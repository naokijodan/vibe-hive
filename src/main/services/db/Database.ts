import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) return db;

  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'vibe-hive.db');

  // Ensure directory exists
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  db = new Database(dbPath);

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run migrations
  runMigrations(db);

  // Seed demo data on first run - DISABLED for testing
  // setTimeout(() => {
  //   try {
  //     const { seedDemoAgents } = require('./seedAgents');
  //     seedDemoAgents();
  //     const { seedDemoTasks } = require('./seedTasks');
  //     seedDemoTasks();
  //   } catch (error) {
  //     console.error('Failed to seed demo data:', error);
  //   }
  // }, 100);

  return db;
}

function runMigrations(database: Database.Database): void {
  // Create migrations table if not exists
  database.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrations = [
    {
      name: '001_initial_schema',
      sql: `
        -- Sessions table
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          working_directory TEXT NOT NULL,
          agent_id TEXT,
          status TEXT NOT NULL DEFAULT 'idle',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- Tasks table
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'todo',
          priority TEXT NOT NULL DEFAULT 'medium',
          assigned_agent_id TEXT,
          parent_task_id TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          completed_at TEXT,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
          FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE SET NULL
        );

        -- Terminal logs table (for persisting terminal output)
        CREATE TABLE IF NOT EXISTS terminal_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          data TEXT NOT NULL,
          timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        );

        -- Agent metadata table
        CREATE TABLE IF NOT EXISTS agents (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          config TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_tasks_session_id ON tasks(session_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
        CREATE INDEX IF NOT EXISTS idx_terminal_logs_session_id ON terminal_logs(session_id);
        CREATE INDEX IF NOT EXISTS idx_terminal_logs_timestamp ON terminal_logs(timestamp);
      `,
    },
    {
      name: '002_update_agents_schema',
      sql: `
        -- Drop old agents table if exists
        DROP TABLE IF EXISTS agents;

        -- Create new agents table with proper schema
        CREATE TABLE agents (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          role TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'idle',
          session_id TEXT,
          parent_agent_id TEXT,
          capabilities TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
          FOREIGN KEY (parent_agent_id) REFERENCES agents(id) ON DELETE SET NULL
        );

        -- Create indexes for agents
        CREATE INDEX IF NOT EXISTS idx_agents_session_id ON agents(session_id);
        CREATE INDEX IF NOT EXISTS idx_agents_parent_id ON agents(parent_agent_id);
        CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
      `,
    },
    {
      name: '003_add_task_feedback_and_dependencies',
      sql: `
        -- Add review_feedback column for feedback injection
        ALTER TABLE tasks ADD COLUMN review_feedback TEXT;

        -- Add depends_on column for task dependencies (JSON array of task IDs)
        ALTER TABLE tasks ADD COLUMN depends_on TEXT;
      `,
    },
    {
      name: '004_create_default_session',
      sql: `
        -- Create a default session if it doesn't exist
        INSERT OR IGNORE INTO sessions (id, name, working_directory, status, created_at, updated_at)
        VALUES ('default-session', 'Default Session', '.', 'idle', datetime('now'), datetime('now'));
      `,
    },
    {
      name: '005_add_task_role',
      sql: `
        -- Add role column for agent system prompt / role definition
        ALTER TABLE tasks ADD COLUMN role TEXT;
      `,
    },
    {
      name: '006_add_execution_history',
      sql: `
        -- Execution history table for tracking task executions
        CREATE TABLE IF NOT EXISTS execution_history (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          session_id TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'running',
          started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          completed_at TEXT,
          exit_code INTEGER,
          error_message TEXT,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        );

        -- Create indexes for execution_history
        CREATE INDEX IF NOT EXISTS idx_execution_history_task_id ON execution_history(task_id);
        CREATE INDEX IF NOT EXISTS idx_execution_history_status ON execution_history(status);
        CREATE INDEX IF NOT EXISTS idx_execution_history_started_at ON execution_history(started_at);
      `,
    },
    {
      name: '007_add_task_templates',
      sql: `
        -- Task templates table for reusable task patterns
        CREATE TABLE IF NOT EXISTS task_templates (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          category TEXT,
          task_data TEXT NOT NULL,
          subtasks TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          usage_count INTEGER NOT NULL DEFAULT 0
        );

        -- Create indexes for task_templates
        CREATE INDEX IF NOT EXISTS idx_task_templates_category ON task_templates(category);
        CREATE INDEX IF NOT EXISTS idx_task_templates_usage_count ON task_templates(usage_count);
        CREATE INDEX IF NOT EXISTS idx_task_templates_created_at ON task_templates(created_at);
      `,
    },
    {
      name: '008_add_workflows',
      sql: `
        -- Workflows table for visual workflow automation
        CREATE TABLE IF NOT EXISTS workflows (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          nodes TEXT NOT NULL,
          edges TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'draft',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        );

        -- Workflow executions table for tracking workflow runs
        CREATE TABLE IF NOT EXISTS workflow_executions (
          id TEXT PRIMARY KEY,
          workflow_id TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'running',
          started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          completed_at TEXT,
          error TEXT,
          execution_data TEXT,
          FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
        );

        -- Create indexes for workflows
        CREATE INDEX IF NOT EXISTS idx_workflows_session_id ON workflows(session_id);
        CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
        CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
        CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
        CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at);
      `,
    },
    {
      name: '009_add_workflow_auto_create_task',
      sql: `
        -- Add auto_create_task column to workflows table
        ALTER TABLE workflows ADD COLUMN auto_create_task INTEGER DEFAULT 0;
      `,
    },
  ];

  const appliedMigrations = database
    .prepare('SELECT name FROM migrations')
    .all() as { name: string }[];
  const appliedNames = new Set(appliedMigrations.map((m) => m.name));

  for (const migration of migrations) {
    if (!appliedNames.has(migration.name)) {
      database.exec(migration.sql);
      database.prepare('INSERT INTO migrations (name) VALUES (?)').run(migration.name);
    }
  }
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
