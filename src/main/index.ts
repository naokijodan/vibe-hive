import { app, BrowserWindow } from 'electron';
import path from 'path';
import { registerIpcHandlers } from './ipc/handlers';
import { registerPtyHandlers } from './ipc/ptyHandlers';
import { registerDbHandlers } from './ipc/dbHandlers';
import { registerAgentHandlers } from './ipc/agentHandlers';
import { registerExecutionHandlers, executionEngine } from './ipc/executionHandlers';
import { registerTemplateHandlers } from './ipc/templateHandlers';
import { registerWorkflowHandlers, workflowEngine } from './ipc/workflowHandlers';
import { registerNotificationHandlers } from './ipc/notificationHandlers';
import { registerExportImportHandlers } from './ipc/exportImportHandlers';
import { registerCoordinationHandlers } from './ipc/coordinationHandlers';
import { registerClaudeHooksHandlers } from './ipc/claudeHooksHandlers';
import { registerThemeHandlers } from './ipc/themeHandlers';
import { getAgentCoordinationService } from './services/AgentCoordinationService';
import { getClaudeHooksService } from './services/ClaudeHooksService';
import { ptyService } from './services/PtyService';
import { agentService } from './services/AgentService';
import { getDatabase, closeDatabase } from './services/db';
import { getWebhookServer } from './services/WebhookServer';
import { getWorkflowScheduler } from './services/WorkflowScheduler';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // node-pty requires sandbox disabled
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0d1117',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
    // Force show window immediately in dev mode for debugging
    mainWindow.show();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Initialize database
  getDatabase();

  // Register IPC handlers
  registerIpcHandlers(); // Session, Git, Settings
  registerPtyHandlers();
  registerDbHandlers();
  registerAgentHandlers();
  registerExecutionHandlers();
  registerTemplateHandlers();
  registerWorkflowHandlers();
  registerNotificationHandlers();
  registerExportImportHandlers();
  registerCoordinationHandlers();
  registerClaudeHooksHandlers();
  registerThemeHandlers();

  createWindow();

  // Set main window for PTY service, Agent service, Execution engine, and Workflow engine
  if (mainWindow) {
    ptyService.setMainWindow(mainWindow);
    agentService.setMainWindow(mainWindow);
    executionEngine.setMainWindow(mainWindow);
    workflowEngine.setMainWindow(mainWindow);
    getAgentCoordinationService().setMainWindow(mainWindow);
    getClaudeHooksService().setMainWindow(mainWindow);
  }

  // Start webhook server
  const webhookServer = getWebhookServer(3100);
  webhookServer.start().catch((error) => {
    console.error('Failed to start webhook server:', error);
  });

  // Initialize workflow scheduler
  const workflowScheduler = getWorkflowScheduler();
  workflowScheduler.initialize().catch((error) => {
    console.error('Failed to initialize workflow scheduler:', error);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      if (mainWindow) {
        ptyService.setMainWindow(mainWindow);
        agentService.setMainWindow(mainWindow);
        executionEngine.setMainWindow(mainWindow);
        workflowEngine.setMainWindow(mainWindow);
        getAgentCoordinationService().setMainWindow(mainWindow);
        getClaudeHooksService().setMainWindow(mainWindow);
      }
    }
  });
});

app.on('window-all-closed', () => {
  // Close all PTY sessions, Agent sessions, and Executions
  ptyService.closeAll();
  agentService.stopAll();
  executionEngine.cleanup();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  ptyService.closeAll();
  agentService.stopAll();
  executionEngine.cleanup();

  // Stop webhook server
  const webhookServer = getWebhookServer();
  await webhookServer.stop();

  // Stop workflow scheduler
  const workflowScheduler = getWorkflowScheduler();
  workflowScheduler.stopAll();

  closeDatabase();
});
