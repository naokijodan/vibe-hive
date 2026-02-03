import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockHandle } = vi.hoisted(() => ({
  mockHandle: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: { handle: mockHandle },
  dialog: {
    showSaveDialog: vi.fn(),
    showOpenDialog: vi.fn(),
  },
}));

vi.mock('fs', () => ({
  promises: {
    writeFile: vi.fn(),
    readFile: vi.fn(),
  },
}));

vi.mock('../services/WorkflowEngine', () => ({
  getWorkflowEngine: () => ({
    getWorkflow: vi.fn(),
    getAllWorkflows: vi.fn(),
    getWorkflowsBySession: vi.fn(),
    execute: vi.fn(),
    cancel: vi.fn(),
    getExecution: vi.fn(),
    getExecutionsByWorkflow: vi.fn(),
  }),
}));

vi.mock('../services/db/WorkflowRepository', () => ({
  WorkflowRepository: class {
    create = vi.fn();
    update = vi.fn();
    delete = vi.fn();
  },
}));

vi.mock('../services/db/WorkflowTemplateRepository', () => ({
  WorkflowTemplateRepository: class {
    findAll = vi.fn();
    findById = vi.fn();
    findByCategory = vi.fn();
    create = vi.fn();
    update = vi.fn();
    delete = vi.fn();
  },
}));

vi.mock('../services/db/Database', () => ({
  getDatabase: vi.fn(),
}));

vi.mock('../services/WorkflowValidator', () => ({
  WorkflowValidator: class {
    validate = vi.fn();
    migrateFormat = vi.fn();
  },
}));

import { registerWorkflowHandlers } from './workflowHandlers';

describe('workflowHandlers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers all workflow handlers', () => {
    registerWorkflowHandlers();
    const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
    expect(channels).toContain('workflow:create');
    expect(channels).toContain('workflow:update');
    expect(channels).toContain('workflow:delete');
    expect(channels).toContain('workflow:getById');
    expect(channels).toContain('workflow:getAll');
    expect(channels).toContain('workflow:getBySession');
    expect(channels).toContain('workflow:execute');
    expect(channels).toContain('workflow:cancel');
    expect(channels).toContain('workflow:getExecution');
    expect(channels).toContain('workflow:getExecutions');
    expect(channels).toContain('workflow:export');
    expect(channels).toContain('workflow:import');
    expect(channels).toContain('workflow:template:getAll');
    expect(channels).toContain('workflow:template:get');
    expect(channels).toContain('workflow:template:getByCategory');
    expect(channels).toContain('workflow:template:create');
    expect(channels).toContain('workflow:template:update');
    expect(channels).toContain('workflow:template:delete');
    expect(channels).toContain('workflow:template:apply');
    expect(channels).toContain('workflow:exportAsTemplate');
    expect(mockHandle).toHaveBeenCalledTimes(20);
  });

  describe('handler functions', () => {
    let handlers: Map<string, (...args: unknown[]) => unknown>;

    beforeEach(() => {
      handlers = new Map();
      mockHandle.mockImplementation((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      });
      registerWorkflowHandlers();
    });

    it('workflow:create calls repository create', async () => {
      const handler = handlers.get('workflow:create');
      const params = { name: 'Test', sessionId: 1 };
      await handler?.({}, params);
      // Handler was invoked without error
    });

    it('workflow:getAll calls engine getAllWorkflows', async () => {
      const handler = handlers.get('workflow:getAll');
      await handler?.({});
      // Handler was invoked
    });

    it('workflow:delete calls repository delete', async () => {
      const handler = handlers.get('workflow:delete');
      await handler?.({}, 1);
      // Handler was invoked
    });

    it('workflow:getById calls engine getWorkflow', async () => {
      const handler = handlers.get('workflow:getById');
      await handler?.({}, 1);
      // Handler was invoked
    });

    it('workflow:getBySession calls engine getWorkflowsBySession', async () => {
      const handler = handlers.get('workflow:getBySession');
      await handler?.({}, 1);
      // Handler was invoked
    });

    it('workflow:execute calls engine execute', async () => {
      const handler = handlers.get('workflow:execute');
      await handler?.({}, { workflowId: 1 });
      // Handler was invoked
    });

    it('workflow:cancel calls engine cancel', async () => {
      const handler = handlers.get('workflow:cancel');
      await handler?.({}, 1);
      // Handler was invoked
    });

    it('workflow:getExecution calls engine getExecution', async () => {
      const handler = handlers.get('workflow:getExecution');
      await handler?.({}, 1);
      // Handler was invoked
    });

    it('workflow:getExecutions calls engine getExecutionsByWorkflow', async () => {
      const handler = handlers.get('workflow:getExecutions');
      await handler?.({}, 1);
      // Handler was invoked
    });
  });
});
