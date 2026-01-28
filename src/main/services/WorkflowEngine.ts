import { BrowserWindow } from 'electron';
import { WorkflowRepository } from './db/WorkflowRepository';
import { getExecutionEngine } from './ExecutionEngine';
import type {
  Workflow,
  WorkflowExecution,
  ExecuteWorkflowParams,
  WorkflowExecutionResult,
  WorkflowNode,
  WorkflowEdge,
} from '../../shared/types/workflow';

interface NodeExecutionContext {
  nodeId: string;
  input: any;
  workflowData: Record<string, any>;
}

interface NodeExecutionResult {
  success: boolean;
  output: any;
  error?: string;
}

export class WorkflowEngine {
  private repository: WorkflowRepository;
  private mainWindow: BrowserWindow | null = null;
  private activeExecutions: Map<number, AbortController> = new Map();

  constructor() {
    this.repository = new WorkflowRepository();
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * Execute a workflow
   */
  async execute(params: ExecuteWorkflowParams): Promise<WorkflowExecutionResult> {
    const workflow = this.repository.findById(params.workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${params.workflowId} not found`);
    }

    // Create execution record
    const execution = this.repository.createExecution(params.workflowId);
    const abortController = new AbortController();
    this.activeExecutions.set(execution.id, abortController);

    try {
      // Notify renderer that execution started
      this.notifyRenderer('workflow:execution:started', { executionId: execution.id, workflowId: params.workflowId });

      // Execute workflow nodes
      const nodeResults = await this.executeWorkflow(workflow, params.triggerData || {}, abortController.signal);

      // Update execution as successful
      this.repository.updateExecution(execution.id, {
        status: 'success',
        executionData: nodeResults,
      });

      this.notifyRenderer('workflow:execution:completed', { executionId: execution.id, status: 'success' });

      return {
        executionId: execution.id,
        status: 'success',
        nodeResults,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update execution as failed
      this.repository.updateExecution(execution.id, {
        status: 'failed',
        error: errorMessage,
      });

      this.notifyRenderer('workflow:execution:completed', { executionId: execution.id, status: 'failed', error: errorMessage });

      return {
        executionId: execution.id,
        status: 'failed',
        error: errorMessage,
        nodeResults: {},
      };
    } finally {
      this.activeExecutions.delete(execution.id);
    }
  }

  /**
   * Cancel a running workflow execution
   */
  cancel(executionId: number): void {
    const controller = this.activeExecutions.get(executionId);
    if (!controller) {
      throw new Error(`Execution ${executionId} not found or not running`);
    }

    controller.abort();
    this.repository.updateExecution(executionId, { status: 'cancelled' });
    this.activeExecutions.delete(executionId);

    this.notifyRenderer('workflow:execution:cancelled', { executionId });
  }

  /**
   * Execute workflow nodes in topological order
   */
  private async executeWorkflow(
    workflow: Workflow,
    triggerData: Record<string, any>,
    signal: AbortSignal
  ): Promise<Record<string, any>> {
    const nodeResults: Record<string, any> = {};
    const executionOrder = this.topologicalSort(workflow.nodes, workflow.edges);

    // Store trigger data
    nodeResults['__trigger__'] = triggerData;

    for (const nodeId of executionOrder) {
      if (signal.aborted) {
        throw new Error('Workflow execution cancelled');
      }

      const node = workflow.nodes.find(n => n.id === nodeId);
      if (!node) continue;

      // Get input from previous nodes
      const input = this.getNodeInput(nodeId, workflow.edges, nodeResults);

      // Execute node
      const result = await this.executeNode({
        nodeId,
        input,
        workflowData: nodeResults,
      }, node);

      if (!result.success) {
        throw new Error(`Node ${nodeId} execution failed: ${result.error}`);
      }

      nodeResults[nodeId] = result.output;

      // Handle conditional branching
      if (node.type === 'conditional' && result.output?.branch) {
        // Filter execution path based on condition result
        const branch = result.output.branch; // 'true' or 'false'
        // This will be handled in topological sort
      }
    }

    return nodeResults;
  }

  /**
   * Execute a single node
   */
  private async executeNode(context: NodeExecutionContext, node: WorkflowNode): Promise<NodeExecutionResult> {
    try {
      switch (node.type) {
        case 'trigger':
          return { success: true, output: context.workflowData['__trigger__'] };

        case 'task':
          return await this.executeTaskNode(node, context.input);

        case 'conditional':
          return this.executeConditionalNode(node, context.input);

        case 'delay':
          return await this.executeDelayNode(node);

        case 'notification':
          return this.executeNotificationNode(node, context.input);

        case 'merge':
          return { success: true, output: context.input };

        default:
          return { success: false, error: `Unknown node type: ${node.type}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute a task node using ExecutionEngine
   */
  private async executeTaskNode(node: WorkflowNode, input: any): Promise<NodeExecutionResult> {
    const taskId = node.data.taskId;
    if (!taskId) {
      return { success: false, error: 'Task ID not specified' };
    }

    const executionEngine = getExecutionEngine();

    // Get task details from config
    const command = node.data.config?.command || 'echo "No command specified"';
    const workingDirectory = node.data.config?.workingDirectory;

    try {
      const response = await executionEngine.startExecution({
        taskId: taskId.toString(),
        command,
        workingDirectory,
      });

      // Wait for execution to complete (simplified - in production, use events)
      await this.waitForExecution(response.executionId, executionEngine);

      const execution = executionEngine.getExecution(response.executionId);
      if (execution?.status === 'completed') {
        return { success: true, output: { executionId: response.executionId, taskId } };
      } else {
        return { success: false, error: execution?.error || 'Task execution failed' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Task execution failed',
      };
    }
  }

  /**
   * Execute a conditional node
   */
  private executeConditionalNode(node: WorkflowNode, input: any): NodeExecutionResult {
    const condition = node.data.condition;
    if (!condition) {
      return { success: false, error: 'Condition not specified' };
    }

    const { field, operator, value } = condition;
    const fieldValue = this.getFieldValue(input, field);

    let result = false;
    switch (operator) {
      case 'equals':
        result = fieldValue === value;
        break;
      case 'not_equals':
        result = fieldValue !== value;
        break;
      case 'greater_than':
        result = fieldValue > value;
        break;
      case 'less_than':
        result = fieldValue < value;
        break;
      case 'contains':
        result = String(fieldValue).includes(String(value));
        break;
      case 'not_contains':
        result = !String(fieldValue).includes(String(value));
        break;
    }

    return {
      success: true,
      output: { branch: result ? 'true' : 'false', conditionMet: result },
    };
  }

  /**
   * Execute a delay node
   */
  private async executeDelayNode(node: WorkflowNode): Promise<NodeExecutionResult> {
    const delayMs = node.data.delayMs || 1000;
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return { success: true, output: { delayed: delayMs } };
  }

  /**
   * Execute a notification node (placeholder)
   */
  private executeNotificationNode(node: WorkflowNode, input: any): NodeExecutionResult {
    // Placeholder - implement actual notification logic
    console.log(`[Notification] ${node.data.notificationType}:`, input);
    return { success: true, output: { notified: true } };
  }

  /**
   * Wait for execution to complete
   */
  private async waitForExecution(executionId: string, engine: any): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const execution = engine.getExecution(executionId);
        if (execution && execution.status !== 'running') {
          clearInterval(checkInterval);
          resolve();
        }
      }, 500);
    });
  }

  /**
   * Get input for a node from previous nodes
   */
  private getNodeInput(nodeId: string, edges: WorkflowEdge[], nodeResults: Record<string, any>): any {
    const incomingEdges = edges.filter(e => e.target === nodeId);
    if (incomingEdges.length === 0) {
      return nodeResults['__trigger__'];
    }

    if (incomingEdges.length === 1) {
      return nodeResults[incomingEdges[0].source];
    }

    // Multiple inputs - merge them
    return incomingEdges.reduce((acc, edge) => {
      acc[edge.source] = nodeResults[edge.source];
      return acc;
    }, {} as Record<string, any>);
  }

  /**
   * Get field value from input using dot notation
   */
  private getFieldValue(input: any, field: string): any {
    const parts = field.split('.');
    let value = input;
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    return value;
  }

  /**
   * Topological sort for DAG execution order
   */
  private topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
    const adjList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize
    nodes.forEach(node => {
      adjList.set(node.id, []);
      inDegree.set(node.id, 0);
    });

    // Build adjacency list and in-degree
    edges.forEach(edge => {
      adjList.get(edge.source)?.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });

    // Find nodes with no incoming edges
    const queue: string[] = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    const result: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const neighbors = adjList.get(current) || [];
      neighbors.forEach(neighbor => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      });
    }

    // Check for cycles
    if (result.length !== nodes.length) {
      throw new Error('Workflow contains cycles');
    }

    return result;
  }

  /**
   * Notify renderer of workflow events
   */
  private notifyRenderer(channel: string, data: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(id: number): Workflow | null {
    return this.repository.findById(id);
  }

  /**
   * Get all workflows
   */
  getAllWorkflows(): Workflow[] {
    return this.repository.findAll();
  }

  /**
   * Get workflows by session
   */
  getWorkflowsBySession(sessionId: number): Workflow[] {
    return this.repository.findBySessionId(sessionId);
  }

  /**
   * Get execution by ID
   */
  getExecution(executionId: number): WorkflowExecution | null {
    return this.repository.findExecutionById(executionId);
  }

  /**
   * Get executions for a workflow
   */
  getExecutionsByWorkflow(workflowId: number): WorkflowExecution[] {
    return this.repository.findExecutionsByWorkflowId(workflowId);
  }
}

// Singleton instance
let instance: WorkflowEngine | null = null;

export function getWorkflowEngine(): WorkflowEngine {
  if (!instance) {
    instance = new WorkflowEngine();
  }
  return instance;
}
