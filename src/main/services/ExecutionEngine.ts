import { BrowserWindow } from 'electron';
import { randomUUID } from 'crypto';
import { ptyService } from './PtyService';
import { ExecutionRepository } from './db/ExecutionRepository';
import type {
  ExecutionRecord,
  ExecutionStatus,
  StartExecutionRequest,
  StartExecutionResponse,
} from '../../shared/types/execution';

class ExecutionEngine {
  private repository: ExecutionRepository;
  private mainWindow: BrowserWindow | null = null;
  private activeExecutions: Map<string, string> = new Map(); // executionId -> sessionId

  constructor() {
    this.repository = new ExecutionRepository();
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * Start executing a task
   */
  async startExecution(request: StartExecutionRequest): Promise<StartExecutionResponse> {
    const executionId = randomUUID();
    const sessionId = `exec-${executionId}`;

    // Create execution record
    const execution: ExecutionRecord = {
      id: executionId,
      taskId: request.taskId,
      sessionId,
      status: 'running',
      startedAt: new Date(),
    };

    try {
      // Save to database
      this.repository.create(execution);

      // Create PTY session for execution
      const workingDir = request.workingDirectory || process.env.HOME || '/tmp';
      ptyService.create(sessionId, 80, 24);

      // Store active execution
      this.activeExecutions.set(executionId, sessionId);

      // Send execution started event to renderer
      this.notifyRenderer('execution:started', { executionId, taskId: request.taskId });

      // Execute command
      // Add newline to execute the command
      ptyService.write(sessionId, `cd "${workingDir}" && ${request.command}\n`);

      // Monitor PTY exit
      this.monitorExecution(executionId, sessionId);

      return { executionId, sessionId };
    } catch (error) {
      // Update status to failed
      this.repository.updateStatus(executionId, 'failed');
      this.repository.updateError(executionId, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Monitor execution and update status on completion
   */
  private monitorExecution(executionId: string, sessionId: string): void {
    // Listen for PTY exit event
    const checkInterval = setInterval(() => {
      const session = ptyService.getSession(sessionId);
      if (!session) {
        // Session ended
        clearInterval(checkInterval);
        this.handleExecutionComplete(executionId, 0);
      }
    }, 1000);

    // Store interval for cleanup
    (this.activeExecutions as any)[`${executionId}_interval`] = checkInterval;
  }

  /**
   * Handle execution completion
   */
  private handleExecutionComplete(executionId: string, exitCode: number): void {
    const status: ExecutionStatus = exitCode === 0 ? 'completed' : 'failed';

    this.repository.updateStatus(executionId, status);
    this.repository.updateCompletion(executionId, new Date(), exitCode);

    // Cleanup
    this.activeExecutions.delete(executionId);
    const interval = (this.activeExecutions as any)[`${executionId}_interval`];
    if (interval) {
      clearInterval(interval);
      delete (this.activeExecutions as any)[`${executionId}_interval`];
    }

    // Notify renderer
    const execution = this.repository.getById(executionId);
    if (execution) {
      this.notifyRenderer('execution:completed', execution);
    }
  }

  /**
   * Cancel a running execution
   */
  cancelExecution(executionId: string): void {
    const sessionId = this.activeExecutions.get(executionId);
    if (!sessionId) {
      throw new Error(`Execution ${executionId} not found or not running`);
    }

    // Kill PTY session
    ptyService.close(sessionId);

    // Update status
    this.repository.updateStatus(executionId, 'cancelled');
    this.repository.updateCompletion(executionId, new Date());

    // Cleanup
    this.activeExecutions.delete(executionId);
    const interval = (this.activeExecutions as any)[`${executionId}_interval`];
    if (interval) {
      clearInterval(interval);
      delete (this.activeExecutions as any)[`${executionId}_interval`];
    }

    // Notify renderer
    const execution = this.repository.getById(executionId);
    if (execution) {
      this.notifyRenderer('execution:cancelled', execution);
    }
  }

  /**
   * Get execution record by ID
   */
  getExecution(executionId: string): ExecutionRecord | null {
    return this.repository.getById(executionId);
  }

  /**
   * Get all executions for a task
   */
  getExecutionsByTask(taskId: string): ExecutionRecord[] {
    return this.repository.getByTaskId(taskId);
  }

  /**
   * Get all executions
   */
  getAllExecutions(): ExecutionRecord[] {
    return this.repository.getAll();
  }

  /**
   * Get currently running executions
   */
  getRunningExecutions(): ExecutionRecord[] {
    return this.repository.getRunning();
  }

  /**
   * Notify renderer of execution events
   */
  private notifyRenderer(channel: string, data: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  /**
   * Cleanup all running executions
   */
  cleanup(): void {
    for (const [executionId, sessionId] of this.activeExecutions.entries()) {
      try {
        ptyService.close(sessionId);
        this.repository.updateStatus(executionId, 'cancelled');
      } catch (error) {
        console.error(`Failed to cleanup execution ${executionId}:`, error);
      }
    }
    this.activeExecutions.clear();
  }
}

// Singleton instance
let instance: ExecutionEngine | null = null;

export function getExecutionEngine(): ExecutionEngine {
  if (!instance) {
    instance = new ExecutionEngine();
  }
  return instance;
}

export { ExecutionEngine };
