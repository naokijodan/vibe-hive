import { getDatabase } from './Database';
import type { Session, SessionConfig, SessionStatus } from '../../../shared/types/session';
import { randomUUID } from 'crypto';

interface SessionRow {
  id: string;
  name: string;
  working_directory: string;
  agent_id: string | null;
  status: string;
  is_active: number;
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
      `INSERT INTO sessions (id, name, working_directory, agent_id, status, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'idle', 0, ?, ?)`
    ).run(
      id,
      config.name,
      config.workingDirectory,
      config.agentId || null,
      now,
      now
    );

    return this.getById(id)!;
  }

  getById(id: string): Session | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as SessionRow | undefined;
    return row ? rowToSession(row) : null;
  }

  getAll(): Session[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM sessions ORDER BY created_at DESC')
      .all() as SessionRow[];
    return rows.map(rowToSession);
  }

  getActive(): Session | null {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM sessions WHERE is_active = 1')
      .get() as SessionRow | undefined;
    return row ? rowToSession(row) : null;
  }

  update(id: string, updates: Partial<SessionConfig>): Session {
    const db = getDatabase();
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.workingDirectory !== undefined) {
      fields.push('working_directory = ?');
      values.push(updates.workingDirectory);
    }
    if (updates.agentId !== undefined) {
      fields.push('agent_id = ?');
      values.push(updates.agentId);
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    db.prepare(`UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    return this.getById(id)!;
  }

  updateStatus(id: string, status: SessionStatus): Session {
    const db = getDatabase();
    const now = new Date().toISOString();

    db.prepare('UPDATE sessions SET status = ?, updated_at = ? WHERE id = ?').run(
      status,
      now,
      id
    );

    return this.getById(id)!;
  }

  setActive(id: string): void {
    const db = getDatabase();
    const now = new Date().toISOString();

    // すべてのセッションを非アクティブに
    db.prepare('UPDATE sessions SET is_active = 0, updated_at = ?').run(now);

    // 指定されたセッションをアクティブに
    db.prepare('UPDATE sessions SET is_active = 1, updated_at = ? WHERE id = ?').run(now, id);
  }

  delete(id: string): void {
    const db = getDatabase();
    db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  }
}
