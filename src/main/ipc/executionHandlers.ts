import { ipcMain } from 'electron';
import { getExecutionEngine } from '../services/ExecutionEngine';
import type { StartExecutionRequest } from '../../shared/types/execution';

const executionEngine = getExecutionEngine();

export function registerExecutionHandlers(): void {
  // Start execution (with input validation)
  ipcMain.handle('execution:start', async (_event, request: StartExecutionRequest) => {
    // Validate required fields
    if (!request || typeof request.taskId !== 'string' || typeof request.command !== 'string') {
      throw new Error('Invalid execution request: taskId and command are required strings');
    }
    if (request.workingDirectory && typeof request.workingDirectory !== 'string') {
      throw new Error('Invalid workingDirectory: must be a string');
    }
    return await executionEngine.startExecution(request);
  });

  // Cancel execution
  ipcMain.handle('execution:cancel', (_event, executionId: string) => {
    executionEngine.cancelExecution(executionId);
  });

  // Get execution by ID
  ipcMain.handle('execution:get', (_event, executionId: string) => {
    return executionEngine.getExecution(executionId);
  });

  // Get executions by task ID
  ipcMain.handle('execution:getByTask', (_event, taskId: string) => {
    return executionEngine.getExecutionsByTask(taskId);
  });

  // Get all executions
  ipcMain.handle('execution:getAll', () => {
    return executionEngine.getAllExecutions();
  });

  // Get running executions
  ipcMain.handle('execution:getRunning', () => {
    return executionEngine.getRunningExecutions();
  });
}

// Export execution engine for initialization in main
export { executionEngine };
