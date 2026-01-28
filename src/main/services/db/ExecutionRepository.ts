import { getDatabase } from './Database';
import type { ExecutionRecord, ExecutionStatus } from '../../../shared/types/execution';

interface ExecutionRow {
  id: string;
  task_id: string;
  session_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  exit_code: number | null;
  error_message: string | null;
}

function rowToExecution(row: ExecutionRow): ExecutionRecord {
  return {
    id: row.id,
    taskId: row.task_id,
    sessionId: row.session_id,
    status: row.status as ExecutionStatus,
    startedAt: new Date(row.started_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    exitCode: row.exit_code ?? undefined,
    errorMessage: row.error_message ?? undefined,
  };
}

export class ExecutionRepository {
  create(execution: ExecutionRecord): ExecutionRecord {
    const db = getDatabase();

    db.prepare(
      `INSERT INTO execution_history
       (id, task_id, session_id, status, started_at, completed_at, exit_code, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      execution.id,
      execution.taskId,
      execution.sessionId,
      execution.status,
      execution.startedAt.toISOString(),
      execution.completedAt?.toISOString() || null,
      execution.exitCode ?? null,
      execution.errorMessage ?? null
    );

    return this.getById(execution.id)!;
  }

  getById(id: string): ExecutionRecord | null {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM execution_history WHERE id = ?')
      .get(id) as ExecutionRow | undefined;
    return row ? rowToExecution(row) : null;
  }

  getAll(): ExecutionRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM execution_history ORDER BY started_at DESC')
      .all() as ExecutionRow[];
    return rows.map(rowToExecution);
  }

  getByTaskId(taskId: string): ExecutionRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM execution_history WHERE task_id = ? ORDER BY started_at DESC')
      .all(taskId) as ExecutionRow[];
    return rows.map(rowToExecution);
  }

  getRunning(): ExecutionRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM execution_history WHERE status = ? ORDER BY started_at DESC')
      .all('running') as ExecutionRow[];
    return rows.map(rowToExecution);
  }

  updateStatus(id: string, status: ExecutionStatus): void {
    const db = getDatabase();
    db.prepare('UPDATE execution_history SET status = ? WHERE id = ?').run(status, id);
  }

  updateCompletion(id: string, completedAt: Date, exitCode?: number): void {
    const db = getDatabase();
    db.prepare(
      'UPDATE execution_history SET completed_at = ?, exit_code = ? WHERE id = ?'
    ).run(completedAt.toISOString(), exitCode ?? null, id);
  }

  updateError(id: string, errorMessage: string): void {
    const db = getDatabase();
    db.prepare('UPDATE execution_history SET error_message = ? WHERE id = ?').run(
      errorMessage,
      id
    );
  }

  delete(id: string): void {
    const db = getDatabase();
    db.prepare('DELETE FROM execution_history WHERE id = ?').run(id);
  }
}
