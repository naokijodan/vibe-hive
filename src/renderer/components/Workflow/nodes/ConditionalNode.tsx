import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from '../../../../shared/types/workflow';

export const ConditionalNode: React.FC<NodeProps<WorkflowNodeData>> = ({ data, selected }) => {
  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-gray-800 min-w-[180px]
        ${selected ? 'border-yellow-500 shadow-lg shadow-yellow-500/50' : 'border-gray-600'}
      `}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-400" />

      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded bg-yellow-600 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-xs text-gray-400 uppercase">Conditional</div>
          <div className="text-sm font-medium text-white">{data.label}</div>
        </div>
      </div>

      {data.condition && (
        <div className="text-xs text-gray-400 mt-1">
          {data.condition.field} {data.condition.operator} {data.condition.value}
        </div>
      )}

      <div className="flex justify-between mt-2">
        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          className="w-3 h-3 bg-green-400"
          style={{ left: '30%' }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          className="w-3 h-3 bg-red-400"
          style={{ left: '70%' }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>True</span>
        <span>False</span>
      </div>
    </div>
  );
};
