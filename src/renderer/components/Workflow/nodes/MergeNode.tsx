import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from '../../../../shared/types/workflow';

export const MergeNode: React.FC<NodeProps<WorkflowNodeData>> = ({ data, selected }) => {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-gray-800 min-w-[180px] ${
        selected ? 'border-cyan-500 shadow-lg shadow-cyan-500/50' : 'border-gray-600'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-cyan-400"
        style={{ left: '33%' }}
        id="input-1"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-cyan-400"
        style={{ left: '50%' }}
        id="input-2"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-cyan-400"
        style={{ left: '66%' }}
        id="input-3"
      />

      <div className="flex items-center space-x-2 mb-2">
        <span className="text-2xl">🔗</span>
        <div className="flex-1">
          <div className="text-xs text-gray-400 uppercase font-semibold">Merge</div>
          <div className="text-sm text-white font-medium">{data.label}</div>
        </div>
      </div>

      <div className="text-xs text-gray-400">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span>Combines multiple inputs</span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-cyan-400" />
    </div>
  );
};
