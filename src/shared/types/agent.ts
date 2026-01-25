export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  sessionId?: string;
  parentAgentId?: string;
  childAgentIds?: string[];
  capabilities?: string[];
  createdAt: Date;
}

export type AgentRole = 'orchestrator' | 'developer' | 'reviewer' | 'tester' | 'custom';

export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'waiting_input' | 'error' | 'running';

export interface AgentConfig {
  name: string;
  role: AgentRole;
  parentAgentId?: string;
  capabilities?: string[];
}
