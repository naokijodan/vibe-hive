import React, { useState } from 'react';
import type { WorkflowNodeData, TriggerType } from '../../../../shared/types/workflow';
import { useWorkflowStore } from '../../../stores/workflowStore';

interface TriggerNodeSettingsProps {
  data: WorkflowNodeData;
  onChange: (data: Partial<WorkflowNodeData>) => void;
}

const triggerTypes: { value: TriggerType; label: string; description: string }[] = [
  { value: 'manual', label: 'Manual', description: 'Start manually by clicking Execute' },
  { value: 'schedule', label: 'Schedule', description: 'Run on a schedule' },
  { value: 'event', label: 'Event', description: 'Triggered by system events (coming soon)' },
  { value: 'webhook', label: 'Webhook', description: 'Triggered by HTTP webhook' },
];

export const TriggerNodeSettings: React.FC<TriggerNodeSettingsProps> = ({ data, onChange }) => {
  const { currentWorkflow } = useWorkflowStore();
  const triggerType = data.triggerType || 'manual';
  const cronExpression = data.config?.cronExpression || '0 * * * *';
  const [copied, setCopied] = useState(false);

  const handleTriggerTypeChange = (type: TriggerType) => {
    onChange({ triggerType: type });
  };

  const handleCronExpressionChange = (expression: string) => {
    onChange({
      config: {
        ...data.config,
        cronExpression: expression,
      },
    });
  };

  const getWebhookUrl = (): string => {
    if (!currentWorkflow) return '';
    const port = 3100;
    return `http://localhost:${port}/webhook/${currentWorkflow.id}`;
  };

  const copyToClipboard = async () => {
    const url = getWebhookUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Trigger Type
        </label>
        <div className="space-y-2">
          {triggerTypes.map(type => (
            <button
              key={type.value}
              onClick={() => handleTriggerTypeChange(type.value)}
              disabled={type.value === 'event'}
              className={`
                w-full px-4 py-3 rounded-lg text-left transition-colors
                ${
                  triggerType === type.value
                    ? 'bg-green-600 border-2 border-green-500'
                    : 'bg-gray-700 border-2 border-gray-600 hover:border-gray-500'
                }
                ${type.value === 'event' ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">{type.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{type.description}</div>
                </div>
                {triggerType === type.value && (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {triggerType === 'schedule' && (
        <div className="p-4 bg-green-900/20 rounded-lg border border-green-700">
          <h4 className="text-sm font-semibold text-green-300 mb-2">
            Cron Expression
          </h4>
          <input
            type="text"
            value={cronExpression}
            onChange={(e) => handleCronExpressionChange(e.target.value)}
            className="
              w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded
              text-sm text-gray-300 font-mono
              focus:outline-none focus:ring-2 focus:ring-green-500
            "
            placeholder="0 * * * *"
          />
          <p className="text-xs text-gray-400 mt-2">
            Cron expression to schedule workflow execution
          </p>
          <div className="mt-3 p-3 bg-gray-800 rounded space-y-1">
            <p className="text-xs text-gray-500 font-semibold mb-2">Common Examples:</p>
            <button
              onClick={() => handleCronExpressionChange('* * * * *')}
              className="block w-full text-left px-2 py-1 text-xs text-gray-400 hover:bg-gray-700 rounded"
            >
              <code className="text-green-400">* * * * *</code> - Every minute
            </button>
            <button
              onClick={() => handleCronExpressionChange('0 * * * *')}
              className="block w-full text-left px-2 py-1 text-xs text-gray-400 hover:bg-gray-700 rounded"
            >
              <code className="text-green-400">0 * * * *</code> - Every hour
            </button>
            <button
              onClick={() => handleCronExpressionChange('0 0 * * *')}
              className="block w-full text-left px-2 py-1 text-xs text-gray-400 hover:bg-gray-700 rounded"
            >
              <code className="text-green-400">0 0 * * *</code> - Every day at midnight
            </button>
            <button
              onClick={() => handleCronExpressionChange('0 0 * * 1')}
              className="block w-full text-left px-2 py-1 text-xs text-gray-400 hover:bg-gray-700 rounded"
            >
              <code className="text-green-400">0 0 * * 1</code> - Every Monday at midnight
            </button>
          </div>
          <div className="mt-3 p-2 bg-yellow-900/30 rounded">
            <p className="text-xs text-yellow-300">
              <strong>Note:</strong> The workflow must be in 'active' status for scheduled execution to work.
            </p>
          </div>
        </div>
      )}

      {triggerType === 'webhook' && currentWorkflow && (
        <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700">
          <h4 className="text-sm font-semibold text-blue-300 mb-2">
            Webhook URL
          </h4>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={getWebhookUrl()}
              readOnly
              className="
                flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded
                text-sm text-gray-300 font-mono
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            />
            <button
              onClick={copyToClipboard}
              className="
                px-3 py-2 bg-blue-600 hover:bg-blue-700
                text-white text-sm rounded font-medium
                transition-colors
              "
              title="Copy to clipboard"
            >
              {copied ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Send a POST request to this URL to trigger the workflow. The request body will be passed as trigger data.
          </p>
          <div className="mt-3 p-2 bg-gray-800 rounded">
            <p className="text-xs text-gray-500 mb-1">Example with curl:</p>
            <code className="text-xs text-green-400 font-mono">
              curl -X POST {getWebhookUrl()} -H "Content-Type: application/json" -d '{`{"key": "value"}`}'
            </code>
          </div>
        </div>
      )}

      {triggerType !== 'webhook' && (
        <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
          <h4 className="text-xs font-semibold text-gray-400 mb-1 uppercase">
            Note
          </h4>
          <p className="text-xs text-gray-300">
            {triggerType === 'manual'
              ? 'Click the Execute button to start the workflow manually.'
              : 'This trigger type will be available in future updates.'}
          </p>
        </div>
      )}
    </div>
  );
};
