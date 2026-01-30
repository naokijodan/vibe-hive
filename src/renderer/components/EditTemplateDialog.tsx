import React, { useState, useEffect } from 'react';
import type { TemplateCategory, WorkflowTemplate, TemplateUpdateInput } from '../../shared/types/template';

interface EditTemplateDialogProps {
  isOpen: boolean;
  template: WorkflowTemplate | null;
  onClose: () => void;
  onSave: (id: number, data: TemplateUpdateInput) => Promise<void>;
}

const CATEGORIES: { value: TemplateCategory; label: string; icon: string }[] = [
  { value: 'automation', label: 'Automation', icon: '🤖' },
  { value: 'notification', label: 'Notification', icon: '🔔' },
  { value: 'data-processing', label: 'Data Processing', icon: '📊' },
  { value: 'custom', label: 'Custom', icon: '⚙️' },
];

export const EditTemplateDialog: React.FC<EditTemplateDialogProps> = ({
  isOpen,
  template,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('custom');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when template changes
  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setCategory(template.category);
      setError(null);
    }
  }, [template]);

  if (!isOpen || !template) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Template name is required');
      return;
    }

    if (template.isBuiltIn) {
      setError('Built-in templates cannot be edited');
      return;
    }

    setLoading(true);

    try {
      await onSave(template.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <span className="text-2xl mr-2">✏️</span>
            Edit Template
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-white text-2xl leading-none disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Built-in Warning */}
        {template.isBuiltIn && (
          <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-500 rounded-lg">
            <div className="flex items-center">
              <span className="text-lg mr-2">⚠️</span>
              <div className="text-sm text-yellow-300">
                <p className="font-semibold">Built-in Template</p>
                <p className="mt-1">
                  This is a built-in template and cannot be edited. Create a new template based on
                  this one instead.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-300 text-sm">
              <div className="flex items-center">
                <span className="text-lg mr-2">❌</span>
                {error}
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Template Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading || template.isBuiltIn}
              className="
                w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              placeholder="My Workflow Template"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={loading || template.isBuiltIn}
              className="
                w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              placeholder="Describe what this template does..."
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TemplateCategory)}
              disabled={loading || template.isBuiltIn}
              className="
                w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                text-white focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Template Info */}
          <div className="p-3 bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-400 mb-2">Template Info</p>
            <div className="space-y-1 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>Nodes:</span>
                <span className="font-medium">{template.nodes.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Edges:</span>
                <span className="font-medium">{template.edges.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-medium ${template.isBuiltIn ? 'text-yellow-400' : 'text-green-400'}`}>
                  {template.isBuiltIn ? 'Built-in' : 'Custom'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="
                px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg
                transition-colors font-medium
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              Cancel
            </button>
            {!template.isBuiltIn && (
              <button
                type="submit"
                disabled={loading}
                className="
                  px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                  transition-colors font-medium
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center
                "
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Update Template'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
