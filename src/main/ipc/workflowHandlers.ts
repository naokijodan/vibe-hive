import { ipcMain } from 'electron';
import { getWorkflowEngine } from '../services/WorkflowEngine';
import { WorkflowRepository } from '../services/db/WorkflowRepository';
import type {
  CreateWorkflowParams,
  UpdateWorkflowParams,
  ExecuteWorkflowParams,
} from '../../shared/types/workflow';

const workflowEngine = getWorkflowEngine();
const workflowRepository = new WorkflowRepository();

export function registerWorkflowHandlers(): void {
  // Create workflow
  ipcMain.handle('workflow:create', (_event, params: CreateWorkflowParams) => {
    return workflowRepository.create(params);
  });

  // Update workflow
  ipcMain.handle('workflow:update', (_event, params: UpdateWorkflowParams) => {
    return workflowRepository.update(params);
  });

  // Delete workflow
  ipcMain.handle('workflow:delete', (_event, id: number) => {
    workflowRepository.delete(id);
  });

  // Get workflow by ID
  ipcMain.handle('workflow:getById', (_event, id: number) => {
    return workflowEngine.getWorkflow(id);
  });

  // Get all workflows
  ipcMain.handle('workflow:getAll', () => {
    return workflowEngine.getAllWorkflows();
  });

  // Get workflows by session
  ipcMain.handle('workflow:getBySession', (_event, sessionId: number) => {
    return workflowEngine.getWorkflowsBySession(sessionId);
  });

  // Execute workflow
  ipcMain.handle('workflow:execute', async (_event, params: ExecuteWorkflowParams) => {
    return await workflowEngine.execute(params);
  });

  // Cancel workflow execution
  ipcMain.handle('workflow:cancel', (_event, executionId: number) => {
    workflowEngine.cancel(executionId);
  });

  // Get execution by ID
  ipcMain.handle('workflow:getExecution', (_event, executionId: number) => {
    return workflowEngine.getExecution(executionId);
  });

  // Get executions by workflow ID
  ipcMain.handle('workflow:getExecutions', (_event, workflowId: number) => {
    return workflowEngine.getExecutionsByWorkflow(workflowId);
  });
}

// Export workflow engine for initialization in main
export { workflowEngine };
