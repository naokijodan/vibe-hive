import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from '../../../../shared/types/workflow';

export const TriggerNode: React.FC<NodeProps<WorkflowNodeData>> = ({ data, selected }) => {
  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-gray-800 min-w-[180px]
        ${selected ? 'border-green-500 shadow-lg shadow-green-500/50' : 'border-gray-600'}
      `}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded bg-green-600 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-xs text-gray-400 uppercase">Trigger</div>
          <div className="text-sm font-medium text-white">{data.label}</div>
        </div>
      </div>

      {data.triggerType && (
        <div className="text-xs text-gray-400 mt-1">
          Type: {data.triggerType}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-400" />
    </div>
  );
};
