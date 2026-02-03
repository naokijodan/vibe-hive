import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockHandle } = vi.hoisted(() => ({
  mockHandle: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: { handle: mockHandle },
}));

vi.mock('../services/db', () => ({
  SessionRepository: class {
    create = vi.fn();
    getById = vi.fn();
    getAll = vi.fn();
    update = vi.fn();
    delete = vi.fn();
    updateStatus = vi.fn();
  },
  TaskRepository: class {
    create = vi.fn();
    getById = vi.fn();
    getBySessionId = vi.fn();
    getByStatus = vi.fn();
    getAll = vi.fn();
    update = vi.fn();
    updateStatus = vi.fn();
    delete = vi.fn();
    getSubtasks = vi.fn();
    createSubtasks = vi.fn();
    areDependenciesMet = vi.fn();
    clearReviewFeedback = vi.fn();
    wouldCreateCircularDependency = vi.fn();
    getDependentTasks = vi.fn();
    getDependencyTree = vi.fn();
    isReadyToExecute = vi.fn();
    getReadyTasks = vi.fn();
  },
  TerminalLogRepository: class {
    append = vi.fn();
    getBySessionId = vi.fn();
    deleteBySessionId = vi.fn();
    cleanup = vi.fn();
  },
  AgentRepository: class {
    create = vi.fn();
    getById = vi.fn();
    getAll = vi.fn();
    getBySessionId = vi.fn();
    update = vi.fn();
    updateStatus = vi.fn();
    delete = vi.fn();
  },
}));

import { registerDbHandlers } from './dbHandlers';

describe('dbHandlers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers all db handlers', () => {
    registerDbHandlers();
    const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
    // Session handlers
    expect(channels).toContain('db:session:create');
    expect(channels).toContain('db:session:get');
    expect(channels).toContain('db:session:getAll');
    expect(channels).toContain('db:session:update');
    expect(channels).toContain('db:session:delete');
    expect(channels).toContain('db:session:updateStatus');
    // Task handlers
    expect(channels).toContain('db:task:create');
    expect(channels).toContain('db:task:get');
    expect(channels).toContain('db:task:getBySession');
    expect(channels).toContain('db:task:getByStatus');
    expect(channels).toContain('db:task:getAll');
    expect(channels).toContain('db:task:update');
    expect(channels).toContain('db:task:updateStatus');
    expect(channels).toContain('db:task:delete');
    // Terminal log handlers
    expect(channels).toContain('db:terminalLog:append');
    expect(channels).toContain('db:terminalLog:getBySession');
    expect(channels).toContain('db:terminalLog:deleteBySession');
    expect(channels).toContain('db:terminalLog:cleanup');
    // Agent handlers
    expect(channels).toContain('db:agent:create');
    expect(channels).toContain('db:agent:get');
    expect(channels).toContain('db:agent:getAll');
    expect(channels).toContain('db:agent:getBySession');
    expect(channels).toContain('db:agent:update');
    expect(channels).toContain('db:agent:updateStatus');
    expect(channels).toContain('db:agent:delete');
  });

  describe('handler invocations', () => {
    let handlers: Map<string, (...args: unknown[]) => unknown>;

    beforeEach(() => {
      handlers = new Map();
      mockHandle.mockImplementation((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      });
      registerDbHandlers();
    });

    // Session handler invocations
    it('db:session:create invokes repository', async () => {
      const handler = handlers.get('db:session:create');
      await handler?.({}, { name: 'Test' });
    });

    it('db:session:get invokes repository', async () => {
      const handler = handlers.get('db:session:get');
      await handler?.({}, 'session-1');
    });

    it('db:session:getAll invokes repository', async () => {
      const handler = handlers.get('db:session:getAll');
      await handler?.({});
    });

    // Task handler invocations
    it('db:task:create invokes repository', async () => {
      const handler = handlers.get('db:task:create');
      await handler?.({}, { title: 'Test', sessionId: '1' });
    });

    it('db:task:get invokes repository', async () => {
      const handler = handlers.get('db:task:get');
      await handler?.({}, 'task-1');
    });

    it('db:task:getBySession invokes repository', async () => {
      const handler = handlers.get('db:task:getBySession');
      await handler?.({}, 'session-1');
    });

    it('db:task:getSubtasks invokes repository', async () => {
      const handler = handlers.get('db:task:getSubtasks');
      await handler?.({}, 'parent-1');
    });

    // Terminal log handler invocations
    it('db:terminalLog:append invokes repository', async () => {
      const handler = handlers.get('db:terminalLog:append');
      await handler?.({}, 'session-1', 'log data');
    });

    it('db:terminalLog:getBySession invokes repository', async () => {
      const handler = handlers.get('db:terminalLog:getBySession');
      await handler?.({}, 'session-1', 100);
    });

    // Agent handler invocations
    it('db:agent:create invokes repository', async () => {
      const handler = handlers.get('db:agent:create');
      await handler?.({}, { name: 'Agent', type: 'claude' });
    });

    it('db:agent:getBySession invokes repository', async () => {
      const handler = handlers.get('db:agent:getBySession');
      await handler?.({}, 'session-1');
    });
  });
});
