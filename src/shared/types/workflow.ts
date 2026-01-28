export type NodeType =
  | 'task'           // Execute existing task
  | 'trigger'        // Workflow start trigger
  | 'conditional'    // IF/ELSE branching
  | 'notification'   // Send notification
  | 'delay'          // Wait/delay
  | 'merge'          // Merge multiple flows
  | 'loop'           // Loop/iteration
  | 'subworkflow'    // Call another workflow
  | 'agent';         // Execute AI agent

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

export type LogicalOperator = 'AND' | 'OR';

export interface SimpleCondition {
  field: string;
  operator: ConditionalOperator;
  value: any;
}

export interface ConditionGroup {
  operator: LogicalOperator;
  conditions: SimpleCondition[];
  groups?: ConditionGroup[];  // Nested groups for complex logic
}

export type LoopType = 'forEach' | 'count' | 'while';

export interface LoopConfig {
  type: LoopType;
  arrayPath?: string;        // For forEach: path to array in input
  count?: number;            // For count: number of iterations
  condition?: ConditionGroup; // For while: exit condition
  maxIterations: number;     // Safety limit (default 100)
}

export interface SubworkflowConfig {
  workflowId: number;
  inputMapping: Record<string, string>;  // parent field -> child input
  outputMapping: Record<string, string>; // child output -> parent field
}

export type AgentType = 'claude-code' | 'codex' | 'custom';

export interface AgentConfig {
  agentType: AgentType;
  prompt: string;
  templateVariables: boolean;
  timeout: number;  // milliseconds
}

export interface WorkflowNodeData {
  label: string;
  config: Record<string, any>;
  // Node-specific config
  taskId?: number;                    // For task nodes
  triggerType?: TriggerType;          // For trigger nodes
  condition?: SimpleCondition;        // For conditional nodes (legacy, single condition)
  conditionGroup?: ConditionGroup;    // For conditional nodes (new, multiple conditions)
  notificationType?: 'discord' | 'slack' | 'email';  // For notification nodes
  delayMs?: number;                   // For delay nodes
  loopConfig?: LoopConfig;            // For loop nodes
  subworkflowConfig?: SubworkflowConfig;  // For subworkflow nodes
  agentConfig?: AgentConfig;          // For agent nodes
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
