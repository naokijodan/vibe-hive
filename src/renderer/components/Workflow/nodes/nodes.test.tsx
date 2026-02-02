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
import { ConditionalNode } from './ConditionalNode';
import { LoopNode } from './LoopNode';
import { MergeNode } from './MergeNode';
import { NotificationNode } from './NotificationNode';

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

describe('ConditionalNode', () => {
  it('renders label', () => {
    render(<ConditionalNode {...baseNodeProps} data={{ label: 'Check Status' } as any} />);
    expect(screen.getByText('Check Status')).toBeDefined();
    expect(screen.getByText('Conditional')).toBeDefined();
  });

  it('shows True/False outputs', () => {
    render(<ConditionalNode {...baseNodeProps} data={{ label: 'If' } as any} />);
    expect(screen.getByText('True')).toBeDefined();
    expect(screen.getByText('False')).toBeDefined();
  });

  it('shows condition when provided', () => {
    render(<ConditionalNode {...baseNodeProps} data={{ label: 'If', condition: { field: 'status', operator: '==', value: 'done' } } as any} />);
    expect(screen.getByText('status == done')).toBeDefined();
  });
});

describe('LoopNode', () => {
  it('renders label and default type', () => {
    render(<LoopNode {...baseNodeProps} data={{ label: 'Iterate' } as any} />);
    expect(screen.getByText('Iterate')).toBeDefined();
    expect(screen.getByText('For Each')).toBeDefined();
  });

  it('shows count type', () => {
    render(<LoopNode {...baseNodeProps} data={{ label: 'L', loopConfig: { type: 'count', count: 5 } } as any} />);
    expect(screen.getByText('Count')).toBeDefined();
    expect(screen.getByText('5 times')).toBeDefined();
  });

  it('shows while type', () => {
    render(<LoopNode {...baseNodeProps} data={{ label: 'L', loopConfig: { type: 'while' } } as any} />);
    expect(screen.getByText('While')).toBeDefined();
  });

  it('shows max iterations', () => {
    render(<LoopNode {...baseNodeProps} data={{ label: 'L', loopConfig: { type: 'forEach', maxIterations: 50 } } as any} />);
    expect(screen.getByText('Max iterations: 50')).toBeDefined();
  });
});

describe('MergeNode', () => {
  it('renders label', () => {
    render(<MergeNode {...baseNodeProps} data={{ label: 'Combine' } as any} />);
    expect(screen.getByText('Combine')).toBeDefined();
    expect(screen.getByText('Merge')).toBeDefined();
  });

  it('shows description', () => {
    render(<MergeNode {...baseNodeProps} data={{ label: 'M' } as any} />);
    expect(screen.getByText('Combines multiple inputs')).toBeDefined();
  });
});

describe('NotificationNode', () => {
  it('renders label with default discord type', () => {
    render(<NotificationNode {...baseNodeProps} data={{ label: 'Notify' } as any} />);
    expect(screen.getByText('Notify')).toBeDefined();
    expect(screen.getByText('discord')).toBeDefined();
  });

  it('renders slack type', () => {
    render(<NotificationNode {...baseNodeProps} data={{ label: 'N', notificationType: 'slack' } as any} />);
    expect(screen.getByText('slack')).toBeDefined();
  });

  it('renders email type', () => {
    render(<NotificationNode {...baseNodeProps} data={{ label: 'N', notificationType: 'email' } as any} />);
    expect(screen.getByText('email')).toBeDefined();
  });

  it('shows title and message from config', () => {
    render(<NotificationNode {...baseNodeProps} data={{ label: 'N', config: { title: 'Alert', message: 'Something happened' } } as any} />);
    expect(screen.getByText('Title: Alert')).toBeDefined();
    expect(screen.getByText(/Something happened/)).toBeDefined();
  });
});
