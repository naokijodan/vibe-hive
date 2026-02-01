import { getDatabase } from './Database';
import type { AgentContext, AgentContextCreateInput } from '../../../shared/types/context';

function generateId(): string {
  return `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function save(input: AgentContextCreateInput): AgentContext {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO agent_contexts (id, org_node_id, session_id, context_type, data_format, content, parent_context_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, input.orgNodeId, input.sessionId, input.contextType, input.dataFormat, input.content, input.parentContextId ?? null, now);

  return {
    id,
    orgNodeId: input.orgNodeId,
    sessionId: input.sessionId,
    contextType: input.contextType,
    dataFormat: input.dataFormat,
    content: input.content,
    parentContextId: input.parentContextId,
    createdAt: now,
  };
}

export function getById(id: string): AgentContext | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM agent_contexts WHERE id = ?').get(id) as Record<string, string> | undefined;
  if (!row) return null;
  return mapRow(row);
}

export function getByNode(orgNodeId: string, limit = 10): AgentContext[] {
  const db = getDatabase();
  const rows = db.prepare(
    'SELECT * FROM agent_contexts WHERE org_node_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(orgNodeId, limit) as Record<string, string>[];
  return rows.map(mapRow);
}

export function getBySession(sessionId: string): AgentContext[] {
  const db = getDatabase();
  const rows = db.prepare(
    'SELECT * FROM agent_contexts WHERE session_id = ? ORDER BY created_at DESC'
  ).all(sessionId) as Record<string, string>[];
  return rows.map(mapRow);
}

export function getChain(contextId: string): AgentContext[] {
  const chain: AgentContext[] = [];
  let currentId: string | undefined = contextId;

  while (currentId) {
    const ctx = getById(currentId);
    if (!ctx) break;
    chain.unshift(ctx);
    currentId = ctx.parentContextId;
  }

  return chain;
}

export function deleteById(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM agent_contexts WHERE id = ?').run(id);
  return result.changes > 0;
}

function mapRow(row: Record<string, string>): AgentContext {
  return {
    id: row.id,
    orgNodeId: row.org_node_id,
    sessionId: row.session_id,
    contextType: row.context_type as AgentContext['contextType'],
    dataFormat: row.data_format as AgentContext['dataFormat'],
    content: row.content,
    parentContextId: row.parent_context_id || undefined,
    createdAt: row.created_at,
  };
}
