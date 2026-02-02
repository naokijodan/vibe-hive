// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock @xyflow/react
vi.mock('@xyflow/react', () => ({
  Handle: ({ type, position }: any) => <div data-testid={`handle-${type}-${position}`} />,
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
}));

import { AgentNode } from './AgentNode';
import { TriggerNode } from './TriggerNode';
import { DelayNode } from './DelayNode';
import { TaskNode } from './TaskNode';

const baseNodeProps = {
  id: 'n1',
  type: 'custom',
  selected: false,
  isConnectable: true,
  zIndex: 0,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
  dragging: false,
  deletable: true,
  selectable: true,
  parentId: undefined,
  sourcePosition: undefined,
  targetPosition: undefined,
  width: 200,
  height: 100,
  dragHandle: undefined,
};

describe('AgentNode', () => {
  it('renders label and agent type', () => {
    render(<AgentNode {...baseNodeProps} data={{ label: 'My Agent', agentConfig: { agentType: 'claude-code' } } as any} />);
    expect(screen.getByText('My Agent')).toBeDefined();
    expect(screen.getByText('Claude Code')).toBeDefined();
  });

  it('renders codex agent type', () => {
    render(<AgentNode {...baseNodeProps} data={{ label: 'MyCodexAgent', agentConfig: { agentType: 'codex' } } as any} />);
    expect(screen.getByText('Codex')).toBeDefined();
    expect(screen.getByText('MyCodexAgent')).toBeDefined();
  });

  it('renders custom agent type', () => {
    render(<AgentNode {...baseNodeProps} data={{ label: 'MyCustomAgent', agentConfig: { agentType: 'custom' } } as any} />);
    expect(screen.getByText('Custom')).toBeDefined();
    expect(screen.getByText('MyCustomAgent')).toBeDefined();
  });

  it('renders default timeout', () => {
    render(<AgentNode {...baseNodeProps} data={{ label: 'A', agentConfig: {} } as any} />);
    expect(screen.getByText('Timeout: 300s')).toBeDefined();
  });

  it('shows prompt truncated', () => {
    render(<AgentNode {...baseNodeProps} data={{ label: 'A', agentConfig: { agentType: 'claude-code', prompt: 'This is a very long prompt that should be truncated' } } as any} />);
    expect(screen.getByText(/This is a very long prompt/)).toBeDefined();
  });
});

describe('TriggerNode', () => {
  it('renders label', () => {
    render(<TriggerNode {...baseNodeProps} data={{ label: 'Start' } as any} />);
    expect(screen.getByText('Start')).toBeDefined();
    expect(screen.getByText('Trigger')).toBeDefined();
  });

  it('shows trigger type when provided', () => {
    render(<TriggerNode {...baseNodeProps} data={{ label: 'On Push', triggerType: 'webhook' } as any} />);
    expect(screen.getByText('Type: webhook')).toBeDefined();
  });
});

describe('DelayNode', () => {
  it('renders label and default delay', () => {
    render(<DelayNode {...baseNodeProps} data={{ label: 'Wait' } as any} />);
    expect(screen.getByText('Wait')).toBeDefined();
    expect(screen.getByText('1.0s')).toBeDefined();
  });

  it('formats milliseconds', () => {
    render(<DelayNode {...baseNodeProps} data={{ label: 'W', delayMs: 500 } as any} />);
    expect(screen.getByText('500ms')).toBeDefined();
  });

  it('formats minutes', () => {
    render(<DelayNode {...baseNodeProps} data={{ label: 'W', delayMs: 120000 } as any} />);
    expect(screen.getByText('2.0min')).toBeDefined();
  });
});

describe('TaskNode', () => {
  it('renders label', () => {
    render(<TaskNode {...baseNodeProps} data={{ label: 'Build' } as any} />);
    expect(screen.getByText('Build')).toBeDefined();
    expect(screen.getByText('Task')).toBeDefined();
  });

  it('shows task ID when provided', () => {
    render(<TaskNode {...baseNodeProps} data={{ label: 'Build', taskId: 'task-123' } as any} />);
    expect(screen.getByText('Task ID: task-123')).toBeDefined();
  });
});
