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
  review_feedback: string | null;
  depends_on: string | null;
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
    reviewFeedback: row.review_feedback || undefined,
    dependsOn: row.depends_on ? JSON.parse(row.depends_on) : undefined,
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
    if (updates.reviewFeedback !== undefined) {
      updateFields.push('review_feedback = ?');
      values.push(updates.reviewFeedback || null);
    }
    if (updates.dependsOn !== undefined) {
      updateFields.push('depends_on = ?');
      values.push(updates.dependsOn ? JSON.stringify(updates.dependsOn) : null);
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

  getSubtasks(parentId: string): Task[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM tasks WHERE parent_task_id = ? ORDER BY created_at ASC')
      .all(parentId) as TaskRow[];
    return rows.map(rowToTask);
  }

  createSubtasks(parentId: string, titles: string[]): Task[] {
    const parent = this.getById(parentId);
    if (!parent) return [];

    const tasks: Task[] = [];
    for (const title of titles) {
      const task = this.create({
        sessionId: parent.sessionId,
        title: title.trim(),
        priority: parent.priority,
        parentTaskId: parentId,
      });
      tasks.push(task);
    }
    return tasks;
  }

  /**
   * Check if all dependencies are completed (done status)
   */
  areDependenciesMet(taskId: string): { met: boolean; completed: number; total: number; blocking: Task[] } {
    const task = this.getById(taskId);
    if (!task || !task.dependsOn || task.dependsOn.length === 0) {
      return { met: true, completed: 0, total: 0, blocking: [] };
    }

    const blocking: Task[] = [];
    let completed = 0;

    for (const depId of task.dependsOn) {
      const depTask = this.getById(depId);
      if (depTask) {
        if (depTask.status === 'done') {
          completed++;
        } else {
          blocking.push(depTask);
        }
      }
    }

    return {
      met: blocking.length === 0,
      completed,
      total: task.dependsOn.length,
      blocking,
    };
  }

  /**
   * Clear review feedback after it's been applied
   */
  clearReviewFeedback(taskId: string): Task | null {
    return this.update(taskId, { reviewFeedback: undefined });
  }

  /**
   * Check if adding a dependency would create a circular dependency
   * Returns true if circular dependency would be created
   */
  wouldCreateCircularDependency(taskId: string, newDependencyId: string): boolean {
    // Can't depend on itself
    if (taskId === newDependencyId) {
      return true;
    }

    // DFS to check if taskId is reachable from newDependencyId
    const visited = new Set<string>();
    const stack = [newDependencyId];

    while (stack.length > 0) {
      const currentId = stack.pop()!;

      // Found a cycle
      if (currentId === taskId) {
        return true;
      }

      if (visited.has(currentId)) {
        continue;
      }
      visited.add(currentId);

      // Get dependencies of current task
      const currentTask = this.getById(currentId);
      if (currentTask && currentTask.dependsOn) {
        for (const depId of currentTask.dependsOn) {
          if (!visited.has(depId)) {
            stack.push(depId);
          }
        }
      }
    }

    return false;
  }

  /**
   * Get all tasks that depend on this task (reverse dependency lookup)
   */
  getDependentTasks(taskId: string): Task[] {
    const allTasks = this.getAll();
    return allTasks.filter(task =>
      task.dependsOn && task.dependsOn.includes(taskId)
    );
  }

  /**
   * Get dependency tree for visualization
   */
  getDependencyTree(taskId: string): {
    task: Task;
    dependencies: ReturnType<TaskRepository['getDependencyTree']>[];
  } | null {
    const task = this.getById(taskId);
    if (!task) return null;

    const dependencies = [];
    if (task.dependsOn) {
      for (const depId of task.dependsOn) {
        const depTree = this.getDependencyTree(depId);
        if (depTree) {
          dependencies.push(depTree);
        }
      }
    }

    return { task, dependencies };
  }
}

export const taskRepository = new TaskRepository();
