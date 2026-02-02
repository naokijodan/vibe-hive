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
});
