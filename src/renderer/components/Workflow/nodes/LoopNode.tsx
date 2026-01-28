import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from '../../../../shared/types/workflow';

export const LoopNode: React.FC<NodeProps<WorkflowNodeData>> = ({ data, selected }) => {
  const loopConfig = data.loopConfig;
  const loopType = loopConfig?.type || 'forEach';
  const maxIterations = loopConfig?.maxIterations || 100;

  const getLoopTypeLabel = (): string => {
    switch (loopType) {
      case 'forEach':
        return 'For Each';
      case 'count':
        return 'Count';
      case 'while':
        return 'While';
      default:
        return 'Loop';
    }
  };

  const getLoopDetails = (): string => {
    if (!loopConfig) return 'Not configured';

    switch (loopType) {
      case 'forEach':
        return loopConfig.arrayPath || 'No array path';
      case 'count':
        return `${loopConfig.count || 0} times`;
      case 'while':
        return 'Conditional';
      default:
        return 'Loop';
    }
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-gray-800 min-w-[180px] ${
        selected ? 'border-orange-400 shadow-lg shadow-orange-400/50' : 'border-orange-600'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-orange-400" />

      <div className="flex items-center space-x-2 mb-2">
        <span className="text-2xl">🔄</span>
        <div className="flex-1">
          <div className="text-xs text-gray-400 uppercase font-semibold">Loop</div>
          <div className="text-sm text-white font-medium">{data.label}</div>
        </div>
      </div>

      <div className="text-xs space-y-1">
        <div className="flex items-center space-x-2">
          <span className="text-gray-500">Type:</span>
          <span className="px-2 py-0.5 bg-orange-900/50 text-orange-300 rounded font-semibold">
            {getLoopTypeLabel()}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-500">Details:</span>
          <span className="text-gray-300">{getLoopDetails()}</span>
        </div>
        <div className="text-gray-400 text-[10px]">
          Max iterations: {maxIterations}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-orange-400" />
    </div>
  );
};
