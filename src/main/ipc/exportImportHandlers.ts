import { ipcMain } from 'electron';
import { getExportImportService } from '../services/ExportImportService';

export function registerExportImportHandlers(): void {
  const service = getExportImportService();

  ipcMain.handle('exportImport:export', async (_event, targets: string[]) => {
    return service.exportData(targets as ('tasks' | 'taskTemplates' | 'workflows' | 'workflowTemplates')[]);
  });

  ipcMain.handle('exportImport:import', async (_event, mode: 'merge' | 'overwrite') => {
    return service.importData(mode);
  });
}
