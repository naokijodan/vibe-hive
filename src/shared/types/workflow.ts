export type NodeType =
  | 'task'           // Execute existing task
  | 'trigger'        // Workflow start trigger
  | 'conditional'    // IF/ELSE branching
  | 'notification'   // Send notification
  | 'delay'          // Wait/delay
  | 'merge';         // Merge multiple flows

export type TriggerType =
  | 'manual'         // Manual trigger
  | 'schedule'       // Time-based trigger
  | 'event'          // Event-based trigger
  | 'webhook';       // Webhook trigger

export type ConditionalOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'contains'
  | 'not_contains';

export interface WorkflowNodeData {
  label: string;
  config: Record<string, any>;
  // Node-specific config
  taskId?: number;                    // For task nodes
  triggerType?: TriggerType;          // For trigger nodes
  condition?: {                       // For conditional nodes
    field: string;
    operator: ConditionalOperator;
    value: any;
  };
  notificationType?: 'discord' | 'slack' | 'email';  // For notification nodes
  delayMs?: number;                   // For delay nodes
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;  // For conditional nodes: 'true', 'false'
  targetHandle?: string;
}

export interface Workflow {
  id: number;
  sessionId: number;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  status: 'draft' | 'active' | 'paused';
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowExecution {
  id: number;
  workflowId: number;
  status: 'running' | 'success' | 'failed' | 'cancelled';
  startedAt: number;
  completedAt?: number;
  error?: string;
  executionData?: Record<string, any>;  // Store runtime data for each node
}

export interface CreateWorkflowParams {
  sessionId: number;
  name: string;
  description?: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
}

export interface UpdateWorkflowParams {
  id: number;
  name?: string;
  description?: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  status?: 'draft' | 'active' | 'paused';
}

export interface ExecuteWorkflowParams {
  workflowId: number;
  triggerData?: Record<string, any>;
}

export interface WorkflowExecutionResult {
  executionId: number;
  status: 'success' | 'failed';
  error?: string;
  nodeResults: Record<string, any>;
}
