import React, { useState, useEffect } from 'react';
import { useWorkflowStore } from '../../stores/workflowStore';
import type { Workflow } from '../../../shared/types/workflow';

interface WorkflowSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: Workflow;
}

export const WorkflowSettingsModal: React.FC<WorkflowSettingsModalProps> = ({
  isOpen,
  onClose,
  workflow,
}) => {
  const { updateWorkflow } = useWorkflowStore();

  const [name, setName] = useState(workflow.name);
  const [description, setDescription] = useState(workflow.description || '');
  const [status, setStatus] = useState(workflow.status);
  const [autoCreateTask, setAutoCreateTask] = useState(workflow.autoCreateTask || false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update local state when workflow changes
  useEffect(() => {
    setName(workflow.name);
    setDescription(workflow.description || '');
    setStatus(workflow.status);
    setAutoCreateTask(workflow.autoCreateTask || false);
  }, [workflow]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Workflow name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateWorkflow({
        id: workflow.id,
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        autoCreateTask,
      });

      if (updated) {
        onClose();
      } else {
        setError('Failed to update workflow');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workflow');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      // Reset to original values
      setName(workflow.name);
      setDescription(workflow.description || '');
      setStatus(workflow.status);
      setAutoCreateTask(workflow.autoCreateTask || false);
      setError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Workflow Settings</h2>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-white disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="workflow-name" className="block text-sm font-medium text-gray-300 mb-1">
                Name *
              </label>
              <input
                id="workflow-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
                className="
                  w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                  text-white placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                placeholder="My Workflow"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="workflow-description" className="block text-sm font-medium text-gray-300 mb-1">
                Description (optional)
              </label>
              <textarea
                id="workflow-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSaving}
                rows={3}
                className="
                  w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                  text-white placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                  resize-none
                "
                placeholder="Describe what this workflow does..."
              />
            </div>

            <div>
              <label htmlFor="workflow-status" className="block text-sm font-medium text-gray-300 mb-1">
                Status
              </label>
              <select
                id="workflow-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'active' | 'paused')}
                disabled={isSaving}
                className="
                  w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                  text-white
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex items-center h-5">
                <input
                  id="auto-create-task"
                  type="checkbox"
                  checked={autoCreateTask}
                  onChange={(e) => setAutoCreateTask(e.target.checked)}
                  disabled={isSaving}
                  className="
                    w-4 h-4 bg-gray-700 border-gray-600 rounded
                    text-blue-600 focus:ring-2 focus:ring-blue-500
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                />
              </div>
              <div className="flex-1">
                <label htmlFor="auto-create-task" className="text-sm font-medium text-gray-300 cursor-pointer">
                  Auto-create task on completion
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Automatically create a new task with execution results when this workflow completes successfully
                </p>
              </div>
            </div>

            {error && (
              <div className="px-3 py-2 bg-red-900/50 border border-red-700 rounded-lg">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="
                flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600
                text-white rounded-lg font-medium
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="
                flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700
                text-white rounded-lg font-medium
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
