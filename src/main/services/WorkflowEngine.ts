import { BrowserWindow } from 'electron';
import { WorkflowRepository } from './db/WorkflowRepository';
import { TaskRepository } from './db/TaskRepository';
import { getExecutionEngine } from './ExecutionEngine';
import { notificationService } from './NotificationService';
import type {
  Workflow,
  WorkflowExecution,
  ExecuteWorkflowParams,
  WorkflowExecutionResult,
  WorkflowNode,
  WorkflowEdge,
  SimpleCondition,
  ConditionGroup,
  ConditionalOperator,
} from '../../shared/types/workflow';

interface NodeExecutionContext {
  nodeId: string;
  input: any;
  workflowData: Record<string, any>;
  executionStack?: number[];  // Stack of workflow IDs currently being executed (for recursion detection)
}

interface NodeExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
}

export class WorkflowEngine {
  private repository: WorkflowRepository;
  private taskRepository: TaskRepository;
  private mainWindow: BrowserWindow | null = null;
  private activeExecutions: Map<number, AbortController> = new Map();

  constructor() {
    this.repository = new WorkflowRepository();
    this.taskRepository = new TaskRepository();
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

      // Execute workflow nodes with execution stack for recursion detection
      const executionStack = [params.workflowId];
      const nodeResults = await this.executeWorkflow(workflow, params.triggerData || {}, abortController.signal, executionStack);

      // Update execution as successful
      this.repository.updateExecution(execution.id, {
        status: 'success',
        executionData: nodeResults,
      });

      // Auto-create task if enabled
      if (workflow.autoCreateTask) {
        await this.createTaskFromExecution(workflow, execution, nodeResults);
      }

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
   * Execute workflow nodes with parallel execution support
   */
  private async executeWorkflow(
    workflow: Workflow,
    triggerData: Record<string, any>,
    signal: AbortSignal,
    executionStack: number[] = []
  ): Promise<Record<string, any>> {
    const nodeResults: Record<string, any> = {};

    // Store trigger data
    nodeResults['__trigger__'] = triggerData;

    // Store workflow metadata for loop nodes
    nodeResults['__edges__'] = workflow.edges;
    nodeResults['__nodes__'] = workflow.nodes;

    // Store execution stack for subworkflow nodes (recursion detection)
    nodeResults['__execution_stack__'] = executionStack;

    // Group nodes by execution level for parallel execution
    const levels = this.groupNodesByLevel(workflow.nodes, workflow.edges);

    // Execute nodes level by level (parallel within each level)
    for (const level of levels) {
      if (signal.aborted) {
        throw new Error('Workflow execution cancelled');
      }

      // Execute all nodes in this level in parallel
      const levelPromises = level.map(async (nodeId) => {
        const node = workflow.nodes.find(n => n.id === nodeId);
        if (!node) return;

        // Get input from previous nodes
        const input = this.getNodeInput(nodeId, workflow.edges, nodeResults);

        // Execute node
        const result = await this.executeNode({
          nodeId,
          input,
          workflowData: nodeResults,
          executionStack,
        }, node);

        if (!result.success) {
          throw new Error(`Node ${nodeId} execution failed: ${result.error}`);
        }

        return { nodeId, result };
      });

      // Wait for all nodes in this level to complete
      const levelResults = await Promise.all(levelPromises);

      // Store results
      levelResults.forEach(item => {
        if (item) {
          nodeResults[item.nodeId] = item.result.output;
        }
      });
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
          return await this.executeNotificationNode(node, context.input);

        case 'merge':
          return { success: true, output: context.input };

        case 'loop':
          return await this.executeLoopNode(node, context);

        case 'subworkflow':
          return await this.executeSubworkflowNode(node, context.input, context.executionStack);

        case 'agent':
          return await this.executeAgentNode(node, context.input);

        default:
          return { success: false, error: `Unknown node type: ${node.type}` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const nodeName = node.data.label || node.type || 'Unknown';
      return {
        success: false,
        error: `Error in node "${nodeName}" (${node.type}): ${errorMessage}`,
      };
    }
  }

  /**
   * Execute a task node using ExecutionEngine
   */
  private async executeTaskNode(node: WorkflowNode, input: any): Promise<NodeExecutionResult> {
    const taskId = node.data.taskId;
    if (!taskId) {
      return { success: false, error: 'Task node error: Task ID not specified. Please select a task in node settings.' };
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
        return { success: false, error: execution?.errorMessage || 'Task execution failed' };
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
    let result: boolean;

    // Check if using advanced mode (conditionGroup) or simple mode (condition)
    if (node.data.conditionGroup) {
      result = this.evaluateConditionGroup(node.data.conditionGroup, input);
    } else if (node.data.condition) {
      result = this.evaluateSimpleCondition(node.data.condition, input);
    } else {
      return { success: false, error: 'Conditional node error: No condition specified. Please configure the condition in node settings.' };
    }

    return {
      success: true,
      output: { branch: result ? 'true' : 'false', conditionMet: result },
    };
  }

  /**
   * Evaluate a single condition
   */
  private evaluateSimpleCondition(condition: SimpleCondition, input: any): boolean {
    const { field, operator, value } = condition;
    const fieldValue = this.getFieldValue(input, field);

    return this.compareValues(fieldValue, operator, value);
  }

  /**
   * Evaluate a condition group (multiple conditions with AND/OR)
   */
  private evaluateConditionGroup(group: ConditionGroup, input: any): boolean {
    const { operator, conditions, groups } = group;

    // Evaluate all simple conditions
    const conditionResults = conditions.map(cond => this.evaluateSimpleCondition(cond, input));

    // Evaluate nested groups recursively
    const groupResults = groups ? groups.map(g => this.evaluateConditionGroup(g, input)) : [];

    // Combine all results
    const allResults = [...conditionResults, ...groupResults];

    // Apply logical operator
    if (operator === 'AND') {
      return allResults.every(r => r === true);
    } else {
      // OR
      return allResults.some(r => r === true);
    }
  }

  /**
   * Compare two values using an operator
   */
  private compareValues(fieldValue: any, operator: ConditionalOperator, value: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'greater_than':
        return fieldValue > value;
      case 'less_than':
        return fieldValue < value;
      case 'contains':
        return String(fieldValue).includes(String(value));
      case 'not_contains':
        return !String(fieldValue).includes(String(value));
      default:
        return false;
    }
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
   * Execute a notification node
   */
  private async executeNotificationNode(node: WorkflowNode, input: any): Promise<NodeExecutionResult> {
    const notificationType = node.data.notificationType;
    const title = node.data.config?.title;
    const message = node.data.config?.message || JSON.stringify(input);
    const webhookUrl = node.data.config?.webhookUrl;
    const emailTo = node.data.config?.emailTo;

    if (!notificationType) {
      return { success: false, error: 'Notification type not specified' };
    }

    try {
      // Set webhook URL if provided
      if (webhookUrl && (notificationType === 'discord' || notificationType === 'slack')) {
        notificationService.setWebhookUrl(notificationType, webhookUrl);
      }

      await notificationService.send({
        type: notificationType,
        title,
        message,
        to: emailTo,
      });

      return { success: true, output: { notified: true, type: notificationType } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Notification failed',
      };
    }
  }

  /**
   * Execute a loop node
   */
  private async executeLoopNode(node: WorkflowNode, context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const loopConfig = node.data.loopConfig;
    if (!loopConfig) {
      return { success: false, error: 'Loop configuration not specified' };
    }

    const { type, maxIterations } = loopConfig;
    const results: any[] = [];
    let iterations = 0;

    try {
      // Get child nodes (nodes connected after this loop node)
      const childNodeIds = this.getLoopChildNodes(node.id, context.workflowData['__edges__'] || []);

      if (childNodeIds.length === 0) {
        // No child nodes - loop does nothing but still succeeds
        return {
          success: true,
          output: {
            iterations: 0,
            results: [],
            completed: true,
            message: 'Loop has no child nodes to execute',
          },
        };
      }

      if (type === 'forEach') {
        // For Each: iterate over array
        const arrayPath = loopConfig.arrayPath || '';
        const array = this.getFieldValue(context.input, arrayPath);

        if (!Array.isArray(array)) {
          return { success: false, error: `Loop node error: Field '${arrayPath}' is not an array. Expected an array for forEach iteration.` };
        }

        for (let i = 0; i < array.length && i < maxIterations; i++) {
          const item = array[i];

          // Execute child nodes with current item as input
          const iterationContext = {
            ...context.workflowData,
            __loop_index__: i,
            __loop_item__: item,
            __loop_total__: array.length,
          };

          const iterationResult = await this.executeSubgraph(
            childNodeIds,
            context.workflowData['__edges__'] || [],
            context.workflowData['__nodes__'] || [],
            item,
            iterationContext
          );

          results.push({ index: i, value: item, result: iterationResult });
          iterations++;
        }
      } else if (type === 'count') {
        // Count: fixed number of iterations
        const count = Math.min(loopConfig.count || 1, maxIterations);

        for (let i = 0; i < count; i++) {
          // Execute child nodes with iteration index
          const iterationContext = {
            ...context.workflowData,
            __loop_index__: i,
            __loop_total__: count,
          };

          const iterationResult = await this.executeSubgraph(
            childNodeIds,
            context.workflowData['__edges__'] || [],
            context.workflowData['__nodes__'] || [],
            context.input,
            iterationContext
          );

          results.push({ index: i, result: iterationResult });
          iterations++;
        }
      } else if (type === 'while') {
        // While: conditional loop
        const condition = loopConfig.condition;
        if (!condition) {
          return { success: false, error: 'Loop node error: While loop condition not specified. Please configure the loop condition in node settings.' };
        }

        let shouldContinue = true;
        let currentInput = context.input;

        while (shouldContinue && iterations < maxIterations) {
          // Evaluate condition
          const conditionMet = this.evaluateConditionGroup(condition, currentInput);

          if (!conditionMet) {
            shouldContinue = false;
            break;
          }

          // Execute child nodes with current input
          const iterationContext = {
            ...context.workflowData,
            __loop_index__: iterations,
          };

          const iterationResult = await this.executeSubgraph(
            childNodeIds,
            context.workflowData['__edges__'] || [],
            context.workflowData['__nodes__'] || [],
            currentInput,
            iterationContext
          );

          results.push({ index: iterations, result: iterationResult });

          // Update input for next iteration (use result as next input)
          currentInput = iterationResult;
          iterations++;
        }
      }

      return {
        success: true,
        output: {
          iterations,
          results,
          completed: iterations < maxIterations,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Loop execution failed',
      };
    }
  }

  /**
   * Execute a subworkflow node
   */
  private async executeSubworkflowNode(
    node: WorkflowNode,
    input: any,
    executionStack: number[] = []
  ): Promise<NodeExecutionResult> {
    const subworkflowConfig = node.data.subworkflowConfig;
    if (!subworkflowConfig) {
      return { success: false, error: 'Subworkflow node error: Subworkflow not selected. Please select a subworkflow in node settings.' };
    }

    const { workflowId, inputMapping, outputMapping } = subworkflowConfig;

    // Recursion detection
    if (executionStack.includes(workflowId)) {
      const stackTrace = [...executionStack, workflowId].join(' → ');
      return {
        success: false,
        error: `Recursive subworkflow detected: Workflow ${workflowId} is already in the execution stack.\nCall chain: ${stackTrace}`,
      };
    }

    // Get the target workflow
    const targetWorkflow = this.repository.findById(workflowId);
    if (!targetWorkflow) {
      return { success: false, error: `Subworkflow node error: Workflow with ID ${workflowId} not found. The workflow may have been deleted.` };
    }

    try {
      // Map input data
      const childInput: Record<string, any> = {};
      const missingFields: string[] = [];

      // Validate and map input
      if (!inputMapping || Object.keys(inputMapping).length === 0) {
        // No input mapping - pass empty object to child workflow
        // This is not an error, just a warning in development
      } else {
        for (const [childField, parentField] of Object.entries(inputMapping)) {
          const value = this.getFieldValue(input, parentField);
          if (value === undefined) {
            missingFields.push(parentField);
          }
          childInput[childField] = value;
        }
      }

      // Add execution stack for recursion detection
      const newStack = [...executionStack, workflowId];

      // Execute child workflow
      const result = await this.execute({
        workflowId,
        triggerData: childInput,
      });

      if (result.status === 'failed') {
        return {
          success: false,
          error: `Subworkflow execution failed: ${result.error || 'Unknown error'}
Workflow: ${targetWorkflow.name} (ID: ${workflowId})
Input: ${JSON.stringify(childInput, null, 2)}`,
        };
      }

      // Map output data
      const output: Record<string, any> = {};
      const unmappedFields: string[] = [];

      if (!outputMapping || Object.keys(outputMapping).length === 0) {
        // No output mapping - return entire result
        return {
          success: true,
          output: result.nodeResults,
        };
      } else {
        for (const [parentField, childField] of Object.entries(outputMapping)) {
          const value = this.getFieldValue(result.nodeResults, childField);
          if (value === undefined) {
            unmappedFields.push(childField);
          }
          output[parentField] = value;
        }
      }

      return {
        success: true,
        output,
      };
    } catch (error) {
      return {
        success: false,
        error: `Subworkflow execution failed: ${error instanceof Error ? error.message : 'Unknown error'}
Workflow: ${targetWorkflow.name} (ID: ${workflowId})`,
      };
    }
  }

  /**
   * Execute an AI agent node
   */
  private async executeAgentNode(node: WorkflowNode, input: any): Promise<NodeExecutionResult> {
    const agentConfig = node.data.agentConfig;
    if (!agentConfig) {
      return { success: false, error: 'Agent configuration not specified' };
    }

    const { agentType, prompt, templateVariables, timeout } = agentConfig;

    try {
      // Replace template variables if enabled
      let finalPrompt = prompt;
      if (templateVariables) {
        finalPrompt = this.replaceTemplateVariables(prompt, input);
      }

      // TODO: Implement actual agent execution
      // For now, return a mock response
      const agentResponse = {
        agentType,
        prompt: finalPrompt,
        executedAt: Date.now(),
        result: 'Agent execution not yet implemented',
      };

      return {
        success: true,
        output: agentResponse,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Agent execution failed',
      };
    }
  }

  /**
   * Replace template variables in text
   */
  private replaceTemplateVariables(text: string, input: any): string {
    let result = text;

    // Replace {{input}}
    result = result.replace(/\{\{input\}\}/g, JSON.stringify(input));

    // Replace {{timestamp}}
    result = result.replace(/\{\{timestamp\}\}/g, new Date().toISOString());

    // TODO: Add more template variables (workflow.name, execution.id, etc.)

    return result;
  }

  /**
   * Create a task from workflow execution results
   */
  private async createTaskFromExecution(
    workflow: Workflow,
    execution: WorkflowExecution,
    nodeResults: Record<string, any>
  ): Promise<void> {
    try {
      const taskTitle = `${workflow.name} - Execution #${execution.id}`;
      const taskDescription = `Auto-generated from workflow execution

**Workflow**: ${workflow.name}
**Execution ID**: ${execution.id}
**Started**: ${new Date(execution.startedAt).toISOString()}
**Completed**: ${new Date().toISOString()}

**Results**:
\`\`\`json
${JSON.stringify(nodeResults, null, 2)}
\`\`\``;

      await this.taskRepository.create({
        sessionId: workflow.sessionId.toString(),
        title: taskTitle,
        description: taskDescription,
        priority: 'medium',
      });
    } catch (error) {
      console.error('Failed to auto-create task from workflow execution:', error);
      // Don't throw - task creation failure shouldn't fail the workflow
    }
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
   * Group nodes by execution level for parallel execution
   */
  private groupNodesByLevel(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[][] {
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

    const levels: string[][] = [];
    const queue: string[] = [];

    // Find nodes with no incoming edges (level 0)
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    while (queue.length > 0) {
      const currentLevel: string[] = [...queue];
      levels.push(currentLevel);
      queue.length = 0;

      // Process all nodes in current level
      currentLevel.forEach(nodeId => {
        const neighbors = adjList.get(nodeId) || [];
        neighbors.forEach(neighbor => {
          const newDegree = (inDegree.get(neighbor) || 0) - 1;
          inDegree.set(neighbor, newDegree);
          if (newDegree === 0) {
            queue.push(neighbor);
          }
        });
      });
    }

    // Check for cycles
    const totalNodes = levels.reduce((sum, level) => sum + level.length, 0);
    if (totalNodes !== nodes.length) {
      throw new Error('Workflow contains cycles');
    }

    return levels;
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
   * Get child nodes that are part of a loop's scope
   */
  private getLoopChildNodes(loopNodeId: string, edges: WorkflowEdge[]): string[] {
    const childNodes: string[] = [];
    const visited = new Set<string>();

    // Find all nodes reachable from the loop node
    const queue: string[] = [];

    // Start with direct children
    edges
      .filter(e => e.source === loopNodeId)
      .forEach(e => queue.push(e.target));

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (visited.has(current)) continue;
      visited.add(current);
      childNodes.push(current);

      // Add children of current node
      edges
        .filter(e => e.source === current)
        .forEach(e => {
          // Don't follow edges that go back to the loop node (would create infinite loop)
          if (e.target !== loopNodeId && !visited.has(e.target)) {
            queue.push(e.target);
          }
        });
    }

    return childNodes;
  }

  /**
   * Execute a subgraph (subset of workflow nodes)
   */
  private async executeSubgraph(
    nodeIds: string[],
    edges: WorkflowEdge[],
    allNodes: WorkflowNode[],
    initialInput: any,
    workflowData: Record<string, any>
  ): Promise<any> {
    const subgraphResults: Record<string, any> = { ...workflowData };
    subgraphResults['__subgraph_input__'] = initialInput;

    // Filter edges to only include those within the subgraph
    const subgraphEdges = edges.filter(e =>
      nodeIds.includes(e.source) && nodeIds.includes(e.target)
    );

    // Get the actual node objects
    const subgraphNodes = allNodes.filter(n => nodeIds.includes(n.id));

    if (subgraphNodes.length === 0) {
      return initialInput;
    }

    // Group nodes by execution level
    const levels = this.groupNodesByLevel(subgraphNodes, subgraphEdges);

    // Execute nodes level by level
    for (const level of levels) {
      const levelPromises = level.map(async (nodeId) => {
        const node = subgraphNodes.find(n => n.id === nodeId);
        if (!node) return;

        // Get input from previous nodes or use initial input
        const input = this.getNodeInput(nodeId, subgraphEdges, subgraphResults) || initialInput;

        // Execute node
        const result = await this.executeNode({
          nodeId,
          input,
          workflowData: subgraphResults,
          executionStack: workflowData['__execution_stack__'] || [],
        }, node);

        if (!result.success) {
          throw new Error(`Subgraph node ${nodeId} execution failed: ${result.error}`);
        }

        return { nodeId, result };
      });

      const levelResults = await Promise.all(levelPromises);

      // Store results
      levelResults.forEach(item => {
        if (item) {
          subgraphResults[item.nodeId] = item.result.output;
        }
      });
    }

    // Return the output of the last node in the subgraph
    const lastLevelNodeId = levels[levels.length - 1]?.[0];
    return lastLevelNodeId ? subgraphResults[lastLevelNodeId] : initialInput;
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
