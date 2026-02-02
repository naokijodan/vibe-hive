// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AgentPerformance } from './AgentPerformance';

describe('AgentPerformance', () => {
  it('shows empty message when no agents', () => {
    render(<AgentPerformance agents={[]} tasks={[]} executions={[]} />);
    expect(screen.getByText('No agents registered')).toBeDefined();
  });

  it('renders agent stats', () => {
    const agents = [
      { id: 'a1', name: 'Agent A', status: 'idle', role: 'developer', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
    ] as any[];
    const tasks = [
      { id: 't1', assignedAgentId: 'a1', status: 'done', createdAt: new Date(), updatedAt: new Date() },
      { id: 't2', assignedAgentId: 'a1', status: 'todo', createdAt: new Date(), updatedAt: new Date() },
    ] as any[];
    render(<AgentPerformance agents={agents} tasks={tasks} executions={[]} />);
    expect(screen.getByText('Agent A')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined(); // assigned
    expect(screen.getByText('1')).toBeDefined(); // completed
  });
});
