import { ipcMain } from 'electron';
import { ptyService } from '../services/PtyService';

export function registerPtyHandlers(): void {
  // Create a new PTY session
  ipcMain.handle('pty:create', (_event, sessionId: string, cols?: number, rows?: number) => {
    return ptyService.create(sessionId, cols, rows);
  });

  // Write data to PTY
  ipcMain.handle('pty:write', (_event, sessionId: string, data: string) => {
    ptyService.write(sessionId, data);
  });

  // Resize PTY
  ipcMain.handle('pty:resize', (_event, sessionId: string, cols: number, rows: number) => {
    ptyService.resize(sessionId, cols, rows);
  });

  // Close PTY session
  ipcMain.handle('pty:close', (_event, sessionId: string) => {
    ptyService.close(sessionId);
  });

  // List all sessions
  ipcMain.handle('pty:list', () => {
    return ptyService.getAllSessions();
  });
}
