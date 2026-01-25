export interface Session {
  id: string;
  name: string;
  workingDirectory: string;
  agentId?: string;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type SessionStatus = 'idle' | 'running' | 'waiting' | 'error' | 'completed';

export interface SessionConfig {
  name: string;
  workingDirectory: string;
  agentId?: string;
}
