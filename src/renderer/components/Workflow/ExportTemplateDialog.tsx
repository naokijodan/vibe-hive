import React, { useState } from 'react';
import { ipcBridge } from '../../bridge/ipcBridge';

interface ExportTemplateDialogProps {
  isOpen: boolean;
  workflowId: number | null;
  workflowName: string;
  onClose: () => void;
  onSuccess: () => void;
}

type TemplateCategory = 'automation' | 'notification' | 'data-processing' | 'custom';

export const ExportTemplateDialog: React.FC<ExportTemplateDialogProps> = ({
  isOpen,
  workflowId,
  workflowName,
  onClose,
  onSuccess,
}) => {
  const [category, setCategory] = useState<TemplateCategory>('custom');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!workflowId) {
      setError('No workflow selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await ipcBridge.workflow.exportAsTemplate(workflowId, { category });

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError('Failed to save template');
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <span className="text-2xl mr-2">📝</span>
            Save as Template
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-white text-2xl leading-none disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Workflow Info */}
        <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-400 mb-1">Workflow</p>
          <p className="text-sm text-white font-medium">{workflowName}</p>
        </div>

        {/* Category Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TemplateCategory)}
            disabled={loading}
            className="
              w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
              text-white focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <option value="automation">🤖 Automation</option>
            <option value="notification">🔔 Notification</option>
            <option value="data-processing">📊 Data Processing</option>
            <option value="custom">⚙️ Custom</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Select the category that best describes this workflow template
          </p>
        </div>

        {/* Category Descriptions */}
        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded text-xs text-blue-300">
          <strong>Category Guide:</strong>
          <ul className="mt-1 space-y-1 ml-4 list-disc">
            <li><strong>Automation:</strong> Task automation, scheduled jobs</li>
            <li><strong>Notification:</strong> Alert workflows, messaging</li>
            <li><strong>Data Processing:</strong> ETL, data transformation</li>
            <li><strong>Custom:</strong> General purpose workflows</li>
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-300 text-sm">
            <div className="flex items-center">
              <span className="text-lg mr-2">❌</span>
              {error}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="
              px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg
              transition-colors font-medium
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !workflowId}
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
                Saving...
              </>
            ) : (
              'Save Template'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
