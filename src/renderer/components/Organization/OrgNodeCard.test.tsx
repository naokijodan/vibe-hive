// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { OrgNodeCard } from './OrgNodeCard';

vi.mock('reactflow', () => ({
  Handle: () => null,
  Position: { Top: 'top', Bottom: 'bottom' },
}));

vi.mock('../../stores/agentStore', () => ({
  useAgentStore: () => ({ agents: [] }),
}));

vi.mock('../../stores/organizationStore', () => ({
  useOrganizationStore: (selector: any) => selector ? selector({ nodeExecutions: new Map() }) : ({ nodeExecutions: new Map() }),
}));

const mockData = {
  node: {
    id: 'n1',
    name: 'Test Node',
    type: 'task' as const,
    agentType: 'claude-code' as const,
    assignedAgentIds: [],
    prompt: '',
  },
  onSelect: vi.fn(),
  onDelete: vi.fn(),
  isSelected: false,
};

describe('OrgNodeCard', () => {
  it('renders node name', () => {
    render(<OrgNodeCard data={mockData} />);
    expect(screen.getByText('Test Node')).toBeDefined();
  });
});
