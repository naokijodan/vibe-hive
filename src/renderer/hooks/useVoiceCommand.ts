import { useState, useCallback, useRef, useEffect } from 'react';
import type { VoiceCommand, VoiceCommandResult, VoiceCommandType } from '../../shared/types/voice';

// Extend Window for SpeechRecognition
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

// Command patterns (Japanese)
interface CommandPattern {
  type: VoiceCommandType;
  patterns: RegExp[];
  extractParams: (match: RegExpMatchArray, text: string) => Record<string, string>;
}

const COMMAND_PATTERNS: CommandPattern[] = [
  {
    type: 'task:create',
    patterns: [
      /タスク作成\s*(.+)/,
      /タスクを作成\s*(.+)/,
      /(.+)を作成/,
      /新しいタスク\s*(.+)/,
      /create task\s+(.+)/i,
    ],
    extractParams: (match) => ({ title: match[1]?.trim() || '' }),
  },
  {
    type: 'task:complete',
    patterns: [
      /(.+)を完了/,
      /(.+)を終了/,
      /(.+)完了/,
      /complete\s+(.+)/i,
    ],
    extractParams: (match) => ({ query: match[1]?.trim() || '' }),
  },
  {
    type: 'task:delete',
    patterns: [
      /(.+)を削除/,
      /(.+)を消して/,
      /delete\s+(.+)/i,
    ],
    extractParams: (match) => ({ query: match[1]?.trim() || '' }),
  },
  {
    type: 'task:search',
    patterns: [
      /(.+)を検索/,
      /(.+)を探して/,
      /タスク検索\s*(.+)/,
      /search\s+(.+)/i,
    ],
    extractParams: (match) => ({ query: match[1]?.trim() || '' }),
  },
  {
    type: 'view:switch',
    patterns: [
      /(タスクボード|カンバン|組織|依存|実行|ワークフロー|履歴|分析|設定|プロファイラー|コラボ|テーマ|プラグイン)に切り替え/,
      /(タスクボード|カンバン|組織|依存|実行|ワークフロー|履歴|分析|設定|プロファイラー|コラボ|テーマ|プラグイン)を表示/,
      /show\s+(kanban|organization|dependencies|execution|workflow|history|analytics|settings)/i,
    ],
    extractParams: (match) => ({ view: match[1]?.trim() || '' }),
  },
];

const VIEW_MAP: Record<string, string> = {
  'タスクボード': 'kanban',
  'カンバン': 'kanban',
  '組織': 'organization',
  '依存': 'dependencies',
  '実行': 'execution',
  'ワークフロー': 'workflow',
  '履歴': 'history',
  '分析': 'analytics',
  '設定': 'settings',
  'プロファイラー': 'profiler',
  'コラボ': 'collaboration',
  'テーマ': 'theme',
  'プラグイン': 'plugins',
};

function parseCommand(text: string): VoiceCommand {
  const normalized = text.trim();

  for (const pattern of COMMAND_PATTERNS) {
    for (const regex of pattern.patterns) {
      const match = normalized.match(regex);
      if (match) {
        const params = pattern.extractParams(match, normalized);
        // Resolve view name
        if (pattern.type === 'view:switch' && params.view) {
          params.view = VIEW_MAP[params.view] || params.view.toLowerCase();
        }
        return {
          type: pattern.type,
          rawText: normalized,
          params,
          confidence: 1.0,
          timestamp: Date.now(),
        };
      }
    }
  }

  return {
    type: 'unknown',
    rawText: normalized,
    params: {},
    confidence: 0,
    timestamp: Date.now(),
  };
}

interface UseVoiceCommandOptions {
  onCommand?: (result: VoiceCommandResult) => void;
  lang?: string;
}

export function useVoiceCommand(options: UseVoiceCommandOptions = {}) {
  const { onCommand, lang = 'ja-JP' } = options;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [commandHistory, setCommandHistory] = useState<VoiceCommandResult[]>([]);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const isSupported = typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const processTranscript = useCallback((text: string) => {
    if (!text.trim()) return;
    const command = parseCommand(text);
    const result: VoiceCommandResult = {
      success: command.type !== 'unknown',
      command,
      message: command.type === 'unknown'
        ? `認識できないコマンド: "${text}"`
        : `${command.type}: ${JSON.stringify(command.params)}`,
    };
    setCommandHistory(prev => [result, ...prev].slice(0, 50));
    onCommand?.(result);
  }, [onCommand]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('音声認識はこのブラウザでサポートされていません');
      return;
    }

    setError(null);
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (final) {
        setTranscript(final);
        setInterimTranscript('');
        processTranscript(final);
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech') {
        setError(`音声認識エラー: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, lang, processTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const clearHistory = useCallback(() => {
    setCommandHistory([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    commandHistory,
    startListening,
    stopListening,
    toggleListening,
    clearHistory,
  };
}
