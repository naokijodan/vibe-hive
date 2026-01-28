import React, { useState } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { useWorkflowStore } from '../../stores/workflowStore';

interface WorkflowCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (workflowId: number) => void;
}

export const WorkflowCreateModal: React.FC<WorkflowCreateModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { activeSessionId } = useSessionStore();
  const { createWorkflow } = useWorkflowStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Workflow name is required');
      return;
    }

    if (!activeSessionId) {
      setError('No active session. Please create a session first.');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const workflow = await createWorkflow({
        sessionId: parseInt(activeSessionId, 10),
        name: name.trim(),
        description: description.trim() || undefined,
        nodes: [],
        edges: [],
      });

      if (workflow) {
        setName('');
        setDescription('');
        onClose();
        if (onCreated) {
          onCreated(workflow.id);
        }
      } else {
        setError('Failed to create workflow');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setName('');
      setDescription('');
      setError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Create New Workflow</h2>
          <button
            onClick={handleClose}
            disabled={isCreating}
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
                disabled={isCreating}
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
                disabled={isCreating}
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

            {error && (
              <div className="px-3 py-2 bg-red-900/50 border border-red-700 rounded-lg">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {!activeSessionId && (
              <div className="px-3 py-2 bg-yellow-900/50 border border-yellow-700 rounded-lg">
                <p className="text-sm text-yellow-300">
                  No active session. Please create a session first.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCreating}
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
              disabled={isCreating || !name.trim() || !activeSessionId}
              className="
                flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700
                text-white rounded-lg font-medium
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
