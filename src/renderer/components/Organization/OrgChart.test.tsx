// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrgChart } from './OrgChart';

const mockLoadOrganization = vi.fn();
const mockAddNode = vi.fn();
const mockUpdateNode = vi.fn();
const mockDeleteNode = vi.fn();
const mockSetSelectedNode = vi.fn();
const mockAssignAgentToNode = vi.fn();
const mockUnassignAgentFromNode = vi.fn();
const mockExecuteNode = vi.fn();
const mockStopNode = vi.fn();
const mockOrchestrateNode = vi.fn();
const mockApproveOrchestration = vi.fn();
const mockRejectOrchestration = vi.fn();
const mockInitListener = vi.fn(() => vi.fn());

vi.mock('reactflow', () => {
  const ReactFlow = ({ children, onConnect }: any) => (
    <div data-testid="reactflow">
      <button onClick={() => onConnect?.({ source: 'n1', target: 'n2' })}>Connect</button>
      {children}
    </div>
  );
  return {
    __esModule: true,
    default: ReactFlow,
    Controls: () => <div data-testid="controls" />,
    Background: () => <div data-testid="background" />,
    BackgroundVariant: { Dots: 'dots' },
    useNodesState: vi.fn(() => [
      [{ id: 'n1', data: { name: 'Node 1' } }],
      vi.fn(),
      vi.fn(),
    ]),
    useEdgesState: vi.fn(() => [[], vi.fn(), vi.fn()]),
    addEdge: vi.fn(),
  };
});

vi.mock('reactflow/dist/style.css', () => ({}));

vi.mock('../../stores/organizationStore', () => ({
  useOrganizationStore: () => ({
    nodes: [
      { id: 'n1', name: 'Dev Team', type: 'team', parentId: null },
      { id: 'n2', name: 'Manager', type: 'role', parentId: 'n1' },
    ],
    selectedNodeId: null,
    nodeExecutions: new Map(),
    orchestrationStates: new Map(),
    isLoading: false,
    error: null,
    loadOrganization: mockLoadOrganization,
    addNode: mockAddNode,
    updateNode: mockUpdateNode,
    deleteNode: mockDeleteNode,
    setSelectedNode: mockSetSelectedNode,
    assignAgentToNode: mockAssignAgentToNode,
    unassignAgentFromNode: mockUnassignAgentFromNode,
    executeNode: mockExecuteNode,
    stopNode: mockStopNode,
    initOrchestrationListener: mockInitListener,
    orchestrateNode: mockOrchestrateNode,
    approveOrchestration: mockApproveOrchestration,
    rejectOrchestration: mockRejectOrchestration,
  }),
}));

vi.mock('../../stores/agentStore', () => ({
  useAgentStore: () => ({
    agents: [
      { id: 'a1', name: 'Claude', status: 'idle' },
      { id: 'a2', name: 'Agent-2', status: 'executing' },
    ],
  }),
}));

vi.mock('./OrgNodeCard', () => ({
  OrgNodeCard: () => <div data-testid="org-node-card">OrgNodeCard</div>,
}));

vi.mock('./AddNodeModal', () => ({
  AddNodeModal: ({ isOpen, onClose, onAdd }: any) =>
    isOpen ? (
      <div data-testid="add-node-modal">
        <button onClick={() => onAdd({ name: 'New Node', type: 'team' })}>Add</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

vi.mock('./ResultsReviewPanel', () => ({
  ResultsReviewPanel: ({ onClose }: any) => (
    <div data-testid="results-review-panel">
      <button onClick={onClose}>Close Review</button>
    </div>
  ),
}));

describe('OrgChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<OrgChart />);
    expect(container.innerHTML).not.toBe('');
  });

  it('loads organization on mount', () => {
    render(<OrgChart />);
    expect(mockLoadOrganization).toHaveBeenCalled();
  });

  it('initializes orchestration listener', () => {
    render(<OrgChart />);
    expect(mockInitListener).toHaveBeenCalled();
  });

  it('renders toolbar buttons', () => {
    render(<OrgChart />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders ReactFlow container', () => {
    render(<OrgChart />);
    expect(screen.getByTestId('reactflow')).toBeDefined();
  });

  it('renders add node button', () => {
    render(<OrgChart />);
    expect(screen.getByText(/ノード追加|Add Node/i)).toBeDefined();
  });

  it('opens add node modal on button click', () => {
    render(<OrgChart />);
    fireEvent.click(screen.getByText(/ノード追加|Add Node/i));
    expect(screen.getByTestId('add-node-modal')).toBeDefined();
  });

  it('handles add node submission', async () => {
    render(<OrgChart />);
    fireEvent.click(screen.getByText(/ノード追加|Add Node/i));
    fireEvent.click(screen.getByText('Add'));
    await waitFor(() => {
      expect(mockAddNode).toHaveBeenCalledWith({ name: 'New Node', type: 'team' });
    });
  });

  it('closes add node modal on close', () => {
    render(<OrgChart />);
    fireEvent.click(screen.getByText(/ノード追加|Add Node/i));
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('add-node-modal')).toBeNull();
  });

  it('handles node connection', async () => {
    render(<OrgChart />);
    fireEvent.click(screen.getByText('Connect'));
    await waitFor(() => {
      expect(mockUpdateNode).toHaveBeenCalledWith('n2', { parentId: 'n1' });
    });
  });

  it('renders add node text', () => {
    render(<OrgChart />);
    expect(screen.getByText(/ノード追加/)).toBeDefined();
  });

  it('handles agent click callback prop', () => {
    const onAgentClick = vi.fn();
    render(<OrgChart onAgentClick={onAgentClick} />);
    expect(screen.getByTestId('reactflow')).toBeDefined();
  });

  it('renders controls component', () => {
    render(<OrgChart />);
    expect(screen.getByTestId('controls')).toBeDefined();
  });

  it('renders background component', () => {
    render(<OrgChart />);
    expect(screen.getByTestId('background')).toBeDefined();
  });
});
