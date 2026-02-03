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

  it('shows notification type label', () => {
    render(<NotificationNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('Notification Type')).toBeDefined();
  });

  it('shows title field', () => {
    render(<NotificationNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('Title (Optional)')).toBeDefined();
  });

  it('shows message field', () => {
    render(<NotificationNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('Message *')).toBeDefined();
  });

  it('shows webhook URL field for discord', () => {
    const data = { notificationType: 'discord' };
    render(<NotificationNodeSettings data={data as any} onChange={vi.fn()} />);
    expect(screen.getByText('Webhook URL *')).toBeDefined();
  });

  it('shows webhook URL field for slack', () => {
    const data = { notificationType: 'slack' };
    render(<NotificationNodeSettings data={data as any} onChange={vi.fn()} />);
    expect(screen.getByText('Webhook URL *')).toBeDefined();
  });

  it('shows email field for email type', () => {
    const data = { notificationType: 'email' };
    render(<NotificationNodeSettings data={data as any} onChange={vi.fn()} />);
    expect(screen.getByText('Recipient Email *')).toBeDefined();
  });

  it('shows email configuration warning for email type', () => {
    const data = { notificationType: 'email' };
    render(<NotificationNodeSettings data={data as any} onChange={vi.fn()} />);
    expect(screen.getByText('Email Configuration Required')).toBeDefined();
  });

  it('calls onChange when title changes', () => {
    const onChange = vi.fn();
    render(<NotificationNodeSettings data={{} as any} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Notification title');
    fireEvent.change(input, { target: { value: 'Test Title' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('calls onChange when message changes', () => {
    const onChange = vi.fn();
    render(<NotificationNodeSettings data={{} as any} onChange={onChange} />);
    const textarea = screen.getByPlaceholderText('Enter notification message...');
    fireEvent.change(textarea, { target: { value: 'Test Message' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('calls onChange when webhook URL changes', () => {
    const onChange = vi.fn();
    const data = { notificationType: 'discord' };
    render(<NotificationNodeSettings data={data as any} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Enter discord webhook URL...');
    fireEvent.change(input, { target: { value: 'https://discord.com/webhook' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('calls onChange when email changes', () => {
    const onChange = vi.fn();
    const data = { notificationType: 'email' };
    render(<NotificationNodeSettings data={data as any} onChange={onChange} />);
    const input = screen.getByPlaceholderText('recipient@example.com');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('shows Discord description', () => {
    render(<NotificationNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('Send to Discord webhook')).toBeDefined();
  });

  it('shows Slack description', () => {
    render(<NotificationNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('Send to Slack channel')).toBeDefined();
  });

  it('shows Email description', () => {
    render(<NotificationNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('Send email notification')).toBeDefined();
  });
});
