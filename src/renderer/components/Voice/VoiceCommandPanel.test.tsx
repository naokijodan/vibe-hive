// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { VoiceCommandPanel } from './VoiceCommandPanel';

const {
  mockToggleListening,
  mockClearHistory,
  mockAddTask,
  mockUpdateTaskStatus,
  mockDeleteTask,
  mockToastError,
  mockToastSuccess,
  mockToast,
} = vi.hoisted(() => ({
  mockToggleListening: vi.fn(),
  mockClearHistory: vi.fn(),
  mockAddTask: vi.fn(),
  mockUpdateTaskStatus: vi.fn(),
  mockDeleteTask: vi.fn(),
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToast: vi.fn(),
}));

const mockOnViewSwitch = vi.fn();

type CommandHandler = (result: { success: boolean; command: { type: string; rawText: string; params: Record<string, string> } }) => void;

let mockVoiceState = {
  isListening: false,
  isSupported: true,
  transcript: '',
  interimTranscript: '',
  error: null as string | null,
  commandHistory: [] as Array<{ success: boolean; command: { type: string; rawText: string; timestamp: number; params: Record<string, string> } }>,
  toggleListening: mockToggleListening,
  clearHistory: mockClearHistory,
};

let mockTaskState = {
  addTask: mockAddTask,
  tasks: [] as Array<{ id: string; title: string; description: string; status: string }>,
  updateTaskStatus: mockUpdateTaskStatus,
  deleteTask: mockDeleteTask,
};

let capturedOnCommand: CommandHandler | null = null;

vi.mock('../../hooks/useVoiceCommand', () => ({
  useVoiceCommand: (opts: { onCommand: CommandHandler }) => {
    capturedOnCommand = opts.onCommand;
    return mockVoiceState;
  },
}));

vi.mock('../../stores/taskStore', () => ({
  useTaskStore: () => mockTaskState,
}));

vi.mock('react-hot-toast', () => ({
  default: Object.assign(mockToast, {
    error: mockToastError,
    success: mockToastSuccess,
  }),
}));

describe('VoiceCommandPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVoiceState = {
      isListening: false,
      isSupported: true,
      transcript: '',
      interimTranscript: '',
      error: null,
      commandHistory: [],
      toggleListening: mockToggleListening,
      clearHistory: mockClearHistory,
    };
    mockTaskState = {
      addTask: mockAddTask,
      tasks: [],
      updateTaskStatus: mockUpdateTaskStatus,
      deleteTask: mockDeleteTask,
    };
    capturedOnCommand = null;
  });

  it('renders header', () => {
    render(<VoiceCommandPanel />);
    expect(screen.getByText('音声コマンド')).toBeDefined();
  });

  it('renders command reference', () => {
    render(<VoiceCommandPanel />);
    expect(screen.getByText('使えるコマンド')).toBeDefined();
  });

  it('shows empty history message', () => {
    render(<VoiceCommandPanel />);
    expect(screen.getByText('履歴はありません')).toBeDefined();
  });

  it('shows click-to-start text when supported', () => {
    render(<VoiceCommandPanel />);
    expect(screen.getByText('クリックして開始')).toBeDefined();
  });

  it('shows listening state when isListening is true', () => {
    mockVoiceState.isListening = true;
    render(<VoiceCommandPanel />);
    expect(screen.getByText('音声認識中...')).toBeDefined();
  });

  it('shows not supported text when isSupported is false', () => {
    mockVoiceState.isSupported = false;
    render(<VoiceCommandPanel />);
    expect(screen.getByText('音声認識非対応')).toBeDefined();
  });

  it('displays transcript when available', () => {
    mockVoiceState.transcript = 'タスク作成 テスト';
    render(<VoiceCommandPanel />);
    expect(screen.getByText('タスク作成 テスト')).toBeDefined();
  });

  it('displays interim transcript when available', () => {
    mockVoiceState.interimTranscript = '認識中テキスト';
    render(<VoiceCommandPanel />);
    expect(screen.getByText('認識中テキスト')).toBeDefined();
  });

  it('displays error when available', () => {
    mockVoiceState.error = 'マイクエラー';
    render(<VoiceCommandPanel />);
    expect(screen.getByText('マイクエラー')).toBeDefined();
  });

  it('displays command history', () => {
    mockVoiceState.commandHistory = [
      {
        success: true,
        command: { type: 'task:create', rawText: 'タスク作成 テスト', timestamp: Date.now(), params: { title: 'テスト' } },
      },
      {
        success: false,
        command: { type: 'unknown', rawText: '不明なコマンド', timestamp: Date.now(), params: {} },
      },
    ];
    render(<VoiceCommandPanel />);
    expect(screen.getByText('"タスク作成 テスト"')).toBeDefined();
    expect(screen.getByText('"不明なコマンド"')).toBeDefined();
    expect(screen.getByText('タスク作成')).toBeDefined();
    expect(screen.getByText('不明')).toBeDefined();
  });

  it('calls toggleListening when button clicked', () => {
    render(<VoiceCommandPanel />);
    const button = screen.getByRole('button', { name: /🎙/i });
    fireEvent.click(button);
    expect(mockToggleListening).toHaveBeenCalled();
  });

  it('disables button when not supported', () => {
    mockVoiceState.isSupported = false;
    render(<VoiceCommandPanel />);
    const button = screen.getByRole('button', { name: /🎙/i });
    expect(button).toHaveProperty('disabled', true);
  });

  it('calls clearHistory when clear button clicked', () => {
    mockVoiceState.commandHistory = [
      {
        success: true,
        command: { type: 'task:create', rawText: 'テスト', timestamp: Date.now(), params: {} },
      },
    ];
    render(<VoiceCommandPanel />);
    const clearButton = screen.getByText('クリア');
    fireEvent.click(clearButton);
    expect(mockClearHistory).toHaveBeenCalled();
  });

  describe('command handling', () => {
    it('handles task:create command', () => {
      render(<VoiceCommandPanel />);
      capturedOnCommand?.({
        success: true,
        command: { type: 'task:create', rawText: 'タスク作成 新しいタスク', params: { title: '新しいタスク' } },
      });
      expect(mockAddTask).toHaveBeenCalledWith(expect.objectContaining({
        title: '新しいタスク',
        tags: ['voice-created'],
      }));
      expect(mockToastSuccess).toHaveBeenCalled();
    });

    it('does not create task without title', () => {
      render(<VoiceCommandPanel />);
      capturedOnCommand?.({
        success: true,
        command: { type: 'task:create', rawText: 'タスク作成', params: {} },
      });
      expect(mockAddTask).not.toHaveBeenCalled();
    });

    it('handles task:complete command when task found', () => {
      mockTaskState.tasks = [
        { id: '1', title: 'テストタスク', description: '', status: 'todo' },
      ];
      render(<VoiceCommandPanel />);
      capturedOnCommand?.({
        success: true,
        command: { type: 'task:complete', rawText: 'テストタスクを完了', params: { query: 'テストタスク' } },
      });
      expect(mockUpdateTaskStatus).toHaveBeenCalledWith('1', 'done');
      expect(mockToastSuccess).toHaveBeenCalled();
    });

    it('shows error when task not found for complete', () => {
      mockTaskState.tasks = [];
      render(<VoiceCommandPanel />);
      capturedOnCommand?.({
        success: true,
        command: { type: 'task:complete', rawText: '存在しないを完了', params: { query: '存在しない' } },
      });
      expect(mockUpdateTaskStatus).not.toHaveBeenCalled();
      expect(mockToastError).toHaveBeenCalled();
    });

    it('skips already done task for complete', () => {
      mockTaskState.tasks = [
        { id: '1', title: 'テストタスク', description: '', status: 'done' },
      ];
      render(<VoiceCommandPanel />);
      capturedOnCommand?.({
        success: true,
        command: { type: 'task:complete', rawText: 'テストタスクを完了', params: { query: 'テストタスク' } },
      });
      expect(mockUpdateTaskStatus).not.toHaveBeenCalled();
      expect(mockToastError).toHaveBeenCalled();
    });

    it('handles task:delete command when task found', () => {
      mockTaskState.tasks = [
        { id: '1', title: '削除タスク', description: '', status: 'todo' },
      ];
      render(<VoiceCommandPanel />);
      capturedOnCommand?.({
        success: true,
        command: { type: 'task:delete', rawText: '削除タスクを削除', params: { query: '削除タスク' } },
      });
      expect(mockDeleteTask).toHaveBeenCalledWith('1');
      expect(mockToastSuccess).toHaveBeenCalled();
    });

    it('shows error when task not found for delete', () => {
      mockTaskState.tasks = [];
      render(<VoiceCommandPanel />);
      capturedOnCommand?.({
        success: true,
        command: { type: 'task:delete', rawText: '存在しないを削除', params: { query: '存在しない' } },
      });
      expect(mockDeleteTask).not.toHaveBeenCalled();
      expect(mockToastError).toHaveBeenCalled();
    });

    it('handles task:search command', () => {
      mockTaskState.tasks = [
        { id: '1', title: '検索タスク1', description: '', status: 'todo' },
        { id: '2', title: '検索タスク2', description: '', status: 'done' },
        { id: '3', title: '別のタスク', description: '', status: 'todo' },
      ];
      render(<VoiceCommandPanel />);
      capturedOnCommand?.({
        success: true,
        command: { type: 'task:search', rawText: '検索タスクを検索', params: { query: '検索タスク' } },
      });
      expect(mockToast).toHaveBeenCalledWith('検索結果: 2件', expect.any(Object));
    });

    it('handles task:search with description match', () => {
      mockTaskState.tasks = [
        { id: '1', title: 'タスク', description: '検索キーワード含む説明', status: 'todo' },
      ];
      render(<VoiceCommandPanel />);
      capturedOnCommand?.({
        success: true,
        command: { type: 'task:search', rawText: '検索キーワードを検索', params: { query: '検索キーワード' } },
      });
      expect(mockToast).toHaveBeenCalledWith('検索結果: 1件', expect.any(Object));
    });

    it('handles view:switch command', () => {
      render(<VoiceCommandPanel onViewSwitch={mockOnViewSwitch} />);
      capturedOnCommand?.({
        success: true,
        command: { type: 'view:switch', rawText: '分析に切り替え', params: { view: '分析' } },
      });
      expect(mockOnViewSwitch).toHaveBeenCalledWith('分析');
      expect(mockToastSuccess).toHaveBeenCalled();
    });

    it('does not switch view without callback', () => {
      render(<VoiceCommandPanel />);
      capturedOnCommand?.({
        success: true,
        command: { type: 'view:switch', rawText: '分析に切り替え', params: { view: '分析' } },
      });
      expect(mockOnViewSwitch).not.toHaveBeenCalled();
    });

    it('does not switch view without view param', () => {
      render(<VoiceCommandPanel onViewSwitch={mockOnViewSwitch} />);
      capturedOnCommand?.({
        success: true,
        command: { type: 'view:switch', rawText: 'に切り替え', params: {} },
      });
      expect(mockOnViewSwitch).not.toHaveBeenCalled();
    });

    it('shows error for unrecognized command', () => {
      render(<VoiceCommandPanel />);
      capturedOnCommand?.({
        success: false,
        command: { type: 'unknown', rawText: '意味不明', params: {} },
      });
      expect(mockToastError).toHaveBeenCalled();
    });

    it('handles unknown command type silently', () => {
      render(<VoiceCommandPanel />);
      capturedOnCommand?.({
        success: true,
        command: { type: 'other:unknown', rawText: '未知のコマンド', params: {} },
      });
      // Should not throw and no toast
      expect(mockToastError).not.toHaveBeenCalled();
      expect(mockToastSuccess).not.toHaveBeenCalled();
    });
  });

  describe('commandTypeLabel', () => {
    it('displays correct labels for known types', () => {
      mockVoiceState.commandHistory = [
        { success: true, command: { type: 'task:create', rawText: 'test', timestamp: Date.now(), params: {} } },
        { success: true, command: { type: 'task:complete', rawText: 'test', timestamp: Date.now(), params: {} } },
        { success: true, command: { type: 'task:delete', rawText: 'test', timestamp: Date.now(), params: {} } },
        { success: true, command: { type: 'task:search', rawText: 'test', timestamp: Date.now(), params: {} } },
        { success: true, command: { type: 'view:switch', rawText: 'test', timestamp: Date.now(), params: {} } },
      ];
      render(<VoiceCommandPanel />);
      expect(screen.getByText('タスク作成')).toBeDefined();
      expect(screen.getByText('タスク完了')).toBeDefined();
      expect(screen.getByText('タスク削除')).toBeDefined();
      expect(screen.getByText('タスク検索')).toBeDefined();
      expect(screen.getByText('ビュー切替')).toBeDefined();
    });

    it('displays type as-is for unknown types', () => {
      mockVoiceState.commandHistory = [
        { success: true, command: { type: 'custom:type', rawText: 'test', timestamp: Date.now(), params: {} } },
      ];
      render(<VoiceCommandPanel />);
      expect(screen.getByText('custom:type')).toBeDefined();
    });
  });
});
