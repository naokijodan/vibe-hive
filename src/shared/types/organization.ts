import type { Agent } from './agent';

export interface Organization {
  id: string;
  name: string;
  rootAgentId?: string;
  agents: Agent[];
  connections: AgentConnection[];
  whiteboard: Whiteboard;
  hierarchy?: OrgHierarchy; // Added hierarchy support
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentConnection {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  connectionType: ConnectionType;
}

export type ConnectionType = 'reports_to' | 'delegates_to' | 'collaborates_with';

export interface Whiteboard {
  id: string;
  organizationId: string;
  entries: WhiteboardEntry[];
}

export interface WhiteboardEntry {
  id: string;
  agentId: string;
  content: string;
  entryType: WhiteboardEntryType;
  createdAt: Date;
}

export type WhiteboardEntryType = 'note' | 'decision' | 'question' | 'context';

// Organization hierarchy nodes (teams and roles)
export interface OrgNode {
  id: string;
  name: string;
  type: 'team' | 'role';
  parentId?: string;
  assignedAgentIds?: string[];
  description?: string;
  position?: { x: number; y: number }; // For React Flow positioning
}

export interface OrgHierarchy {
  nodes: OrgNode[];
  rootNodeId?: string;
}
