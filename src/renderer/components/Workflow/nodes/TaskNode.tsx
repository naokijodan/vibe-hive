import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from '../../../../shared/types/workflow';

export const TaskNode: React.FC<NodeProps<WorkflowNodeData>> = ({ data, selected }) => {
  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-gray-800 min-w-[180px]
        ${selected ? 'border-blue-500 shadow-lg shadow-blue-500/50' : 'border-gray-600'}
      `}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-400" />

      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded bg-purple-600 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-xs text-gray-400 uppercase">Task</div>
          <div className="text-sm font-medium text-white">{data.label}</div>
        </div>
      </div>

      {data.taskId && (
        <div className="text-xs text-gray-400 mt-1">
          Task ID: {data.taskId}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-400" />
    </div>
  );
};
