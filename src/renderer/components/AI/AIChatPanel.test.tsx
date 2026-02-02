// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AIChatPanel } from './AIChatPanel';

Element.prototype.scrollIntoView = vi.fn();

vi.mock('../../stores/aiAssistantStore', () => ({
  useAIAssistantStore: () => ({
    messages: [
      { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      { id: '2', role: 'assistant', content: 'Hi there', timestamp: Date.now() },
    ],
    isLoading: false,
    isOpen: true,
    hasApiKey: true,
    error: null,
    sendMessage: vi.fn(),
    closePanel: vi.fn(),
    clearHistory: vi.fn(),
    checkApiKey: vi.fn(),
  }),
}));

vi.mock('../../stores/settingsStore', () => ({
  useSettingsStore: () => ({
    updateAgentSettings: vi.fn(),
  }),
}));

describe('AIChatPanel', () => {
  it('renders chat messages', () => {
    render(<AIChatPanel />);
    expect(screen.getByText('Hello')).toBeDefined();
    expect(screen.getByText('Hi there')).toBeDefined();
  });

  it('renders input area', () => {
    render(<AIChatPanel />);
    expect(screen.getByPlaceholderText(/メッセージを入力/)).toBeDefined();
  });
});
