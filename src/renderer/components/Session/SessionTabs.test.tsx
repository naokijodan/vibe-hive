// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionTabs } from './SessionTabs';

const makeSession = (id: string, name: string, status = 'idle' as const) => ({
  id,
  name,
  status,
  organizationId: 'org1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('SessionTabs', () => {
  it('shows empty message when no sessions', () => {
    render(<SessionTabs sessions={[]} activeSessionId={null} onSessionSwitch={vi.fn()} />);
    expect(screen.getByText('セッションがありません')).toBeDefined();
  });

  it('renders session names', () => {
    const sessions = [makeSession('s1', 'Session 1'), makeSession('s2', 'Session 2')];
    render(<SessionTabs sessions={sessions} activeSessionId="s1" onSessionSwitch={vi.fn()} />);
    expect(screen.getByText('Session 1')).toBeDefined();
    expect(screen.getByText('Session 2')).toBeDefined();
  });

  it('calls onSessionSwitch on click', () => {
    const onSwitch = vi.fn();
    const sessions = [makeSession('s1', 'Test')];
    render(<SessionTabs sessions={sessions} activeSessionId={null} onSessionSwitch={onSwitch} />);
    fireEvent.click(screen.getByText('Test'));
    expect(onSwitch).toHaveBeenCalledWith('s1');
  });

  it('shows keyboard shortcut for first 9 sessions', () => {
    const sessions = [makeSession('s1', 'First')];
    const { container } = render(<SessionTabs sessions={sessions} activeSessionId="s1" onSessionSwitch={vi.fn()} />);
    expect(container.textContent).toContain('⌘1');
  });
});
