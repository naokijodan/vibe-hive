// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { NotificationNodeSettings } from './NotificationNodeSettings';

describe('NotificationNodeSettings', () => {
  it('renders notification type options', () => {
    render(<NotificationNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getAllByText(/Discord/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Slack/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Email/i).length).toBeGreaterThan(0);
  });
});
