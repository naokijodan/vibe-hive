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
  private taskCompleteCallbacks: Map<string, () => void> = new Map();
  private outputBuffers: Map<string, string> = new Map();
  private outputListenerCleanups: Map<string, () => void> = new Map();

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * Listen for agent:taskComplete events from AgentService.
   * Must be called after mainWindow is set.
   */
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

  async executeNode(request: ExecuteNodeRequest): Promise<ExecuteNodeResult> {
    const { nodeId, sessionId, prompt, parentContextId } = request;

    const org = OrgRepo.getOrCreate(sessionId);
    const nodes = org.hierarchy?.nodes ?? [];
    const node = nodes.find(n => n.id === nodeId);

    if (!node) {
      return { nodeId, status: 'failed', error: 'Node not found' };
    }

    const children = nodes.filter(n => n.parentId === nodeId);

    // Leaf node (role) — execute directly
    if (children.length === 0) {
      return this.executeLeafNode(node, sessionId, prompt, parentContextId);
    }

    // Team node — execute children based on strategy
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

    // Clean up output listener
    const cleanup = this.outputListenerCleanups.get(nodeId);
    if (cleanup) {
      cleanup();
      this.outputListenerCleanups.delete(nodeId);
    }
    this.outputBuffers.delete(nodeId);
  }

  getStatus(nodeId: string): NodeExecution | null {
    return this.executions.get(nodeId) ?? null;
  }

  getAllStatus(sessionId: string): NodeExecution[] {
    return Array.from(this.executions.values()).filter(
      e => e.sessionId === sessionId
    );
  }

  // --- Private ---

  private async executeLeafNode(
    node: OrgNode,
    sessionId: string,
    prompt: string,
    parentContextId?: string,
  ): Promise<ExecuteNodeResult> {
    const agentSessionId = generateSessionId(node.id);
    const agentType = node.preferredAgentType ?? 'claude-code';
    const cwd = process.env.HOME || '/tmp';

    // Build prompt with parent context if sequential
    let fullPrompt = prompt;
    if (parentContextId) {
      const parentCtx = ContextRepo.getById(parentContextId);
      if (parentCtx) {
        fullPrompt = `Previous agent output:\n---\n${parentCtx.content}\n---\n\nBased on the above, ${prompt}`;
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
      // Start capturing output
      this.outputBuffers.set(node.id, '');
      this.setupOutputCapture(node.id, agentSessionId);

      // Start agent
      agentService.start(agentSessionId, toAgentServiceType(agentType), cwd, fullPrompt);

      // Wait for task completion
      await this.waitForTaskComplete(agentSessionId);

      // Capture output and save as context
      const rawOutput = this.outputBuffers.get(node.id) ?? '';
      this.outputBuffers.delete(node.id);

      // Clean up output listener
      const cleanup = this.outputListenerCleanups.get(node.id);
      if (cleanup) {
        cleanup();
        this.outputListenerCleanups.delete(node.id);
      }

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
      this.executeNode({
        nodeId: child.id,
        sessionId,
        prompt,
      })
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

    return {
      nodeId: parentNode.id,
      status: finalStatus,
      childResults,
    };
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

      // Pass output context to next child
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

  private waitForTaskComplete(agentSessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const TIMEOUT = 10 * 60 * 1000; // 10 minutes

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

  private emitStatusChange(nodeId: string): void {
    const execution = this.executions.get(nodeId);
    if (execution && this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('orchestration:statusChange', execution);
    }
  }
}

export const orchestratorService = new OrchestratorService();
