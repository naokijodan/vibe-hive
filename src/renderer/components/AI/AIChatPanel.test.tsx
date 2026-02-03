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

  it('renders header with title', () => {
    render(<AIChatPanel />);
    expect(screen.getByText('AI アシスタント')).toBeDefined();
  });

  it('renders close button', () => {
    render(<AIChatPanel />);
    expect(screen.getByText('✕')).toBeDefined();
  });

  it('renders send button', () => {
    render(<AIChatPanel />);
    expect(screen.getByText('送信')).toBeDefined();
  });

  it('renders emoji in header', () => {
    render(<AIChatPanel />);
    expect(screen.getByText('🤖')).toBeDefined();
  });

  it('renders clear history button', () => {
    render(<AIChatPanel />);
    expect(screen.getByTitle('履歴をクリア')).toBeDefined();
  });

  it('renders user message bubble', () => {
    render(<AIChatPanel />);
    expect(screen.getByText('Hello')).toBeDefined();
  });

  it('renders assistant message bubble', () => {
    render(<AIChatPanel />);
    expect(screen.getByText('Hi there')).toBeDefined();
  });
});
