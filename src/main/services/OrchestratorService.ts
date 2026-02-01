import { BrowserWindow } from 'electron';
import { agentService } from './AgentService';
import type { AgentType as AgentServiceType } from './AgentService';
import * as ContextRepo from './db/ContextRepository';
import * as OrgRepo from './db/OrganizationRepository';
import { parseAgentOutput } from './ContextService';
import type { OrgNode } from '../../shared/types/organization';
import type { AgentType } from '../../shared/types/workflow';
import type {
  NodeExecution,
  NodeExecutionStatus,
  ExecuteNodeRequest,
  ExecuteNodeResult,
  OrchestrationState,
  OrchestrationPhase,
  ChildInstruction,
  OrchestrateNodeRequest,
  ApproveRejectRequest,
} from '../../shared/types/orchestration';

function toAgentServiceType(agentType: AgentType): AgentServiceType {
  if (agentType === 'claude-code') return 'claude';
  return agentType as AgentServiceType;
}

function generateSessionId(nodeId: string): string {
  return `orch-${nodeId}-${Date.now()}`;
}

class OrchestratorService {
  private mainWindow: BrowserWindow | null = null;
  private executions: Map<string, NodeExecution> = new Map();
  private orchestrations: Map<string, OrchestrationState> = new Map();
  private taskCompleteCallbacks: Map<string, () => void> = new Map();
  private outputBuffers: Map<string, string> = new Map();
  private outputListenerCleanups: Map<string, () => void> = new Map();

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  setupEventListeners(): void {
    if (!this.mainWindow) return;

    this.mainWindow.webContents.on('ipc-message', (_event, channel, ...args) => {
      if (channel === 'agent:taskComplete') {
        const agentSessionId = args[0] as string;
        const callback = this.taskCompleteCallbacks.get(agentSessionId);
        if (callback) {
          this.taskCompleteCallbacks.delete(agentSessionId);
          callback();
        }
      }
    });
  }

  // ===== Phase 3: Direct execution =====

  async executeNode(request: ExecuteNodeRequest): Promise<ExecuteNodeResult> {
    const { nodeId, sessionId, prompt, parentContextId } = request;

    const org = OrgRepo.getOrCreate(sessionId);
    const nodes = org.hierarchy?.nodes ?? [];
    const node = nodes.find(n => n.id === nodeId);

    if (!node) {
      return { nodeId, status: 'failed', error: 'Node not found' };
    }

    const children = nodes.filter(n => n.parentId === nodeId);

    if (children.length === 0) {
      return this.executeLeafNode(node, sessionId, prompt, parentContextId);
    }

    const strategy = node.executionStrategy ?? 'parallel';
    if (strategy === 'parallel') {
      return this.executeParallel(node, children, sessionId, prompt);
    }
    return this.executeSequential(node, children, sessionId, prompt);
  }

  stopNode(nodeId: string): void {
    const execution = this.executions.get(nodeId);
    if (execution?.agentSessionId) {
      agentService.stop(execution.agentSessionId);
    }
    this.updateExecution(nodeId, { status: 'idle' });
    this.cleanupOutputListener(nodeId);

    // Also clear orchestration state
    this.orchestrations.delete(nodeId);
  }

  getStatus(nodeId: string): NodeExecution | null {
    return this.executions.get(nodeId) ?? null;
  }

  getAllStatus(sessionId: string): NodeExecution[] {
    return Array.from(this.executions.values()).filter(
      e => e.sessionId === sessionId
    );
  }

  // ===== Phase 4: Orchestration =====

  async orchestrateNode(request: OrchestrateNodeRequest): Promise<OrchestrationState> {
    const { nodeId, sessionId, goal } = request;

    const org = OrgRepo.getOrCreate(sessionId);
    const nodes = org.hierarchy?.nodes ?? [];
    const parentNode = nodes.find(n => n.id === nodeId);

    if (!parentNode) {
      return this.setOrchestrationState(nodeId, sessionId, 'rejected', { error: 'Node not found' });
    }

    const children = nodes.filter(n => n.parentId === nodeId);
    if (children.length === 0) {
      return this.setOrchestrationState(nodeId, sessionId, 'rejected', { error: 'No child nodes to orchestrate' });
    }

    // Phase 1: Planning — parent AI generates instructions for children
    this.setOrchestrationState(nodeId, sessionId, 'planning');
    this.emitOrchestrationChange(nodeId);

    try {
      const plan = await this.generatePlan(parentNode, children, sessionId, goal);
      this.setOrchestrationState(nodeId, sessionId, 'executing', { plan });
      this.emitOrchestrationChange(nodeId);

      // Phase 2: Executing — run children with generated instructions
      const strategy = parentNode.executionStrategy ?? 'parallel';
      const childResults = await this.executeWithPlan(children, plan, sessionId, strategy);

      // Phase 3: Reviewing — parent AI summarizes results
      this.setOrchestrationState(nodeId, sessionId, 'reviewing', { plan, childResults });
      this.emitOrchestrationChange(nodeId);

      const summary = await this.generateSummary(parentNode, children, childResults, sessionId, goal);

      // Phase 4: Pending approval — wait for human
      const state = this.setOrchestrationState(nodeId, sessionId, 'pending_approval', {
        plan,
        childResults,
        summary,
      });
      this.emitOrchestrationChange(nodeId);

      return state;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const state = this.setOrchestrationState(nodeId, sessionId, 'rejected', { error: errMsg });
      this.emitOrchestrationChange(nodeId);
      return state;
    }
  }

  approveOrReject(request: ApproveRejectRequest): OrchestrationState | null {
    const { nodeId, approved, feedback } = request;
    const current = this.orchestrations.get(nodeId);
    if (!current) return null;

    const phase: OrchestrationPhase = approved ? 'approved' : 'rejected';
    const updates: Partial<OrchestrationState> = {};
    if (!approved && feedback) {
      updates.error = `Rejected: ${feedback}`;
    }

    const state = this.setOrchestrationState(nodeId, current.sessionId, phase, updates);
    this.emitOrchestrationChange(nodeId);
    return state;
  }

  getOrchestrationState(nodeId: string): OrchestrationState | null {
    return this.orchestrations.get(nodeId) ?? null;
  }

  // ===== Private: Phase 3 =====

  private async executeLeafNode(
    node: OrgNode,
    sessionId: string,
    prompt: string,
    parentContextId?: string,
  ): Promise<ExecuteNodeResult> {
    const agentSessionId = generateSessionId(node.id);
    const agentType = node.preferredAgentType ?? 'claude-code';
    const cwd = process.env.HOME || '/tmp';

    let fullPrompt = prompt;

    // Prepend systemPrompt if set
    if (node.systemPrompt) {
      fullPrompt = `[System Role]\n${node.systemPrompt}\n\n[Task]\n${fullPrompt}`;
    }

    // Add parent context for sequential chains
    if (parentContextId) {
      const parentCtx = ContextRepo.getById(parentContextId);
      if (parentCtx) {
        fullPrompt = `Previous agent output:\n---\n${parentCtx.content}\n---\n\nBased on the above, ${fullPrompt}`;
      }
    }

    this.updateExecution(node.id, {
      nodeId: node.id,
      sessionId,
      status: 'running',
      agentSessionId,
      startedAt: new Date().toISOString(),
    });
    this.emitStatusChange(node.id);

    try {
      this.outputBuffers.set(node.id, '');
      this.setupOutputCapture(node.id, agentSessionId);

      agentService.start(agentSessionId, toAgentServiceType(agentType), cwd, fullPrompt);

      await this.waitForTaskComplete(agentSessionId);

      const rawOutput = this.outputBuffers.get(node.id) ?? '';
      this.outputBuffers.delete(node.id);
      this.cleanupOutputListener(node.id);

      const parsed = parseAgentOutput(rawOutput);
      const ctx = ContextRepo.save({
        orgNodeId: node.id,
        sessionId,
        contextType: 'output',
        dataFormat: parsed.format,
        content: parsed.content,
        parentContextId,
      });

      this.updateExecution(node.id, {
        status: 'completed',
        contextId: ctx.id,
        completedAt: new Date().toISOString(),
      });
      this.emitStatusChange(node.id);

      return { nodeId: node.id, status: 'completed', contextId: ctx.id };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.updateExecution(node.id, {
        status: 'failed',
        error: errMsg,
        completedAt: new Date().toISOString(),
      });
      this.emitStatusChange(node.id);
      return { nodeId: node.id, status: 'failed', error: errMsg };
    }
  }

  private async executeParallel(
    parentNode: OrgNode,
    children: OrgNode[],
    sessionId: string,
    prompt: string,
  ): Promise<ExecuteNodeResult> {
    this.updateExecution(parentNode.id, {
      nodeId: parentNode.id,
      sessionId,
      status: 'running',
      startedAt: new Date().toISOString(),
    });
    this.emitStatusChange(parentNode.id);

    const promises = children.map(child =>
      this.executeNode({ nodeId: child.id, sessionId, prompt })
    );

    const results = await Promise.allSettled(promises);
    const childResults: ExecuteNodeResult[] = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      return {
        nodeId: children[i].id,
        status: 'failed' as const,
        error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      };
    });

    const allCompleted = childResults.every(r => r.status === 'completed');
    const finalStatus = allCompleted ? 'completed' : 'failed';

    this.updateExecution(parentNode.id, {
      status: finalStatus,
      completedAt: new Date().toISOString(),
    });
    this.emitStatusChange(parentNode.id);

    return { nodeId: parentNode.id, status: finalStatus, childResults };
  }

  private async executeSequential(
    parentNode: OrgNode,
    children: OrgNode[],
    sessionId: string,
    prompt: string,
  ): Promise<ExecuteNodeResult> {
    this.updateExecution(parentNode.id, {
      nodeId: parentNode.id,
      sessionId,
      status: 'running',
      startedAt: new Date().toISOString(),
    });
    this.emitStatusChange(parentNode.id);

    const childResults: ExecuteNodeResult[] = [];
    let lastContextId: string | undefined;

    for (const child of children) {
      const result = await this.executeNode({
        nodeId: child.id,
        sessionId,
        prompt,
        parentContextId: lastContextId,
      });

      childResults.push(result);

      if (result.status === 'failed') {
        this.updateExecution(parentNode.id, {
          status: 'failed',
          error: `Child node ${child.name} failed: ${result.error}`,
          completedAt: new Date().toISOString(),
        });
        this.emitStatusChange(parentNode.id);

        return {
          nodeId: parentNode.id,
          status: 'failed',
          childResults,
          error: `Sequential execution stopped at ${child.name}`,
        };
      }

      lastContextId = result.contextId;
    }

    this.updateExecution(parentNode.id, {
      status: 'completed',
      contextId: lastContextId,
      completedAt: new Date().toISOString(),
    });
    this.emitStatusChange(parentNode.id);

    return {
      nodeId: parentNode.id,
      status: 'completed',
      contextId: lastContextId,
      childResults,
    };
  }

  // ===== Private: Phase 4 =====

  private async generatePlan(
    parentNode: OrgNode,
    children: OrgNode[],
    sessionId: string,
    goal: string,
  ): Promise<ChildInstruction[]> {
    const agentSessionId = generateSessionId(`plan-${parentNode.id}`);
    const agentType = parentNode.preferredAgentType ?? 'claude-code';
    const cwd = process.env.HOME || '/tmp';

    const childDescriptions = children.map(c => {
      const typeLabel = c.type === 'team' ? 'Team' : 'Role';
      const model = c.preferredAgentType ?? 'claude-code';
      return `- ${c.name} (${typeLabel}, model: ${model})${c.systemPrompt ? `: ${c.systemPrompt}` : ''}${c.description ? ` — ${c.description}` : ''}`;
    }).join('\n');

    const planPrompt = `You are an orchestrator. Your role: ${parentNode.systemPrompt || parentNode.name}.

You have the following team members:
${childDescriptions}

The goal is: ${goal}

Generate a JSON array of instructions for each team member. Format:
\`\`\`json
[
  {"childNodeId": "<id>", "childNodeName": "<name>", "instruction": "<specific task instruction>"}
]
\`\`\`

Child node IDs: ${children.map(c => `${c.name}=${c.id}`).join(', ')}

IMPORTANT: Output ONLY the JSON array in a fenced code block. No other text.`;

    this.outputBuffers.set(`plan-${parentNode.id}`, '');
    this.setupOutputCapture(`plan-${parentNode.id}`, agentSessionId);

    agentService.start(agentSessionId, toAgentServiceType(agentType), cwd, planPrompt);
    await this.waitForTaskComplete(agentSessionId);

    const rawOutput = this.outputBuffers.get(`plan-${parentNode.id}`) ?? '';
    this.outputBuffers.delete(`plan-${parentNode.id}`);
    this.cleanupOutputListener(`plan-${parentNode.id}`);

    // Save planning output as context
    ContextRepo.save({
      orgNodeId: parentNode.id,
      sessionId,
      contextType: 'output',
      dataFormat: 'json',
      content: rawOutput,
    });

    return this.parsePlan(rawOutput, children);
  }

  private parsePlan(rawOutput: string, children: OrgNode[]): ChildInstruction[] {
    // Try to extract JSON from fenced block or raw
    const fencedMatch = rawOutput.match(/```(?:json)?\s*\n([\s\S]*?)\n\s*```/);
    const jsonStr = fencedMatch ? fencedMatch[1].trim() : rawOutput.trim();

    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        return parsed.map((item: Record<string, string>) => ({
          childNodeId: item.childNodeId ?? '',
          childNodeName: item.childNodeName ?? '',
          instruction: item.instruction ?? '',
        }));
      }
    } catch {
      // Fallback: create equal instructions for all children
    }

    // Fallback: give the raw output as instruction to all children
    return children.map(c => ({
      childNodeId: c.id,
      childNodeName: c.name,
      instruction: rawOutput.slice(0, 500),
    }));
  }

  private async executeWithPlan(
    children: OrgNode[],
    plan: ChildInstruction[],
    sessionId: string,
    strategy: 'parallel' | 'sequential',
  ): Promise<ExecuteNodeResult[]> {
    const instructionMap = new Map(plan.map(p => [p.childNodeId, p.instruction]));

    if (strategy === 'parallel') {
      const promises = children.map(child => {
        const instruction = instructionMap.get(child.id) ?? 'Complete your assigned task.';
        return this.executeNode({ nodeId: child.id, sessionId, prompt: instruction });
      });

      const results = await Promise.allSettled(promises);
      return results.map((r, i) => {
        if (r.status === 'fulfilled') return r.value;
        return {
          nodeId: children[i].id,
          status: 'failed' as const,
          error: r.reason instanceof Error ? r.reason.message : String(r.reason),
        };
      });
    }

    // Sequential
    const childResults: ExecuteNodeResult[] = [];
    let lastContextId: string | undefined;

    for (const child of children) {
      const instruction = instructionMap.get(child.id) ?? 'Complete your assigned task.';
      const result = await this.executeNode({
        nodeId: child.id,
        sessionId,
        prompt: instruction,
        parentContextId: lastContextId,
      });
      childResults.push(result);
      if (result.status === 'failed') break;
      lastContextId = result.contextId;
    }

    return childResults;
  }

  private async generateSummary(
    parentNode: OrgNode,
    children: OrgNode[],
    childResults: ExecuteNodeResult[],
    sessionId: string,
    goal: string,
  ): Promise<string> {
    const agentSessionId = generateSessionId(`summary-${parentNode.id}`);
    const agentType = parentNode.preferredAgentType ?? 'claude-code';
    const cwd = process.env.HOME || '/tmp';

    // Gather child outputs
    const resultSummaries = childResults.map((r, i) => {
      const child = children[i];
      const name = child?.name ?? r.nodeId;
      if (r.status === 'failed') {
        return `### ${name}\nStatus: FAILED\nError: ${r.error ?? 'Unknown'}`;
      }
      const ctx = r.contextId ? ContextRepo.getById(r.contextId) : null;
      const output = ctx?.content ?? '(no output)';
      return `### ${name}\nStatus: Completed\nOutput:\n${output.slice(0, 2000)}`;
    }).join('\n\n');

    const summaryPrompt = `You are an orchestrator. Your role: ${parentNode.systemPrompt || parentNode.name}.

The goal was: ${goal}

Here are the results from your team:

${resultSummaries}

Please provide a concise summary that:
1. Evaluates whether the goal was achieved
2. Highlights key findings from each team member
3. Notes any failures or issues
4. Provides a recommended next step

Output your summary in markdown format.`;

    this.outputBuffers.set(`summary-${parentNode.id}`, '');
    this.setupOutputCapture(`summary-${parentNode.id}`, agentSessionId);

    agentService.start(agentSessionId, toAgentServiceType(agentType), cwd, summaryPrompt);
    await this.waitForTaskComplete(agentSessionId);

    const rawOutput = this.outputBuffers.get(`summary-${parentNode.id}`) ?? '';
    this.outputBuffers.delete(`summary-${parentNode.id}`);
    this.cleanupOutputListener(`summary-${parentNode.id}`);

    // Save summary as context
    const parsed = parseAgentOutput(rawOutput);
    ContextRepo.save({
      orgNodeId: parentNode.id,
      sessionId,
      contextType: 'output',
      dataFormat: parsed.format,
      content: parsed.content,
    });

    return parsed.content;
  }

  // ===== Private: Utilities =====

  private setupOutputCapture(nodeId: string, agentSessionId: string): void {
    if (!this.mainWindow) return;

    const handler = (_event: Electron.Event, channel: string, ...args: unknown[]) => {
      if (channel === 'agent:output' && args[0] === agentSessionId) {
        const data = args[1] as string;
        const current = this.outputBuffers.get(nodeId) ?? '';
        this.outputBuffers.set(nodeId, current + data);
      }
    };

    this.mainWindow.webContents.on('ipc-message', handler);
    this.outputListenerCleanups.set(nodeId, () => {
      this.mainWindow?.webContents.removeListener('ipc-message', handler);
    });
  }

  private cleanupOutputListener(nodeId: string): void {
    const cleanup = this.outputListenerCleanups.get(nodeId);
    if (cleanup) {
      cleanup();
      this.outputListenerCleanups.delete(nodeId);
    }
    this.outputBuffers.delete(nodeId);
  }

  private waitForTaskComplete(agentSessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const TIMEOUT = 10 * 60 * 1000;

      const timer = setTimeout(() => {
        this.taskCompleteCallbacks.delete(agentSessionId);
        reject(new Error('Agent execution timed out'));
      }, TIMEOUT);

      this.taskCompleteCallbacks.set(agentSessionId, () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  private updateExecution(nodeId: string, updates: Partial<NodeExecution>): void {
    const existing = this.executions.get(nodeId) ?? {
      nodeId,
      sessionId: '',
      status: 'idle' as NodeExecutionStatus,
    };
    this.executions.set(nodeId, { ...existing, ...updates });
  }

  private setOrchestrationState(
    nodeId: string,
    sessionId: string,
    phase: OrchestrationPhase,
    updates?: Partial<OrchestrationState>,
  ): OrchestrationState {
    const existing = this.orchestrations.get(nodeId);
    const state: OrchestrationState = {
      nodeId,
      sessionId,
      phase,
      plan: existing?.plan,
      childResults: existing?.childResults,
      summary: existing?.summary,
      error: existing?.error,
      ...updates,
    };
    this.orchestrations.set(nodeId, state);
    return state;
  }

  private emitStatusChange(nodeId: string): void {
    const execution = this.executions.get(nodeId);
    if (execution && this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('orchestration:statusChange', execution);
    }
  }

  private emitOrchestrationChange(nodeId: string): void {
    const state = this.orchestrations.get(nodeId);
    if (state && this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('orchestration:stateChange', state);
    }
  }
}

export const orchestratorService = new OrchestratorService();
