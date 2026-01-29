import Database from 'better-sqlite3';
import type {
  WorkflowTemplate,
  TemplateCreateInput,
  TemplateUpdateInput,
} from '../../../shared/types/template';
import type { WorkflowNode, WorkflowEdge } from '../../../shared/types/workflow';

export class WorkflowTemplateRepository {
  constructor(private db: Database.Database) {}

  create(input: TemplateCreateInput): WorkflowTemplate {
    const stmt = this.db.prepare(`
      INSERT INTO workflow_templates (name, description, category, nodes, edges, thumbnail, is_built_in)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `);

    const info = stmt.run(
      input.name,
      input.description,
      input.category,
      JSON.stringify(input.nodes),
      JSON.stringify(input.edges),
      input.thumbnail || null
    );

    return this.findById(Number(info.lastInsertRowid))!;
  }

  findById(id: number): WorkflowTemplate | null {
    const stmt = this.db.prepare(`
      SELECT * FROM workflow_templates WHERE id = ?
    `);

    const row = stmt.get(id) as any;
    if (!row) return null;

    return this.mapRowToTemplate(row);
  }

  findAll(): WorkflowTemplate[] {
    const stmt = this.db.prepare(`
      SELECT * FROM workflow_templates ORDER BY is_built_in DESC, created_at DESC
    `);

    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapRowToTemplate(row));
  }

  findByCategory(category: string): WorkflowTemplate[] {
    const stmt = this.db.prepare(`
      SELECT * FROM workflow_templates WHERE category = ? ORDER BY is_built_in DESC, created_at DESC
    `);

    const rows = stmt.all(category) as any[];
    return rows.map((row) => this.mapRowToTemplate(row));
  }

  update(id: number, input: TemplateUpdateInput): WorkflowTemplate | null {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description);
    }
    if (input.category !== undefined) {
      updates.push('category = ?');
      values.push(input.category);
    }
    if (input.thumbnail !== undefined) {
      updates.push('thumbnail = ?');
      values.push(input.thumbnail);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const sql = `UPDATE workflow_templates SET ${updates.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(sql);

    stmt.run(...values);
    return this.findById(id);
  }

  delete(id: number): void {
    const template = this.findById(id);
    if (template?.isBuiltIn) {
      throw new Error('Cannot delete built-in templates');
    }

    const stmt = this.db.prepare(`
      DELETE FROM workflow_templates WHERE id = ?
    `);

    stmt.run(id);
  }

  private mapRowToTemplate(row: any): WorkflowTemplate {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      nodes: JSON.parse(row.nodes) as WorkflowNode[],
      edges: JSON.parse(row.edges) as WorkflowEdge[],
      thumbnail: row.thumbnail,
      isBuiltIn: Boolean(row.is_built_in),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
