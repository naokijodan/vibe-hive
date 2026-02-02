// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationNodeSettings } from './NotificationNodeSettings';

describe('NotificationNodeSettings', () => {
  it('renders notification type options', () => {
    render(<NotificationNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getAllByText(/Discord/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Slack/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Email/i).length).toBeGreaterThan(0);
  });

  it('renders with discord data without crash', () => {
    const data = { notificationType: 'discord' };
    const { container } = render(<NotificationNodeSettings data={data as any} onChange={vi.fn()} />);
    expect(container.innerHTML).not.toBe('');
  });

  it('calls onChange when type selected', () => {
    const onChange = vi.fn();
    render(<NotificationNodeSettings data={{} as any} onChange={onChange} />);
    fireEvent.click(screen.getAllByText(/Discord/i)[0]);
    expect(onChange).toHaveBeenCalled();
  });
});
