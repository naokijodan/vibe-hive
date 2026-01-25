import { getDatabase } from './Database';
import type { Task, TaskStatus, TaskPriority, TaskCreateInput } from '../../../shared/types/task';
import { randomUUID } from 'crypto';

interface TaskRow {
  id: string;
  session_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_agent_id: string | null;
  parent_task_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

function rowToTask(row: TaskRow): Task {
  const db = getDatabase();
  const subtaskRows = db
    .prepare('SELECT id FROM tasks WHERE parent_task_id = ?')
    .all(row.id) as { id: string }[];

  return {
    id: row.id,
    sessionId: row.session_id,
    title: row.title,
    description: row.description || undefined,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    assignedAgentId: row.assigned_agent_id || undefined,
    parentTaskId: row.parent_task_id || undefined,
    subtasks: subtaskRows.length > 0 ? subtaskRows.map((r) => r.id) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  };
}

export class TaskRepository {
  create(input: TaskCreateInput): Task {
    const db = getDatabase();
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO tasks (id, session_id, title, description, status, priority, assigned_agent_id, parent_task_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'todo', ?, ?, ?, ?, ?)`
    ).run(
      id,
      input.sessionId,
      input.title,
      input.description || null,
      input.priority || 'medium',
      input.assignedAgentId || null,
      input.parentTaskId || null,
      now,
      now
    );

    return this.getById(id)!;
  }

  getById(id: string): Task | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow | undefined;
    return row ? rowToTask(row) : null;
  }

  getBySessionId(sessionId: string): Task[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM tasks WHERE session_id = ? ORDER BY created_at DESC')
      .all(sessionId) as TaskRow[];
    return rows.map(rowToTask);
  }

  getByStatus(status: TaskStatus): Task[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM tasks WHERE status = ? ORDER BY priority DESC, created_at DESC')
      .all(status) as TaskRow[];
    return rows.map(rowToTask);
  }

  getAll(): Task[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM tasks ORDER BY created_at DESC')
      .all() as TaskRow[];
    return rows.map(rowToTask);
  }

  update(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'sessionId'>>): Task | null {
    const db = getDatabase();
    const task = this.getById(id);
    if (!task) return null;

    const updateFields: string[] = [];
    const values: unknown[] = [];

    if (updates.title !== undefined) {
      updateFields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      values.push(updates.description || null);
    }
    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      values.push(updates.status);
      if (updates.status === 'done') {
        updateFields.push('completed_at = ?');
        values.push(new Date().toISOString());
      }
    }
    if (updates.priority !== undefined) {
      updateFields.push('priority = ?');
      values.push(updates.priority);
    }
    if (updates.assignedAgentId !== undefined) {
      updateFields.push('assigned_agent_id = ?');
      values.push(updates.assignedAgentId || null);
    }
    if (updates.parentTaskId !== undefined) {
      updateFields.push('parent_task_id = ?');
      values.push(updates.parentTaskId || null);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      db.prepare(
        `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`
      ).run(...values);
    }

    return this.getById(id);
  }

  updateStatus(id: string, status: TaskStatus): Task | null {
    return this.update(id, { status });
  }

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return result.changes > 0;
  }

  deleteBySessionId(sessionId: string): number {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM tasks WHERE session_id = ?').run(sessionId);
    return result.changes;
  }
}

export const taskRepository = new TaskRepository();
