// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
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
});
