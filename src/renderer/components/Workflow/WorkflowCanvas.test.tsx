// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { WorkflowCanvas } from './WorkflowCanvas';

vi.mock('@xyflow/react', () => {
  const ReactFlow = ({ children }: any) => <div data-testid="xyflow">{children}</div>;
  return {
    ReactFlow,
    Background: () => null,
    Controls: () => null,
    MiniMap: () => null,
    Panel: ({ children }: any) => <div>{children}</div>,
    addEdge: vi.fn(),
    useNodesState: vi.fn(() => [[], vi.fn(), vi.fn()]),
    useEdgesState: vi.fn(() => [[], vi.fn(), vi.fn()]),
  };
});

vi.mock('@xyflow/react/dist/style.css', () => ({}));

vi.mock('./nodes', () => ({
  TaskNode: () => null,
  TriggerNode: () => null,
  ConditionalNode: () => null,
  NotificationNode: () => null,
  MergeNode: () => null,
  DelayNode: () => null,
  LoopNode: () => null,
  SubworkflowNode: () => null,
  AgentNode: () => null,
}));

vi.mock('./NodePalette', () => ({
  NodePalette: () => <div>NodePalette</div>,
}));

vi.mock('./settings/NodeSettingsPanel', () => ({
  NodeSettingsPanel: () => null,
}));

vi.mock('./WorkflowSettingsModal', () => ({
  WorkflowSettingsModal: () => null,
}));

vi.mock('./ImportValidationDialog', () => ({
  ImportValidationDialog: () => null,
}));

vi.mock('./ExportTemplateDialog', () => ({
  ExportTemplateDialog: () => null,
}));

vi.mock('../../stores/workflowStore', () => ({
  useWorkflowStore: () => ({
    currentWorkflow: null,
    nodes: [],
    edges: [],
    setNodes: vi.fn(),
    setEdges: vi.fn(),
    addNode: vi.fn(),
    saveCurrentWorkflow: vi.fn(),
    executeWorkflow: vi.fn(),
    isExecuting: false,
  }),
}));

vi.mock('../../bridge/ipcBridge', () => ({
  ipcBridge: {
    workflow: {
      importWorkflow: vi.fn(),
      exportWorkflow: vi.fn(),
    },
  },
}));

vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

describe('WorkflowCanvas', () => {
  it('renders without crashing', () => {
    const { container } = render(<WorkflowCanvas />);
    expect(container.innerHTML).not.toBe('');
  });

  it('shows empty state text when no workflow', () => {
    const { getByText } = render(<WorkflowCanvas />);
    expect(getByText('No Workflow Selected')).toBeDefined();
  });
});
