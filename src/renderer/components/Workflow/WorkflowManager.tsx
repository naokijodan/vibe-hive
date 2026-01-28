import React, { useState, useEffect } from 'react';
import { WorkflowList } from './WorkflowList';
import { WorkflowCanvas } from './WorkflowCanvas';
import { WorkflowCreateModal } from './WorkflowCreateModal';
import { useWorkflowStore } from '../../stores/workflowStore';
import type { Workflow } from '../../../shared/types/workflow';

export const WorkflowManager: React.FC = () => {
  const { setCurrentWorkflow, loadWorkflow } = useWorkflowStore();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

      <div className="flex-1">
        <WorkflowCanvas />
      </div>

      <WorkflowCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleWorkflowCreated}
      />
    </div>
  );
};
