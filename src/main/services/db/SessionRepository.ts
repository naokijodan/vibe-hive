import { getDatabase } from './Database';
import type { Session, SessionStatus, SessionConfig } from '../../../shared/types/session';
import { randomUUID } from 'crypto';

interface SessionRow {
  id: string;
  name: string;
  working_directory: string;
  agent_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

function rowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    name: row.name,
    workingDirectory: row.working_directory,
    agentId: row.agent_id || undefined,
    status: row.status as SessionStatus,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SessionRepository {
  create(config: SessionConfig): Session {
    const db = getDatabase();
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO sessions (id, name, working_directory, agent_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'idle', ?, ?)`
    ).run(id, config.name, config.workingDirectory, config.agentId || null, now, now);

    return this.getById(id)!;
  }

  getById(id: string): Session | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as SessionRow | undefined;
    return row ? rowToSession(row) : null;
  }

  getAll(): Session[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM sessions ORDER BY created_at DESC').all() as SessionRow[];
    return rows.map(rowToSession);
  }

  update(id: string, updates: Partial<Omit<Session, 'id' | 'createdAt'>>): Session | null {
    const db = getDatabase();
    const session = this.getById(id);
    if (!session) return null;

    const updateFields: string[] = [];
    const values: unknown[] = [];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.workingDirectory !== undefined) {
      updateFields.push('working_directory = ?');
      values.push(updates.workingDirectory);
    }
    if (updates.agentId !== undefined) {
      updateFields.push('agent_id = ?');
      values.push(updates.agentId || null);
    }
    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      values.push(updates.status);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      db.prepare(
        `UPDATE sessions SET ${updateFields.join(', ')} WHERE id = ?`
      ).run(...values);
    }

    return this.getById(id);
  }

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
    return result.changes > 0;
  }

  updateStatus(id: string, status: SessionStatus): Session | null {
    return this.update(id, { status });
  }
}

export const sessionRepository = new SessionRepository();
