// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { VoiceCommandPanel } from './VoiceCommandPanel';

vi.mock('../../hooks/useVoiceCommand', () => ({
  useVoiceCommand: () => ({
    isListening: false,
    isSupported: true,
    transcript: '',
    interimTranscript: '',
    error: null,
    commandHistory: [],
    toggleListening: vi.fn(),
    clearHistory: vi.fn(),
  }),
}));

vi.mock('../../stores/taskStore', () => ({
  useTaskStore: () => ({
    addTask: vi.fn(),
    tasks: [],
    updateTaskStatus: vi.fn(),
    deleteTask: vi.fn(),
  }),
}));

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

describe('VoiceCommandPanel', () => {
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
});
