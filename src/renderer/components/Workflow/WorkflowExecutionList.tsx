import React, { useEffect, useState } from 'react';
import type { WorkflowExecution } from '../../../shared/types/workflow';
import { useWorkflowStore } from '../../stores/workflowStore';

interface WorkflowExecutionListProps {
  workflowId: number;
}

export const WorkflowExecutionList: React.FC<WorkflowExecutionListProps> = ({ workflowId }) => {
  const { loadExecutions } = useWorkflowStore();
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);

  useEffect(() => {
    loadExecutionList();
  }, [workflowId]);

  const loadExecutionList = async () => {
    setIsLoading(true);
    try {
      const result = await loadExecutions(workflowId);
      setExecutions(result);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: WorkflowExecution['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-400 bg-green-900/30 border-green-700';
      case 'failed':
        return 'text-red-400 bg-red-900/30 border-red-700';
      case 'running':
        return 'text-blue-400 bg-blue-900/30 border-blue-700';
      case 'cancelled':
        return 'text-gray-400 bg-gray-700/30 border-gray-600';
      default:
        return 'text-gray-400 bg-gray-700/30 border-gray-600';
    }
  };

  const getStatusIcon = (status: WorkflowExecution['status']) => {
    switch (status) {
      case 'success':
        return '';
      case 'failed':
        return '';
      case 'running':
        return 'ó';
      case 'cancelled':
        return 'Ë';
      default:
        return '?';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getDuration = (execution: WorkflowExecution): string => {
    if (!execution.completedAt) {
      return 'Running...';
    }
    const duration = execution.completedAt - execution.startedAt;
    const seconds = Math.floor(duration / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">Loading execution history...</p>
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">No executions yet</p>
        <p className="text-xs text-gray-600 mt-1">Run this workflow to see execution history</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-white">Execution History</h3>
        <p className="text-xs text-gray-500">{executions.length} execution{executions.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-2">
          {executions.map((execution) => (
            <div
              key={execution.id}
              className={`
                p-3 rounded-lg border-2 cursor-pointer transition-all
                ${
                  selectedExecution?.id === execution.id
                    ? 'bg-blue-900/30 border-blue-500'
                    : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                }
              `}
              onClick={() => setSelectedExecution(execution)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`
                      text-sm font-mono font-semibold
                      ${getStatusColor(execution.status).split(' ')[0]}
                    `}
                  >
                    {getStatusIcon(execution.status)}
                  </span>
                  <div>
                    <div className="text-sm text-white font-medium">Execution #{execution.id}</div>
                    <div className="text-xs text-gray-500">{formatDate(execution.startedAt)}</div>
                  </div>
                </div>
                <span
                  className={`
                    px-2 py-0.5 text-xs rounded border
                    ${getStatusColor(execution.status)}
                  `}
                >
                  {execution.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Duration: {getDuration(execution)}</span>
              </div>

              {execution.error && (
                <div className="mt-2 p-2 bg-red-900/30 rounded border border-red-700">
                  <p className="text-xs text-red-300">{execution.error}</p>
                </div>
              )}

              {selectedExecution?.id === execution.id && execution.executionData && (
                <div className="mt-3 p-2 bg-gray-800 rounded">
                  <p className="text-xs text-gray-500 mb-1 font-semibold">Execution Data:</p>
                  <pre className="text-xs text-gray-400 font-mono overflow-x-auto max-h-40">
                    {JSON.stringify(execution.executionData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
