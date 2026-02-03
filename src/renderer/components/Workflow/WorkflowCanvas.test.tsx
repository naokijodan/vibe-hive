// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { WorkflowCanvas } from './WorkflowCanvas';

vi.mock('@xyflow/react', () => {
  const ReactFlow = ({ children }: any) => (
    <div data-testid="xyflow">{children}</div>
  );
  return {
    ReactFlow,
    Background: () => <div data-testid="background" />,
    Controls: () => <div data-testid="controls" />,
    MiniMap: () => <div data-testid="minimap" />,
    Panel: ({ children }: any) => <div data-testid="panel">{children}</div>,
    addEdge: vi.fn((edge, edges) => [...edges, edge]),
    useNodesState: vi.fn(() => [[], vi.fn(), vi.fn()]),
    useEdgesState: vi.fn(() => [[], vi.fn(), vi.fn()]),
  };
});

vi.mock('@xyflow/react/dist/style.css', () => ({}));

vi.mock('./nodes', () => ({
  TaskNode: () => <div>TaskNode</div>,
  TriggerNode: () => <div>TriggerNode</div>,
  ConditionalNode: () => <div>ConditionalNode</div>,
  NotificationNode: () => <div>NotificationNode</div>,
  MergeNode: () => <div>MergeNode</div>,
  DelayNode: () => <div>DelayNode</div>,
  LoopNode: () => <div>LoopNode</div>,
  SubworkflowNode: () => <div>SubworkflowNode</div>,
  AgentNode: () => <div>AgentNode</div>,
}));

vi.mock('./NodePalette', () => ({
  NodePalette: () => <div data-testid="node-palette">NodePalette</div>,
}));

vi.mock('./settings/NodeSettingsPanel', () => ({
  NodeSettingsPanel: () => <div data-testid="node-settings" />,
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
    render(<WorkflowCanvas />);
    expect(screen.getByText('No Workflow Selected')).toBeDefined();
  });

  it('shows workflow selection instruction', () => {
    render(<WorkflowCanvas />);
    expect(screen.getByText(/Select a workflow/i)).toBeDefined();
  });

  it('renders empty state container', () => {
    const { container } = render(<WorkflowCanvas />);
    expect(container.querySelector('svg')).toBeDefined();
  });

  it('renders flex container', () => {
    const { container } = render(<WorkflowCanvas />);
    expect(container.innerHTML).toContain('flex');
  });
});
