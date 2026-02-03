// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { NotificationNode } from './NotificationNode';

vi.mock('@xyflow/react', () => ({
  Handle: ({ type, position, id, className }: any) => (
    <div data-testid={`handle-${type}-${id || 'default'}`} className={className} />
  ),
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
}));

const mockNodeProps = {
  id: 'node-1',
  data: {
    label: 'Send Notification',
    notificationType: 'discord',
    config: { title: 'Alert', message: 'Task completed successfully!' },
  },
  selected: false,
  type: 'notification',
  zIndex: 1,
  isConnectable: true,
  xPos: 0,
  yPos: 0,
  dragging: false,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
};

describe('NotificationNode', () => {
  it('renders notification label', () => {
    render(<NotificationNode {...mockNodeProps as any} />);
    expect(screen.getByText('Send Notification')).toBeDefined();
  });

  it('renders node type header', () => {
    render(<NotificationNode {...mockNodeProps as any} />);
    expect(screen.getByText('Notification')).toBeDefined();
  });

  it('renders notification type badge', () => {
    render(<NotificationNode {...mockNodeProps as any} />);
    expect(screen.getByText('discord')).toBeDefined();
  });

  it('renders discord icon for discord type', () => {
    render(<NotificationNode {...mockNodeProps as any} />);
    expect(screen.getByText('💬')).toBeDefined();
  });

  it('renders slack icon for slack type', () => {
    const props = { ...mockNodeProps, data: { ...mockNodeProps.data, notificationType: 'slack' } };
    render(<NotificationNode {...props as any} />);
    expect(screen.getByText('💼')).toBeDefined();
  });

  it('renders email icon for email type', () => {
    const props = { ...mockNodeProps, data: { ...mockNodeProps.data, notificationType: 'email' } };
    render(<NotificationNode {...props as any} />);
    expect(screen.getByText('📧')).toBeDefined();
  });

  it('renders default icon for unknown type', () => {
    const props = { ...mockNodeProps, data: { ...mockNodeProps.data, notificationType: 'unknown' } };
    render(<NotificationNode {...props as any} />);
    expect(screen.getByText('📢')).toBeDefined();
  });

  it('renders config title when provided', () => {
    render(<NotificationNode {...mockNodeProps as any} />);
    expect(screen.getByText('Title: Alert')).toBeDefined();
  });

  it('renders config message when provided', () => {
    render(<NotificationNode {...mockNodeProps as any} />);
    expect(screen.getByText('Message: Task completed successfully!')).toBeDefined();
  });

  it('truncates long messages', () => {
    const longMessage = 'This is a very long message that should be truncated after 30 characters';
    const props = {
      ...mockNodeProps,
      data: { ...mockNodeProps.data, config: { message: longMessage } },
    };
    render(<NotificationNode {...props as any} />);
    expect(screen.getByText(/Message:.*\.\.\./)).toBeDefined();
  });

  it('defaults to discord type', () => {
    const props = { ...mockNodeProps, data: { label: 'Notify' } };
    render(<NotificationNode {...props as any} />);
    expect(screen.getByText('💬')).toBeDefined();
  });

  it('renders target and source handles', () => {
    render(<NotificationNode {...mockNodeProps as any} />);
    expect(screen.getByTestId('handle-target-default')).toBeDefined();
    expect(screen.getByTestId('handle-source-default')).toBeDefined();
  });
});
