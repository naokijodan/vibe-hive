import React, { useState, useEffect } from 'react';
import { WorkflowList } from './WorkflowList';
import { WorkflowCanvas } from './WorkflowCanvas';
import { WorkflowCreateModal } from './WorkflowCreateModal';
import { ExecutionHistory } from './ExecutionHistory';
import { ExecutionDetails } from './ExecutionDetails';
import { TemplateGallery } from '../TemplateGallery';
import { SaveAsTemplateDialog } from '../SaveAsTemplateDialog';
import { ApplyTemplateDialog } from '../ApplyTemplateDialog';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useWorkflowTemplateStore } from '../../stores/workflowTemplateStore';
import { useSessionStore } from '../../stores/sessionStore';
import type { Workflow, WorkflowExecution } from '../../../shared/types/workflow';
import type { WorkflowTemplate } from '../../../shared/types/template';

type TabType = 'canvas' | 'history' | 'templates';

export const WorkflowManager: React.FC = () => {
  const { currentWorkflow, setCurrentWorkflow, loadWorkflow } = useWorkflowStore();
  const { activeSession } = useSessionStore();
  const { createTemplate, applyTemplate } = useWorkflowTemplateStore();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('canvas');
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [isSaveTemplateDialogOpen, setIsSaveTemplateDialogOpen] = useState(false);
  const [isApplyTemplateDialogOpen, setIsApplyTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);

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

  const handleSaveAsTemplate = async (data: {
    name: string;
    description: string;
    category: 'automation' | 'notification' | 'data-processing' | 'custom';
    thumbnail?: string;
  }) => {
    if (!currentWorkflow) return;

    await createTemplate({
      ...data,
      nodes: currentWorkflow.nodes,
      edges: currentWorkflow.edges,
    });
  };

  const handleApplyTemplate = (templateId: number) => {
    const template = selectedTemplate;
    if (!template || template.id !== templateId) return;

    setIsApplyTemplateDialogOpen(true);
  };

  const handleApplyTemplateConfirm = async () => {
    if (!selectedTemplate || !activeSession) return;

    await applyTemplate(selectedTemplate.id, activeSession.id);
    // Reload the workflow list after applying template
    setActiveTab('canvas');
  };

  const handleTemplateSelect = (templateId: number) => {
    // This is called when user clicks Apply on a template card
    setSelectedTemplate(
      useWorkflowTemplateStore.getState().templates.find((t) => t.id === templateId) || null
    );
    setIsApplyTemplateDialogOpen(true);
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
        <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800">
          <div className="flex">
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

            <button
              onClick={() => setActiveTab('templates')}
              className={`
                px-6 py-3 text-sm font-medium transition-colors border-b-2
                ${
                  activeTab === 'templates'
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
                    d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                  />
                </svg>
                <span>Templates</span>
              </div>
            </button>
          </div>

          {/* Save as Template button - only show on canvas tab */}
          {activeTab === 'canvas' && currentWorkflow && (
            <button
              onClick={() => setIsSaveTemplateDialogOpen(true)}
              className="mr-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Save as Template
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'canvas' && <WorkflowCanvas showNodePalette={true} />}
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
          {activeTab === 'templates' && (
            <TemplateGallery
              onApply={handleTemplateSelect}
              onCreateNew={() => setIsSaveTemplateDialogOpen(true)}
            />
          )}
        </div>
      </div>

      <WorkflowCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleWorkflowCreated}
      />

      {currentWorkflow && (
        <SaveAsTemplateDialog
          isOpen={isSaveTemplateDialogOpen}
          onClose={() => setIsSaveTemplateDialogOpen(false)}
          onSave={handleSaveAsTemplate}
          currentWorkflow={{
            nodes: currentWorkflow.nodes,
            edges: currentWorkflow.edges,
          }}
        />
      )}

      <ApplyTemplateDialog
        isOpen={isApplyTemplateDialogOpen}
        onClose={() => setIsApplyTemplateDialogOpen(false)}
        onApply={handleApplyTemplateConfirm}
        template={selectedTemplate}
      />
    </div>
  );
};
