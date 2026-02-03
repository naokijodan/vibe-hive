import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockHandle } = vi.hoisted(() => ({
  mockHandle: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: { handle: mockHandle },
}));

vi.mock('../services/ExportImportService', () => ({
  getExportImportService: () => ({ exportData: vi.fn(), importData: vi.fn() }),
}));

import { registerExportImportHandlers } from './exportImportHandlers';

describe('exportImportHandlers', () => {
  beforeEach(() => vi.clearAllMocks());
  it('registers export/import handlers', () => {
    registerExportImportHandlers();
    const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
    expect(channels).toContain('exportImport:export');
    expect(channels).toContain('exportImport:import');
  });

  describe('handler invocations', () => {
    let handlers: Map<string, (...args: unknown[]) => unknown>;

    beforeEach(() => {
      handlers = new Map();
      mockHandle.mockImplementation((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      });
      registerExportImportHandlers();
    });

    it('exportImport:export invokes service', async () => {
      const handler = handlers.get('exportImport:export');
      await handler?.({}, { sessions: true, templates: true });
    });

    it('exportImport:import invokes service', async () => {
      const handler = handlers.get('exportImport:import');
      await handler?.({}, { sessions: [], templates: [] });
    });
  });
});
