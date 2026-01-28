export interface ExecutionRecord {
  id: string;
  taskId: string;
  sessionId: string;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  exitCode?: number;
  errorMessage?: string;
}

export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export interface ExecutionProgress {
  executionId: string;
  taskId: string;
  output: string;
  timestamp: Date;
}

export interface StartExecutionRequest {
  taskId: string;
  command: string;
  workingDirectory?: string;
  agentId?: string; // Optional: for future agent-specific execution
}

export interface StartExecutionResponse {
  executionId: string;
  sessionId: string;
}

export interface ExecutionOutput {
  executionId: string;
  output: string;
  isError: boolean;
}
