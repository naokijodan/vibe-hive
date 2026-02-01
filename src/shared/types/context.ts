export type ContextType = 'output' | 'input' | 'shared';
export type DataFormat = 'json' | 'text' | 'markdown';

export interface AgentContext {
  id: string;
  orgNodeId: string;
  sessionId: string;
  contextType: ContextType;
  dataFormat: DataFormat;
  content: string;
  parentContextId?: string;
  createdAt: string;
}

export interface AgentContextCreateInput {
  orgNodeId: string;
  sessionId: string;
  contextType: ContextType;
  dataFormat: DataFormat;
  content: string;
  parentContextId?: string;
}
