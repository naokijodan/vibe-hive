// Collaborative Mode types

export interface CollabUser {
  id: string;
  nickname: string;
  color: string;
  joinedAt: string;
}

export interface CollabRoom {
  sessionId: string;
  users: CollabUser[];
  hostId: string;
}

export interface CollabEvent {
  type: CollabEventType;
  userId: string;
  timestamp: string;
  payload: unknown;
}

export type CollabEventType =
  | 'user:joined'
  | 'user:left'
  | 'task:updated'
  | 'task:created'
  | 'task:deleted'
  | 'task:moved'
  | 'cursor:moved'
  | 'chat:message';

export interface CollabChatMessage {
  id: string;
  userId: string;
  nickname: string;
  color: string;
  message: string;
  timestamp: string;
}

export interface CollabCursorPosition {
  userId: string;
  nickname: string;
  color: string;
  taskId?: string;
  view?: string;
}

export interface CollabServerConfig {
  port: number;
  maxUsers: number;
}

export interface CollabConnectionStatus {
  connected: boolean;
  role: 'host' | 'guest' | 'disconnected';
  roomSessionId?: string;
  userCount: number;
  serverPort?: number;
}

export interface CollabSettings {
  nickname: string;
  color: string;
}
