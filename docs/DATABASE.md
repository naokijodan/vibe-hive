# Vibe Hive - データベース設計書

## 概要

SQLite を使用してセッション、タスク、ログを永続化する。
`better-sqlite3` を使用し、同期APIで高速なアクセスを実現。

---

## テーブル設計

### sessions テーブル

セッション（作業単位）を管理。

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  working_directory TEXT NOT NULL,
  organization_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
```

### tasks テーブル

タスク（Kanbanカード）を管理。

```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  agent_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  column TEXT NOT NULL DEFAULT 'running',  -- 'running' | 'waiting' | 'done'
  status TEXT NOT NULL DEFAULT 'idle',     -- 'idle' | 'running' | 'waiting_input' | 'completed' | 'failed'
  working_directory TEXT NOT NULL,
  git_branch TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE INDEX idx_tasks_session_id ON tasks(session_id);
CREATE INDEX idx_tasks_column ON tasks(column);
CREATE INDEX idx_tasks_status ON tasks(status);
```

### agents テーブル

エージェント（Claude Code等）の状態を管理。

```sql
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,                       -- 'claude-code' | 'codex-cli' | 'terminal'
  status TEXT NOT NULL DEFAULT 'idle',      -- 'idle' | 'starting' | 'running' | 'waiting_input' | 'stopped' | 'error'
  terminal_id TEXT,
  task_id TEXT,
  organization_role TEXT,
  system_prompt TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_type ON agents(type);
```

### organizations テーブル

組織定義を管理。

```sql
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  config TEXT NOT NULL,  -- JSON形式で組織構造を保存
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### org_messages テーブル

組織内のエージェント間メッセージを管理。

```sql
CREATE TABLE org_messages (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  from_agent TEXT NOT NULL,
  to_agent TEXT NOT NULL,
  type TEXT NOT NULL,                       -- 'instruction' | 'report' | 'question'
  content TEXT NOT NULL,
  metadata TEXT,                            -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_org_messages_org_id ON org_messages(organization_id);
CREATE INDEX idx_org_messages_from ON org_messages(from_agent);
CREATE INDEX idx_org_messages_to ON org_messages(to_agent);
CREATE INDEX idx_org_messages_created ON org_messages(created_at DESC);
```

### whiteboard テーブル

組織の共有コンテキスト（ホワイトボード）を管理。

```sql
CREATE TABLE whiteboard (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,  -- JSON
  updated_by TEXT,      -- agent_id
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE (organization_id, key)
);

CREATE INDEX idx_whiteboard_org_key ON whiteboard(organization_id, key);
```

### terminal_logs テーブル

ターミナル出力ログを管理（検索・復元用）。

```sql
CREATE TABLE terminal_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  type TEXT NOT NULL,                       -- 'stdout' | 'stderr' | 'stdin'
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_terminal_logs_agent ON terminal_logs(agent_id);
CREATE INDEX idx_terminal_logs_session ON terminal_logs(session_id);
CREATE INDEX idx_terminal_logs_created ON terminal_logs(created_at DESC);

-- 全文検索用（オプション）
CREATE VIRTUAL TABLE terminal_logs_fts USING fts5(
  content,
  content='terminal_logs',
  content_rowid='id'
);
```

---

## マイグレーション

```typescript
// src/main/services/db/migrations/001_initial.ts

export const migration001 = `
  CREATE TABLE IF NOT EXISTS sessions (...);
  CREATE TABLE IF NOT EXISTS tasks (...);
  CREATE TABLE IF NOT EXISTS agents (...);
  CREATE TABLE IF NOT EXISTS organizations (...);
  CREATE TABLE IF NOT EXISTS org_messages (...);
  CREATE TABLE IF NOT EXISTS whiteboard (...);
  CREATE TABLE IF NOT EXISTS terminal_logs (...);

  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;
```

---

## データアクセス例

```typescript
// src/main/services/db/Database.ts

import Database from 'better-sqlite3';

class DB {
  private db: Database.Database;

  constructor() {
    this.db = new Database('vibe-hive.db');
    this.db.pragma('journal_mode = WAL');  // パフォーマンス向上
  }

  // Session
  createSession(params: CreateSessionParams): Session {
    const id = crypto.randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, name, working_directory, organization_id)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, params.name, params.workingDirectory, params.organizationId);
    return this.getSession(id);
  }

  getSessions(): Session[] {
    return this.db.prepare('SELECT * FROM sessions ORDER BY updated_at DESC').all();
  }

  // Task
  getTasksBySession(sessionId: string): Task[] {
    return this.db.prepare('SELECT * FROM tasks WHERE session_id = ?').all(sessionId);
  }

  updateTaskColumn(taskId: string, column: TaskColumn): void {
    this.db.prepare(`
      UPDATE tasks SET column = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(column, taskId);
  }

  // Terminal Logs (バッチ挿入でパフォーマンス向上)
  insertLogs(logs: TerminalLog[]): void {
    const stmt = this.db.prepare(`
      INSERT INTO terminal_logs (agent_id, session_id, type, content)
      VALUES (?, ?, ?, ?)
    `);
    const insertMany = this.db.transaction((logs: TerminalLog[]) => {
      for (const log of logs) {
        stmt.run(log.agentId, log.sessionId, log.type, log.content);
      }
    });
    insertMany(logs);
  }

  // 検索
  searchLogs(query: string, sessionId?: string): TerminalLog[] {
    let sql = `
      SELECT l.* FROM terminal_logs l
      JOIN terminal_logs_fts fts ON l.id = fts.rowid
      WHERE fts.content MATCH ?
    `;
    const params: any[] = [query];

    if (sessionId) {
      sql += ' AND l.session_id = ?';
      params.push(sessionId);
    }

    sql += ' ORDER BY l.created_at DESC LIMIT 100';
    return this.db.prepare(sql).all(...params);
  }
}

export const db = new DB();
```

---

## ER図

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  sessions   │───────│    tasks    │───────│   agents    │
│─────────────│ 1   n │─────────────│ 1   1 │─────────────│
│ id          │       │ id          │       │ id          │
│ name        │       │ session_id  │       │ type        │
│ working_dir │       │ agent_id    │       │ status      │
│ org_id      │       │ title       │       │ task_id     │
│ created_at  │       │ column      │       │ org_role    │
│ updated_at  │       │ status      │       │ sys_prompt  │
└──────┬──────┘       └─────────────┘       └──────┬──────┘
       │                                          │
       │ 1                                        │ 1
       │                                          │
       │ n                                        │ n
┌──────▼──────┐                           ┌──────▼──────┐
│organizations│                           │terminal_logs│
│─────────────│                           │─────────────│
│ id          │                           │ id          │
│ name        │                           │ agent_id    │
│ config(JSON)│                           │ session_id  │
└──────┬──────┘                           │ type        │
       │                                  │ content     │
       │ 1                                │ created_at  │
       │                                  └─────────────┘
       │ n
┌──────▼──────┐       ┌─────────────┐
│org_messages │       │ whiteboard  │
│─────────────│       │─────────────│
│ id          │       │ id          │
│ org_id      │       │ org_id      │
│ from_agent  │       │ key         │
│ to_agent    │       │ value(JSON) │
│ type        │       │ updated_by  │
│ content     │       └─────────────┘
└─────────────┘
```
