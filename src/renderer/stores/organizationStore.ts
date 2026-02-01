import { create } from 'zustand';
import type { Organization, OrgNode } from '../../shared/types/organization';
import type { NodeExecution, ExecuteNodeResult, OrchestrationState } from '../../shared/types/orchestration';
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
  nodeExecutions: Map<string, NodeExecution>;
  orchestrationStates: Map<string, OrchestrationState>;
  highlightedNodeIds: Set<string>;

  // Actions
  loadOrganization: () => Promise<void>;
  updateOrganization: (org: Organization) => Promise<void>;

  // Node operations
  addNode: (node: Omit<OrgNode, 'id'>) => Promise<OrgNode>;
  updateNode: (id: string, updates: Partial<OrgNode>) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  setSelectedNode: (id: string | null) => void;
  setHighlightedNodes: (selectedId: string | null) => void;

  // Agent assignment
  assignAgentToNode: (nodeId: string, agentId: string) => Promise<void>;
  unassignAgentFromNode: (nodeId: string, agentId: string) => Promise<void>;

  // Orchestration
  executeNode: (nodeId: string, prompt: string) => Promise<ExecuteNodeResult>;
  stopNode: (nodeId: string) => void;
  updateNodeExecution: (execution: NodeExecution) => void;
  initOrchestrationListener: () => () => void;

  // Phase 4: Orchestration
  orchestrateNode: (nodeId: string, goal: string) => Promise<OrchestrationState>;
  approveOrchestration: (nodeId: string) => void;
  rejectOrchestration: (nodeId: string, feedback: string) => void;
  updateOrchestrationState: (state: OrchestrationState) => void;
}

export const useOrganizationStore = create<OrganizationState>((set, get) => ({
  organization: null,
  nodes: [],
  selectedNodeId: null,
  isLoading: false,
  error: null,
  nodeExecutions: new Map(),
  orchestrationStates: new Map(),
  highlightedNodeIds: new Set(),

  loadOrganization: async () => {
    set({ isLoading: true, error: null });
    try {
      const org = await ipcBridge.organization.get() as Organization | null;
      if (org) {
        set({
          organization: org,
          nodes: org.hierarchy?.nodes || [],
          isLoading: false,
        });
      } else {
        // No org returned - initialize with empty default
        const defaultOrg: Organization = {
          id: `org-${Date.now()}`,
          name: 'Default Organization',
          agents: [],
          connections: [],
          whiteboard: { id: `wb-${Date.now()}`, organizationId: `org-${Date.now()}`, entries: [] },
          hierarchy: { nodes: [], rootNodeId: undefined },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await ipcBridge.organization.update(defaultOrg);
        set({
          organization: defaultOrg,
          nodes: [],
          isLoading: false,
        });
      }
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
    get().setHighlightedNodes(id);
  },

  setHighlightedNodes: (selectedId) => {
    if (!selectedId) {
      set({ highlightedNodeIds: new Set() });
      return;
    }
    const { nodes } = get();
    const highlighted = new Set<string>([selectedId]);

    // Traverse parent chain upward
    let current = nodes.find(n => n.id === selectedId);
    while (current?.parentId) {
      highlighted.add(current.parentId);
      current = nodes.find(n => n.id === current!.parentId);
    }

    // Add direct children
    nodes.filter(n => n.parentId === selectedId)
      .forEach(n => highlighted.add(n.id));

    set({ highlightedNodeIds: highlighted });
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

  executeNode: async (nodeId, prompt) => {
    const result = await ipcBridge.orchestration.execute({
      nodeId,
      sessionId: 'default-session',
      prompt,
    });
    return result;
  },

  stopNode: (nodeId) => {
    ipcBridge.orchestration.stop(nodeId);
  },

  updateNodeExecution: (execution) => {
    set(state => {
      const newMap = new Map(state.nodeExecutions);
      newMap.set(execution.nodeId, execution);
      return { nodeExecutions: newMap };
    });
  },

  initOrchestrationListener: () => {
    const cleanup1 = ipcBridge.orchestration.onStatusChange((execution) => {
      get().updateNodeExecution(execution);
    });
    const cleanup2 = ipcBridge.orchestration.onStateChange((state) => {
      get().updateOrchestrationState(state);
    });
    return () => {
      cleanup1();
      cleanup2();
    };
  },

  orchestrateNode: async (nodeId, goal) => {
    const result = await ipcBridge.orchestration.orchestrate({
      nodeId,
      sessionId: 'default-session',
      goal,
    });
    return result;
  },

  approveOrchestration: (nodeId) => {
    ipcBridge.orchestration.approve({ nodeId, approved: true });
  },

  rejectOrchestration: (nodeId, feedback) => {
    ipcBridge.orchestration.approve({ nodeId, approved: false, feedback });
  },

  updateOrchestrationState: (state) => {
    set(s => {
      const newMap = new Map(s.orchestrationStates);
      newMap.set(state.nodeId, state);
      return { orchestrationStates: newMap };
    });
  },
}));
