import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockWorkflow } = vi.hoisted(() => ({
  mockWorkflow: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
    cancel: vi.fn(),
    getExecution: vi.fn(),
    getExecutions: vi.fn(),
  },
}));

vi.mock('../bridge/ipcBridge', () => ({
  ipcBridge: { workflow: mockWorkflow },
}));

import { useWorkflowStore } from './workflowStore';

const makeMockWorkflow = (overrides = {}) => ({
  id: 1,
  name: 'Test Workflow',
  nodes: [
    { id: 'n1', type: 'task', position: { x: 0, y: 0 }, data: { label: 'Task' } },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2', sourceHandle: null, targetHandle: null },
  ],
  ...overrides,
});

describe('workflowStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkflowStore.setState({
      workflows: [],
      currentWorkflow: null,
      nodes: [],
      edges: [],
      isLoading: false,
      error: null,
      isExecuting: false,
      currentExecution: null,
    });
  });

  describe('loadWorkflows', () => {
    it('loads all workflows', async () => {
      const workflows = [makeMockWorkflow()];
      mockWorkflow.getAll.mockResolvedValue(workflows);

      await useWorkflowStore.getState().loadWorkflows();

      expect(useWorkflowStore.getState().workflows).toEqual(workflows);
      expect(useWorkflowStore.getState().isLoading).toBe(false);
    });

    it('handles error', async () => {
      mockWorkflow.getAll.mockRejectedValue(new Error('fail'));

      await useWorkflowStore.getState().loadWorkflows();

      expect(useWorkflowStore.getState().error).toBe('Failed to load workflows');
    });
  });

  describe('loadWorkflow', () => {
    it('loads workflow and converts nodes/edges', async () => {
      mockWorkflow.getById.mockResolvedValue(makeMockWorkflow());

      await useWorkflowStore.getState().loadWorkflow(1);

      expect(useWorkflowStore.getState().currentWorkflow).toBeTruthy();
      expect(useWorkflowStore.getState().nodes).toHaveLength(1);
      expect(useWorkflowStore.getState().edges).toHaveLength(1);
    });

    it('sets error when not found', async () => {
      mockWorkflow.getById.mockResolvedValue(null);

      await useWorkflowStore.getState().loadWorkflow(999);

      expect(useWorkflowStore.getState().error).toBe('Workflow not found');
    });
  });

  describe('createWorkflow', () => {
    it('creates and adds workflow', async () => {
      const wf = makeMockWorkflow();
      mockWorkflow.create.mockResolvedValue(wf);

      const result = await useWorkflowStore.getState().createWorkflow({ name: 'New' } as any);

      expect(result).toEqual(wf);
      expect(useWorkflowStore.getState().workflows).toHaveLength(1);
    });

    it('returns null on error', async () => {
      mockWorkflow.create.mockRejectedValue(new Error('fail'));

      const result = await useWorkflowStore.getState().createWorkflow({ name: 'x' } as any);

      expect(result).toBeNull();
    });
  });

  describe('updateWorkflow', () => {
    it('updates workflow in state', async () => {
      const wf = makeMockWorkflow();
      useWorkflowStore.setState({ workflows: [wf] as any });
      const updated = makeMockWorkflow({ name: 'Updated' });
      mockWorkflow.update.mockResolvedValue(updated);

      const result = await useWorkflowStore.getState().updateWorkflow({ id: 1, name: 'Updated' } as any);

      expect(result?.name).toBe('Updated');
    });
  });

  describe('deleteWorkflow', () => {
    it('removes workflow from state', async () => {
      useWorkflowStore.setState({ workflows: [makeMockWorkflow()] as any });
      mockWorkflow.delete.mockResolvedValue(undefined);

      await useWorkflowStore.getState().deleteWorkflow(1);

      expect(useWorkflowStore.getState().workflows).toHaveLength(0);
    });

    it('clears currentWorkflow if deleted', async () => {
      const wf = makeMockWorkflow();
      useWorkflowStore.setState({ workflows: [wf] as any, currentWorkflow: wf as any });
      mockWorkflow.delete.mockResolvedValue(undefined);

      await useWorkflowStore.getState().deleteWorkflow(1);

      expect(useWorkflowStore.getState().currentWorkflow).toBeNull();
    });
  });

  describe('node/edge management', () => {
    it('addNode adds a node', () => {
      const node = { id: 'n1', position: { x: 0, y: 0 }, data: {} };
      useWorkflowStore.getState().addNode(node as any);
      expect(useWorkflowStore.getState().nodes).toHaveLength(1);
    });

    it('updateNode updates a node', () => {
      useWorkflowStore.setState({ nodes: [{ id: 'n1', data: { label: 'A' } }] as any });
      useWorkflowStore.getState().updateNode('n1', { data: { label: 'B' } } as any);
      expect(useWorkflowStore.getState().nodes[0].data).toEqual({ label: 'B' });
    });

    it('deleteNode removes node and connected edges', () => {
      useWorkflowStore.setState({
        nodes: [{ id: 'n1' }, { id: 'n2' }] as any,
        edges: [{ id: 'e1', source: 'n1', target: 'n2' }] as any,
      });
      useWorkflowStore.getState().deleteNode('n1');
      expect(useWorkflowStore.getState().nodes).toHaveLength(1);
      expect(useWorkflowStore.getState().edges).toHaveLength(0);
    });

    it('addEdge adds an edge', () => {
      useWorkflowStore.getState().addEdge({ id: 'e1', source: 'n1', target: 'n2' } as any);
      expect(useWorkflowStore.getState().edges).toHaveLength(1);
    });

    it('deleteEdge removes an edge', () => {
      useWorkflowStore.setState({ edges: [{ id: 'e1' }] as any });
      useWorkflowStore.getState().deleteEdge('e1');
      expect(useWorkflowStore.getState().edges).toHaveLength(0);
    });
  });

  describe('setCurrentWorkflow', () => {
    it('sets workflow with converted nodes/edges', () => {
      useWorkflowStore.getState().setCurrentWorkflow(makeMockWorkflow() as any);
      expect(useWorkflowStore.getState().nodes).toHaveLength(1);
    });

    it('clears when null', () => {
      useWorkflowStore.setState({ nodes: [{ id: 'n1' }] as any });
      useWorkflowStore.getState().setCurrentWorkflow(null);
      expect(useWorkflowStore.getState().nodes).toHaveLength(0);
    });
  });

  describe('saveCurrentWorkflow', () => {
    it('sets error when no current workflow', async () => {
      await useWorkflowStore.getState().saveCurrentWorkflow();
      expect(useWorkflowStore.getState().error).toBe('No workflow to save');
    });

    it('saves current workflow', async () => {
      const wf = makeMockWorkflow();
      useWorkflowStore.setState({
        currentWorkflow: wf as any,
        workflows: [wf] as any,
        nodes: [{ id: 'n1', type: 'task', position: { x: 0, y: 0 }, data: {} }] as any,
        edges: [{ id: 'e1', source: 'n1', target: 'n2' }] as any,
      });
      mockWorkflow.update.mockResolvedValue(wf);

      await useWorkflowStore.getState().saveCurrentWorkflow();

      expect(mockWorkflow.update).toHaveBeenCalled();
    });
  });

  describe('saveCurrentWorkflow - error', () => {
    it('sets error on save failure', async () => {
      const wf = makeMockWorkflow();
      useWorkflowStore.setState({
        currentWorkflow: wf as any,
        workflows: [wf] as any,
        nodes: [{ id: 'n1', type: 'task', position: { x: 0, y: 0 }, data: {} }] as any,
        edges: [],
      });
      mockWorkflow.update.mockRejectedValue(new Error('save fail'));

      await useWorkflowStore.getState().saveCurrentWorkflow();

      expect(useWorkflowStore.getState().error).toBe('Failed to update workflow');
    });
  });

  describe('executeWorkflow', () => {
    it('executes workflow', async () => {
      const result = { id: 1, status: 'completed' };
      mockWorkflow.execute.mockResolvedValue(result);

      const res = await useWorkflowStore.getState().executeWorkflow(1);

      expect(res).toEqual(result);
      expect(useWorkflowStore.getState().isExecuting).toBe(false);
    });

    it('returns null on error', async () => {
      mockWorkflow.execute.mockRejectedValue(new Error('fail'));

      const res = await useWorkflowStore.getState().executeWorkflow(1);

      expect(res).toBeNull();
    });
  });

  describe('cancelExecution', () => {
    it('cancels execution', async () => {
      useWorkflowStore.setState({ isExecuting: true });
      mockWorkflow.cancel.mockResolvedValue(undefined);

      await useWorkflowStore.getState().cancelExecution(1);

      expect(useWorkflowStore.getState().isExecuting).toBe(false);
    });
  });

  describe('cancelExecution - error', () => {
    it('sets error on cancel failure', async () => {
      mockWorkflow.cancel.mockRejectedValue(new Error('cancel fail'));

      await useWorkflowStore.getState().cancelExecution(1);

      expect(useWorkflowStore.getState().error).toBe('Failed to cancel execution');
    });
  });

  describe('loadExecution', () => {
    it('loads execution by id', async () => {
      const exec = { id: 1, status: 'completed' };
      mockWorkflow.getExecution.mockResolvedValue(exec);

      await useWorkflowStore.getState().loadExecution(1);

      expect(useWorkflowStore.getState().currentExecution).toEqual(exec);
    });

    it('sets error on failure', async () => {
      mockWorkflow.getExecution.mockRejectedValue(new Error('fail'));

      await useWorkflowStore.getState().loadExecution(1);

      expect(useWorkflowStore.getState().error).toBe('Failed to load execution');
    });
  });

  describe('loadExecutions', () => {
    it('returns executions', async () => {
      mockWorkflow.getExecutions.mockResolvedValue([{ id: 1 }]);

      const result = await useWorkflowStore.getState().loadExecutions(1);

      expect(result).toHaveLength(1);
    });

    it('returns empty array on error', async () => {
      mockWorkflow.getExecutions.mockRejectedValue(new Error('fail'));

      const result = await useWorkflowStore.getState().loadExecutions(1);

      expect(result).toEqual([]);
    });
  });
});
