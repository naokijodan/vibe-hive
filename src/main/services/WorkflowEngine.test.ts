import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFindById, mockFindAll, mockFindBySessionId, mockCreateExecution, mockUpdateExecution, mockFindExecutionById, mockFindExecutionsByWorkflowId } = vi.hoisted(() => ({
  mockFindById: vi.fn(),
  mockFindAll: vi.fn(() => []),
  mockFindBySessionId: vi.fn(() => []),
  mockCreateExecution: vi.fn(() => ({ id: 1, workflowId: 1, status: 'running', startedAt: Date.now() })),
  mockUpdateExecution: vi.fn(),
  mockFindExecutionById: vi.fn(),
  mockFindExecutionsByWorkflowId: vi.fn(() => []),
}));

vi.mock('electron', () => ({
  BrowserWindow: class {},
}));

vi.mock('./db/WorkflowRepository', () => ({
  WorkflowRepository: class {
    findById = mockFindById;
    findAll = mockFindAll;
    findBySessionId = mockFindBySessionId;
    createExecution = mockCreateExecution;
    updateExecution = mockUpdateExecution;
    findExecutionById = mockFindExecutionById;
    findExecutionsByWorkflowId = mockFindExecutionsByWorkflowId;
  },
}));

vi.mock('./db/TaskRepository', () => ({
  TaskRepository: class {
    create = vi.fn();
  },
}));

vi.mock('./ExecutionEngine', () => ({
  getExecutionEngine: () => ({
    startExecution: vi.fn(),
    getExecution: vi.fn(),
    cancelExecution: vi.fn(),
  }),
}));

vi.mock('./NotificationService', () => ({
  notificationService: {
    send: vi.fn(),
    setWebhookUrl: vi.fn(),
  },
}));

vi.mock('./SettingsService', () => ({
  getSettingsService: () => ({
    getSettings: () => ({
      agent: {
        providers: {
          'claude-code': { enabled: true, cliPath: 'claude' },
          codex: { enabled: true, cliPath: 'codex' },
          gemini: { enabled: true, cliPath: 'gemini' },
          ollama: { enabled: true, cliPath: 'ollama' },
        },
        ollamaDefaultModel: 'llama3',
      },
    }),
  }),
}));

import { WorkflowEngine, getWorkflowEngine } from './WorkflowEngine';

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new WorkflowEngine();
  });

  it('getWorkflow delegates to repository', () => {
    mockFindById.mockReturnValue({ id: 1, name: 'WF' });
    expect(engine.getWorkflow(1)?.name).toBe('WF');
  });

  it('getWorkflow returns null when not found', () => {
    mockFindById.mockReturnValue(null);
    expect(engine.getWorkflow(999)).toBeNull();
  });

  it('getAllWorkflows returns list', () => {
    mockFindAll.mockReturnValue([{ id: 1 }]);
    expect(engine.getAllWorkflows()).toHaveLength(1);
  });

  it('getWorkflowsBySession delegates', () => {
    mockFindBySessionId.mockReturnValue([]);
    expect(engine.getWorkflowsBySession(1)).toEqual([]);
  });

  it('getExecution delegates', () => {
    mockFindExecutionById.mockReturnValue({ id: 1 });
    expect(engine.getExecution(1)?.id).toBe(1);
  });

  it('getExecutionsByWorkflow delegates', () => {
    mockFindExecutionsByWorkflowId.mockReturnValue([]);
    expect(engine.getExecutionsByWorkflow(1)).toEqual([]);
  });

  it('execute throws when workflow not found', async () => {
    mockFindById.mockReturnValue(null);
    await expect(engine.execute({ workflowId: 999 })).rejects.toThrow('not found');
  });

  it('execute returns failed on workflow error', async () => {
    mockFindById.mockReturnValue({
      id: 1,
      name: 'WF',
      nodes: [
        { id: 'n1', type: 'trigger', data: {} },
        { id: 'n2', type: 'unknown_bad', data: {} },
      ],
      edges: [{ source: 'n1', target: 'n2' }],
    });

    const result = await engine.execute({ workflowId: 1 });
    expect(result.status).toBe('failed');
  });

  it('execute succeeds with trigger-only workflow', async () => {
    mockFindById.mockReturnValue({
      id: 1,
      name: 'Simple',
      nodes: [{ id: 'n1', type: 'trigger', data: {} }],
      edges: [],
    });

    const result = await engine.execute({ workflowId: 1, triggerData: { test: true } });
    expect(result.status).toBe('success');
  });

  it('cancel throws for non-existent execution', () => {
    expect(() => engine.cancel(999)).toThrow('not found');
  });

  it('onTaskCompleted does nothing with no active workflows', async () => {
    mockFindAll.mockReturnValue([]);
    await engine.onTaskCompleted('t1', 'Task 1', 's1');
    // No error
  });

  it('getWorkflowEngine returns singleton', () => {
    const a = getWorkflowEngine();
    const b = getWorkflowEngine();
    expect(a).toBe(b);
  });
});
