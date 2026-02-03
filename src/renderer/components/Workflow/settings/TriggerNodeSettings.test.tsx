// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TriggerNodeSettings } from './TriggerNodeSettings';

let mockCurrentWorkflow: any = null;

vi.mock('../../../stores/workflowStore', () => ({
  useWorkflowStore: () => ({ currentWorkflow: mockCurrentWorkflow }),
}));

describe('TriggerNodeSettings', () => {
  const defaultOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentWorkflow = null;
  });

  describe('rendering', () => {
    it('renders trigger type label', () => {
      render(<TriggerNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Trigger Type')).toBeDefined();
    });

    it('renders trigger type options', () => {
      render(<TriggerNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Manual')).toBeDefined();
      expect(screen.getByText('Schedule')).toBeDefined();
      expect(screen.getByText('Event')).toBeDefined();
      expect(screen.getByText('Webhook')).toBeDefined();
    });

    it('shows manual description', () => {
      render(<TriggerNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Start manually by clicking Execute')).toBeDefined();
    });

    it('shows schedule description', () => {
      render(<TriggerNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Run on a schedule')).toBeDefined();
    });

    it('shows event description', () => {
      render(<TriggerNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Triggered by task completion events')).toBeDefined();
    });

    it('shows webhook description', () => {
      render(<TriggerNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Triggered by HTTP webhook')).toBeDefined();
    });

    it('defaults to manual trigger', () => {
      render(<TriggerNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Click the Execute button to start the workflow manually.')).toBeDefined();
    });
  });

  describe('trigger type selection', () => {
    it('calls onChange when trigger type selected', () => {
      const onChange = vi.fn();
      render(<TriggerNodeSettings data={{} as any} onChange={onChange} />);
      fireEvent.click(screen.getByText('Schedule'));
      expect(onChange).toHaveBeenCalledWith({ triggerType: 'schedule' });
    });

    it('calls onChange when event selected', () => {
      const onChange = vi.fn();
      render(<TriggerNodeSettings data={{} as any} onChange={onChange} />);
      fireEvent.click(screen.getByText('Event'));
      expect(onChange).toHaveBeenCalledWith({ triggerType: 'event' });
    });

    it('calls onChange when webhook selected', () => {
      const onChange = vi.fn();
      render(<TriggerNodeSettings data={{} as any} onChange={onChange} />);
      fireEvent.click(screen.getByText('Webhook'));
      expect(onChange).toHaveBeenCalledWith({ triggerType: 'webhook' });
    });

    it('calls onChange when manual selected', () => {
      const onChange = vi.fn();
      render(<TriggerNodeSettings data={{ triggerType: 'schedule' } as any} onChange={onChange} />);
      fireEvent.click(screen.getByText('Manual'));
      expect(onChange).toHaveBeenCalledWith({ triggerType: 'manual' });
    });
  });

  describe('manual trigger', () => {
    it('shows manual note section', () => {
      render(<TriggerNodeSettings data={{ triggerType: 'manual' } as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Note')).toBeDefined();
    });

    it('shows manual instruction', () => {
      render(<TriggerNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Click the Execute button to start the workflow manually.')).toBeDefined();
    });
  });

  describe('schedule trigger', () => {
    it('shows cron expression section when schedule selected', () => {
      render(<TriggerNodeSettings data={{ triggerType: 'schedule' } as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Cron Expression')).toBeDefined();
    });

    it('shows cron input field', () => {
      render(<TriggerNodeSettings data={{ triggerType: 'schedule' } as any} onChange={defaultOnChange} />);
      expect(screen.getByPlaceholderText('0 * * * *')).toBeDefined();
    });

    it('shows cron description', () => {
      render(<TriggerNodeSettings data={{ triggerType: 'schedule' } as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Cron expression to schedule workflow execution')).toBeDefined();
    });

    it('shows common examples label', () => {
      render(<TriggerNodeSettings data={{ triggerType: 'schedule' } as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Common Examples:')).toBeDefined();
    });

    it('shows every minute example', () => {
      render(<TriggerNodeSettings data={{ triggerType: 'schedule' } as any} onChange={defaultOnChange} />);
      expect(screen.getByText(/Every minute/)).toBeDefined();
    });

    it('shows every hour example', () => {
      render(<TriggerNodeSettings data={{ triggerType: 'schedule' } as any} onChange={defaultOnChange} />);
      expect(screen.getByText(/Every hour/)).toBeDefined();
    });

    it('shows daily example', () => {
      render(<TriggerNodeSettings data={{ triggerType: 'schedule' } as any} onChange={defaultOnChange} />);
      expect(screen.getByText(/Every day at midnight/)).toBeDefined();
    });

    it('shows weekly example', () => {
      render(<TriggerNodeSettings data={{ triggerType: 'schedule' } as any} onChange={defaultOnChange} />);
      expect(screen.getByText(/Every Monday at midnight/)).toBeDefined();
    });

    it('calls onChange when cron expression changed', () => {
      const onChange = vi.fn();
      render(<TriggerNodeSettings data={{ triggerType: 'schedule' } as any} onChange={onChange} />);
      const input = screen.getByPlaceholderText('0 * * * *');
      fireEvent.change(input, { target: { value: '30 * * * *' } });
      expect(onChange).toHaveBeenCalledWith({
        config: expect.objectContaining({ cronExpression: '30 * * * *' }),
      });
    });

    it('clicks example to set cron expression', () => {
      const onChange = vi.fn();
      render(<TriggerNodeSettings data={{ triggerType: 'schedule' } as any} onChange={onChange} />);
      fireEvent.click(screen.getByText(/Every minute/));
      expect(onChange).toHaveBeenCalledWith({
        config: expect.objectContaining({ cronExpression: '* * * * *' }),
      });
    });

    it('shows active status note', () => {
      render(<TriggerNodeSettings data={{ triggerType: 'schedule' } as any} onChange={defaultOnChange} />);
      expect(screen.getByText(/workflow must be in 'active' status/)).toBeDefined();
    });

    it('renders with existing cron expression', () => {
      const data = { triggerType: 'schedule', config: { cronExpression: '30 8 * * *' } };
      render(<TriggerNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByDisplayValue('30 8 * * *')).toBeDefined();
    });
  });

  describe('webhook trigger', () => {
    it('does not show webhook URL when no workflow', () => {
      mockCurrentWorkflow = null;
      render(<TriggerNodeSettings data={{ triggerType: 'webhook' } as any} onChange={defaultOnChange} />);
      expect(screen.queryByText('Webhook URL')).toBeNull();
    });

    it('shows webhook URL section when workflow exists', () => {
      mockCurrentWorkflow = { id: 123 };
      render(<TriggerNodeSettings data={{ triggerType: 'webhook' } as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Webhook URL')).toBeDefined();
    });

    it('shows generated webhook URL', () => {
      mockCurrentWorkflow = { id: 123 };
      render(<TriggerNodeSettings data={{ triggerType: 'webhook' } as any} onChange={defaultOnChange} />);
      expect(screen.getByDisplayValue('http://localhost:3100/webhook/123')).toBeDefined();
    });

    it('shows webhook description', () => {
      mockCurrentWorkflow = { id: 123 };
      render(<TriggerNodeSettings data={{ triggerType: 'webhook' } as any} onChange={defaultOnChange} />);
      expect(screen.getByText(/Send a POST request to this URL to trigger the workflow/)).toBeDefined();
    });

    it('shows curl example', () => {
      mockCurrentWorkflow = { id: 123 };
      render(<TriggerNodeSettings data={{ triggerType: 'webhook' } as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Example with curl:')).toBeDefined();
    });

    it('shows copy button', () => {
      mockCurrentWorkflow = { id: 123 };
      const { container } = render(<TriggerNodeSettings data={{ triggerType: 'webhook' } as any} onChange={defaultOnChange} />);
      const buttons = container.querySelectorAll('button');
      const copyButton = Array.from(buttons).find(b => b.title === 'Copy to clipboard');
      expect(copyButton).toBeDefined();
    });
  });

  describe('event trigger', () => {
    it('shows event configuration section', () => {
      render(<TriggerNodeSettings data={{ triggerType: 'event' } as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Event Configuration')).toBeDefined();
    });

    it('shows event type select', () => {
      render(<TriggerNodeSettings data={{ triggerType: 'event' } as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Event Type')).toBeDefined();
    });

    it('shows task completed option', () => {
      render(<TriggerNodeSettings data={{ triggerType: 'event' } as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Task Completed')).toBeDefined();
    });

    it('shows title filter input', () => {
      render(<TriggerNodeSettings data={{ triggerType: 'event' } as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Title Filter (optional)')).toBeDefined();
    });

    it('shows title filter placeholder', () => {
      render(<TriggerNodeSettings data={{ triggerType: 'event' } as any} onChange={defaultOnChange} />);
      expect(screen.getByPlaceholderText('e.g. deploy, test')).toBeDefined();
    });

    it('shows title filter description', () => {
      render(<TriggerNodeSettings data={{ triggerType: 'event' } as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Only trigger when task title contains this text')).toBeDefined();
    });

    it('calls onChange when event type changed', () => {
      const onChange = vi.fn();
      render(<TriggerNodeSettings data={{ triggerType: 'event' } as any} onChange={onChange} />);
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'task_completed' } });
      expect(onChange).toHaveBeenCalled();
    });

    it('calls onChange when title filter changed', () => {
      const onChange = vi.fn();
      render(<TriggerNodeSettings data={{ triggerType: 'event' } as any} onChange={onChange} />);
      const input = screen.getByPlaceholderText('e.g. deploy, test');
      fireEvent.change(input, { target: { value: 'test' } });
      expect(onChange).toHaveBeenCalledWith({
        config: expect.objectContaining({ titlePattern: 'test' }),
      });
    });

    it('shows event active status note', () => {
      render(<TriggerNodeSettings data={{ triggerType: 'event' } as any} onChange={defaultOnChange} />);
      expect(screen.getByText(/workflow must be in 'active' status/)).toBeDefined();
    });

    it('shows trigger data info', () => {
      render(<TriggerNodeSettings data={{ triggerType: 'event' } as any} onChange={defaultOnChange} />);
      expect(screen.getByText(/taskId, taskTitle, and sessionId/)).toBeDefined();
    });

    it('renders with existing title pattern', () => {
      const data = { triggerType: 'event', config: { titlePattern: 'deploy' } };
      render(<TriggerNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByDisplayValue('deploy')).toBeDefined();
    });
  });

  describe('styling', () => {
    it('has space-y-4 layout', () => {
      const { container } = render(<TriggerNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(container.innerHTML).toContain('space-y-4');
    });

    it('has green styling for schedule section', () => {
      const { container } = render(<TriggerNodeSettings data={{ triggerType: 'schedule' } as any} onChange={defaultOnChange} />);
      expect(container.innerHTML).toContain('bg-green-900');
    });

    it('has blue styling for webhook section', () => {
      mockCurrentWorkflow = { id: 1 };
      const { container } = render(<TriggerNodeSettings data={{ triggerType: 'webhook' } as any} onChange={defaultOnChange} />);
      expect(container.innerHTML).toContain('bg-blue-900');
    });

    it('has purple styling for event section', () => {
      const { container } = render(<TriggerNodeSettings data={{ triggerType: 'event' } as any} onChange={defaultOnChange} />);
      expect(container.innerHTML).toContain('bg-purple-900');
    });

    it('shows checkmark for selected trigger type', () => {
      const { container } = render(<TriggerNodeSettings data={{} as any} onChange={defaultOnChange} />);
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  describe('existing data', () => {
    it('renders with schedule trigger data', () => {
      render(<TriggerNodeSettings data={{ triggerType: 'schedule', config: { cronExpression: '0 * * * *' } } as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Cron Expression')).toBeDefined();
    });

    it('renders with webhook trigger data', () => {
      mockCurrentWorkflow = { id: 1 };
      render(<TriggerNodeSettings data={{ triggerType: 'webhook' } as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Webhook URL')).toBeDefined();
    });

    it('renders with event trigger data', () => {
      render(<TriggerNodeSettings data={{ triggerType: 'event', config: { eventType: 'task_completed' } } as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Event Configuration')).toBeDefined();
    });
  });
});
