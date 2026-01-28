import { ipcMain } from 'electron';
import { SessionRepository, TaskRepository, TerminalLogRepository, AgentRepository } from '../services/db';
import type { SessionConfig } from '../../shared/types/session';
import type { TaskCreateInput, TaskStatus } from '../../shared/types/task';
import type { AgentConfig, AgentStatus } from '../../shared/types/agent';

// Create repository instances
const sessionRepository = new SessionRepository();
const taskRepository = new TaskRepository();
const terminalLogRepository = new TerminalLogRepository();
const agentRepository = new AgentRepository();

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

  ipcMain.handle('db:task:getSubtasks', (_event, parentId: string) => {
    return taskRepository.getSubtasks(parentId);
  });

  ipcMain.handle('db:task:createSubtasks', (_event, parentId: string, titles: string[]) => {
    return taskRepository.createSubtasks(parentId, titles);
  });

  ipcMain.handle('db:task:checkDependencies', (_event, taskId: string) => {
    return taskRepository.areDependenciesMet(taskId);
  });

  ipcMain.handle('db:task:clearReviewFeedback', (_event, taskId: string) => {
    return taskRepository.clearReviewFeedback(taskId);
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

  // Agent handlers
  ipcMain.handle('db:agent:create', (_event, config: AgentConfig) => {
    return agentRepository.create(config);
  });

  ipcMain.handle('db:agent:get', (_event, id: string) => {
    return agentRepository.getById(id);
  });

  ipcMain.handle('db:agent:getAll', () => {
    return agentRepository.getAll();
  });

  ipcMain.handle('db:agent:getBySession', (_event, sessionId: string) => {
    return agentRepository.getBySessionId(sessionId);
  });

  ipcMain.handle('db:agent:update', (_event, id: string, updates: Record<string, unknown>) => {
    return agentRepository.update(id, updates);
  });

  ipcMain.handle('db:agent:updateStatus', (_event, id: string, status: AgentStatus) => {
    return agentRepository.updateStatus(id, status);
  });

  ipcMain.handle('db:agent:delete', (_event, id: string) => {
    return agentRepository.delete(id);
  });

  console.log('Database IPC handlers registered');
}
