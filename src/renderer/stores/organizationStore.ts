import { create } from 'zustand';
import type { Organization, OrgNode } from '../../shared/types/organization';
import ipcBridge from '../bridge/ipcBridge';

// Browser-compatible UUID generator
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface OrganizationState {
  organization: Organization | null;
  nodes: OrgNode[];
  selectedNodeId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadOrganization: () => Promise<void>;
  updateOrganization: (org: Organization) => Promise<void>;

  // Node operations
  addNode: (node: Omit<OrgNode, 'id'>) => Promise<OrgNode>;
  updateNode: (id: string, updates: Partial<OrgNode>) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  setSelectedNode: (id: string | null) => void;

  // Agent assignment
  assignAgentToNode: (nodeId: string, agentId: string) => Promise<void>;
  unassignAgentFromNode: (nodeId: string, agentId: string) => Promise<void>;
}

export const useOrganizationStore = create<OrganizationState>((set, get) => ({
  organization: null,
  nodes: [],
  selectedNodeId: null,
  isLoading: false,
  error: null,

  loadOrganization: async () => {
    set({ isLoading: true, error: null });
    try {
      const org = await ipcBridge.organization.get() as Organization;
      set({
        organization: org,
        nodes: org.hierarchy?.nodes || [],
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load organization',
        isLoading: false,
      });
    }
  },

  updateOrganization: async (org: Organization) => {
    set({ isLoading: true, error: null });
    try {
      await ipcBridge.organization.update(org);
      set({ organization: org, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update organization',
        isLoading: false,
      });
    }
  },

  addNode: async (nodeData) => {
    const { organization, nodes } = get();
    if (!organization) throw new Error('No organization loaded');

    const newNode: OrgNode = {
      ...nodeData,
      id: generateUUID(),
    };

    const updatedNodes = [...nodes, newNode];
    const updatedOrg = {
      ...organization,
      hierarchy: {
        ...organization.hierarchy,
        nodes: updatedNodes,
        rootNodeId: organization.hierarchy?.rootNodeId || (!nodeData.parentId ? newNode.id : organization.hierarchy?.rootNodeId),
      },
    };

    await get().updateOrganization(updatedOrg);
    set({ nodes: updatedNodes });
    return newNode;
  },

  updateNode: async (id, updates) => {
    const { organization, nodes } = get();
    if (!organization) throw new Error('No organization loaded');

    const updatedNodes = nodes.map(node =>
      node.id === id ? { ...node, ...updates } : node
    );

    const updatedOrg = {
      ...organization,
      hierarchy: {
        ...organization.hierarchy,
        nodes: updatedNodes,
      },
    };

    await get().updateOrganization(updatedOrg);
    set({ nodes: updatedNodes });
  },

  deleteNode: async (id) => {
    const { organization, nodes } = get();
    if (!organization) throw new Error('No organization loaded');

    // Remove node and its children
    const nodesToDelete = new Set<string>([id]);
    const findChildren = (parentId: string) => {
      nodes.forEach(node => {
        if (node.parentId === parentId) {
          nodesToDelete.add(node.id);
          findChildren(node.id);
        }
      });
    };
    findChildren(id);

    const updatedNodes = nodes.filter(node => !nodesToDelete.has(node.id));

    const updatedOrg = {
      ...organization,
      hierarchy: {
        ...organization.hierarchy,
        nodes: updatedNodes,
        rootNodeId: organization.hierarchy?.rootNodeId === id ? undefined : organization.hierarchy?.rootNodeId,
      },
    };

    await get().updateOrganization(updatedOrg);
    set({ nodes: updatedNodes, selectedNodeId: null });
  },

  setSelectedNode: (id) => {
    set({ selectedNodeId: id });
  },

  assignAgentToNode: async (nodeId, agentId) => {
    const { nodes } = get();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const currentAgents = node.assignedAgentIds || [];
    if (currentAgents.includes(agentId)) return;

    await get().updateNode(nodeId, {
      assignedAgentIds: [...currentAgents, agentId],
    });
  },

  unassignAgentFromNode: async (nodeId, agentId) => {
    const { nodes } = get();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const currentAgents = node.assignedAgentIds || [];
    await get().updateNode(nodeId, {
      assignedAgentIds: currentAgents.filter(id => id !== agentId),
    });
  },
}));
