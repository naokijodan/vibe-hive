import React from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { WorkflowNodeData } from '../../../../shared/types/workflow';

export const DelayNode: React.FC<NodeProps<Node<WorkflowNodeData>>> = ({ data, selected }) => {
  const delayMs = data.delayMs || 1000;

  const formatDelay = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-gray-800 min-w-[180px] ${
        selected ? 'border-gray-400 shadow-lg shadow-gray-400/50' : 'border-gray-600'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400" />

      <div className="flex items-center space-x-2 mb-2">
        <span className="text-2xl">⏱️</span>
        <div className="flex-1">
          <div className="text-xs text-gray-400 uppercase font-semibold">Delay</div>
          <div className="text-sm text-white font-medium">{data.label}</div>
        </div>
      </div>

      <div className="text-xs space-y-1">
        <div className="flex items-center space-x-2">
          <span className="text-gray-500">Duration:</span>
          <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded font-mono">
            {formatDelay(delayMs)}
          </span>
        </div>
        <div className="text-gray-400 text-[10px]">
          Pauses workflow execution
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-gray-400" />
    </div>
  );
};
