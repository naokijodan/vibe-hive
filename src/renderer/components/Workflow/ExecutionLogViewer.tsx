import React, { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { WorkflowExecution } from '../../../shared/types/workflow';

interface ExecutionLogViewerProps {
  execution: WorkflowExecution | null;
  selectedNodeId: string | null;
}

export const ExecutionLogViewer: React.FC<ExecutionLogViewerProps> = ({
  execution,
  selectedNodeId,
}) => {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const logs = useMemo(() => {
    if (!execution || !selectedNodeId) return [];

    const executionData = execution.executionData || {};
    const nodeResult = executionData[selectedNodeId];

    if (!nodeResult) return [];

    // Extract logs from node result
    const logLines: string[] = [];

    if (nodeResult.output) {
      if (typeof nodeResult.output === 'string') {
        logLines.push(...nodeResult.output.split('\n'));
      } else if (nodeResult.output.stdout) {
        logLines.push('=== STDOUT ===');
        logLines.push(...nodeResult.output.stdout.split('\n'));
      }

      if (nodeResult.output.stderr) {
        logLines.push('=== STDERR ===');
        logLines.push(...nodeResult.output.stderr.split('\n'));
      }
    }

    if (nodeResult.error) {
      logLines.push('=== ERROR ===');
      logLines.push(nodeResult.error);
    }

    if (nodeResult.logs && Array.isArray(nodeResult.logs)) {
      logLines.push(...nodeResult.logs);
    }

    return logLines.filter(line => line !== undefined && line !== null);
  }, [execution, selectedNodeId]);

  const virtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 20,
    overscan: 10,
  });

  if (!execution) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center">
        <p className="text-sm text-gray-500">No execution selected</p>
      </div>
    );
  }

  if (!selectedNodeId) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto text-gray-600 mb-3"
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
          <p className="text-sm text-gray-400">Select a node to view logs</p>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto text-gray-600 mb-3"
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
          <p className="text-sm text-gray-400">No logs available for this node</p>
        </div>
      </div>
    );
  }

  const getLineColor = (line: string) => {
    if (line.startsWith('===')) return 'text-blue-400 font-semibold';
    if (line.toLowerCase().includes('error')) return 'text-red-400';
    if (line.toLowerCase().includes('warning')) return 'text-yellow-400';
    if (line.toLowerCase().includes('success')) return 'text-green-400';
    return 'text-gray-300';
  };

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 bg-gray-800">
        <h3 className="text-sm font-semibold text-white">Node Logs</h3>
        <p className="text-xs text-gray-500 mt-1">{selectedNodeId}</p>
      </div>

      {/* Log Content with Virtual Scrolling */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto bg-gray-950 font-mono text-xs"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map(virtualRow => (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="px-3 py-0.5"
            >
              <div className="flex items-start space-x-3">
                <span className="text-gray-600 select-none min-w-[3ch] text-right">
                  {virtualRow.index + 1}
                </span>
                <span className={`flex-1 break-all ${getLineColor(logs[virtualRow.index])}`}>
                  {logs[virtualRow.index]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700 bg-gray-800">
        <p className="text-xs text-gray-500">
          {logs.length} line{logs.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};
