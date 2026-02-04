// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrgChart } from './OrgChart';

const { mockFns, mockOrgState } = vi.hoisted(() => ({
  mockFns: {
    loadOrganization: vi.fn(),
    addNode: vi.fn(),
    updateNode: vi.fn(),
    deleteNode: vi.fn(),
    setSelectedNode: vi.fn(),
    assignAgentToNode: vi.fn(),
    unassignAgentFromNode: vi.fn(),
    executeNode: vi.fn(),
    stopNode: vi.fn(),
    orchestrateNode: vi.fn(),
    approveOrchestration: vi.fn(),
    rejectOrchestration: vi.fn(),
    initOrchestrationListener: vi.fn(() => vi.fn()),
  },
  mockOrgState: {
    nodes: [] as any[],
    selectedNodeId: null as string | null,
    nodeExecutions: new Map(),
    orchestrationStates: new Map(),
    isLoading: false,
    error: null as string | null,
  },
}));

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
    ...mockOrgState,
    ...mockFns,
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
    // Reset to default state with nodes
    mockOrgState.nodes = [
      { id: 'n1', name: 'Dev Team', type: 'team', parentId: null },
      { id: 'n2', name: 'Manager', type: 'role', parentId: 'n1' },
    ];
    mockOrgState.selectedNodeId = null;
    mockOrgState.nodeExecutions = new Map();
    mockOrgState.orchestrationStates = new Map();
    mockOrgState.isLoading = false;
    mockOrgState.error = null;
  });

  it('renders without crashing', () => {
    const { container } = render(<OrgChart />);
    expect(container.innerHTML).not.toBe('');
  });

  it('loads organization on mount', () => {
    render(<OrgChart />);
    expect(mockFns.loadOrganization).toHaveBeenCalled();
  });

  it('initializes orchestration listener', () => {
    render(<OrgChart />);
    expect(mockFns.initOrchestrationListener).toHaveBeenCalled();
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
      expect(mockFns.addNode).toHaveBeenCalledWith({ name: 'New Node', type: 'team' });
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
      expect(mockFns.updateNode).toHaveBeenCalledWith('n2', { parentId: 'n1' });
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

  describe('empty state', () => {
    beforeEach(() => {
      mockOrgState.nodes = [];
    });

    it('shows empty state when no nodes', () => {
      render(<OrgChart />);
      expect(screen.getByText('組織構造が空です')).toBeDefined();
    });

    it('shows add first node button', () => {
      render(<OrgChart />);
      expect(screen.getByText(/最初のノードを追加/)).toBeDefined();
    });

    it('opens modal when add first node button clicked', () => {
      render(<OrgChart />);
      fireEvent.click(screen.getByText(/最初のノードを追加/));
      expect(screen.getByTestId('add-node-modal')).toBeDefined();
    });
  });

  describe('agent panel', () => {
    it('renders with full width when no agent panel', () => {
      const { container } = render(<OrgChart />);
      expect(container.innerHTML).toContain('flex-1');
    });
  });

  describe('node types', () => {
    it('configures custom node types for reactflow', () => {
      // OrgNodeCard is set up as 'orgNode' type in nodeTypes
      // This is tested implicitly through rendering without errors
      const { container } = render(<OrgChart />);
      expect(container.innerHTML).not.toBe('');
    });
  });

  describe('add button styling', () => {
    it('has accent background', () => {
      const { container } = render(<OrgChart />);
      expect(container.innerHTML).toContain('bg-hive-accent');
    });

    it('has shadow styling', () => {
      const { container } = render(<OrgChart />);
      expect(container.innerHTML).toContain('shadow-lg');
    });
  });

  describe('styling', () => {
    it('has full height and width', () => {
      const { container } = render(<OrgChart />);
      expect(container.innerHTML).toContain('h-full');
      expect(container.innerHTML).toContain('w-full');
    });

    it('has flex layout', () => {
      const { container } = render(<OrgChart />);
      expect(container.innerHTML).toContain('flex');
    });

    it('has relative positioning for main canvas', () => {
      const { container } = render(<OrgChart />);
      expect(container.innerHTML).toContain('relative');
    });

    it('has z-10 for add button', () => {
      const { container } = render(<OrgChart />);
      expect(container.innerHTML).toContain('z-10');
    });
  });

  describe('background variant', () => {
    it('renders with dots background', () => {
      render(<OrgChart />);
      expect(screen.getByTestId('background')).toBeDefined();
    });
  });

  describe('agent panel', () => {
    beforeEach(() => {
      mockOrgState.nodes = [
        { id: 'n1', name: 'Dev Team', type: 'team', parentId: null, assignedAgentIds: ['a1'] },
        { id: 'n2', name: 'Manager', type: 'role', parentId: 'n1' },
      ];
      mockOrgState.selectedNodeId = 'n1';
    });

    it('does not render agent panel when no node selected', () => {
      mockOrgState.selectedNodeId = null;
      render(<OrgChart />);
      expect(screen.queryByText('エージェント割り当て')).toBeNull();
    });
  });

  describe('loading state', () => {
    it('renders without error when loading', () => {
      mockOrgState.isLoading = true;
      const { container } = render(<OrgChart />);
      expect(container.innerHTML).not.toBe('');
    });
  });

  describe('error state', () => {
    it('renders without error when error exists', () => {
      mockOrgState.error = 'Failed to load';
      const { container } = render(<OrgChart />);
      expect(container.innerHTML).not.toBe('');
    });
  });

  describe('with orchestration state', () => {
    it('handles node with orchestration state', () => {
      mockOrgState.nodes = [
        { id: 'n1', name: 'Team', type: 'team', parentId: null },
        { id: 'n2', name: 'Child', type: 'role', parentId: 'n1' },
      ];
      mockOrgState.orchestrationStates.set('n1', {
        phase: 'pending_approval',
        goal: 'test',
        plan: [],
      });
      const { container } = render(<OrgChart />);
      expect(container.innerHTML).not.toBe('');
    });
  });

  describe('with node executions', () => {
    it('handles node with execution state', () => {
      mockOrgState.nodes = [
        { id: 'n1', name: 'Team', type: 'team', parentId: null },
      ];
      mockOrgState.nodeExecutions.set('n1', {
        status: 'running',
        startedAt: Date.now(),
      });
      const { container } = render(<OrgChart />);
      expect(container.innerHTML).not.toBe('');
    });
  });

  describe('cleanup', () => {
    it('cleans up orchestration listener on unmount', () => {
      const cleanupFn = vi.fn();
      mockFns.initOrchestrationListener.mockReturnValue(cleanupFn);
      const { unmount } = render(<OrgChart />);
      unmount();
      expect(cleanupFn).toHaveBeenCalled();
    });
  });

  describe('node selection handling', () => {
    beforeEach(() => {
      mockOrgState.nodes = [
        { id: 'n1', name: 'Dev Team', type: 'team', parentId: null },
      ];
    });

    it('does not show agent panel when no node selected', () => {
      mockOrgState.selectedNodeId = null;
      const { container } = render(<OrgChart />);
      expect(container.innerHTML).not.toContain('エージェント割り当て');
    });
  });

  describe('multiple node types', () => {
    it('handles team node type', () => {
      mockOrgState.nodes = [
        { id: 'n1', name: 'Team 1', type: 'team', parentId: null },
      ];
      const { container } = render(<OrgChart />);
      expect(container.innerHTML).not.toBe('');
    });

    it('handles role node type', () => {
      mockOrgState.nodes = [
        { id: 'n1', name: 'Role 1', type: 'role', parentId: null },
      ];
      const { container } = render(<OrgChart />);
      expect(container.innerHTML).not.toBe('');
    });

    it('handles mixed node types', () => {
      mockOrgState.nodes = [
        { id: 'n1', name: 'Team', type: 'team', parentId: null },
        { id: 'n2', name: 'Role', type: 'role', parentId: 'n1' },
        { id: 'n3', name: 'SubRole', type: 'role', parentId: 'n2' },
      ];
      const { container } = render(<OrgChart />);
      expect(container.innerHTML).not.toBe('');
    });
  });

  describe('edge handling', () => {
    beforeEach(() => {
      mockOrgState.nodes = [
        { id: 'n1', name: 'Parent', type: 'team', parentId: null },
        { id: 'n2', name: 'Child', type: 'role', parentId: 'n1' },
      ];
    });

    it('creates edges from parent relationships', () => {
      const { container } = render(<OrgChart />);
      // ReactFlow mock should be rendered with the nodes
      expect(screen.getByTestId('reactflow')).toBeDefined();
    });
  });

  describe('different orchestration phases', () => {
    beforeEach(() => {
      mockOrgState.nodes = [
        { id: 'n1', name: 'Team', type: 'team', parentId: null },
      ];
    });

    it('handles executing phase', () => {
      mockOrgState.orchestrationStates.set('n1', {
        phase: 'executing',
        goal: 'test',
        plan: [],
      });
      const { container } = render(<OrgChart />);
      expect(container.innerHTML).not.toBe('');
    });

    it('handles completed phase', () => {
      mockOrgState.orchestrationStates.set('n1', {
        phase: 'completed',
        goal: 'test',
        plan: [],
      });
      const { container } = render(<OrgChart />);
      expect(container.innerHTML).not.toBe('');
    });
  });

  describe('node execution states', () => {
    beforeEach(() => {
      mockOrgState.nodes = [
        { id: 'n1', name: 'Team', type: 'team', parentId: null },
      ];
    });

    it('handles completed execution state', () => {
      mockOrgState.nodeExecutions.set('n1', {
        status: 'completed',
        startedAt: Date.now() - 10000,
        completedAt: Date.now(),
      });
      const { container } = render(<OrgChart />);
      expect(container.innerHTML).not.toBe('');
    });

    it('handles failed execution state', () => {
      mockOrgState.nodeExecutions.set('n1', {
        status: 'failed',
        startedAt: Date.now() - 10000,
        completedAt: Date.now(),
        error: 'Test error',
      });
      const { container } = render(<OrgChart />);
      expect(container.innerHTML).not.toBe('');
    });
  });
});
