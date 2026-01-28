import { TaskRepository } from './TaskRepository';
import { AgentRepository } from './AgentRepository';
import { SessionRepository } from './SessionRepository';
import type { TaskCreateInput } from '../../../shared/types/task';

/**
 * Seeds initial demo tasks into the database
 */
export function seedDemoTasks(): void {
  try {
    const taskRepository = new TaskRepository();
    const agentRepository = new AgentRepository();
    const sessionRepository = new SessionRepository();

    // Check if tasks already exist
    const existingTasks = taskRepository.getAll();
    if (existingTasks.length > 0) {
      console.log('Tasks already exist, skipping seed');
      return;
    }

    console.log('Seeding demo tasks...');

    // Create a demo session first if it doesn't exist
    let demoSession = sessionRepository.getById('demo-session');
    if (!demoSession) {
      demoSession = sessionRepository.create({
        name: 'Vibe Hive 開発',
        workingDirectory: process.cwd(),
      });
    }
    const defaultSessionId = demoSession.id;

    // Get agents to assign tasks
    const agents = agentRepository.getAll();
    const ceo = agents.find(a => a.name === 'CEO Agent');
    const cto = agents.find(a => a.name === 'CTO Agent');
    const frontend = agents.find(a => a.name === 'Frontend Dev');
    const backend = agents.find(a => a.name === 'Backend Dev');
    const qa = agents.find(a => a.name === 'QA Engineer');

    // Create demo tasks
    const tasks: TaskCreateInput[] = [
      {
        sessionId: defaultSessionId,
        title: 'プロジェクト計画の策定',
        description: 'Vibe Hiveの開発ロードマップを作成',
        priority: 'high',
        assignedAgentId: ceo?.id,
      },
      {
        sessionId: defaultSessionId,
        title: 'アーキテクチャ設計',
        description: 'システム全体の技術設計を行う',
        priority: 'high',
        assignedAgentId: cto?.id,
      },
      {
        sessionId: defaultSessionId,
        title: 'UIコンポーネント実装',
        description: 'カンバンボードのドラッグ&ドロップ機能',
        priority: 'medium',
        assignedAgentId: frontend?.id,
      },
      {
        sessionId: defaultSessionId,
        title: 'API設計',
        description: 'IPC通信のAPI設計とハンドラー実装',
        priority: 'medium',
        assignedAgentId: backend?.id,
      },
      {
        sessionId: defaultSessionId,
        title: 'テスト計画作成',
        description: '統合テストとE2Eテストの計画',
        priority: 'low',
        assignedAgentId: qa?.id,
      },
      {
        sessionId: defaultSessionId,
        title: 'ターミナル統合',
        description: 'xterm.jsとnode-ptyの統合',
        priority: 'high',
        assignedAgentId: frontend?.id,
      },
    ];

    for (const taskInput of tasks) {
      taskRepository.create(taskInput);
    }

    // Update some tasks to different statuses for demo
    const allTasks = taskRepository.getAll();
    if (allTasks.length >= 3) {
      taskRepository.updateStatus(allTasks[0].id, 'done');
      taskRepository.updateStatus(allTasks[1].id, 'in_progress');
      taskRepository.updateStatus(allTasks[2].id, 'in_progress');
    }

    console.log('Demo tasks seeded successfully');
  } catch (error) {
    console.error('Failed to seed demo tasks:', error);
  }
}
