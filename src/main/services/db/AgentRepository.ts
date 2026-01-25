import { getDatabase } from './Database';
import type { Agent, AgentRole, AgentStatus, AgentConfig } from '../../../shared/types/agent';
import { randomUUID } from 'crypto';

interface AgentRow {
  id: string;
  name: string;
  role: string;
  status: string;
  session_id: string | null;
  parent_agent_id: string | null;
  capabilities: string | null;
  created_at: string;
}

function rowToAgent(row: AgentRow): Agent {
  const db = getDatabase();
  const childRows = db
    .prepare('SELECT id FROM agents WHERE parent_agent_id = ?')
    .all(row.id) as { id: string }[];

  return {
    id: row.id,
    name: row.name,
    role: row.role as AgentRole,
    status: row.status as AgentStatus,
    sessionId: row.session_id || undefined,
    parentAgentId: row.parent_agent_id || undefined,
    childAgentIds: childRows.length > 0 ? childRows.map((r) => r.id) : undefined,
    capabilities: row.capabilities ? JSON.parse(row.capabilities) : undefined,
    createdAt: new Date(row.created_at),
  };
}

export class AgentRepository {
  create(config: AgentConfig): Agent {
    const db = getDatabase();
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO agents (id, name, role, status, parent_agent_id, capabilities, created_at, updated_at)
       VALUES (?, ?, ?, 'idle', ?, ?, ?, ?)`
    ).run(
      id,
      config.name,
      config.role,
      config.parentAgentId || null,
      config.capabilities ? JSON.stringify(config.capabilities) : null,
      now,
      now
    );

    return this.getById(id)!;
  }

  getById(id: string): Agent | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as AgentRow | undefined;
    return row ? rowToAgent(row) : null;
  }

  getAll(): Agent[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM agents ORDER BY created_at ASC')
      .all() as AgentRow[];
    return rows.map(rowToAgent);
  }

  getBySessionId(sessionId: string): Agent[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM agents WHERE session_id = ? ORDER BY created_at ASC')
      .all(sessionId) as AgentRow[];
    return rows.map(rowToAgent);
  }

  update(id: string, updates: Partial<Omit<Agent, 'id' | 'createdAt'>>): Agent | null {
    const db = getDatabase();
    const agent = this.getById(id);
    if (!agent) return null;

    const updateFields: string[] = [];
    const values: unknown[] = [];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.role !== undefined) {
      updateFields.push('role = ?');
      values.push(updates.role);
    }
    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.sessionId !== undefined) {
      updateFields.push('session_id = ?');
      values.push(updates.sessionId || null);
    }
    if (updates.parentAgentId !== undefined) {
      updateFields.push('parent_agent_id = ?');
      values.push(updates.parentAgentId || null);
    }
    if (updates.capabilities !== undefined) {
      updateFields.push('capabilities = ?');
      values.push(updates.capabilities ? JSON.stringify(updates.capabilities) : null);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      db.prepare(
        `UPDATE agents SET ${updateFields.join(', ')} WHERE id = ?`
      ).run(...values);
    }

    return this.getById(id);
  }

  updateStatus(id: string, status: AgentStatus): Agent | null {
    return this.update(id, { status });
  }

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM agents WHERE id = ?').run(id);
    return result.changes > 0;
  }
}

export const agentRepository = new AgentRepository();
