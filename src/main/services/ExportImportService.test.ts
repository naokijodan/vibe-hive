import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockShowSaveDialog, mockShowOpenDialog, mockWriteFile, mockReadFile, mockAll, mockRun, mockGet, mockPrepare, mockTransaction } = vi.hoisted(() => {
  const mockAll = vi.fn(() => []);
  const mockRun = vi.fn();
  const mockGet = vi.fn();
  const mockPrepare = vi.fn(() => ({ all: mockAll, run: mockRun, get: mockGet }));
  const mockTransaction = vi.fn((fn: Function) => fn);
  return {
    mockShowSaveDialog: vi.fn(),
    mockShowOpenDialog: vi.fn(),
    mockWriteFile: vi.fn(),
    mockReadFile: vi.fn(),
    mockAll,
    mockRun,
    mockGet,
    mockPrepare,
    mockTransaction,
  };
});

vi.mock('electron', () => ({
  dialog: {
    showSaveDialog: mockShowSaveDialog,
    showOpenDialog: mockShowOpenDialog,
  },
}));

vi.mock('fs/promises', () => ({
  default: {
    writeFile: mockWriteFile,
    readFile: mockReadFile,
  },
}));

vi.mock('./db', () => ({
  getDatabase: () => ({
    prepare: mockPrepare,
    transaction: mockTransaction,
  }),
}));

let getExportImportService: () => any;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.doMock('electron', () => ({
    dialog: {
      showSaveDialog: mockShowSaveDialog,
      showOpenDialog: mockShowOpenDialog,
    },
  }));
  vi.doMock('fs/promises', () => ({
    default: {
      writeFile: mockWriteFile,
      readFile: mockReadFile,
    },
  }));
  vi.doMock('./db', () => ({
    getDatabase: () => ({
      prepare: mockPrepare,
      transaction: mockTransaction,
    }),
  }));
  const mod = await import('./ExportImportService');
  getExportImportService = mod.getExportImportService;
});

describe('ExportImportService', () => {
  describe('exportData', () => {
    it('returns canceled when dialog canceled', async () => {
      mockShowSaveDialog.mockResolvedValue({ canceled: true });
      const svc = getExportImportService();
      const result = await svc.exportData(['tasks']);
      expect(result.success).toBe(false);
      expect(result.canceled).toBe(true);
    });

    it('exports tasks to file', async () => {
      mockShowSaveDialog.mockResolvedValue({ canceled: false, filePath: '/tmp/export.json' });
      mockAll.mockReturnValue([{ id: 1, title: 'Task 1' }]);
      mockWriteFile.mockResolvedValue(undefined);

      const svc = getExportImportService();
      const result = await svc.exportData(['tasks']);

      expect(result.success).toBe(true);
      expect(result.stats?.tasks).toBe(1);
      expect(mockWriteFile).toHaveBeenCalled();
    });

    it('exports multiple targets', async () => {
      mockShowSaveDialog.mockResolvedValue({ canceled: false, filePath: '/tmp/export.json' });
      mockAll.mockReturnValue([{ id: 1 }]);
      mockWriteFile.mockResolvedValue(undefined);

      const svc = getExportImportService();
      const result = await svc.exportData(['tasks', 'workflows']);

      expect(result.stats?.tasks).toBe(1);
      expect(result.stats?.workflows).toBe(1);
    });
  });

  describe('importData', () => {
    it('returns canceled when dialog canceled', async () => {
      mockShowOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] });
      const svc = getExportImportService();
      const result = await svc.importData();
      expect(result.canceled).toBe(true);
    });

    it('returns error for invalid JSON', async () => {
      mockShowOpenDialog.mockResolvedValue({ canceled: false, filePaths: ['/tmp/bad.json'] });
      mockReadFile.mockResolvedValue('not json');

      const svc = getExportImportService();
      const result = await svc.importData();
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Invalid JSON');
    });

    it('returns error for non-vibe-hive file', async () => {
      mockShowOpenDialog.mockResolvedValue({ canceled: false, filePaths: ['/tmp/other.json'] });
      mockReadFile.mockResolvedValue(JSON.stringify({ app: 'other' }));

      const svc = getExportImportService();
      const result = await svc.importData();
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Not a valid vibe-hive');
    });

    it('imports tasks in merge mode', async () => {
      const exportData = {
        version: 1,
        exportedAt: '2026-01-01',
        app: 'vibe-hive',
        data: { tasks: [{ id: 1, title: 'T1' }] },
      };
      mockShowOpenDialog.mockResolvedValue({ canceled: false, filePaths: ['/tmp/good.json'] });
      mockReadFile.mockResolvedValue(JSON.stringify(exportData));
      mockGet.mockReturnValue(undefined); // no existing
      mockTransaction.mockImplementation((fn: Function) => fn);

      const svc = getExportImportService();
      const result = await svc.importData('merge');
      expect(result.success).toBe(true);
      expect(result.stats?.tasks).toBe(1);
    });

    it('skips existing in merge mode', async () => {
      const exportData = {
        version: 1,
        exportedAt: '2026-01-01',
        app: 'vibe-hive',
        data: { tasks: [{ id: 1, title: 'T1' }] },
      };
      mockShowOpenDialog.mockResolvedValue({ canceled: false, filePaths: ['/tmp/good.json'] });
      mockReadFile.mockResolvedValue(JSON.stringify(exportData));
      mockGet.mockReturnValue({ id: 1 }); // exists
      mockTransaction.mockImplementation((fn: Function) => fn);

      const svc = getExportImportService();
      const result = await svc.importData('merge');
      expect(result.warnings).toContain('Task 1 already exists, skipped');
    });
  });
});
