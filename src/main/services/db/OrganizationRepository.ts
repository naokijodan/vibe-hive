import { getDatabase } from './Database';
import type { Organization } from '../../../shared/types/organization';

function createDefaultOrganization(sessionId: string): Organization {
  const id = `org-${Date.now()}`;
  const now = new Date();
  return {
    id,
    name: 'Default Organization',
    agents: [],
    connections: [],
    whiteboard: { id: `wb-${Date.now()}`, organizationId: id, entries: [] },
    hierarchy: { nodes: [], rootNodeId: undefined },
    createdAt: now,
    updatedAt: now,
  };
}

export function getBySessionId(sessionId: string): Organization | null {
  const db = getDatabase();
  const row = db.prepare('SELECT data FROM organizations WHERE session_id = ?').get(sessionId) as { data: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.data) as Organization;
}

export function getOrCreate(sessionId: string): Organization {
  const existing = getBySessionId(sessionId);
  if (existing) return existing;
  const org = createDefaultOrganization(sessionId);
  save(sessionId, org);
  return org;
}

export function save(sessionId: string, org: Organization): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO organizations (id, session_id, data, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(session_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `).run(org.id, sessionId, JSON.stringify(org), now, now);
}
