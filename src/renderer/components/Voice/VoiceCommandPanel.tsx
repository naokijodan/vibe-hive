import React, { useCallback } from 'react';
import { useVoiceCommand } from '../../hooks/useVoiceCommand';
import { useTaskStore } from '../../stores/taskStore';
import type { VoiceCommandResult } from '../../../shared/types/voice';
import toast from 'react-hot-toast';

interface VoiceCommandPanelProps {
  onViewSwitch?: (view: string) => void;
}

export function VoiceCommandPanel({ onViewSwitch }: VoiceCommandPanelProps): React.ReactElement {
  const { addTask, tasks, updateTaskStatus, deleteTask } = useTaskStore();

  const handleCommand = useCallback((result: VoiceCommandResult) => {
    const { command } = result;

    if (!result.success) {
      toast.error(`認識できないコマンド: "${command.rawText}"`);
      return;
    }

    switch (command.type) {
      case 'task:create': {
        const title = command.params.title;
        if (title) {
          addTask({
            title,
            description: '',
            status: 'todo',
            priority: 'medium',
            tags: ['voice-created'],
          });
          toast.success(`タスク作成: "${title}"`);
        }
        break;
      }
      case 'task:complete': {
        const query = command.params.query;
        const task = tasks.find(t =>
          t.title.includes(query) && t.status !== 'done'
        );
        if (task) {
          updateTaskStatus(task.id, 'done');
          toast.success(`タスク完了: "${task.title}"`);
        } else {
          toast.error(`タスクが見つかりません: "${query}"`);
        }
        break;
      }
      case 'task:delete': {
        const query = command.params.query;
        const task = tasks.find(t => t.title.includes(query));
        if (task) {
          deleteTask(task.id);
          toast.success(`タスク削除: "${task.title}"`);
        } else {
          toast.error(`タスクが見つかりません: "${query}"`);
        }
        break;
      }
      case 'task:search': {
        const query = command.params.query;
        const found = tasks.filter(t =>
          t.title.includes(query) || (t.description && t.description.includes(query))
        );
        toast(`検索結果: ${found.length}件`, { icon: '🔍' });
        break;
      }
      case 'view:switch': {
        const view = command.params.view;
        if (view && onViewSwitch) {
          onViewSwitch(view);
          toast.success(`ビュー切替: ${view}`);
        }
        break;
      }
      default:
        break;
    }
  }, [addTask, tasks, updateTaskStatus, deleteTask, onViewSwitch]);

  const {
    isListening, isSupported, transcript, interimTranscript,
    error, commandHistory, toggleListening, clearHistory,
  } = useVoiceCommand({ onCommand: handleCommand });

  const commandTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'task:create': 'タスク作成',
      'task:complete': 'タスク完了',
      'task:delete': 'タスク削除',
      'task:search': 'タスク検索',
      'view:switch': 'ビュー切替',
      'unknown': '不明',
    };
    return labels[type] || type;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-hive-border">
        <h2 className="text-xl font-bold">音声コマンド</h2>
        <p className="text-sm text-hive-muted mt-1">音声でタスクを操作できます</p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Mic Button */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={toggleListening}
            disabled={!isSupported}
            className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-all ${
              isListening
                ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/50'
                : isSupported
                  ? 'bg-hive-surface border-2 border-hive-border hover:border-hive-accent text-hive-muted hover:text-white'
                  : 'bg-hive-surface border-2 border-hive-border text-hive-muted opacity-50 cursor-not-allowed'
            }`}
          >
            🎙
          </button>
          <span className={`text-sm font-medium ${isListening ? 'text-red-400' : 'text-hive-muted'}`}>
            {isListening ? '音声認識中...' : isSupported ? 'クリックして開始' : '音声認識非対応'}
          </span>
        </div>

        {/* Transcript */}
        {(transcript || interimTranscript) && (
          <div className="p-4 bg-hive-surface border border-hive-border rounded-lg">
            <div className="text-xs text-hive-muted mb-1 uppercase font-semibold">認識テキスト</div>
            {transcript && <div className="text-sm text-white">{transcript}</div>}
            {interimTranscript && (
              <div className="text-sm text-hive-muted italic">{interimTranscript}</div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700 rounded text-sm text-red-300">{error}</div>
        )}

        {/* Command Reference */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-hive-muted uppercase">使えるコマンド</h3>
          <div className="grid gap-2 text-sm">
            {[
              { cmd: 'タスク作成 〇〇', desc: '新しいタスクを作成' },
              { cmd: '〇〇を完了', desc: 'タスクを完了に移動' },
              { cmd: '〇〇を削除', desc: 'タスクを削除' },
              { cmd: '〇〇を検索', desc: 'タスクを検索' },
              { cmd: '〇〇に切り替え', desc: 'ビューを切替（タスクボード、分析等）' },
            ].map(({ cmd, desc }) => (
              <div key={cmd} className="flex items-center gap-3 p-2 bg-hive-bg rounded">
                <code className="text-hive-accent text-xs px-2 py-0.5 bg-hive-surface rounded">{cmd}</code>
                <span className="text-hive-muted">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Command History */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-hive-muted uppercase">コマンド履歴</h3>
            {commandHistory.length > 0 && (
              <button onClick={clearHistory} className="text-xs text-hive-muted hover:text-white">
                クリア
              </button>
            )}
          </div>
          {commandHistory.length === 0 ? (
            <p className="text-sm text-hive-muted py-4 text-center">履歴はありません</p>
          ) : (
            <div className="space-y-1">
              {commandHistory.map((result, i) => (
                <div
                  key={i}
                  className={`p-2 rounded text-sm flex items-center gap-2 ${
                    result.success ? 'bg-green-900/20 border border-green-800' : 'bg-red-900/20 border border-red-800'
                  }`}
                >
                  <span>{result.success ? '✓' : '✗'}</span>
                  <span className="text-xs px-1.5 py-0.5 bg-hive-surface rounded">
                    {commandTypeLabel(result.command.type)}
                  </span>
                  <span className="text-hive-muted truncate">"{result.command.rawText}"</span>
                  <span className="text-xs text-hive-muted ml-auto shrink-0">
                    {new Date(result.command.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
