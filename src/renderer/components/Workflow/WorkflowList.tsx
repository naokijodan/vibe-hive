import React, { useEffect, useState } from 'react';
import { useWorkflowStore } from '../../stores/workflowStore';
import type { Workflow } from '../../../shared/types/workflow';

interface WorkflowListProps {
  selectedWorkflowId: number | null;
  onSelectWorkflow: (workflow: Workflow) => void;
  onCreateNew: () => void;
}

export const WorkflowList: React.FC<WorkflowListProps> = ({
  selectedWorkflowId,
  onSelectWorkflow,
  onCreateNew,
}) => {
  const { workflows, loadWorkflows, deleteWorkflow, executeWorkflow, isExecuting } = useWorkflowStore();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteWorkflow(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExecute = async (workflow: Workflow) => {
    if (isExecuting) {
      alert('A workflow is already executing');
      return;
    }

    const result = await executeWorkflow(workflow.id);
    if (result) {
      if (result.status === 'success') {
        alert(`Workflow "${workflow.name}" executed successfully!`);
      } else {
        alert(`Workflow execution failed: ${result.error}`);
      }
    }
  };

  const getStatusColor = (status: Workflow['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-900/30 border-green-700';
      case 'paused':
        return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
      case 'draft':
      default:
        return 'text-gray-400 bg-gray-700/30 border-gray-600';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Workflows</h2>
          <button
            onClick={onCreateNew}
            className="
              px-3 py-1.5 bg-blue-600 hover:bg-blue-700
              text-white text-sm rounded-lg font-medium
              transition-colors
            "
          >
            + New
          </button>
        </div>
        <div className="text-xs text-gray-400">
          {workflows.length} workflow{workflows.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {workflows.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm mb-2">No workflows yet</p>
            <p className="text-xs">Click "New" to create your first workflow</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className={`
                  p-3 rounded-lg border-2 cursor-pointer transition-all
                  ${
                    selectedWorkflowId === workflow.id
                      ? 'bg-blue-900/30 border-blue-500'
                      : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                  }
                `}
                onClick={() => onSelectWorkflow(workflow)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-medium text-white flex-1 mr-2">
                    {workflow.name}
                  </h3>
                  <span
                    className={`
                      px-2 py-0.5 text-xs rounded border
                      ${getStatusColor(workflow.status)}
                    `}
                  >
                    {workflow.status}
                  </span>
                </div>

                {workflow.description && (
                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                    {workflow.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{workflow.nodes.length} nodes</span>
                  <span>{formatDate(workflow.updatedAt)}</span>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExecute(workflow);
                    }}
                    disabled={isExecuting}
                    className="
                      flex-1 px-2 py-1 bg-green-600 hover:bg-green-700
                      text-white text-xs rounded font-medium
                      transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    {isExecuting ? 'Running...' : 'Execute'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(workflow.id, workflow.name);
                    }}
                    disabled={deletingId === workflow.id}
                    className="
                      px-2 py-1 bg-red-600 hover:bg-red-700
                      text-white text-xs rounded font-medium
                      transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    {deletingId === workflow.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
