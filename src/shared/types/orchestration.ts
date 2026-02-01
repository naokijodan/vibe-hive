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

// Phase 4: Orchestration types
export type OrchestrationPhase =
  | 'planning'
  | 'executing'
  | 'reviewing'
  | 'pending_approval'
  | 'approved'
  | 'rejected';

export interface ChildInstruction {
  childNodeId: string;
  childNodeName: string;
  instruction: string;
}

export interface OrchestrationState {
  nodeId: string;
  sessionId: string;
  phase: OrchestrationPhase;
  plan?: ChildInstruction[];
  childResults?: ExecuteNodeResult[];
  summary?: string;
  error?: string;
}

export interface OrchestrateNodeRequest {
  nodeId: string;
  sessionId: string;
  goal: string;
}

export interface ApproveRejectRequest {
  nodeId: string;
  approved: boolean;
  feedback?: string;
}
