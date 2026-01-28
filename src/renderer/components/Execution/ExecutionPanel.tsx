import React, { useEffect } from 'react';
import { useExecutionStore } from '../../stores/executionStore';
import { useTaskStore } from '../../stores/taskStore';
import type { ExecutionRecord } from '../../../shared/types/execution';

interface ExecutionPanelProps {
  onSelectExecution?: (execution: ExecutionRecord) => void;
}

const statusColors = {
  running: { bg: 'bg-blue-900/50', text: 'text-blue-300', border: 'border-blue-500' },
  completed: { bg: 'bg-green-900/50', text: 'text-green-300', border: 'border-green-500' },
  failed: { bg: 'bg-red-900/50', text: 'text-red-300', border: 'border-red-500' },
  cancelled: { bg: 'bg-gray-900/50', text: 'text-gray-400', border: 'border-gray-500' },
};

const statusIcons = {
  running: '⚙',
  completed: '✓',
  failed: '✗',
  cancelled: '⊘',
};

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({ onSelectExecution }) => {
  const {
    runningExecutions,
    executions,
    loadRunningExecutions,
    loadExecutions,
    cancelExecution,
    selectedExecutionId,
    setSelectedExecution,
  } = useExecutionStore();
  const { tasks } = useTaskStore();

  // Load executions on mount
  useEffect(() => {
    loadRunningExecutions();
    loadExecutions();
  }, [loadRunningExecutions, loadExecutions]);

  // Auto-refresh running executions every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (runningExecutions.length > 0) {
        loadRunningExecutions();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [runningExecutions.length, loadRunningExecutions]);

  const handleCancelExecution = async (executionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('実行をキャンセルしますか？')) {
      try {
        await cancelExecution(executionId);
      } catch (error) {
        console.error('Failed to cancel execution:', error);
      }
    }
  };

  const handleSelectExecution = (execution: ExecutionRecord) => {
    setSelectedExecution(execution.id);
    onSelectExecution?.(execution);
  };

  const getTaskTitle = (taskId: string): string => {
    const task = tasks.find((t) => t.id === taskId);
    return task?.title || 'Unknown Task';
  };

  const formatTime = (date: Date | string | undefined): string => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDuration = (startedAt: Date | string, completedAt?: Date | string): string => {
    const start = typeof startedAt === 'string' ? new Date(startedAt) : startedAt;
    const end = completedAt
      ? typeof completedAt === 'string'
        ? new Date(completedAt)
        : completedAt
      : new Date();
    const durationMs = end.getTime() - start.getTime();
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const allExecutions = [
    ...runningExecutions.map((e) => ({ ...e, isRunning: true })),
    ...executions
      .filter((e) => !runningExecutions.some((re) => re.id === e.id))
      .map((e) => ({ ...e, isRunning: false })),
  ];

  return (
    <div className="h-full flex flex-col bg-hive-bg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-hive-border">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">実行管理</h2>
          {runningExecutions.length > 0 && (
            <span className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded-full">
              {runningExecutions.length} 実行中
            </span>
          )}
        </div>
        <button
          onClick={() => loadExecutions()}
          className="text-xs text-hive-muted hover:text-hive-accent transition-colors"
          title="更新"
        >
          🔄 更新
        </button>
      </div>

      {/* Execution List */}
      <div className="flex-1 overflow-y-auto">
        {allExecutions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-hive-muted">
            <p className="text-sm">実行履歴がありません</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {allExecutions.map((execution) => {
              const colors = statusColors[execution.status];
              const isSelected = selectedExecutionId === execution.id;

              return (
                <div
                  key={execution.id}
                  onClick={() => handleSelectExecution(execution)}
                  className={`
                    ${colors.bg} border ${colors.border}
                    rounded-lg p-3 cursor-pointer
                    transition-all hover:border-hive-accent/50
                    ${isSelected ? 'ring-2 ring-hive-accent' : ''}
                  `}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg ${execution.status === 'running' ? 'animate-spin' : ''}`}
                      >
                        {statusIcons[execution.status]}
                      </span>
                      <span className="text-sm font-medium text-white">
                        {getTaskTitle(execution.taskId)}
                      </span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                      {execution.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="text-xs text-hive-muted space-y-1">
                    <div className="flex justify-between">
                      <span>開始時刻:</span>
                      <span className="text-white">{formatTime(execution.startedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>実行時間:</span>
                      <span className="text-white">
                        {formatDuration(execution.startedAt, execution.completedAt)}
                      </span>
                    </div>
                    {execution.exitCode !== undefined && (
                      <div className="flex justify-between">
                        <span>終了コード:</span>
                        <span
                          className={execution.exitCode === 0 ? 'text-green-400' : 'text-red-400'}
                        >
                          {execution.exitCode}
                        </span>
                      </div>
                    )}
                    {execution.errorMessage && (
                      <div className="mt-1 p-2 bg-red-950/50 rounded text-red-300 text-[10px]">
                        {execution.errorMessage}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {execution.status === 'running' && (
                    <div className="mt-2 pt-2 border-t border-hive-border/30">
                      <button
                        onClick={(e) => handleCancelExecution(execution.id, e)}
                        className="text-[10px] px-2 py-1 bg-red-600/80 text-white rounded hover:bg-red-500 transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
