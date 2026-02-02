// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TriggerNodeSettings } from './TriggerNodeSettings';

vi.mock('../../../stores/workflowStore', () => ({
  useWorkflowStore: () => ({ currentWorkflow: null }),
}));

describe('TriggerNodeSettings', () => {
  it('renders trigger type options', () => {
    render(<TriggerNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('Manual')).toBeDefined();
    expect(screen.getByText('Schedule')).toBeDefined();
    expect(screen.getByText('Event')).toBeDefined();
    expect(screen.getByText('Webhook')).toBeDefined();
  });

  it('calls onChange when trigger type selected', () => {
    const onChange = vi.fn();
    render(<TriggerNodeSettings data={{} as any} onChange={onChange} />);
    fireEvent.click(screen.getByText('Schedule'));
    expect(onChange).toHaveBeenCalled();
  });

  it('renders with schedule trigger data', () => {
    render(<TriggerNodeSettings data={{ triggerType: 'schedule', schedule: '0 * * * *' } as any} onChange={vi.fn()} />);
    expect(screen.getByText('Schedule')).toBeDefined();
  });

  it('renders with webhook trigger data', () => {
    render(<TriggerNodeSettings data={{ triggerType: 'webhook' } as any} onChange={vi.fn()} />);
    expect(screen.getByText('Webhook')).toBeDefined();
  });
});
