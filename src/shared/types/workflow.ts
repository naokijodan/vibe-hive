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

export type AgentType = 'claude-code' | 'codex' | 'gemini' | 'ollama' | 'custom';

export interface AgentConfig {
  agentType: AgentType;
  prompt: string;
  templateVariables: boolean;
  timeout: number;  // milliseconds
  ollamaModel?: string;  // Model name for Ollama (e.g., 'llama3', 'codellama')
}

// Model provider settings for Settings UI
export interface ModelProviderConfig {
  enabled: boolean;
  cliPath: string;        // Path to CLI binary
  defaultArgs?: string;   // Additional default arguments
}

export interface AgentSettings {
  defaultAgent: AgentType;
  providers: {
    'claude-code': ModelProviderConfig;
    'codex': ModelProviderConfig;
    'gemini': ModelProviderConfig;
    'ollama': ModelProviderConfig;
  };
  ollamaDefaultModel: string;  // Default Ollama model
}

export interface RetryConfig {
  enabled: boolean;
  maxAttempts: number;           // Maximum retry attempts (default: 3)
  delayMs: number;               // Delay between retries in ms (default: 1000)
  backoffMultiplier: number;     // Exponential backoff multiplier (default: 2)
  retryOnErrorTypes?: string[];  // Only retry on specific error types (optional)
}

export interface TimeoutConfig {
  enabled: boolean;
  timeoutMs: number;  // Timeout in milliseconds (default: 30000)
}

export interface ErrorHandlingConfig {
  continueOnError: boolean;  // Continue workflow on error (default: false)
  errorOutput?: any;         // Fallback output value on error
}

export interface WorkflowNodeData {
  [key: string]: unknown;
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
  // Error handling & retry config
  retryConfig?: RetryConfig;          // Retry configuration
  timeoutConfig?: TimeoutConfig;      // Timeout configuration
  errorHandlingConfig?: ErrorHandlingConfig;  // Error handling configuration
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
  autoCreateTask?: boolean;  // Auto-create task on workflow completion
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
  autoCreateTask?: boolean;
}

export interface UpdateWorkflowParams {
  id: number;
  name?: string;
  description?: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  status?: 'draft' | 'active' | 'paused';
  autoCreateTask?: boolean;
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

// Workflow Export/Import types
export type WorkflowComplexity = 'simple' | 'medium' | 'complex';

export interface WorkflowExportData {
  // Format metadata
  formatVersion: string;      // '2.0'
  exportedAt: string;         // ISO 8601
  exportedBy?: string;        // Optional exporter name/email

  // Workflow data
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  autoCreateTask?: boolean;

  // Additional metadata
  tags?: string[];
  category?: string;
  complexity?: WorkflowComplexity;

  // Statistics
  nodeCount: number;
  edgeCount: number;
  usesAdvancedFeatures?: string[];  // ['loop', 'subworkflow', 'expert-condition']
}

export interface WorkflowImportResult {
  success: boolean;
  workflow?: Workflow;
  canceled?: boolean;
  errors?: string[];
  warnings?: string[];
  validationReport?: {
    nodeCount: number;
    edgeCount: number;
    hasAdvancedFeatures: boolean;
    advancedFeatures: string[];
    compatibility: 'full' | 'partial' | 'none';
  };
}

export interface WorkflowExportResult {
  success: boolean;
  filePath?: string;
  canceled?: boolean;
  error?: string;
}

// Type alias for backward compatibility with old node types
export type WorkflowNodeType = NodeType | 'start' | 'end';
