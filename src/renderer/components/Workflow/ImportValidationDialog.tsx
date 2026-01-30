import React from 'react';
import type { WorkflowImportResult } from '../../../shared/types/workflow';

interface ImportValidationDialogProps {
  isOpen: boolean;
  result: WorkflowImportResult | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const ImportValidationDialog: React.FC<ImportValidationDialogProps> = ({
  isOpen,
  result,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !result) return null;

  const hasErrors = result.errors && result.errors.length > 0;
  const hasWarnings = result.warnings && result.warnings.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            {result.success ? (
              <>
                <span className="text-2xl mr-2">✅</span>
                Import Successful
              </>
            ) : (
              <>
                <span className="text-2xl mr-2">❌</span>
                Import Failed
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Errors */}
        {hasErrors && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-500 rounded-lg">
            <h3 className="font-semibold text-red-400 mb-2 flex items-center">
              <span className="text-lg mr-2">🚫</span>
              Errors
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-300">
              {result.errors!.map((error, idx) => (
                <li key={idx} className="ml-2">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {hasWarnings && (
          <div className="mb-4 p-4 bg-yellow-900/30 border border-yellow-500 rounded-lg">
            <h3 className="font-semibold text-yellow-400 mb-2 flex items-center">
              <span className="text-lg mr-2">⚠️</span>
              Warnings
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-300">
              {result.warnings!.map((warning, idx) => (
                <li key={idx} className="ml-2">
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Validation Report */}
        {result.validationReport && (
          <div className="mb-4 p-4 bg-blue-900/30 border border-blue-500 rounded-lg">
            <h3 className="font-semibold text-blue-400 mb-3 flex items-center">
              <span className="text-lg mr-2">📊</span>
              Validation Report
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-blue-300 font-medium">Nodes:</span>
                <span className="text-white">{result.validationReport.nodeCount}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-300 font-medium">Edges:</span>
                <span className="text-white">{result.validationReport.edgeCount}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-300 font-medium">Compatibility:</span>
                <span
                  className={`
                    font-semibold
                    ${result.validationReport.compatibility === 'full' ? 'text-green-400' : ''}
                    ${result.validationReport.compatibility === 'partial' ? 'text-yellow-400' : ''}
                    ${result.validationReport.compatibility === 'none' ? 'text-red-400' : ''}
                  `}
                >
                  {result.validationReport.compatibility}
                </span>
              </div>
              {result.validationReport.hasAdvancedFeatures && (
                <div className="col-span-2 flex items-start space-x-2">
                  <span className="text-blue-300 font-medium whitespace-nowrap">Advanced Features:</span>
                  <div className="flex flex-wrap gap-1">
                    {result.validationReport.advancedFeatures.map((feature, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-purple-600/30 border border-purple-500 rounded text-xs text-purple-300"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Message */}
        {result.success && !hasErrors && !hasWarnings && (
          <div className="mb-4 p-4 bg-green-900/30 border border-green-500 rounded-lg text-green-300">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🎉</span>
              <div>
                <p className="font-semibold">Workflow imported successfully!</p>
                <p className="text-sm mt-1">
                  The workflow has been added to your workspace and is ready to use.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-2">
          {!result.success && (
            <button
              onClick={onClose}
              className="
                px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg
                transition-colors font-medium
              "
            >
              Close
            </button>
          )}
          {result.success && (
            <>
              <button
                onClick={onClose}
                className="
                  px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg
                  transition-colors font-medium
                "
              >
                Close
              </button>
              <button
                onClick={onConfirm}
                className="
                  px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                  transition-colors font-medium
                "
              >
                OK
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
