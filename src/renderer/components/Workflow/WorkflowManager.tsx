import React, { useState, useEffect } from 'react';
import { WorkflowList } from './WorkflowList';
import { WorkflowCanvas } from './WorkflowCanvas';
import { WorkflowCreateModal } from './WorkflowCreateModal';
import { ExecutionHistory } from './ExecutionHistory';
import { ExecutionDetails } from './ExecutionDetails';
import { useWorkflowStore } from '../../stores/workflowStore';
import type { Workflow, WorkflowExecution } from '../../../shared/types/workflow';

type TabType = 'canvas' | 'history';

export const WorkflowManager: React.FC = () => {
  const { setCurrentWorkflow, loadWorkflow } = useWorkflowStore();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('canvas');
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);

  const handleSelectWorkflow = async (workflow: Workflow) => {
    setSelectedWorkflowId(workflow.id);
    await loadWorkflow(workflow.id);
  };

  const handleCreateNew = () => {
    setIsCreateModalOpen(true);
  };

  const handleWorkflowCreated = async (workflowId: number) => {
    await loadWorkflow(workflowId);
    setSelectedWorkflowId(workflowId);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setCurrentWorkflow(null);
    };
  }, [setCurrentWorkflow]);

  return (
    <div className="flex h-full bg-gray-900">
      <WorkflowList
        selectedWorkflowId={selectedWorkflowId}
        onSelectWorkflow={handleSelectWorkflow}
        onCreateNew={handleCreateNew}
      />

      <div className="flex-1 flex flex-col">
        {/* Tab Header */}
        <div className="flex items-center border-b border-gray-700 bg-gray-800">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`
              px-6 py-3 text-sm font-medium transition-colors border-b-2
              ${
                activeTab === 'canvas'
                  ? 'text-white border-blue-500 bg-gray-900'
                  : 'text-gray-400 border-transparent hover:text-gray-300 hover:bg-gray-700'
              }
            `}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
              <span>Canvas</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`
              px-6 py-3 text-sm font-medium transition-colors border-b-2
              ${
                activeTab === 'history'
                  ? 'text-white border-blue-500 bg-gray-900'
                  : 'text-gray-400 border-transparent hover:text-gray-300 hover:bg-gray-700'
              }
            `}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>History</span>
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'canvas' && <WorkflowCanvas />}
          {activeTab === 'history' && (
            <div className="flex h-full">
              <div className="w-80 border-r border-gray-700">
                <ExecutionHistory
                  workflowId={selectedWorkflowId}
                  onSelectExecution={setSelectedExecution}
                  selectedExecutionId={selectedExecution?.id}
                />
              </div>
              <div className="flex-1">
                <ExecutionDetails execution={selectedExecution} />
              </div>
            </div>
          )}
        </div>
      </div>

      <WorkflowCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleWorkflowCreated}
      />
    </div>
  );
};
