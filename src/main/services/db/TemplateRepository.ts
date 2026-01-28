import { getDatabase } from './Database';
import type {
  TaskTemplate,
  TaskTemplateCreateInput,
  TaskTemplateUpdateInput,
  SubtaskTemplateData,
  TaskTemplateData,
} from '../../../shared/types/taskTemplate';
import { randomUUID } from 'crypto';

interface TemplateRow {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  task_data: string; // JSON
  subtasks: string | null; // JSON array
  created_at: string;
  updated_at: string;
  usage_count: number;
}

function rowToTemplate(row: TemplateRow): TaskTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    category: row.category || undefined,
    taskData: JSON.parse(row.task_data) as TaskTemplateData,
    subtasks: row.subtasks ? (JSON.parse(row.subtasks) as SubtaskTemplateData[]) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    usageCount: row.usage_count,
  };
}

export class TemplateRepository {
  /**
   * Create a new task template
   */
  create(input: TaskTemplateCreateInput): TaskTemplate {
    const db = getDatabase();
    const id = randomUUID();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO task_templates (
        id, name, description, category, task_data, subtasks, created_at, updated_at, usage_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      input.name,
      input.description || null,
      input.category || null,
      JSON.stringify(input.taskData),
      input.subtasks ? JSON.stringify(input.subtasks) : null,
      now,
      now,
      0
    );

    return this.getById(id)!;
  }

  /**
   * Get template by ID
   */
  getById(id: string): TaskTemplate | null {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM task_templates WHERE id = ?')
      .get(id) as TemplateRow | undefined;

    return row ? rowToTemplate(row) : null;
  }

  /**
   * Get all templates
   */
  getAll(): TaskTemplate[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM task_templates ORDER BY created_at DESC')
      .all() as TemplateRow[];

    return rows.map(rowToTemplate);
  }

  /**
   * Get templates by category
   */
  getByCategory(category: string): TaskTemplate[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM task_templates WHERE category = ? ORDER BY created_at DESC')
      .all(category) as TemplateRow[];

    return rows.map(rowToTemplate);
  }

  /**
   * Get popular templates (sorted by usage count)
   */
  getPopular(limit: number = 10): TaskTemplate[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM task_templates ORDER BY usage_count DESC, created_at DESC LIMIT ?')
      .all(limit) as TemplateRow[];

    return rows.map(rowToTemplate);
  }

  /**
   * Update template
   */
  update(id: string, updates: TaskTemplateUpdateInput): TaskTemplate | null {
    const db = getDatabase();
    const existing = this.getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updateFields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      values.push(updates.name);
    }

    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      values.push(updates.description || null);
    }

    if (updates.category !== undefined) {
      updateFields.push('category = ?');
      values.push(updates.category || null);
    }

    if (updates.taskData !== undefined) {
      const mergedTaskData = { ...existing.taskData, ...updates.taskData };
      updateFields.push('task_data = ?');
      values.push(JSON.stringify(mergedTaskData));
    }

    if (updates.subtasks !== undefined) {
      updateFields.push('subtasks = ?');
      values.push(updates.subtasks ? JSON.stringify(updates.subtasks) : null);
    }

    if (updateFields.length === 0) {
      return existing;
    }

    updateFields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const stmt = db.prepare(`
      UPDATE task_templates
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);

    return this.getById(id);
  }

  /**
   * Increment usage count
   */
  incrementUsageCount(id: string): void {
    const db = getDatabase();
    db.prepare('UPDATE task_templates SET usage_count = usage_count + 1 WHERE id = ?').run(id);
  }

  /**
   * Delete template
   */
  delete(id: string): void {
    const db = getDatabase();
    db.prepare('DELETE FROM task_templates WHERE id = ?').run(id);
  }

  /**
   * Search templates by name or description
   */
  search(query: string): TaskTemplate[] {
    const db = getDatabase();
    const searchPattern = `%${query}%`;
    const rows = db
      .prepare(`
        SELECT * FROM task_templates
        WHERE name LIKE ? OR description LIKE ?
        ORDER BY usage_count DESC, created_at DESC
      `)
      .all(searchPattern, searchPattern) as TemplateRow[];

    return rows.map(rowToTemplate);
  }
}
