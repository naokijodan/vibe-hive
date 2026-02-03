// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AgentNode } from './AgentNode';

vi.mock('@xyflow/react', () => ({
  Handle: ({ type, position, id, className }: any) => (
    <div data-testid={`handle-${type}-${id || 'default'}`} className={className} />
  ),
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
}));

const mockNodeProps = {
  id: 'node-1',
  data: {
    label: 'Code Assistant',
    agentConfig: {
      agentType: 'claude-code',
      prompt: 'Refactor this function to improve performance',
      timeout: 600000,
    },
  },
  selected: false,
  type: 'agent',
  zIndex: 1,
  isConnectable: true,
  xPos: 0,
  yPos: 0,
  dragging: false,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
};

describe('AgentNode', () => {
  it('renders agent label', () => {
    render(<AgentNode {...mockNodeProps as any} />);
    expect(screen.getByText('Code Assistant')).toBeDefined();
  });

  it('renders node type header', () => {
    render(<AgentNode {...mockNodeProps as any} />);
    expect(screen.getByText('AI Agent')).toBeDefined();
  });

  it('renders claude-code icon', () => {
    render(<AgentNode {...mockNodeProps as any} />);
    expect(screen.getByText('🤖')).toBeDefined();
  });

  it('renders codex icon', () => {
    const props = {
      ...mockNodeProps,
      data: { label: 'Agent', agentConfig: { agentType: 'codex' } },
    };
    render(<AgentNode {...props as any} />);
    expect(screen.getByText('🔮')).toBeDefined();
  });

  it('renders custom icon', () => {
    const props = {
      ...mockNodeProps,
      data: { label: 'Agent', agentConfig: { agentType: 'custom' } },
    };
    render(<AgentNode {...props as any} />);
    expect(screen.getByText('⚙️')).toBeDefined();
  });

  it('shows Claude Code type label', () => {
    render(<AgentNode {...mockNodeProps as any} />);
    expect(screen.getByText('Claude Code')).toBeDefined();
  });

  it('shows Codex type label', () => {
    const props = {
      ...mockNodeProps,
      data: { label: 'Agent', agentConfig: { agentType: 'codex' } },
    };
    render(<AgentNode {...props as any} />);
    expect(screen.getByText('Codex')).toBeDefined();
  });

  it('shows Custom type label', () => {
    const props = {
      ...mockNodeProps,
      data: { label: 'Agent', agentConfig: { agentType: 'custom' } },
    };
    render(<AgentNode {...props as any} />);
    expect(screen.getByText('Custom')).toBeDefined();
  });

  it('shows prompt preview when provided', () => {
    render(<AgentNode {...mockNodeProps as any} />);
    expect(screen.getByText(/"Refactor this function to impr.*\.\.\./)).toBeDefined();
  });

  it('shows timeout in seconds', () => {
    render(<AgentNode {...mockNodeProps as any} />);
    expect(screen.getByText('Timeout: 600s')).toBeDefined();
  });

  it('uses default timeout of 300 seconds', () => {
    const props = {
      ...mockNodeProps,
      data: { label: 'Agent', agentConfig: { agentType: 'claude-code' } },
    };
    render(<AgentNode {...props as any} />);
    expect(screen.getByText('Timeout: 300s')).toBeDefined();
  });

  it('renders target and source handles', () => {
    render(<AgentNode {...mockNodeProps as any} />);
    expect(screen.getByTestId('handle-target-default')).toBeDefined();
    expect(screen.getByTestId('handle-source-default')).toBeDefined();
  });

  it('applies selected styles when selected', () => {
    const props = { ...mockNodeProps, selected: true };
    const { container } = render(<AgentNode {...props as any} />);
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain('border-pink-400');
  });

  it('applies default styles when not selected', () => {
    const { container } = render(<AgentNode {...mockNodeProps as any} />);
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain('border-pink-600');
  });
});
