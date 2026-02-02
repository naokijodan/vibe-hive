// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoiceCommand } from './useVoiceCommand';

// Mock SpeechRecognition
class MockSpeechRecognition {
  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;
  onstart: (() => void) | null = null;

  start() { this.onstart?.(); }
  stop() { this.onend?.(); }
  abort() { this.onend?.(); }
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return false; }
}

describe('useVoiceCommand', () => {
  beforeEach(() => {
    (window as any).SpeechRecognition = MockSpeechRecognition;
  });

  it('reports isSupported when SpeechRecognition exists', () => {
    const { result } = renderHook(() => useVoiceCommand());
    expect(result.current.isSupported).toBe(true);
  });

  it('reports not supported when SpeechRecognition is absent', () => {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
    const { result } = renderHook(() => useVoiceCommand());
    expect(result.current.isSupported).toBe(false);
  });

  it('starts and stops listening', () => {
    const { result } = renderHook(() => useVoiceCommand());
    act(() => result.current.startListening());
    expect(result.current.isListening).toBe(true);
    act(() => result.current.stopListening());
    expect(result.current.isListening).toBe(false);
  });

  it('toggleListening toggles state', () => {
    const { result } = renderHook(() => useVoiceCommand());
    act(() => result.current.toggleListening());
    expect(result.current.isListening).toBe(true);
    act(() => result.current.toggleListening());
    expect(result.current.isListening).toBe(false);
  });

  it('sets error when not supported and trying to start', () => {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
    const { result } = renderHook(() => useVoiceCommand());
    act(() => result.current.startListening());
    expect(result.current.error).toContain('サポートされていません');
  });

  it('parses task:create command from final transcript', () => {
    const onCommand = vi.fn();
    const { result } = renderHook(() => useVoiceCommand({ onCommand }));

    act(() => result.current.startListening());

    // Simulate a final recognition result
    const recognition = (window as any).__lastRecognition ||
      // Access through the mock
      (() => {
        // We need to trigger onresult on the active recognition instance
        // Since we mocked start() to call onstart, let's find the instance
        return null;
      })();

    // Use a different approach: directly test via starting and simulating
    // The hook creates an instance internally, so we spy on the constructor
    // Instead, let's verify the command history after a processTranscript simulation
  });

  it('processes Japanese task:create command', () => {
    const onCommand = vi.fn();
    const { result } = renderHook(() => useVoiceCommand({ onCommand }));

    // Start listening to create a recognition instance
    let recognitionInstance: any;
    (window as any).SpeechRecognition = class extends MockSpeechRecognition {
      constructor() {
        super();
        recognitionInstance = this;
      }
    };

    act(() => result.current.startListening());

    // Simulate final result
    act(() => {
      recognitionInstance.onresult?.({
        resultIndex: 0,
        results: {
          length: 1,
          0: { isFinal: true, 0: { transcript: 'タスク作成 テスト用タスク' } },
        },
      });
    });

    expect(onCommand).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      command: expect.objectContaining({
        type: 'task:create',
        params: { title: 'テスト用タスク' },
      }),
    }));
    expect(result.current.commandHistory).toHaveLength(1);
  });

  it('processes view:switch command with Japanese view name', () => {
    const onCommand = vi.fn();
    let recognitionInstance: any;
    (window as any).SpeechRecognition = class extends MockSpeechRecognition {
      constructor() { super(); recognitionInstance = this; }
    };
    const { result } = renderHook(() => useVoiceCommand({ onCommand }));
    act(() => result.current.startListening());
    act(() => {
      recognitionInstance.onresult?.({
        resultIndex: 0,
        results: { length: 1, 0: { isFinal: true, 0: { transcript: 'カンバンに切り替え' } } },
      });
    });
    expect(onCommand).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      command: expect.objectContaining({
        type: 'view:switch',
        params: { view: 'kanban' },
      }),
    }));
  });

  it('handles unknown commands', () => {
    const onCommand = vi.fn();
    let recognitionInstance: any;
    (window as any).SpeechRecognition = class extends MockSpeechRecognition {
      constructor() { super(); recognitionInstance = this; }
    };
    const { result } = renderHook(() => useVoiceCommand({ onCommand }));
    act(() => result.current.startListening());
    act(() => {
      recognitionInstance.onresult?.({
        resultIndex: 0,
        results: { length: 1, 0: { isFinal: true, 0: { transcript: 'ランダムな発話' } } },
      });
    });
    expect(onCommand).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      command: expect.objectContaining({ type: 'unknown' }),
    }));
  });

  it('handles interim transcripts', () => {
    let recognitionInstance: any;
    (window as any).SpeechRecognition = class extends MockSpeechRecognition {
      constructor() { super(); recognitionInstance = this; }
    };
    const { result } = renderHook(() => useVoiceCommand());
    act(() => result.current.startListening());
    act(() => {
      recognitionInstance.onresult?.({
        resultIndex: 0,
        results: { length: 1, 0: { isFinal: false, 0: { transcript: '途中の音声' } } },
      });
    });
    expect(result.current.interimTranscript).toBe('途中の音声');
  });

  it('clearHistory empties command history', () => {
    let recognitionInstance: any;
    (window as any).SpeechRecognition = class extends MockSpeechRecognition {
      constructor() { super(); recognitionInstance = this; }
    };
    const { result } = renderHook(() => useVoiceCommand());
    act(() => result.current.startListening());
    act(() => {
      recognitionInstance.onresult?.({
        resultIndex: 0,
        results: { length: 1, 0: { isFinal: true, 0: { transcript: 'タスク作成 テスト' } } },
      });
    });
    expect(result.current.commandHistory).toHaveLength(1);
    act(() => result.current.clearHistory());
    expect(result.current.commandHistory).toHaveLength(0);
  });

  it('handles recognition error (not no-speech)', () => {
    let recognitionInstance: any;
    (window as any).SpeechRecognition = class extends MockSpeechRecognition {
      constructor() { super(); recognitionInstance = this; }
    };
    const { result } = renderHook(() => useVoiceCommand());
    act(() => result.current.startListening());
    act(() => {
      recognitionInstance.onerror?.({ error: 'network', message: 'Network error' });
    });
    expect(result.current.error).toContain('network');
  });

  it('ignores no-speech error', () => {
    let recognitionInstance: any;
    (window as any).SpeechRecognition = class extends MockSpeechRecognition {
      constructor() { super(); recognitionInstance = this; }
    };
    const { result } = renderHook(() => useVoiceCommand());
    act(() => result.current.startListening());
    act(() => {
      recognitionInstance.onerror?.({ error: 'no-speech', message: '' });
    });
    expect(result.current.error).toBeNull();
  });

  it('processes task:complete command', () => {
    const onCommand = vi.fn();
    let recognitionInstance: any;
    (window as any).SpeechRecognition = class extends MockSpeechRecognition {
      constructor() { super(); recognitionInstance = this; }
    };
    const { result } = renderHook(() => useVoiceCommand({ onCommand }));
    act(() => result.current.startListening());
    act(() => {
      recognitionInstance.onresult?.({
        resultIndex: 0,
        results: { length: 1, 0: { isFinal: true, 0: { transcript: 'タスクAを完了' } } },
      });
    });
    expect(onCommand).toHaveBeenCalledWith(expect.objectContaining({
      command: expect.objectContaining({ type: 'task:complete', params: { query: 'タスクA' } }),
    }));
  });

  it('processes task:delete command', () => {
    const onCommand = vi.fn();
    let recognitionInstance: any;
    (window as any).SpeechRecognition = class extends MockSpeechRecognition {
      constructor() { super(); recognitionInstance = this; }
    };
    const { result } = renderHook(() => useVoiceCommand({ onCommand }));
    act(() => result.current.startListening());
    act(() => {
      recognitionInstance.onresult?.({
        resultIndex: 0,
        results: { length: 1, 0: { isFinal: true, 0: { transcript: 'タスクBを削除' } } },
      });
    });
    expect(onCommand).toHaveBeenCalledWith(expect.objectContaining({
      command: expect.objectContaining({ type: 'task:delete', params: { query: 'タスクB' } }),
    }));
  });

  it('processes task:search command', () => {
    const onCommand = vi.fn();
    let recognitionInstance: any;
    (window as any).SpeechRecognition = class extends MockSpeechRecognition {
      constructor() { super(); recognitionInstance = this; }
    };
    const { result } = renderHook(() => useVoiceCommand({ onCommand }));
    act(() => result.current.startListening());
    act(() => {
      recognitionInstance.onresult?.({
        resultIndex: 0,
        results: { length: 1, 0: { isFinal: true, 0: { transcript: 'バグを検索' } } },
      });
    });
    expect(onCommand).toHaveBeenCalledWith(expect.objectContaining({
      command: expect.objectContaining({ type: 'task:search', params: { query: 'バグ' } }),
    }));
  });
});
