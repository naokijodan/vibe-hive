// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentNode } from './AgentNode';

const mockAgent = {
  id: 'a1',
  name: 'Test Agent',
  status: 'idle' as const,
  role: 'developer' as const,
  sessionId: 's1',
  capabilities: ['code', 'review', 'test'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AgentNode', () => {
  it('renders agent name and role', () => {
    render(<AgentNode agent={mockAgent} />);
    expect(screen.getByText('Test Agent')).toBeDefined();
    expect(screen.getByText('Developer')).toBeDefined();
  });

  it('shows capabilities with overflow', () => {
    render(<AgentNode agent={mockAgent} />);
    expect(screen.getByText('code')).toBeDefined();
    expect(screen.getByText('review')).toBeDefined();
    expect(screen.getByText('+1')).toBeDefined();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<AgentNode agent={mockAgent} onClick={onClick} />);
    fireEvent.click(screen.getByText('Test Agent'));
    expect(onClick).toHaveBeenCalledWith(mockAgent);
  });
});
