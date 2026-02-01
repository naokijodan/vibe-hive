import { ipcMain } from 'electron';
import { IPC_CHANNELS } from './channels';
import { getSessionService } from '../services/SessionService';
import { ptyService } from '../services/PtyService';
import { getGitService } from '../services/GitService';
import { getSettingsService } from '../services/SettingsService';
import { registerAIHandlers } from './aiHandlers';
import * as OrgRepo from '../services/db/OrganizationRepository';
import * as ContextRepo from '../services/db/ContextRepository';
import { orchestratorService } from '../services/OrchestratorService';
import type { AgentContextCreateInput } from '../../shared/types/context';
import type { ExecuteNodeRequest, OrchestrateNodeRequest, ApproveRejectRequest } from '../../shared/types/orchestration';

export function registerIpcHandlers(): void {
  const sessionService = getSessionService();

  // DevTools toggle
  ipcMain.handle('app:toggleDevTools', (event) => {
    event.sender.toggleDevTools();
  });

  // Session handlers
  ipcMain.handle(IPC_CHANNELS.SESSION_CREATE, async (_event, config) => {
    const session = sessionService.createSession(config);
    return session;
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_GET, async (_event, id) => {
    const session = sessionService.getSession(id);
    return session;
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_LIST, async () => {
    const sessions = sessionService.listSessions();
    return sessions;
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_DELETE, async (_event, id) => {
    sessionService.deleteSession(id);
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_SWITCH, async (_event, id) => {
    const session = sessionService.switchSession(id);
    return session;
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_GET_ACTIVE, async () => {
    const session = sessionService.getActiveSession();
    return session;
  });

  // Terminal handlers (legacy - delegates to ptyService)
  ipcMain.handle(IPC_CHANNELS.TERMINAL_WRITE, async (_event, sessionId, data) => {
    ptyService.write(sessionId, data);
  });

  ipcMain.handle(IPC_CHANNELS.TERMINAL_RESIZE, async (_event, sessionId, cols, rows) => {
    ptyService.resize(sessionId, cols, rows);
  });

  // Organization handlers
  ipcMain.handle(IPC_CHANNELS.ORG_GET, async () => {
    return OrgRepo.getOrCreate('default-session');
  });

  ipcMain.handle(IPC_CHANNELS.ORG_UPDATE, async (_event, org) => {
    OrgRepo.save('default-session', org);
  });

  // Git handlers
  ipcMain.handle(IPC_CHANNELS.GIT_STATUS, async (_event, path) => {
    const gitService = getGitService();
    const status = await gitService.getStatus(path);
    return status;
  });

  ipcMain.handle(IPC_CHANNELS.GIT_ADD, async (_event, path, files) => {
    const gitService = getGitService();
    const success = await gitService.add(path, files);
    return success;
  });

  ipcMain.handle(IPC_CHANNELS.GIT_UNSTAGE, async (_event, path, files) => {
    const gitService = getGitService();
    const success = await gitService.unstage(path, files);
    return success;
  });

  ipcMain.handle(IPC_CHANNELS.GIT_COMMIT, async (_event, path, message) => {
    const gitService = getGitService();
    const success = await gitService.commit(path, message);
    return success;
  });

  ipcMain.handle(IPC_CHANNELS.GIT_PUSH, async (_event, path) => {
    const gitService = getGitService();
    const success = await gitService.push(path);
    return success;
  });

  ipcMain.handle(IPC_CHANNELS.GIT_PULL, async (_event, path) => {
    const gitService = getGitService();
    const success = await gitService.pull(path);
    return success;
  });

  ipcMain.handle(IPC_CHANNELS.GIT_LOG, async (_event, path, limit) => {
    const gitService = getGitService();
    const log = await gitService.log(path, limit);
    return log;
  });

  // Settings handlers
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => {
    const settingsService = getSettingsService();
    const settings = settingsService.getSettings();
    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, async (_event, updates) => {
    const settingsService = getSettingsService();
    const settings = settingsService.updateSettings(updates);
    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE_GIT, async (_event, gitSettings) => {
    const settingsService = getSettingsService();
    const settings = settingsService.updateGitSettings(gitSettings);
    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE_APP, async (_event, appSettings) => {
    const settingsService = getSettingsService();
    const settings = settingsService.updateAppSettings(appSettings);
    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE_AGENT, async (_event, agentSettings) => {
    const settingsService = getSettingsService();
    const settings = settingsService.updateAgentSettings(agentSettings);
    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_RESET, async () => {
    const settingsService = getSettingsService();
    const settings = settingsService.resetSettings();
    return settings;
  });

  // Orchestration handlers
  ipcMain.handle(IPC_CHANNELS.ORCHESTRATION_EXECUTE, async (_event, request: ExecuteNodeRequest) => {
    return orchestratorService.executeNode(request);
  });

  ipcMain.handle(IPC_CHANNELS.ORCHESTRATION_STOP, async (_event, nodeId: string) => {
    orchestratorService.stopNode(nodeId);
  });

  ipcMain.handle(IPC_CHANNELS.ORCHESTRATION_STATUS, async (_event, nodeId: string) => {
    return orchestratorService.getStatus(nodeId);
  });

  ipcMain.handle(IPC_CHANNELS.ORCHESTRATION_STATUS_ALL, async (_event, sessionId: string) => {
    return orchestratorService.getAllStatus(sessionId);
  });

  ipcMain.handle(IPC_CHANNELS.ORCHESTRATION_ORCHESTRATE, async (_event, request: OrchestrateNodeRequest) => {
    return orchestratorService.orchestrateNode(request);
  });

  ipcMain.handle(IPC_CHANNELS.ORCHESTRATION_APPROVE, async (_event, request: ApproveRejectRequest) => {
    return orchestratorService.approveOrReject(request);
  });

  ipcMain.handle(IPC_CHANNELS.ORCHESTRATION_GET_STATE, async (_event, nodeId: string) => {
    return orchestratorService.getOrchestrationState(nodeId);
  });

  // Context handlers
  ipcMain.handle(IPC_CHANNELS.CONTEXT_SAVE, async (_event, input: AgentContextCreateInput) => {
    return ContextRepo.save(input);
  });

  ipcMain.handle(IPC_CHANNELS.CONTEXT_GET, async (_event, id: string) => {
    return ContextRepo.getById(id);
  });

  ipcMain.handle(IPC_CHANNELS.CONTEXT_GET_BY_NODE, async (_event, orgNodeId: string, limit?: number) => {
    return ContextRepo.getByNode(orgNodeId, limit);
  });

  ipcMain.handle(IPC_CHANNELS.CONTEXT_GET_CHAIN, async (_event, contextId: string) => {
    return ContextRepo.getChain(contextId);
  });

  ipcMain.handle(IPC_CHANNELS.CONTEXT_GET_BY_SESSION, async (_event, sessionId: string) => {
    return ContextRepo.getBySession(sessionId);
  });

  ipcMain.handle(IPC_CHANNELS.CONTEXT_DELETE, async (_event, id: string) => {
    return ContextRepo.deleteById(id);
  });

  // AI Assistant handlers
  registerAIHandlers();
}
