// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AnalyticsDashboard } from './AnalyticsDashboard';

vi.mock('../../stores/taskStore', () => ({
  useTaskStore: () => ({
    tasks: [
      { id: 't1', status: 'done', createdAt: new Date(), completedAt: new Date() },
      { id: 't2', status: 'in_progress', createdAt: new Date() },
    ],
    loadTasks: vi.fn(),
  }),
}));

vi.mock('../../stores/agentStore', () => ({
  useAgentStore: () => ({
    agents: [{ id: 'a1', status: 'executing', name: 'A1', role: 'developer' }],
    loadAgents: vi.fn(),
  }),
}));

vi.mock('../../stores/executionStore', () => ({
  useExecutionStore: () => ({
    executions: [],
    loadExecutions: vi.fn(),
  }),
}));

vi.mock('./StatCard', () => ({
  StatCard: ({ label, value }: { label: string; value: any }) => <div>{label}: {value}</div>,
}));
vi.mock('./TaskChart', () => ({
  TaskChart: () => <div>TaskChart</div>,
}));
vi.mock('./AgentPerformance', () => ({
  AgentPerformance: () => <div>AgentPerformance</div>,
}));
vi.mock('./TimelineChart', () => ({
  TimelineChart: () => <div>TimelineChart</div>,
}));
vi.mock('./PriorityBreakdown', () => ({
  PriorityBreakdown: () => <div>PriorityBreakdown</div>,
}));

describe('AnalyticsDashboard', () => {
  it('renders header', () => {
    render(<AnalyticsDashboard />);
    expect(screen.getByText('Analytics Dashboard')).toBeDefined();
  });

  it('renders stat cards', () => {
    render(<AnalyticsDashboard />);
    expect(screen.getByText(/Total Tasks: 2/)).toBeDefined();
    expect(screen.getByText(/Completed: 1/)).toBeDefined();
    expect(screen.getByText(/In Progress: 1/)).toBeDefined();
    expect(screen.getByText(/Active Agents: 1/)).toBeDefined();
  });

  it('renders sub-components', () => {
    render(<AnalyticsDashboard />);
    expect(screen.getByText('TaskChart')).toBeDefined();
    expect(screen.getByText('AgentPerformance')).toBeDefined();
    expect(screen.getByText('PriorityBreakdown')).toBeDefined();
  });
});
