import { ipcMain } from 'electron';
import { sessionRepository, taskRepository, terminalLogRepository } from '../services/db';
import type { SessionConfig } from '../../shared/types/session';
import type { TaskCreateInput, TaskStatus } from '../../shared/types/task';

export function registerDbHandlers(): void {
  // Session handlers
  ipcMain.handle('db:session:create', (_event, config: SessionConfig) => {
    return sessionRepository.create(config);
  });

  ipcMain.handle('db:session:get', (_event, id: string) => {
    return sessionRepository.getById(id);
  });

  ipcMain.handle('db:session:getAll', () => {
    return sessionRepository.getAll();
  });

  ipcMain.handle('db:session:update', (_event, id: string, updates: Record<string, unknown>) => {
    return sessionRepository.update(id, updates);
  });

  ipcMain.handle('db:session:delete', (_event, id: string) => {
    return sessionRepository.delete(id);
  });

  ipcMain.handle('db:session:updateStatus', (_event, id: string, status: string) => {
    return sessionRepository.updateStatus(id, status as import('../../shared/types/session').SessionStatus);
  });

  // Task handlers
  ipcMain.handle('db:task:create', (_event, input: TaskCreateInput) => {
    return taskRepository.create(input);
  });

  ipcMain.handle('db:task:get', (_event, id: string) => {
    return taskRepository.getById(id);
  });

  ipcMain.handle('db:task:getBySession', (_event, sessionId: string) => {
    return taskRepository.getBySessionId(sessionId);
  });

  ipcMain.handle('db:task:getByStatus', (_event, status: TaskStatus) => {
    return taskRepository.getByStatus(status);
  });

  ipcMain.handle('db:task:getAll', () => {
    return taskRepository.getAll();
  });

  ipcMain.handle('db:task:update', (_event, id: string, updates: Record<string, unknown>) => {
    return taskRepository.update(id, updates);
  });

  ipcMain.handle('db:task:updateStatus', (_event, id: string, status: TaskStatus) => {
    return taskRepository.updateStatus(id, status);
  });

  ipcMain.handle('db:task:delete', (_event, id: string) => {
    return taskRepository.delete(id);
  });

  // Terminal log handlers
  ipcMain.handle('db:terminalLog:append', (_event, sessionId: string, data: string) => {
    terminalLogRepository.append(sessionId, data);
  });

  ipcMain.handle('db:terminalLog:getBySession', (_event, sessionId: string, limit?: number) => {
    return terminalLogRepository.getBySessionId(sessionId, limit);
  });

  ipcMain.handle('db:terminalLog:deleteBySession', (_event, sessionId: string) => {
    return terminalLogRepository.deleteBySessionId(sessionId);
  });

  ipcMain.handle('db:terminalLog:cleanup', (_event, daysOld: number) => {
    const olderThan = new Date();
    olderThan.setDate(olderThan.getDate() - daysOld);
    return terminalLogRepository.cleanup(olderThan);
  });

  console.log('Database IPC handlers registered');
}
