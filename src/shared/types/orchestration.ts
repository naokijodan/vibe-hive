export type NodeExecutionStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface NodeExecution {
  nodeId: string;
  sessionId: string;
  status: NodeExecutionStatus;
  agentSessionId?: string;
  contextId?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ExecuteNodeRequest {
  nodeId: string;
  sessionId: string;
  prompt: string;
  parentContextId?: string;
}

export interface ExecuteNodeResult {
  nodeId: string;
  status: 'completed' | 'failed';
  contextId?: string;
  childResults?: ExecuteNodeResult[];
  error?: string;
}
