import React, { useState } from 'react';
import type {
  RetryConfig,
  TimeoutConfig,
  ErrorHandlingConfig,
} from '../../../../shared/types/workflow';

interface RetrySettingsProps {
  retryConfig?: RetryConfig;
  timeoutConfig?: TimeoutConfig;
  errorHandlingConfig?: ErrorHandlingConfig;
  onChange: (config: {
    retryConfig?: RetryConfig;
    timeoutConfig?: TimeoutConfig;
    errorHandlingConfig?: ErrorHandlingConfig;
  }) => void;
}

export const RetrySettings: React.FC<RetrySettingsProps> = ({
  retryConfig,
  timeoutConfig,
  errorHandlingConfig,
  onChange,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleRetryToggle = (enabled: boolean) => {
    onChange({
      retryConfig: {
        enabled,
        maxAttempts: retryConfig?.maxAttempts || 3,
        delayMs: retryConfig?.delayMs || 1000,
        backoffMultiplier: retryConfig?.backoffMultiplier || 2,
        retryOnErrorTypes: retryConfig?.retryOnErrorTypes,
      },
      timeoutConfig,
      errorHandlingConfig,
    });
  };

  const handleRetryConfigChange = (field: keyof RetryConfig, value: any) => {
    onChange({
      retryConfig: {
        ...retryConfig,
        enabled: retryConfig?.enabled || false,
        maxAttempts: retryConfig?.maxAttempts || 3,
        delayMs: retryConfig?.delayMs || 1000,
        backoffMultiplier: retryConfig?.backoffMultiplier || 2,
        [field]: value,
      },
      timeoutConfig,
      errorHandlingConfig,
    });
  };

  const handleTimeoutToggle = (enabled: boolean) => {
    onChange({
      retryConfig,
      timeoutConfig: {
        enabled,
        timeoutMs: timeoutConfig?.timeoutMs || 30000,
      },
      errorHandlingConfig,
    });
  };

  const handleTimeoutChange = (timeoutMs: number) => {
    onChange({
      retryConfig,
      timeoutConfig: {
        enabled: timeoutConfig?.enabled || false,
        timeoutMs,
      },
      errorHandlingConfig,
    });
  };

  const handleErrorHandlingToggle = (continueOnError: boolean) => {
    onChange({
      retryConfig,
      timeoutConfig,
      errorHandlingConfig: {
        continueOnError,
        errorOutput: errorHandlingConfig?.errorOutput,
      },
    });
  };

  const handleErrorOutputChange = (errorOutput: string) => {
    try {
      const parsed = errorOutput ? JSON.parse(errorOutput) : undefined;
      onChange({
        retryConfig,
        timeoutConfig,
        errorHandlingConfig: {
          continueOnError: errorHandlingConfig?.continueOnError || false,
          errorOutput: parsed,
        },
      });
    } catch (e) {
      // Invalid JSON - ignore
    }
  };

  return (
    <div className="space-y-4 border-t border-gray-700 pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Error Handling & Retry</h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          {showAdvanced ? 'Hide' : 'Show'}
        </button>
      </div>

      {showAdvanced && (
        <div className="space-y-4">
          {/* Retry Configuration */}
          <div className="p-3 bg-gray-800/50 rounded-lg space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={retryConfig?.enabled || false}
                onChange={(e) => handleRetryToggle(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-300">Enable Retry</span>
            </label>

            {retryConfig?.enabled && (
              <div className="ml-6 space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Max Attempts</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={retryConfig.maxAttempts}
                    onChange={(e) => handleRetryConfigChange('maxAttempts', parseInt(e.target.value))}
                    className="
                      w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm
                      text-white focus:outline-none focus:ring-1 focus:ring-blue-500
                    "
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of retry attempts (default: 3)</p>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Delay (ms)</label>
                  <input
                    type="number"
                    min="100"
                    max="60000"
                    step="100"
                    value={retryConfig.delayMs}
                    onChange={(e) => handleRetryConfigChange('delayMs', parseInt(e.target.value))}
                    className="
                      w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm
                      text-white focus:outline-none focus:ring-1 focus:ring-blue-500
                    "
                  />
                  <p className="text-xs text-gray-500 mt-1">Initial delay between retries (default: 1000ms)</p>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Backoff Multiplier</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={retryConfig.backoffMultiplier}
                    onChange={(e) => handleRetryConfigChange('backoffMultiplier', parseFloat(e.target.value))}
                    className="
                      w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm
                      text-white focus:outline-none focus:ring-1 focus:ring-blue-500
                    "
                  />
                  <p className="text-xs text-gray-500 mt-1">Exponential backoff multiplier (default: 2)</p>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Retry on Error Types (optional)</label>
                  <input
                    type="text"
                    placeholder="ECONNREFUSED, ETIMEDOUT"
                    value={retryConfig.retryOnErrorTypes?.join(', ') || ''}
                    onChange={(e) => {
                      const types = e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0);
                      handleRetryConfigChange('retryOnErrorTypes', types.length > 0 ? types : undefined);
                    }}
                    className="
                      w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm
                      text-white placeholder-gray-500
                      focus:outline-none focus:ring-1 focus:ring-blue-500
                    "
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated error types to retry</p>
                </div>
              </div>
            )}
          </div>

          {/* Timeout Configuration */}
          <div className="p-3 bg-gray-800/50 rounded-lg space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={timeoutConfig?.enabled || false}
                onChange={(e) => handleTimeoutToggle(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-300">Enable Timeout</span>
            </label>

            {timeoutConfig?.enabled && (
              <div className="ml-6">
                <label className="block text-xs text-gray-400 mb-1">Timeout (ms)</label>
                <input
                  type="number"
                  min="1000"
                  max="300000"
                  step="1000"
                  value={timeoutConfig.timeoutMs}
                  onChange={(e) => handleTimeoutChange(parseInt(e.target.value))}
                  className="
                    w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm
                    text-white focus:outline-none focus:ring-1 focus:ring-blue-500
                  "
                />
                <p className="text-xs text-gray-500 mt-1">Maximum execution time (default: 30000ms)</p>
              </div>
            )}
          </div>

          {/* Error Handling Configuration */}
          <div className="p-3 bg-gray-800/50 rounded-lg space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={errorHandlingConfig?.continueOnError || false}
                onChange={(e) => handleErrorHandlingToggle(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-300">Continue on Error</span>
            </label>

            {errorHandlingConfig?.continueOnError && (
              <div className="ml-6">
                <label className="block text-xs text-gray-400 mb-1">Fallback Output (JSON, optional)</label>
                <textarea
                  placeholder='{"status": "error", "data": null}'
                  value={errorHandlingConfig.errorOutput ? JSON.stringify(errorHandlingConfig.errorOutput, null, 2) : ''}
                  onChange={(e) => handleErrorOutputChange(e.target.value)}
                  rows={3}
                  className="
                    w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs
                    text-white placeholder-gray-500 font-mono
                    focus:outline-none focus:ring-1 focus:ring-blue-500
                  "
                />
                <p className="text-xs text-gray-500 mt-1">Output value when error occurs</p>
              </div>
            )}
          </div>

          {/* Summary */}
          {(retryConfig?.enabled || timeoutConfig?.enabled || errorHandlingConfig?.continueOnError) && (
            <div className="p-2 bg-blue-900/20 border border-blue-500/30 rounded text-xs text-blue-300">
              <strong>Summary:</strong>
              {retryConfig?.enabled && (
                <div>• Retry up to {retryConfig.maxAttempts} times with {retryConfig.delayMs}ms delay</div>
              )}
              {timeoutConfig?.enabled && (
                <div>• Timeout after {timeoutConfig.timeoutMs}ms</div>
              )}
              {errorHandlingConfig?.continueOnError && (
                <div>• Continue workflow on error</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
