import React, { useEffect, useState } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { WorkflowNodeData } from '../../../../shared/types/workflow';
import { useWorkflowStore } from '../../../stores/workflowStore';

export const SubworkflowNode: React.FC<NodeProps<Node<WorkflowNodeData>>> = ({ data, selected }) => {
  const subworkflowConfig = data.subworkflowConfig;
  const workflowId = subworkflowConfig?.workflowId;
  const { workflows, loadWorkflows } = useWorkflowStore();
  const [workflowName, setWorkflowName] = useState<string>('');

  useEffect(() => {
    if (workflows.length === 0) {
      loadWorkflows();
    }
  }, []);

  useEffect(() => {
    if (workflowId && workflows.length > 0) {
      const targetWorkflow = workflows.find(w => w.id === workflowId);
      setWorkflowName(targetWorkflow?.name || `Workflow #${workflowId}`);
    } else {
      setWorkflowName('');
    }
  }, [workflowId, workflows]);

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
        {workflowName ? (
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">Target:</span>
            <span className="px-2 py-0.5 bg-indigo-900/50 text-indigo-300 rounded font-medium truncate">
              {workflowName}
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">Workflow:</span>
            <span className="px-2 py-0.5 bg-red-900/50 text-red-300 rounded font-mono text-[10px]">
              Not configured
            </span>
          </div>
        )}
        {subworkflowConfig && workflowId && (
          <>
            <div className="text-gray-400 text-[10px]">
              Inputs: {Object.keys(subworkflowConfig.inputMapping || {}).length} mapped
            </div>
            <div className="text-gray-400 text-[10px]">
              Outputs: {Object.keys(subworkflowConfig.outputMapping || {}).length} mapped
            </div>
          </>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-400" />
    </div>
  );
};
