import Anthropic from '@anthropic-ai/sdk';
import { getSettingsService } from './SettingsService';
import { getDatabase } from './db/Database';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ToolResult {
  toolName: string;
  result: unknown;
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'list_tasks',
    description: 'タスク一覧を取得する',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', description: 'フィルタするステータス (todo, in_progress, done, review, backlog)' },
      },
      required: [],
    },
  },
  {
    name: 'create_task',
    description: '新しいタスクを作成する',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'タスクのタイトル' },
        description: { type: 'string', description: 'タスクの説明' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: '優先度' },
        status: { type: 'string', enum: ['backlog', 'todo', 'in_progress', 'review', 'done'], description: 'ステータス' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_task',
    description: '既存タスクを更新する',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'タスクID' },
        title: { type: 'string' },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        status: { type: 'string', enum: ['backlog', 'todo', 'in_progress', 'review', 'done'] },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_task',
    description: 'タスクを削除する',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: '削除するタスクのID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_project_info',
    description: 'セッション情報やプロジェクトの状態を取得する',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'start_execution',
    description: 'タスクのClaude Code実行を開始する',
    input_schema: {
      type: 'object' as const,
      properties: {
        taskId: { type: 'string', description: '実行するタスクのID' },
      },
      required: ['taskId'],
    },
  },
];

const SYSTEM_PROMPT = `あなたはVibe Hiveの内蔵AIアシスタントです。
Vibe HiveはAIエージェント並列作業環境アプリで、複数のClaude Codeを1画面で統合管理します。

あなたの役割:
- ユーザーの要望に基づいてタスクを作成・管理する
- プロジェクトの状態を把握し、適切なアドバイスを行う
- タスクの実行を開始する
- ワークフローの提案をする

利用可能なツールを使ってアプリの機能を直接操作できます。
日本語で応答してください。簡潔に回答し、実行した操作を報告してください。`;

class AIAssistantService {
  private conversationHistory: ChatMessage[] = [];

  private getClient(): Anthropic | null {
    const settings = getSettingsService().getSettings();
    const apiKey = settings.agent.claudeApiKey;
    if (!apiKey) return null;
    return new Anthropic({ apiKey });
  }

  private async executeTool(name: string, input: Record<string, unknown>): Promise<ToolResult> {
    const db = getDatabase();

    switch (name) {
      case 'list_tasks': {
        const status = input.status as string | undefined;
        let tasks;
        if (status) {
          tasks = db.prepare('SELECT * FROM tasks WHERE status = ?').all(status);
        } else {
          tasks = db.prepare('SELECT * FROM tasks').all();
        }
        return { toolName: name, result: tasks };
      }

      case 'create_task': {
        const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const now = new Date().toISOString();
        db.prepare(`
          INSERT INTO tasks (id, title, description, status, priority, sessionId, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          id,
          input.title as string,
          (input.description as string) || '',
          (input.status as string) || 'todo',
          (input.priority as string) || 'medium',
          'default-session',
          now,
          now,
        );
        return { toolName: name, result: { id, title: input.title, status: input.status || 'todo' } };
      }

      case 'update_task': {
        const { id, ...updates } = input;
        // Security: Allowlist valid column names to prevent SQL injection
        const ALLOWED_COLUMNS = new Set(['title', 'description', 'status', 'priority', 'assignedAgentId', 'role', 'sessionId']);
        const setClauses: string[] = [];
        const values: unknown[] = [];
        for (const [key, value] of Object.entries(updates)) {
          if (value !== undefined && ALLOWED_COLUMNS.has(key)) {
            setClauses.push(`${key} = ?`);
            values.push(value);
          }
        }
        if (setClauses.length > 0) {
          setClauses.push('updatedAt = ?');
          values.push(new Date().toISOString());
          values.push(id);
          db.prepare(`UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
        }
        return { toolName: name, result: { id, updated: setClauses.length > 0 } };
      }

      case 'delete_task': {
        const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(input.id as string);
        return { toolName: name, result: { id: input.id, deleted: result.changes > 0 } };
      }

      case 'get_project_info': {
        const tasks = db.prepare('SELECT status, COUNT(*) as count FROM tasks GROUP BY status').all();
        const sessions = db.prepare('SELECT * FROM sessions ORDER BY updatedAt DESC LIMIT 5').all();
        return { toolName: name, result: { taskSummary: tasks, recentSessions: sessions } };
      }

      case 'start_execution': {
        // Return instruction for renderer to start execution
        return { toolName: name, result: { taskId: input.taskId, action: 'start_execution_requested' } };
      }

      default:
        return { toolName: name, result: { error: `Unknown tool: ${name}` } };
    }
  }

  async chat(userMessage: string): Promise<{ reply: string; toolResults: ToolResult[] }> {
    const client = this.getClient();
    if (!client) {
      return { reply: 'Claude APIキーが設定されていません。設定画面からAPIキーを入力してください。', toolResults: [] };
    }

    this.conversationHistory.push({ role: 'user', content: userMessage });

    const toolResults: ToolResult[] = [];

    try {
      let response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: this.conversationHistory.map(m => ({
          role: m.role,
          content: m.content,
        })),
      });

      // Handle tool use loop
      while (response.stop_reason === 'tool_use') {
        const assistantContent = response.content;
        // Store assistant message with full content as JSON for tool_use blocks
        this.conversationHistory.push({
          role: 'assistant',
          content: JSON.stringify(assistantContent),
        });

        const toolUseBlocks = assistantContent.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
        );

        const toolResultContents: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          const result = await this.executeTool(toolUse.name, toolUse.input as Record<string, unknown>);
          toolResults.push(result);
          toolResultContents.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result.result),
          });
        }

        this.conversationHistory.push({
          role: 'user',
          content: JSON.stringify(toolResultContents),
        });

        response = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          tools: TOOLS,
          messages: this.conversationHistory.map(m => {
            // Try parsing as JSON for structured content
            try {
              const parsed = JSON.parse(m.content);
              if (Array.isArray(parsed)) {
                return { role: m.role, content: parsed };
              }
            } catch {
              // Not JSON, use as string
            }
            return { role: m.role, content: m.content };
          }),
        });
      }

      // Extract text from final response
      const textBlocks = response.content.filter(
        (b): b is Anthropic.TextBlock => b.type === 'text'
      );
      const reply = textBlocks.map(b => b.text).join('\n');

      this.conversationHistory.push({ role: 'assistant', content: reply });

      // Keep history manageable
      if (this.conversationHistory.length > 40) {
        this.conversationHistory = this.conversationHistory.slice(-30);
      }

      return { reply, toolResults };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return { reply: `エラーが発生しました: ${errMsg}`, toolResults: [] };
    }
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  hasApiKey(): boolean {
    const settings = getSettingsService().getSettings();
    return !!settings.agent.claudeApiKey;
  }
}

let instance: AIAssistantService | null = null;

export function getAIAssistantService(): AIAssistantService {
  if (!instance) {
    instance = new AIAssistantService();
  }
  return instance;
}
