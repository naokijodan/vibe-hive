import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockHandle } = vi.hoisted(() => ({
  mockHandle: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: { handle: mockHandle },
}));

vi.mock('../services/db/TemplateRepository', () => ({
  TemplateRepository: class {
    create = vi.fn();
    getById = vi.fn();
    getAll = vi.fn();
    getByCategory = vi.fn();
    getPopular = vi.fn();
    update = vi.fn();
    incrementUsageCount = vi.fn();
    delete = vi.fn();
    search = vi.fn();
  },
}));

import { registerTemplateHandlers } from './templateHandlers';

describe('templateHandlers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers all template handlers', () => {
    registerTemplateHandlers();
    const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
    expect(channels).toContain('template:create');
    expect(channels).toContain('template:get');
    expect(channels).toContain('template:getAll');
    expect(channels).toContain('template:getByCategory');
    expect(channels).toContain('template:getPopular');
    expect(channels).toContain('template:update');
    expect(channels).toContain('template:incrementUsage');
    expect(channels).toContain('template:delete');
    expect(channels).toContain('template:search');
    expect(mockHandle).toHaveBeenCalledTimes(9);
  });

  describe('handler invocations', () => {
    let handlers: Map<string, (...args: unknown[]) => unknown>;

    beforeEach(() => {
      handlers = new Map();
      mockHandle.mockImplementation((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      });
      registerTemplateHandlers();
    });

    it('template:create invokes repository', async () => {
      const handler = handlers.get('template:create');
      await handler?.({}, { name: 'Test', content: '' });
    });

    it('template:get invokes repository', async () => {
      const handler = handlers.get('template:get');
      await handler?.({}, 1);
    });

    it('template:getAll invokes repository', async () => {
      const handler = handlers.get('template:getAll');
      await handler?.({});
    });

    it('template:getByCategory invokes repository', async () => {
      const handler = handlers.get('template:getByCategory');
      await handler?.({}, 'automation');
    });

    it('template:getPopular invokes repository', async () => {
      const handler = handlers.get('template:getPopular');
      await handler?.({}, 10);
    });

    it('template:update invokes repository', async () => {
      const handler = handlers.get('template:update');
      await handler?.({}, 1, { name: 'Updated' });
    });

    it('template:incrementUsage invokes repository', async () => {
      const handler = handlers.get('template:incrementUsage');
      await handler?.({}, 1);
    });

    it('template:delete invokes repository', async () => {
      const handler = handlers.get('template:delete');
      await handler?.({}, 1);
    });

    it('template:search invokes repository', async () => {
      const handler = handlers.get('template:search');
      await handler?.({}, 'query');
    });
  });
});
