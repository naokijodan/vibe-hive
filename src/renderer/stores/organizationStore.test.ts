import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockOrganization, mockOrchestration } = vi.hoisted(() => ({
  mockOrganization: {
    get: vi.fn(),
    update: vi.fn(),
  },
  mockOrchestration: {
    execute: vi.fn(),
    stop: vi.fn(),
    onStatusChange: vi.fn(),
    onStateChange: vi.fn(),
    orchestrate: vi.fn(),
    approve: vi.fn(),
  },
}));

vi.stubGlobal('window', { electronAPI: {} });

vi.mock('../bridge/ipcBridge', () => ({
  default: {
    organization: mockOrganization,
    orchestration: mockOrchestration,
  },
}));

import { useOrganizationStore } from './organizationStore';

const makeOrg = () => ({
  id: 'org-1',
  name: 'Test Org',
  agents: [],
  connections: [],
  whiteboard: { id: 'wb-1', organizationId: 'org-1', entries: [] },
  hierarchy: {
    nodes: [
      { id: 'node-1', name: 'CEO', parentId: undefined, assignedAgentIds: [] },
      { id: 'node-2', name: 'Dev', parentId: 'node-1', assignedAgentIds: ['a1'] },
    ],
    rootNodeId: 'node-1',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('organizationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOrganizationStore.setState({
      organization: null,
      nodes: [],
      selectedNodeId: null,
      isLoading: false,
      error: null,
      nodeExecutions: new Map(),
      orchestrationStates: new Map(),
      highlightedNodeIds: new Set(),
    });
  });

  describe('loadOrganization', () => {
    it('loads organization and nodes', async () => {
      const org = makeOrg();
      mockOrganization.get.mockResolvedValue(org);

      await useOrganizationStore.getState().loadOrganization();

      expect(useOrganizationStore.getState().organization).toBeTruthy();
      expect(useOrganizationStore.getState().nodes).toHaveLength(2);
    });

    it('creates default org when none exists', async () => {
      mockOrganization.get.mockResolvedValue(null);
      mockOrganization.update.mockResolvedValue(undefined);

      await useOrganizationStore.getState().loadOrganization();

      expect(mockOrganization.update).toHaveBeenCalled();
      expect(useOrganizationStore.getState().organization).toBeTruthy();
    });

    it('handles error', async () => {
      mockOrganization.get.mockRejectedValue(new Error('DB error'));

      await useOrganizationStore.getState().loadOrganization();

      expect(useOrganizationStore.getState().error).toBeTruthy();
    });
  });

  describe('addNode', () => {
    it('adds node to organization', async () => {
      const org = makeOrg();
      useOrganizationStore.setState({ organization: org as any, nodes: org.hierarchy.nodes as any });
      mockOrganization.update.mockResolvedValue(undefined);

      const newNode = await useOrganizationStore.getState().addNode({
        name: 'New Node',
        parentId: 'node-1',
        assignedAgentIds: [],
      } as any);

      expect(newNode.id).toBeTruthy();
      expect(useOrganizationStore.getState().nodes).toHaveLength(3);
    });

    it('throws when no org loaded', async () => {
      await expect(
        useOrganizationStore.getState().addNode({ name: 'x' } as any)
      ).rejects.toThrow('No organization loaded');
    });
  });

  describe('updateNode', () => {
    it('updates node in state', async () => {
      const org = makeOrg();
      useOrganizationStore.setState({ organization: org as any, nodes: org.hierarchy.nodes as any });
      mockOrganization.update.mockResolvedValue(undefined);

      await useOrganizationStore.getState().updateNode('node-1', { name: 'Updated' });

      expect(useOrganizationStore.getState().nodes.find(n => n.id === 'node-1')?.name).toBe('Updated');
    });
  });

  describe('deleteNode', () => {
    it('deletes node and children', async () => {
      const org = makeOrg();
      useOrganizationStore.setState({ organization: org as any, nodes: org.hierarchy.nodes as any });
      mockOrganization.update.mockResolvedValue(undefined);

      await useOrganizationStore.getState().deleteNode('node-1');

      // Both node-1 and its child node-2 should be deleted
      expect(useOrganizationStore.getState().nodes).toHaveLength(0);
    });
  });

  describe('setSelectedNode', () => {
    it('sets selectedNodeId and highlights', () => {
      const org = makeOrg();
      useOrganizationStore.setState({ nodes: org.hierarchy.nodes as any });

      useOrganizationStore.getState().setSelectedNode('node-2');

      expect(useOrganizationStore.getState().selectedNodeId).toBe('node-2');
      const highlighted = useOrganizationStore.getState().highlightedNodeIds;
      expect(highlighted.has('node-2')).toBe(true);
      expect(highlighted.has('node-1')).toBe(true); // parent
    });

    it('clears highlights when null', () => {
      useOrganizationStore.getState().setSelectedNode(null);
      expect(useOrganizationStore.getState().highlightedNodeIds.size).toBe(0);
    });
  });

  describe('assignAgentToNode / unassignAgentFromNode', () => {
    it('assigns agent', async () => {
      const org = makeOrg();
      useOrganizationStore.setState({ organization: org as any, nodes: org.hierarchy.nodes as any });
      mockOrganization.update.mockResolvedValue(undefined);

      await useOrganizationStore.getState().assignAgentToNode('node-1', 'agent-1');

      const node = useOrganizationStore.getState().nodes.find(n => n.id === 'node-1');
      expect(node?.assignedAgentIds).toContain('agent-1');
    });

    it('does not duplicate agent', async () => {
      const org = makeOrg();
      useOrganizationStore.setState({ organization: org as any, nodes: org.hierarchy.nodes as any });

      await useOrganizationStore.getState().assignAgentToNode('node-2', 'a1');

      // a1 already assigned, should not call update
      expect(mockOrganization.update).not.toHaveBeenCalled();
    });

    it('unassigns agent', async () => {
      const org = makeOrg();
      useOrganizationStore.setState({ organization: org as any, nodes: org.hierarchy.nodes as any });
      mockOrganization.update.mockResolvedValue(undefined);

      await useOrganizationStore.getState().unassignAgentFromNode('node-2', 'a1');

      const node = useOrganizationStore.getState().nodes.find(n => n.id === 'node-2');
      expect(node?.assignedAgentIds).not.toContain('a1');
    });
  });

  describe('executeNode', () => {
    it('executes and returns result', async () => {
      const result = { nodeId: 'node-1', status: 'completed' };
      mockOrchestration.execute.mockResolvedValue(result);

      const res = await useOrganizationStore.getState().executeNode('node-1', 'do something');

      expect(res).toEqual(result);
    });

    it('sets error on failure', async () => {
      mockOrchestration.execute.mockRejectedValue(new Error('fail'));

      await expect(
        useOrganizationStore.getState().executeNode('node-1', 'x')
      ).rejects.toThrow();
      expect(useOrganizationStore.getState().error).toBeTruthy();
    });
  });

  describe('initOrchestrationListener', () => {
    it('registers listeners and returns cleanup', () => {
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();
      mockOrchestration.onStatusChange.mockReturnValue(cleanup1);
      mockOrchestration.onStateChange.mockReturnValue(cleanup2);

      const cleanup = useOrganizationStore.getState().initOrchestrationListener();

      expect(mockOrchestration.onStatusChange).toHaveBeenCalled();
      expect(mockOrchestration.onStateChange).toHaveBeenCalled();

      cleanup();
      expect(cleanup1).toHaveBeenCalled();
      expect(cleanup2).toHaveBeenCalled();
    });
  });

  describe('updateNodeExecution', () => {
    it('updates execution map', () => {
      const execution = { nodeId: 'n1', status: 'running' };
      useOrganizationStore.getState().updateNodeExecution(execution as any);

      expect(useOrganizationStore.getState().nodeExecutions.get('n1')).toEqual(execution);
    });
  });
});
