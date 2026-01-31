import { dialog } from 'electron';
import fs from 'fs/promises';
import { getDatabase } from './db';

export interface ExportData {
  version: 1;
  exportedAt: string;
  app: 'vibe-hive';
  data: {
    tasks?: unknown[];
    taskTemplates?: unknown[];
    workflows?: unknown[];
    workflowTemplates?: unknown[];
  };
}

export interface ExportImportResult {
  success: boolean;
  filePath?: string;
  canceled?: boolean;
  errors?: string[];
  warnings?: string[];
  stats?: {
    tasks?: number;
    taskTemplates?: number;
    workflows?: number;
    workflowTemplates?: number;
  };
}

type ExportTarget = 'tasks' | 'taskTemplates' | 'workflows' | 'workflowTemplates';

class ExportImportService {
  async exportData(targets: ExportTarget[]): Promise<ExportImportResult> {
    const result = await dialog.showSaveDialog({
      title: 'Export Data',
      defaultPath: `vibe-hive-export-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    const db = getDatabase();
    const exportData: ExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      app: 'vibe-hive',
      data: {},
    };

    const stats: ExportImportResult['stats'] = {};

    if (targets.includes('tasks')) {
      const rows = db.prepare('SELECT * FROM tasks').all();
      exportData.data.tasks = rows;
      stats.tasks = rows.length;
    }

    if (targets.includes('taskTemplates')) {
      const rows = db.prepare('SELECT * FROM task_templates').all();
      exportData.data.taskTemplates = rows;
      stats.taskTemplates = rows.length;
    }

    if (targets.includes('workflows')) {
      const rows = db.prepare('SELECT * FROM workflows').all();
      exportData.data.workflows = rows;
      stats.workflows = rows.length;
    }

    if (targets.includes('workflowTemplates')) {
      const rows = db.prepare('SELECT * FROM workflow_templates').all();
      exportData.data.workflowTemplates = rows;
      stats.workflowTemplates = rows.length;
    }

    await fs.writeFile(result.filePath, JSON.stringify(exportData, null, 2), 'utf-8');

    return { success: true, filePath: result.filePath, stats };
  }

  async importData(mode: 'merge' | 'overwrite' = 'merge'): Promise<ExportImportResult> {
    const result = await dialog.showOpenDialog({
      title: 'Import Data',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const fileContent = await fs.readFile(result.filePaths[0], 'utf-8');
    let parsed: ExportData;

    try {
      parsed = JSON.parse(fileContent);
    } catch {
      return { success: false, errors: ['Invalid JSON file'] };
    }

    if (parsed.app !== 'vibe-hive' || !parsed.version || !parsed.data) {
      return { success: false, errors: ['Not a valid vibe-hive export file'] };
    }

    const db = getDatabase();
    const errors: string[] = [];
    const warnings: string[] = [];
    const stats: ExportImportResult['stats'] = {};

    const importInTransaction = db.transaction(() => {
      // Tasks
      if (parsed.data.tasks && Array.isArray(parsed.data.tasks)) {
        if (mode === 'overwrite') {
          db.prepare('DELETE FROM tasks').run();
        }
        let count = 0;
        for (const row of parsed.data.tasks) {
          try {
            const r = row as Record<string, unknown>;
            if (mode === 'merge') {
              const existing = db.prepare('SELECT id FROM tasks WHERE id = ?').get(r.id);
              if (existing) {
                warnings.push(`Task ${r.id} already exists, skipped`);
                continue;
              }
            }
            db.prepare(
              `INSERT INTO tasks (id, session_id, title, description, status, priority, assigned_agent_id, parent_task_id, review_feedback, depends_on, role, created_at, updated_at, completed_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).run(
              r.id, r.session_id, r.title, r.description, r.status, r.priority,
              r.assigned_agent_id, r.parent_task_id, r.review_feedback, r.depends_on,
              r.role, r.created_at, r.updated_at, r.completed_at
            );
            count++;
          } catch (e) {
            errors.push(`Failed to import task: ${(e as Error).message}`);
          }
        }
        stats.tasks = count;
      }

      // Task Templates
      if (parsed.data.taskTemplates && Array.isArray(parsed.data.taskTemplates)) {
        if (mode === 'overwrite') {
          db.prepare('DELETE FROM task_templates').run();
        }
        let count = 0;
        for (const row of parsed.data.taskTemplates) {
          try {
            const r = row as Record<string, unknown>;
            if (mode === 'merge') {
              const existing = db.prepare('SELECT id FROM task_templates WHERE id = ?').get(r.id);
              if (existing) {
                warnings.push(`Task template ${r.id} already exists, skipped`);
                continue;
              }
            }
            db.prepare(
              `INSERT INTO task_templates (id, name, description, category, priority, role, subtask_titles, tags, usage_count, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).run(
              r.id, r.name, r.description, r.category, r.priority, r.role,
              r.subtask_titles, r.tags, r.usage_count, r.created_at, r.updated_at
            );
            count++;
          } catch (e) {
            errors.push(`Failed to import task template: ${(e as Error).message}`);
          }
        }
        stats.taskTemplates = count;
      }

      // Workflows
      if (parsed.data.workflows && Array.isArray(parsed.data.workflows)) {
        if (mode === 'overwrite') {
          db.prepare('DELETE FROM workflows').run();
        }
        let count = 0;
        for (const row of parsed.data.workflows) {
          try {
            const r = row as Record<string, unknown>;
            if (mode === 'merge') {
              const existing = db.prepare('SELECT id FROM workflows WHERE id = ?').get(r.id);
              if (existing) {
                warnings.push(`Workflow ${r.id} already exists, skipped`);
                continue;
              }
            }
            db.prepare(
              `INSERT INTO workflows (id, session_id, name, description, nodes, edges, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).run(
              r.id, r.session_id, r.name, r.description, r.nodes, r.edges,
              r.status, r.created_at, r.updated_at
            );
            count++;
          } catch (e) {
            errors.push(`Failed to import workflow: ${(e as Error).message}`);
          }
        }
        stats.workflows = count;
      }

      // Workflow Templates
      if (parsed.data.workflowTemplates && Array.isArray(parsed.data.workflowTemplates)) {
        if (mode === 'overwrite') {
          db.prepare('DELETE FROM workflow_templates').run();
        }
        let count = 0;
        for (const row of parsed.data.workflowTemplates) {
          try {
            const r = row as Record<string, unknown>;
            if (mode === 'merge') {
              const existing = db.prepare('SELECT id FROM workflow_templates WHERE id = ?').get(r.id);
              if (existing) {
                warnings.push(`Workflow template ${r.id} already exists, skipped`);
                continue;
              }
            }
            db.prepare(
              `INSERT INTO workflow_templates (id, name, description, category, nodes, edges, thumbnail, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).run(
              r.id, r.name, r.description, r.category, r.nodes, r.edges,
              r.thumbnail, r.created_at, r.updated_at
            );
            count++;
          } catch (e) {
            errors.push(`Failed to import workflow template: ${(e as Error).message}`);
          }
        }
        stats.workflowTemplates = count;
      }
    });

    try {
      importInTransaction();
    } catch (e) {
      return { success: false, errors: [`Transaction failed: ${(e as Error).message}`] };
    }

    return {
      success: errors.length === 0,
      stats,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

let instance: ExportImportService | null = null;

export function getExportImportService(): ExportImportService {
  if (!instance) {
    instance = new ExportImportService();
  }
  return instance;
}
