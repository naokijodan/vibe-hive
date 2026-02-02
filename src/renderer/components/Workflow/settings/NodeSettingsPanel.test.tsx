// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { NodeSettingsPanel } from './NodeSettingsPanel';

vi.mock('../../../stores/workflowStore', () => ({
  useWorkflowStore: (selector: any) => selector ? selector({ updateNode: vi.fn() }) : ({ updateNode: vi.fn() }),
}));

vi.mock('./TaskNodeSettings', () => ({ TaskNodeSettings: () => <div>TaskNodeSettings</div> }));
vi.mock('./ConditionalNodeSettings', () => ({ ConditionalNodeSettings: () => <div>ConditionalNodeSettings</div> }));
vi.mock('./DelayNodeSettings', () => ({ DelayNodeSettings: () => <div>DelayNodeSettings</div> }));
vi.mock('./TriggerNodeSettings', () => ({ TriggerNodeSettings: () => <div>TriggerNodeSettings</div> }));
vi.mock('./NotificationNodeSettings', () => ({ NotificationNodeSettings: () => <div>NotificationNodeSettings</div> }));
vi.mock('./LoopNodeSettings', () => ({ LoopNodeSettings: () => <div>LoopNodeSettings</div> }));
vi.mock('./SubworkflowNodeSettings', () => ({ SubworkflowNodeSettings: () => <div>SubworkflowNodeSettings</div> }));
vi.mock('./AgentNodeSettings', () => ({ AgentNodeSettings: () => <div>AgentNodeSettings</div> }));
vi.mock('../../../utils/validation', () => ({
  validateWorkflowNode: vi.fn().mockReturnValue({ valid: true, errors: [], warnings: [] }),
}));

describe('NodeSettingsPanel', () => {
  it('shows placeholder when no node selected', () => {
    render(<NodeSettingsPanel selectedNode={null} onClose={vi.fn()} />);
    expect(screen.getByText(/Select a node/i)).toBeDefined();
  });

  it('renders settings for task node', () => {
    const node = { id: 'n1', type: 'task', data: { label: 'Test' }, position: { x: 0, y: 0 } };
    render(<NodeSettingsPanel selectedNode={node as any} onClose={vi.fn()} />);
    expect(screen.getByText('TaskNodeSettings')).toBeDefined();
  });
});
