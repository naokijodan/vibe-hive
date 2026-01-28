import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from '../../../../shared/types/workflow';

export const SubworkflowNode: React.FC<NodeProps<WorkflowNodeData>> = ({ data, selected }) => {
  const subworkflowConfig = data.subworkflowConfig;
  const workflowId = subworkflowConfig?.workflowId;

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-gray-800 min-w-[180px] ${
        selected ? 'border-indigo-400 shadow-lg shadow-indigo-400/50' : 'border-indigo-600'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-400" />

      <div className="flex items-center space-x-2 mb-2">
        <span className="text-2xl">📋</span>
        <div className="flex-1">
          <div className="text-xs text-gray-400 uppercase font-semibold">Subworkflow</div>
          <div className="text-sm text-white font-medium">{data.label}</div>
        </div>
      </div>

      <div className="text-xs space-y-1">
        <div className="flex items-center space-x-2">
          <span className="text-gray-500">Workflow ID:</span>
          <span className="px-2 py-0.5 bg-indigo-900/50 text-indigo-300 rounded font-mono">
            {workflowId || 'Not set'}
          </span>
        </div>
        {subworkflowConfig && (
          <>
            <div className="text-gray-400 text-[10px]">
              Inputs: {Object.keys(subworkflowConfig.inputMapping || {}).length}
            </div>
            <div className="text-gray-400 text-[10px]">
              Outputs: {Object.keys(subworkflowConfig.outputMapping || {}).length}
            </div>
          </>
        )}
        <div className="text-gray-400 text-[10px]">
          Calls another workflow
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-400" />
    </div>
  );
};
