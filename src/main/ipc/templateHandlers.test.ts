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
});
