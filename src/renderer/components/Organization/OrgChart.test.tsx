// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { OrgChart } from './OrgChart';

vi.mock('reactflow', () => {
  const ReactFlow = ({ children }: any) => <div data-testid="reactflow">{children}</div>;
  return {
    __esModule: true,
    default: ReactFlow,
    Controls: () => null,
    Background: () => null,
    BackgroundVariant: { Dots: 'dots' },
    useNodesState: vi.fn(() => [[], vi.fn(), vi.fn()]),
    useEdgesState: vi.fn(() => [[], vi.fn(), vi.fn()]),
    addEdge: vi.fn(),
  };
});

vi.mock('reactflow/dist/style.css', () => ({}));

vi.mock('../../stores/organizationStore', () => ({
  useOrganizationStore: () => ({
    nodes: [],
    edges: [],
    isLoading: false,
    error: null,
    loadOrganization: vi.fn(),
    addNode: vi.fn(),
    updateNode: vi.fn(),
    deleteNode: vi.fn(),
    orchestrate: vi.fn(),
    initOrchestrationListener: vi.fn(() => vi.fn()),
    nodeExecutions: new Map(),
  }),
}));

vi.mock('../../stores/agentStore', () => ({
  useAgentStore: () => ({ agents: [] }),
}));

vi.mock('./OrgNodeCard', () => ({
  OrgNodeCard: () => <div>OrgNodeCard</div>,
}));

vi.mock('./AddNodeModal', () => ({
  AddNodeModal: () => null,
}));

vi.mock('./ResultsReviewPanel', () => ({
  ResultsReviewPanel: () => null,
}));

describe('OrgChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<OrgChart />);
    expect(container.innerHTML).not.toBe('');
  });

  it('renders toolbar buttons', () => {
    render(<OrgChart />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
