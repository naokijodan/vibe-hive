// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CollaborationPanel } from './CollaborationPanel';

Element.prototype.scrollIntoView = vi.fn();

vi.mock('../../stores/collaborationStore', () => ({
  useCollaborationStore: () => ({
    status: { connected: false, role: 'disconnected', userCount: 0 },
    users: [],
    chatMessages: [],
    settings: { port: 3101 },
    isLoading: false,
    error: null,
    setSettings: vi.fn(),
    startHost: vi.fn(),
    join: vi.fn(),
    disconnect: vi.fn(),
    sendChat: vi.fn(),
    refreshStatus: vi.fn(),
    refreshUsers: vi.fn(),
    loadChatHistory: vi.fn(),
    addChatMessage: vi.fn(),
    addUser: vi.fn(),
    removeUser: vi.fn(),
    updateStatus: vi.fn(),
  }),
}));

vi.mock('../../stores/sessionStore', () => ({
  useSessionStore: () => ({
    activeSessionId: 'session-1',
  }),
}));

vi.mock('../../bridge/ipcBridge', () => ({
  ipcBridge: {
    collab: {
      onStatus: vi.fn(() => vi.fn()),
      onChat: vi.fn(() => vi.fn()),
      onUserJoined: vi.fn(() => vi.fn()),
      onUserLeft: vi.fn(() => vi.fn()),
      onDisconnected: vi.fn(() => vi.fn()),
    },
  },
}));

describe('CollaborationPanel', () => {
  it('renders tab buttons', () => {
    render(<CollaborationPanel />);
    expect(screen.getByText('接続')).toBeDefined();
    expect(screen.getByText('チャット')).toBeDefined();
  });

  it('shows disconnected status', () => {
    render(<CollaborationPanel />);
    expect(screen.getByText('未接続')).toBeDefined();
  });
});
