import { getDatabase } from './Database';
import type {
  Workflow,
  WorkflowExecution,
  CreateWorkflowParams,
  UpdateWorkflowParams,
} from '../../../shared/types/workflow';
import { randomUUID } from 'crypto';

interface WorkflowRow {
  id: string;
  session_id: string;
  name: string;
  description: string | null;
  nodes: string;
  edges: string;
  status: string;
  auto_create_task: number;
  created_at: string;
  updated_at: string;
}

interface WorkflowExecutionRow {
  id: string;
  workflow_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  error: string | null;
  execution_data: string | null;
}

function rowToWorkflow(row: WorkflowRow): Workflow {
  return {
    id: parseInt(row.id, 10),
    sessionId: parseInt(row.session_id, 10),
    name: row.name,
    description: row.description || undefined,
    nodes: JSON.parse(row.nodes),
    edges: JSON.parse(row.edges),
    status: row.status as 'draft' | 'active' | 'paused',
    autoCreateTask: row.auto_create_task === 1,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

function rowToWorkflowExecution(row: WorkflowExecutionRow): WorkflowExecution {
  return {
    id: parseInt(row.id, 10),
    workflowId: parseInt(row.workflow_id, 10),
    status: row.status as 'running' | 'success' | 'failed' | 'cancelled',
    startedAt: new Date(row.started_at).getTime(),
    completedAt: row.completed_at ? new Date(row.completed_at).getTime() : undefined,
    error: row.error || undefined,
    executionData: row.execution_data ? JSON.parse(row.execution_data) : undefined,
  };
}

export class WorkflowRepository {
  create(params: CreateWorkflowParams): Workflow {
    const db = getDatabase();
    const id = randomUUID();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO workflows (
        id, session_id, name, description, nodes, edges, status, auto_create_task, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      params.sessionId.toString(),
      params.name,
      params.description || null,
      JSON.stringify(params.nodes || []),
      JSON.stringify(params.edges || []),
      'draft',
      params.autoCreateTask ? 1 : 0,
      now,
      now
    );

    const row = db
      .prepare('SELECT * FROM workflows WHERE id = ?')
      .get(id) as WorkflowRow;

    return rowToWorkflow(row);
  }

  findById(id: number): Workflow | null {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM workflows WHERE id = ?')
      .get(id.toString()) as WorkflowRow | undefined;

    return row ? rowToWorkflow(row) : null;
  }

  findBySessionId(sessionId: number): Workflow[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM workflows WHERE session_id = ? ORDER BY created_at DESC')
      .all(sessionId.toString()) as WorkflowRow[];

    return rows.map(rowToWorkflow);
  }

  findAll(): Workflow[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM workflows ORDER BY created_at DESC')
      .all() as WorkflowRow[];

    return rows.map(rowToWorkflow);
  }

  update(params: UpdateWorkflowParams): Workflow {
    const db = getDatabase();
    const now = new Date().toISOString();

    const updates: string[] = [];
    const values: any[] = [];

    if (params.name !== undefined) {
      updates.push('name = ?');
      values.push(params.name);
    }
    if (params.description !== undefined) {
      updates.push('description = ?');
      values.push(params.description);
    }
    if (params.nodes !== undefined) {
      updates.push('nodes = ?');
      values.push(JSON.stringify(params.nodes));
    }
    if (params.edges !== undefined) {
      updates.push('edges = ?');
      values.push(JSON.stringify(params.edges));
    }
    if (params.status !== undefined) {
      updates.push('status = ?');
      values.push(params.status);
    }
    if (params.autoCreateTask !== undefined) {
      updates.push('auto_create_task = ?');
      values.push(params.autoCreateTask ? 1 : 0);
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(params.id.toString());

    const stmt = db.prepare(`
      UPDATE workflows
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);

    const row = db
      .prepare('SELECT * FROM workflows WHERE id = ?')
      .get(params.id.toString()) as WorkflowRow;

    return rowToWorkflow(row);
  }

  delete(id: number): void {
    const db = getDatabase();
    db.prepare('DELETE FROM workflows WHERE id = ?').run(id.toString());
  }

  // Workflow Execution methods
  createExecution(workflowId: number): WorkflowExecution {
    const db = getDatabase();
    const id = randomUUID();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO workflow_executions (
        id, workflow_id, status, started_at
      ) VALUES (?, ?, ?, ?)
    `);

    stmt.run(id, workflowId.toString(), 'running', now);

    const row = db
      .prepare('SELECT * FROM workflow_executions WHERE id = ?')
      .get(id) as WorkflowExecutionRow;

    return rowToWorkflowExecution(row);
  }

  updateExecution(
    executionId: number,
    updates: {
      status?: 'running' | 'success' | 'failed' | 'cancelled';
      error?: string;
      executionData?: Record<string, any>;
    }
  ): WorkflowExecution {
    const db = getDatabase();
    const now = new Date().toISOString();

    const updateFields: string[] = [];
    const values: any[] = [];

    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      values.push(updates.status);

      if (updates.status !== 'running') {
        updateFields.push('completed_at = ?');
        values.push(now);
      }
    }
    if (updates.error !== undefined) {
      updateFields.push('error = ?');
      values.push(updates.error);
    }
    if (updates.executionData !== undefined) {
      updateFields.push('execution_data = ?');
      values.push(JSON.stringify(updates.executionData));
    }

    values.push(executionId.toString());

    const stmt = db.prepare(`
      UPDATE workflow_executions
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);

    const row = db
      .prepare('SELECT * FROM workflow_executions WHERE id = ?')
      .get(executionId.toString()) as WorkflowExecutionRow;

    return rowToWorkflowExecution(row);
  }

  findExecutionsByWorkflowId(workflowId: number): WorkflowExecution[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM workflow_executions WHERE workflow_id = ? ORDER BY started_at DESC')
      .all(workflowId.toString()) as WorkflowExecutionRow[];

    return rows.map(rowToWorkflowExecution);
  }

  findExecutionById(executionId: number): WorkflowExecution | null {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM workflow_executions WHERE id = ?')
      .get(executionId.toString()) as WorkflowExecutionRow | undefined;

    return row ? rowToWorkflowExecution(row) : null;
  }
}
