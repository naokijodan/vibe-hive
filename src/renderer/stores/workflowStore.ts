import { create } from 'zustand';
import type {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  CreateWorkflowParams,
  UpdateWorkflowParams,
  ExecuteWorkflowParams,
  WorkflowExecution,
  WorkflowExecutionResult,
} from '../../shared/types/workflow';
import { ipcBridge } from '../bridge/ipcBridge';
import type { Node, Edge } from '@xyflow/react';

interface WorkflowState {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  nodes: Node[];
  edges: Edge[];
  isLoading: boolean;
  error: string | null;
  isExecuting: boolean;
  currentExecution: WorkflowExecution | null;

  // Workflow CRUD
  loadWorkflows: () => Promise<void>;
  loadWorkflow: (id: number) => Promise<void>;
  createWorkflow: (params: CreateWorkflowParams) => Promise<Workflow | null>;
  updateWorkflow: (params: UpdateWorkflowParams) => Promise<Workflow | null>;
  deleteWorkflow: (id: number) => Promise<void>;

  // Current workflow state
  setCurrentWorkflow: (workflow: Workflow | null) => void;

  // React Flow nodes/edges management
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: Edge) => void;
  deleteEdge: (id: string) => void;

  // Save current workflow (nodes + edges -> workflow)
  saveCurrentWorkflow: () => Promise<void>;

  // Workflow execution
  executeWorkflow: (workflowId: number, triggerData?: Record<string, any>) => Promise<WorkflowExecutionResult | null>;
  cancelExecution: (executionId: number) => Promise<void>;
  loadExecution: (executionId: number) => Promise<void>;
  loadExecutions: (workflowId: number) => Promise<WorkflowExecution[]>;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  nodes: [],
  edges: [],
  isLoading: false,
  error: null,
  isExecuting: false,
  currentExecution: null,

  loadWorkflows: async () => {
    set({ isLoading: true, error: null });
    try {
      const workflows = await ipcBridge.workflow.getAll();
      set({ workflows, isLoading: false });
    } catch (error) {
      console.error('Failed to load workflows:', error);
      set({ error: 'Failed to load workflows', isLoading: false });
    }
  },

  loadWorkflow: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const workflow = await ipcBridge.workflow.getById(id);
      if (workflow) {
        // Convert WorkflowNode[] to React Flow Node[]
        const nodes: Node[] = workflow.nodes.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
        }));

        // Convert WorkflowEdge[] to React Flow Edge[]
        const edges: Edge[] = workflow.edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        }));

        set({ currentWorkflow: workflow, nodes, edges, isLoading: false });
      } else {
        set({ error: 'Workflow not found', isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load workflow:', error);
      set({ error: 'Failed to load workflow', isLoading: false });
    }
  },

  createWorkflow: async (params: CreateWorkflowParams) => {
    set({ error: null });
    try {
      const workflow = await ipcBridge.workflow.create(params);
      set(state => ({ workflows: [...state.workflows, workflow] }));
      return workflow;
    } catch (error) {
      console.error('Failed to create workflow:', error);
      set({ error: 'Failed to create workflow' });
      return null;
    }
  },

  updateWorkflow: async (params: UpdateWorkflowParams) => {
    set({ error: null });
    try {
      const workflow = await ipcBridge.workflow.update(params);
      set(state => ({
        workflows: state.workflows.map(w => w.id === workflow.id ? workflow : w),
        currentWorkflow: state.currentWorkflow?.id === workflow.id ? workflow : state.currentWorkflow,
      }));
      return workflow;
    } catch (error) {
      console.error('Failed to update workflow:', error);
      set({ error: 'Failed to update workflow' });
      return null;
    }
  },

  deleteWorkflow: async (id: number) => {
    set({ error: null });
    try {
      await ipcBridge.workflow.delete(id);
      set(state => ({
        workflows: state.workflows.filter(w => w.id !== id),
        currentWorkflow: state.currentWorkflow?.id === id ? null : state.currentWorkflow,
      }));
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      set({ error: 'Failed to delete workflow' });
    }
  },

  setCurrentWorkflow: (workflow: Workflow | null) => {
    if (workflow) {
      const nodes: Node[] = workflow.nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
      }));

      const edges: Edge[] = workflow.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      }));

      set({ currentWorkflow: workflow, nodes, edges });
    } else {
      set({ currentWorkflow: null, nodes: [], edges: [] });
    }
  },

  setNodes: (nodes: Node[]) => {
    set({ nodes });
  },

  setEdges: (edges: Edge[]) => {
    set({ edges });
  },

  addNode: (node: Node) => {
    set(state => ({ nodes: [...state.nodes, node] }));
  },

  updateNode: (id: string, updates: Partial<Node>) => {
    set(state => ({
      nodes: state.nodes.map(node => node.id === id ? { ...node, ...updates } : node),
    }));
  },

  deleteNode: (id: string) => {
    set(state => ({
      nodes: state.nodes.filter(node => node.id !== id),
      edges: state.edges.filter(edge => edge.source !== id && edge.target !== id),
    }));
  },

  addEdge: (edge: Edge) => {
    set(state => ({ edges: [...state.edges, edge] }));
  },

  deleteEdge: (id: string) => {
    set(state => ({ edges: state.edges.filter(edge => edge.id !== id) }));
  },

  saveCurrentWorkflow: async () => {
    const { currentWorkflow, nodes, edges } = get();
    if (!currentWorkflow) {
      set({ error: 'No workflow to save' });
      return;
    }

    set({ error: null });
    try {
      // Convert React Flow nodes/edges to Workflow nodes/edges
      const workflowNodes: WorkflowNode[] = nodes.map(node => ({
        id: node.id,
        type: node.type as any,
        position: node.position,
        data: node.data as any,
      }));

      const workflowEdges: WorkflowEdge[] = edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle ?? undefined,
        targetHandle: edge.targetHandle ?? undefined,
      }));

      await get().updateWorkflow({
        id: currentWorkflow.id,
        nodes: workflowNodes,
        edges: workflowEdges,
      });
    } catch (error) {
      console.error('Failed to save workflow:', error);
      set({ error: 'Failed to save workflow' });
    }
  },

  executeWorkflow: async (workflowId: number, triggerData?: Record<string, any>) => {
    set({ isExecuting: true, error: null });
    try {
      const result = await ipcBridge.workflow.execute({ workflowId, triggerData });
      set({ isExecuting: false });
      return result;
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      set({ error: 'Failed to execute workflow', isExecuting: false });
      return null;
    }
  },

  cancelExecution: async (executionId: number) => {
    try {
      await ipcBridge.workflow.cancel(executionId);
      set({ isExecuting: false });
    } catch (error) {
      console.error('Failed to cancel execution:', error);
      set({ error: 'Failed to cancel execution' });
    }
  },

  loadExecution: async (executionId: number) => {
    try {
      const execution = await ipcBridge.workflow.getExecution(executionId);
      set({ currentExecution: execution });
    } catch (error) {
      console.error('Failed to load execution:', error);
      set({ error: 'Failed to load execution' });
    }
  },

  loadExecutions: async (workflowId: number) => {
    try {
      const executions = await ipcBridge.workflow.getExecutions(workflowId);
      return executions;
    } catch (error) {
      console.error('Failed to load executions:', error);
      set({ error: 'Failed to load executions' });
      return [];
    }
  },
}));
