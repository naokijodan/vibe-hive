import React, { useEffect, useState } from 'react';
import type { WorkflowExecution } from '../../../shared/types/workflow';
import { useWorkflowStore } from '../../stores/workflowStore';

interface ExecutionHistoryProps {
  workflowId: number | null;
  onSelectExecution: (execution: WorkflowExecution) => void;
  selectedExecutionId?: number | null;
}

export const ExecutionHistory: React.FC<ExecutionHistoryProps> = ({
  workflowId,
  onSelectExecution,
  selectedExecutionId,
}) => {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadExecutions = useWorkflowStore(state => state.loadExecutions);

  useEffect(() => {
    if (workflowId) {
      loadExecutionHistory();
    } else {
      setExecutions([]);
    }
  }, [workflowId]);

  const loadExecutionHistory = async () => {
    if (!workflowId) return;
    setIsLoading(true);
    const result = await loadExecutions(workflowId);
    setExecutions(result);
    setIsLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return (
          <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'cancelled':
        return (
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'success':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'failed':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'cancelled':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  const formatDuration = (startedAt: number, completedAt?: number) => {
    if (!completedAt) return 'Running...';
    const duration = completedAt - startedAt;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (!workflowId) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center px-6">
          <svg
            className="w-16 h-16 mx-auto text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-gray-400">
            Select a workflow to view execution history
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto text-blue-500 animate-spin mb-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-sm text-gray-400">Loading execution history...</p>
        </div>
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center px-6">
          <svg
            className="w-16 h-16 mx-auto text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-sm text-gray-400 mb-1">No execution history yet</p>
          <p className="text-xs text-gray-500">Execute the workflow to see results here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 p-4 overflow-y-auto">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Execution History</h2>
        <button
          onClick={loadExecutionHistory}
          className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {executions.map(execution => (
          <div
            key={execution.id}
            onClick={() => onSelectExecution(execution)}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-colors
              ${
                selectedExecutionId === execution.id
                  ? 'bg-gray-700 border-blue-500'
                  : 'bg-gray-800 border-gray-700 hover:border-gray-600'
              }
            `}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getStatusIcon(execution.status)}
                <span className="text-sm font-medium text-white">
                  Execution #{execution.id}
                </span>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(
                  execution.status
                )}`}
              >
                {execution.status}
              </span>
            </div>

            <div className="space-y-1 text-xs text-gray-400">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Started {formatDate(execution.startedAt)}</span>
              </div>

              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>Duration: {formatDuration(execution.startedAt, execution.completedAt)}</span>
              </div>

              {execution.error && (
                <div className="mt-2 p-2 bg-red-900/20 border border-red-700 rounded">
                  <p className="text-xs text-red-400">{execution.error}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
