import { getDatabase } from './Database';

export interface TerminalLog {
  id: number;
  sessionId: string;
  data: string;
  timestamp: Date;
}

interface TerminalLogRow {
  id: number;
  session_id: string;
  data: string;
  timestamp: string;
}

function rowToLog(row: TerminalLogRow): TerminalLog {
  return {
    id: row.id,
    sessionId: row.session_id,
    data: row.data,
    timestamp: new Date(row.timestamp),
  };
}

export class TerminalLogRepository {
  append(sessionId: string, data: string): void {
    const db = getDatabase();
    db.prepare(
      'INSERT INTO terminal_logs (session_id, data, timestamp) VALUES (?, ?, ?)'
    ).run(sessionId, data, new Date().toISOString());
  }

  getBySessionId(sessionId: string, limit = 1000): TerminalLog[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM terminal_logs
         WHERE session_id = ?
         ORDER BY timestamp DESC
         LIMIT ?`
      )
      .all(sessionId, limit) as TerminalLogRow[];
    return rows.reverse().map(rowToLog);
  }

  getRecentBySessionId(sessionId: string, since: Date): TerminalLog[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM terminal_logs
         WHERE session_id = ? AND timestamp > ?
         ORDER BY timestamp ASC`
      )
      .all(sessionId, since.toISOString()) as TerminalLogRow[];
    return rows.map(rowToLog);
  }

  deleteBySessionId(sessionId: string): number {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM terminal_logs WHERE session_id = ?').run(sessionId);
    return result.changes;
  }

  cleanup(olderThan: Date): number {
    const db = getDatabase();
    const result = db
      .prepare('DELETE FROM terminal_logs WHERE timestamp < ?')
      .run(olderThan.toISOString());
    return result.changes;
  }

  getSessionLogSize(sessionId: string): number {
    const db = getDatabase();
    const result = db
      .prepare('SELECT SUM(LENGTH(data)) as size FROM terminal_logs WHERE session_id = ?')
      .get(sessionId) as { size: number | null };
    return result.size || 0;
  }
}

export const terminalLogRepository = new TerminalLogRepository();
