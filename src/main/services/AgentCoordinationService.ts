import { BrowserWindow } from 'electron';
import { randomUUID } from 'crypto';

export interface CoordinationMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string | null; // null = broadcast
  type: 'message' | 'task_delegate' | 'status_update' | 'request' | 'response';
  content: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface TaskDelegation {
  id: string;
  taskId: string;
  fromAgentId: string;
  toAgentId: string;
  reason?: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
}

class AgentCoordinationService {
  private messages: CoordinationMessage[] = [];
  private delegations: TaskDelegation[] = [];
  private mainWindow: BrowserWindow | null = null;
  private maxMessages = 500;

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  sendMessage(
    fromAgentId: string,
    toAgentId: string | null,
    type: CoordinationMessage['type'],
    content: string,
    metadata?: Record<string, unknown>
  ): CoordinationMessage {
    const msg: CoordinationMessage = {
      id: randomUUID(),
      fromAgentId,
      toAgentId,
      type,
      content,
      metadata,
      timestamp: new Date().toISOString(),
    };

    this.messages.push(msg);

    // Trim old messages
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }

    // Notify renderer
    this.notifyRenderer('coordination:message', msg);

    return msg;
  }

  delegateTask(
    taskId: string,
    fromAgentId: string,
    toAgentId: string,
    reason?: string
  ): TaskDelegation {
    const delegation: TaskDelegation = {
      id: randomUUID(),
      taskId,
      fromAgentId,
      toAgentId,
      reason,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    this.delegations.push(delegation);

    // Send coordination message about the delegation
    this.sendMessage(
      fromAgentId,
      toAgentId,
      'task_delegate',
      `Task ${taskId} delegated${reason ? `: ${reason}` : ''}`,
      { delegationId: delegation.id, taskId }
    );

    // Notify renderer
    this.notifyRenderer('coordination:delegation', delegation);

    return delegation;
  }

  respondToDelegation(delegationId: string, accepted: boolean): TaskDelegation | null {
    const delegation = this.delegations.find(d => d.id === delegationId);
    if (!delegation || delegation.status !== 'pending') return null;

    delegation.status = accepted ? 'accepted' : 'rejected';

    this.sendMessage(
      delegation.toAgentId,
      delegation.fromAgentId,
      'response',
      `Task delegation ${accepted ? 'accepted' : 'rejected'}`,
      { delegationId, taskId: delegation.taskId }
    );

    this.notifyRenderer('coordination:delegation', delegation);
    return delegation;
  }

  getMessages(limit?: number): CoordinationMessage[] {
    if (limit) {
      return this.messages.slice(-limit);
    }
    return [...this.messages];
  }

  getMessagesByAgent(agentId: string): CoordinationMessage[] {
    return this.messages.filter(
      m => m.fromAgentId === agentId || m.toAgentId === agentId || m.toAgentId === null
    );
  }

  getDelegations(): TaskDelegation[] {
    return [...this.delegations];
  }

  clearMessages(): void {
    this.messages = [];
    this.delegations = [];
  }

  private notifyRenderer(channel: string, data: unknown): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }
}

let instance: AgentCoordinationService | null = null;

export function getAgentCoordinationService(): AgentCoordinationService {
  if (!instance) {
    instance = new AgentCoordinationService();
  }
  return instance;
}
