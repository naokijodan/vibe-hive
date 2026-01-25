# Vibe Hive - IPC API 設計書

## 概要

Renderer Process と Main Process 間の通信は IPC Bridge を通じて行う。
将来的に Tauri へ移行する際も、この Bridge 層のみを差し替えれば済む設計。

---

## IPC チャンネル一覧

### Session 関連

| チャンネル | 方向 | 説明 |
|-----------|------|------|
| `session:create` | R→M | 新規セッション作成 |
| `session:list` | R→M | セッション一覧取得 |
| `session:get` | R→M | セッション詳細取得 |
| `session:delete` | R→M | セッション削除 |
| `session:restore` | R→M | セッション復元 |
| `session:updated` | M→R | セッション更新通知（イベント） |

### Terminal 関連

| チャンネル | 方向 | 説明 |
|-----------|------|------|
| `terminal:spawn` | R→M | 新規ターミナル起動 |
| `terminal:write` | R→M | ターミナルに入力送信 |
| `terminal:resize` | R→M | ターミナルサイズ変更 |
| `terminal:kill` | R→M | ターミナル終了 |
| `terminal:data` | M→R | ターミナル出力（イベント） |
| `terminal:exit` | M→R | ターミナル終了通知（イベント） |

### Agent 関連

| チャンネル | 方向 | 説明 |
|-----------|------|------|
| `agent:start` | R→M | エージェント起動 |
| `agent:stop` | R→M | エージェント停止 |
| `agent:send` | R→M | エージェントにメッセージ送信 |
| `agent:status-changed` | M→R | ステータス変更通知（イベント） |

### Task 関連

| チャンネル | 方向 | 説明 |
|-----------|------|------|
| `task:create` | R→M | タスク作成 |
| `task:update` | R→M | タスク更新 |
| `task:move` | R→M | タスク移動（カラム間） |
| `task:list` | R→M | タスク一覧取得 |
| `task:updated` | M→R | タスク更新通知（イベント） |

### Organization 関連

| チャンネル | 方向 | 説明 |
|-----------|------|------|
| `org:load` | R→M | 組織定義読み込み |
| `org:save` | R→M | 組織定義保存 |
| `org:send-message` | R→M | エージェント間メッセージ送信 |
| `org:message-received` | M→R | メッセージ受信通知（イベント） |
| `org:whiteboard-update` | R→M | ホワイトボード更新 |
| `org:whiteboard-changed` | M→R | ホワイトボード変更通知（イベント） |

### Git 関連

| チャンネル | 方向 | 説明 |
|-----------|------|------|
| `git:status` | R→M | Git ステータス取得 |
| `git:diff` | R→M | Git diff 取得 |
| `git:branch` | R→M | ブランチ情報取得 |
| `git:checkout` | R→M | ブランチ切り替え |
| `git:commit` | R→M | コミット |

---

## IPC Bridge 実装

### Renderer側 (ipcBridge.ts)

```typescript
// src/renderer/bridge/ipcBridge.ts

type IpcBridge = {
  // Session
  session: {
    create: (params: CreateSessionParams) => Promise<Session>;
    list: () => Promise<Session[]>;
    get: (id: string) => Promise<Session>;
    delete: (id: string) => Promise<void>;
    restore: (id: string) => Promise<Session>;
    onUpdated: (callback: (session: Session) => void) => () => void;
  };

  // Terminal
  terminal: {
    spawn: (params: SpawnTerminalParams) => Promise<string>; // returns terminalId
    write: (terminalId: string, data: string) => Promise<void>;
    resize: (terminalId: string, cols: number, rows: number) => Promise<void>;
    kill: (terminalId: string) => Promise<void>;
    onData: (terminalId: string, callback: (data: string) => void) => () => void;
    onExit: (terminalId: string, callback: (code: number) => void) => () => void;
  };

  // Agent
  agent: {
    start: (params: StartAgentParams) => Promise<string>; // returns agentId
    stop: (agentId: string) => Promise<void>;
    send: (agentId: string, message: string) => Promise<void>;
    onStatusChanged: (agentId: string, callback: (status: AgentStatus) => void) => () => void;
  };

  // Task
  task: {
    create: (params: CreateTaskParams) => Promise<Task>;
    update: (id: string, params: UpdateTaskParams) => Promise<Task>;
    move: (id: string, column: TaskColumn) => Promise<Task>;
    list: (sessionId?: string) => Promise<Task[]>;
    onUpdated: (callback: (task: Task) => void) => () => void;
  };

  // Organization
  org: {
    load: (path?: string) => Promise<Organization>;
    save: (org: Organization, path?: string) => Promise<void>;
    sendMessage: (from: string, to: string, message: OrgMessage) => Promise<void>;
    onMessageReceived: (agentId: string, callback: (msg: OrgMessage) => void) => () => void;
    updateWhiteboard: (key: string, value: any) => Promise<void>;
    onWhiteboardChanged: (callback: (key: string, value: any) => void) => () => void;
  };

  // Git
  git: {
    status: (cwd: string) => Promise<GitStatus>;
    diff: (cwd: string) => Promise<string>;
    branch: (cwd: string) => Promise<GitBranch>;
    checkout: (cwd: string, branch: string) => Promise<void>;
    commit: (cwd: string, message: string) => Promise<void>;
  };
};

// Electron実装
const electronBridge: IpcBridge = {
  session: {
    create: (params) => window.electron.invoke('session:create', params),
    list: () => window.electron.invoke('session:list'),
    // ...
  },
  // ...
};

// 将来的にTauri実装に差し替え可能
// const tauriBridge: IpcBridge = { ... };

export const bridge: IpcBridge = electronBridge;
```

### Main側 (handlers.ts)

```typescript
// src/main/ipc/handlers.ts

import { ipcMain } from 'electron';
import { SessionService } from '../services/session/SessionService';
import { PtyManager } from '../services/pty/PtyManager';
// ...

export function registerIpcHandlers() {
  // Session handlers
  ipcMain.handle('session:create', async (_, params) => {
    return SessionService.create(params);
  });

  ipcMain.handle('session:list', async () => {
    return SessionService.list();
  });

  // Terminal handlers
  ipcMain.handle('terminal:spawn', async (_, params) => {
    return PtyManager.spawn(params);
  });

  ipcMain.handle('terminal:write', async (_, terminalId, data) => {
    return PtyManager.write(terminalId, data);
  });

  // イベント送信例
  PtyManager.on('data', (terminalId, data) => {
    mainWindow.webContents.send('terminal:data', terminalId, data);
  });

  // ...
}
```

---

## 型定義

### Session

```typescript
// src/shared/types/session.ts

interface Session {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  workingDirectory: string;
  tasks: string[];        // Task IDs
  agents: string[];       // Agent IDs
  organizationId?: string;
}

interface CreateSessionParams {
  name: string;
  workingDirectory: string;
  organizationPath?: string;
}
```

### Task

```typescript
// src/shared/types/task.ts

type TaskColumn = 'running' | 'waiting' | 'done';

type TaskStatus =
  | 'idle'
  | 'running'
  | 'waiting_input'
  | 'completed'
  | 'failed';

interface Task {
  id: string;
  sessionId: string;
  agentId?: string;
  title: string;
  description?: string;
  column: TaskColumn;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  workingDirectory: string;
  gitBranch?: string;
}

interface CreateTaskParams {
  sessionId: string;
  title: string;
  description?: string;
  workingDirectory: string;
  agentType?: AgentType;
}

interface UpdateTaskParams {
  title?: string;
  description?: string;
  column?: TaskColumn;
  status?: TaskStatus;
}
```

### Agent

```typescript
// src/shared/types/agent.ts

type AgentType = 'claude-code' | 'codex-cli' | 'terminal';

type AgentStatus =
  | 'idle'
  | 'starting'
  | 'running'
  | 'waiting_input'
  | 'stopped'
  | 'error';

interface Agent {
  id: string;
  type: AgentType;
  status: AgentStatus;
  terminalId: string;
  taskId?: string;
  organizationRole?: string;  // 組織内での役割
  systemPrompt?: string;
}

interface StartAgentParams {
  type: AgentType;
  taskId?: string;
  workingDirectory: string;
  systemPrompt?: string;
  organizationRole?: string;
}
```

### Organization

```typescript
// src/shared/types/organization.ts

interface Organization {
  id: string;
  name: string;
  agents: Record<string, OrganizationAgent>;
  communication: CommunicationConfig;
  whiteboard: Record<string, any>;
}

interface OrganizationAgent {
  name: string;
  role: string;
  systemPrompt: string;
  permissions: string[];
  supervisor?: string;
  subordinates?: string[];
}

interface CommunicationConfig {
  downward: MessageTemplate;
  upward: MessageTemplate;
}

interface MessageTemplate {
  template: string;
}

interface OrgMessage {
  id: string;
  from: string;
  to: string;
  type: 'instruction' | 'report' | 'question';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

---

## ステータス自動検知フロー

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code Process                       │
│  stdout: "Thinking..." / "Running tool..." / "?" prompt     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Status Detector                           │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  Hooks Listener │  │ Stdout Analyzer │                   │
│  │  (優先)         │  │ (フォールバック)│                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           └──────────┬─────────┘                            │
│                      ▼                                       │
│           ┌─────────────────┐                               │
│           │ Status Resolver │                               │
│           │ running/waiting │                               │
│           └────────┬────────┘                               │
└────────────────────┼────────────────────────────────────────┘
                     │
                     ▼ IPC: agent:status-changed
┌─────────────────────────────────────────────────────────────┐
│                    Renderer Process                          │
│           Zustand Store → Kanban UI 更新                     │
└─────────────────────────────────────────────────────────────┘
```

### Claude Code Hooks 連携

```typescript
// src/main/services/agent/HooksIntegration.ts

// Claude Code の hooks 設定例 (~/.claude/settings.json)
// {
//   "hooks": {
//     "postToolUse": ["echo 'VIBE_HIVE_EVENT:{\"type\":\"tool_complete\"}' >&2"]
//   }
// }

export class HooksIntegration {
  private static EVENT_PREFIX = 'VIBE_HIVE_EVENT:';

  static parseStderr(data: string): AgentEvent | null {
    if (data.includes(this.EVENT_PREFIX)) {
      const jsonStr = data.split(this.EVENT_PREFIX)[1].trim();
      try {
        return JSON.parse(jsonStr);
      } catch {
        return null;
      }
    }
    return null;
  }
}
```
