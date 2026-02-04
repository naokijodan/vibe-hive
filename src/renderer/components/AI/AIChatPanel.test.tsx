// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIChatPanel } from './AIChatPanel';

Element.prototype.scrollIntoView = vi.fn();

const { mockFns, mockState } = vi.hoisted(() => ({
  mockFns: {
    sendMessage: vi.fn().mockResolvedValue(undefined),
    closePanel: vi.fn(),
    clearHistory: vi.fn(),
    checkApiKey: vi.fn(),
    updateAgentSettings: vi.fn().mockResolvedValue(undefined),
  },
  mockState: {
    messages: [] as any[],
    isLoading: false,
    isOpen: true,
    hasApiKey: true as boolean | null,
    error: null as string | null,
  },
}));

vi.mock('../../stores/aiAssistantStore', () => ({
  useAIAssistantStore: () => ({
    ...mockState,
    ...mockFns,
  }),
}));

vi.mock('../../stores/settingsStore', () => ({
  useSettingsStore: () => ({
    updateAgentSettings: mockFns.updateAgentSettings,
  }),
}));

describe('AIChatPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.messages = [];
    mockState.isLoading = false;
    mockState.isOpen = true;
    mockState.hasApiKey = true;
    mockState.error = null;
  });

  describe('rendering', () => {
    it('renders nothing when not open', () => {
      mockState.isOpen = false;
      const { container } = render(<AIChatPanel />);
      expect(container.innerHTML).toBe('');
    });

    it('renders panel when open', () => {
      render(<AIChatPanel />);
      expect(screen.getByText('AI アシスタント')).toBeDefined();
    });

    it('renders header with emoji', () => {
      render(<AIChatPanel />);
      expect(screen.getByText('🤖')).toBeDefined();
    });

    it('renders close button', () => {
      render(<AIChatPanel />);
      expect(screen.getByText('✕')).toBeDefined();
    });

    it('renders clear history button', () => {
      render(<AIChatPanel />);
      expect(screen.getByTitle('履歴をクリア')).toBeDefined();
    });

    it('renders input area', () => {
      render(<AIChatPanel />);
      expect(screen.getByPlaceholderText(/メッセージを入力/)).toBeDefined();
    });

    it('renders send button', () => {
      render(<AIChatPanel />);
      expect(screen.getByText('送信')).toBeDefined();
    });
  });

  describe('API key prompt', () => {
    it('shows API key prompt when hasApiKey is false', () => {
      mockState.hasApiKey = false;
      render(<AIChatPanel />);
      expect(screen.getByText(/Claude APIキーが必要です/)).toBeDefined();
    });

    it('shows API key input field', () => {
      mockState.hasApiKey = false;
      render(<AIChatPanel />);
      expect(screen.getByPlaceholderText('sk-ant-...')).toBeDefined();
    });

    it('shows save button for API key', () => {
      mockState.hasApiKey = false;
      render(<AIChatPanel />);
      expect(screen.getByText('保存')).toBeDefined();
    });

    it('saves API key on button click', async () => {
      mockState.hasApiKey = false;
      render(<AIChatPanel />);
      const input = screen.getByPlaceholderText('sk-ant-...');
      fireEvent.change(input, { target: { value: 'sk-ant-test-key' } });
      fireEvent.click(screen.getByText('保存'));
      await waitFor(() => {
        expect(mockFns.updateAgentSettings).toHaveBeenCalledWith({ claudeApiKey: 'sk-ant-test-key' });
      });
    });

    it('saves API key on Enter key', async () => {
      mockState.hasApiKey = false;
      render(<AIChatPanel />);
      const input = screen.getByPlaceholderText('sk-ant-...');
      fireEvent.change(input, { target: { value: 'sk-ant-test' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => {
        expect(mockFns.updateAgentSettings).toHaveBeenCalled();
      });
    });

    it('does not save empty API key', async () => {
      mockState.hasApiKey = false;
      render(<AIChatPanel />);
      fireEvent.click(screen.getByText('保存'));
      expect(mockFns.updateAgentSettings).not.toHaveBeenCalled();
    });

    it('checks API key after mount when hasApiKey is null', () => {
      mockState.hasApiKey = null;
      render(<AIChatPanel />);
      expect(mockFns.checkApiKey).toHaveBeenCalled();
    });
  });

  describe('empty state', () => {
    it('shows welcome message when no messages', () => {
      render(<AIChatPanel />);
      expect(screen.getByText('Vibe Hive AIアシスタントへようこそ')).toBeDefined();
    });

    it('shows suggestions when no messages', () => {
      render(<AIChatPanel />);
      expect(screen.getByText('タスクを一覧表示して')).toBeDefined();
      expect(screen.getByText('ログイン画面のタスクを作成して')).toBeDefined();
      expect(screen.getByText('プロジェクトの状態を教えて')).toBeDefined();
    });

    it('fills input when suggestion clicked', () => {
      render(<AIChatPanel />);
      fireEvent.click(screen.getByText('タスクを一覧表示して'));
      const input = screen.getByPlaceholderText(/メッセージを入力/) as HTMLTextAreaElement;
      expect(input.value).toBe('タスクを一覧表示して');
    });
  });

  describe('messages', () => {
    it('renders user message', () => {
      mockState.messages = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      render(<AIChatPanel />);
      expect(screen.getByText('Hello')).toBeDefined();
    });

    it('renders assistant message', () => {
      mockState.messages = [
        { id: '1', role: 'assistant', content: 'Hi there', timestamp: Date.now() },
      ];
      render(<AIChatPanel />);
      expect(screen.getByText('Hi there')).toBeDefined();
    });

    it('renders multiple messages', () => {
      mockState.messages = [
        { id: '1', role: 'user', content: 'Question', timestamp: Date.now() },
        { id: '2', role: 'assistant', content: 'Answer', timestamp: Date.now() },
      ];
      render(<AIChatPanel />);
      expect(screen.getByText('Question')).toBeDefined();
      expect(screen.getByText('Answer')).toBeDefined();
    });

    it('renders tool results in message', () => {
      mockState.messages = [
        {
          id: '1',
          role: 'assistant',
          content: 'Done',
          timestamp: Date.now(),
          toolResults: [{ toolName: 'listTasks', result: {} }],
        },
      ];
      render(<AIChatPanel />);
      expect(screen.getByText('listTasks 実行済み')).toBeDefined();
    });

    it('renders multiple tool results', () => {
      mockState.messages = [
        {
          id: '1',
          role: 'assistant',
          content: 'Done',
          timestamp: Date.now(),
          toolResults: [
            { toolName: 'tool1', result: {} },
            { toolName: 'tool2', result: {} },
          ],
        },
      ];
      render(<AIChatPanel />);
      expect(screen.getByText('tool1 実行済み')).toBeDefined();
      expect(screen.getByText('tool2 実行済み')).toBeDefined();
    });
  });

  describe('loading state', () => {
    it('shows loading indicator when loading', () => {
      mockState.isLoading = true;
      render(<AIChatPanel />);
      expect(screen.getByText('考え中...')).toBeDefined();
    });

    it('shows spinner when loading', () => {
      mockState.isLoading = true;
      const { container } = render(<AIChatPanel />);
      expect(container.innerHTML).toContain('animate-spin');
    });

    it('disables send button when loading', () => {
      mockState.isLoading = true;
      render(<AIChatPanel />);
      const sendButton = screen.getByText('送信');
      expect(sendButton).toHaveProperty('disabled', true);
    });
  });

  describe('error state', () => {
    it('shows error message when error exists', () => {
      mockState.error = 'API error occurred';
      render(<AIChatPanel />);
      expect(screen.getByText('API error occurred')).toBeDefined();
    });

    it('has red styling for error', () => {
      mockState.error = 'Error message';
      const { container } = render(<AIChatPanel />);
      expect(container.innerHTML).toContain('text-red-400');
    });
  });

  describe('send message', () => {
    it('sends message on button click', async () => {
      render(<AIChatPanel />);
      const input = screen.getByPlaceholderText(/メッセージを入力/) as HTMLTextAreaElement;
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(screen.getByText('送信'));
      await waitFor(() => {
        expect(mockFns.sendMessage).toHaveBeenCalledWith('Test message');
      });
    });

    it('sends message on Enter key', async () => {
      render(<AIChatPanel />);
      const input = screen.getByPlaceholderText(/メッセージを入力/) as HTMLTextAreaElement;
      fireEvent.change(input, { target: { value: 'Enter test' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => {
        expect(mockFns.sendMessage).toHaveBeenCalledWith('Enter test');
      });
    });

    it('does not send on Shift+Enter', () => {
      render(<AIChatPanel />);
      const input = screen.getByPlaceholderText(/メッセージを入力/) as HTMLTextAreaElement;
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
      expect(mockFns.sendMessage).not.toHaveBeenCalled();
    });

    it('clears input after sending', async () => {
      render(<AIChatPanel />);
      const input = screen.getByPlaceholderText(/メッセージを入力/) as HTMLTextAreaElement;
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(screen.getByText('送信'));
      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('does not send empty message', () => {
      render(<AIChatPanel />);
      fireEvent.click(screen.getByText('送信'));
      expect(mockFns.sendMessage).not.toHaveBeenCalled();
    });

    it('does not send whitespace only message', () => {
      render(<AIChatPanel />);
      const input = screen.getByPlaceholderText(/メッセージを入力/) as HTMLTextAreaElement;
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(screen.getByText('送信'));
      expect(mockFns.sendMessage).not.toHaveBeenCalled();
    });

    it('disables send button when input is empty', () => {
      render(<AIChatPanel />);
      const sendButton = screen.getByText('送信');
      expect(sendButton).toHaveProperty('disabled', true);
    });

    it('enables send button when input has content', () => {
      render(<AIChatPanel />);
      const input = screen.getByPlaceholderText(/メッセージを入力/) as HTMLTextAreaElement;
      fireEvent.change(input, { target: { value: 'Test' } });
      const sendButton = screen.getByText('送信');
      expect(sendButton).toHaveProperty('disabled', false);
    });
  });

  describe('close panel', () => {
    it('calls closePanel on close button click', () => {
      render(<AIChatPanel />);
      fireEvent.click(screen.getByText('✕'));
      expect(mockFns.closePanel).toHaveBeenCalled();
    });
  });

  describe('clear history', () => {
    it('calls clearHistory on button click', () => {
      render(<AIChatPanel />);
      fireEvent.click(screen.getByTitle('履歴をクリア'));
      expect(mockFns.clearHistory).toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('has fixed position', () => {
      const { container } = render(<AIChatPanel />);
      expect(container.innerHTML).toContain('fixed right-0');
    });

    it('has full height', () => {
      const { container } = render(<AIChatPanel />);
      expect(container.innerHTML).toContain('h-screen');
    });

    it('has width 96', () => {
      const { container } = render(<AIChatPanel />);
      expect(container.innerHTML).toContain('w-96');
    });

    it('has z-40 for layering', () => {
      const { container } = render(<AIChatPanel />);
      expect(container.innerHTML).toContain('z-40');
    });

    it('has shadow', () => {
      const { container } = render(<AIChatPanel />);
      expect(container.innerHTML).toContain('shadow-2xl');
    });

    it('has border left', () => {
      const { container } = render(<AIChatPanel />);
      expect(container.innerHTML).toContain('border-l');
    });
  });

  describe('message styling', () => {
    it('user messages aligned right', () => {
      mockState.messages = [
        { id: '1', role: 'user', content: 'User message', timestamp: Date.now() },
      ];
      const { container } = render(<AIChatPanel />);
      expect(container.innerHTML).toContain('justify-end');
    });

    it('assistant messages aligned left', () => {
      mockState.messages = [
        { id: '1', role: 'assistant', content: 'Assistant message', timestamp: Date.now() },
      ];
      const { container } = render(<AIChatPanel />);
      expect(container.innerHTML).toContain('justify-start');
    });

    it('user messages have accent background', () => {
      mockState.messages = [
        { id: '1', role: 'user', content: 'User message', timestamp: Date.now() },
      ];
      const { container } = render(<AIChatPanel />);
      expect(container.innerHTML).toContain('bg-hive-accent/20');
    });

    it('assistant messages have surface background', () => {
      mockState.messages = [
        { id: '1', role: 'assistant', content: 'Assistant message', timestamp: Date.now() },
      ];
      const { container } = render(<AIChatPanel />);
      expect(container.innerHTML).toContain('bg-hive-surface');
    });
  });
});
