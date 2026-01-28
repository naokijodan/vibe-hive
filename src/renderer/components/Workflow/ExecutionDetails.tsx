import React, { useState } from 'react';
import type { WorkflowExecution } from '../../../shared/types/workflow';
import { ExecutionLogViewer } from './ExecutionLogViewer';

interface ExecutionDetailsProps {
  execution: WorkflowExecution | null;
}

export const ExecutionDetails: React.FC<ExecutionDetailsProps> = ({ execution }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  if (!execution) {
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm text-gray-400">
            Select an execution to view details
          </p>
        </div>
      </div>
    );
  }

  const executionData = execution.executionData || {};
  const nodeResults = Object.entries(executionData);

  const getNodeStatusIcon = (result: any) => {
    if (result.status === 'success') {
      return (
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else if (result.status === 'failed' || result.error) {
      return (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else if (result.status === 'skipped') {
      return (
        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="flex h-full bg-gray-900">
      {/* Left: Node Results */}
      <div className="w-2/3 border-r border-gray-700 overflow-y-auto">
        <div className="p-6">
          {/* Execution Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-2">
              Execution #{execution.id}
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Status:</span>{' '}
                <span className={`
                  font-medium
                  ${execution.status === 'success' ? 'text-green-400' : ''}
                  ${execution.status === 'failed' ? 'text-red-400' : ''}
                  ${execution.status === 'running' ? 'text-blue-400' : ''}
                  ${execution.status === 'cancelled' ? 'text-gray-400' : ''}
                `}>
                  {execution.status}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Started:</span>{' '}
                <span className="text-gray-300">{formatDate(execution.startedAt)}</span>
              </div>
              {execution.completedAt && (
                <div>
                  <span className="text-gray-500">Completed:</span>{' '}
                  <span className="text-gray-300">{formatDate(execution.completedAt)}</span>
                </div>
              )}
              {execution.completedAt && (
                <div>
                  <span className="text-gray-500">Duration:</span>{' '}
                  <span className="text-gray-300">
                    {formatDuration(execution.completedAt - execution.startedAt)}
                  </span>
                </div>
              )}
            </div>

            {execution.error && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
                <div className="flex items-start space-x-2">
                  <svg
                    className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-400">Execution Error</p>
                    <p className="text-sm text-red-300 mt-1">{execution.error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Node Results */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Node Results</h3>
            {nodeResults.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No node results available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {nodeResults.map(([nodeId, result]: [string, any]) => (
                  <div
                    key={nodeId}
                    onClick={() => setSelectedNodeId(nodeId)}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-colors
                      ${
                        selectedNodeId === nodeId
                          ? 'bg-gray-700 border-blue-500'
                          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getNodeStatusIcon(result)}
                        <div>
                          <div className="text-sm font-medium text-white">{nodeId}</div>
                          <div className="text-xs text-gray-500">
                            {result.duration ? `${formatDuration(result.duration)}` : 'N/A'}
                          </div>
                        </div>
                      </div>
                      <span className={`
                        px-2 py-1 text-xs font-medium rounded
                        ${result.status === 'success' ? 'bg-green-500/10 text-green-400' : ''}
                        ${result.status === 'failed' || result.error ? 'bg-red-500/10 text-red-400' : ''}
                        ${result.status === 'skipped' ? 'bg-yellow-500/10 text-yellow-400' : ''}
                      `}>
                        {result.status || (result.error ? 'failed' : 'unknown')}
                      </span>
                    </div>

                    {result.error && (
                      <div className="mt-2 p-2 bg-red-900/20 border border-red-700 rounded text-xs text-red-400">
                        {result.error}
                      </div>
                    )}

                    {result.output && (
                      <div className="mt-2 text-xs">
                        <span className="text-gray-500">Output: </span>
                        <span className="text-gray-300 font-mono">
                          {typeof result.output === 'string'
                            ? result.output.substring(0, 100)
                            : JSON.stringify(result.output).substring(0, 100)}
                          {(typeof result.output === 'string' ? result.output.length : JSON.stringify(result.output).length) > 100 ? '...' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Log Viewer */}
      <div className="w-1/3">
        <ExecutionLogViewer
          execution={execution}
          selectedNodeId={selectedNodeId}
        />
      </div>
    </div>
  );
};
