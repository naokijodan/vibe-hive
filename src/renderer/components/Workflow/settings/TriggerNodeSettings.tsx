import React from 'react';
import type { WorkflowNodeData, TriggerType } from '../../../../shared/types/workflow';

interface TriggerNodeSettingsProps {
  data: WorkflowNodeData;
  onChange: (data: Partial<WorkflowNodeData>) => void;
}

const triggerTypes: { value: TriggerType; label: string; description: string }[] = [
  { value: 'manual', label: 'Manual', description: 'Start manually by clicking Execute' },
  { value: 'schedule', label: 'Schedule', description: 'Run on a schedule (coming soon)' },
  { value: 'event', label: 'Event', description: 'Triggered by system events (coming soon)' },
  { value: 'webhook', label: 'Webhook', description: 'Triggered by HTTP webhook (coming soon)' },
];

export const TriggerNodeSettings: React.FC<TriggerNodeSettingsProps> = ({ data, onChange }) => {
  const triggerType = data.triggerType || 'manual';

  const handleTriggerTypeChange = (type: TriggerType) => {
    onChange({ triggerType: type });
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
              disabled={type.value !== 'manual'}
              className={`
                w-full px-4 py-3 rounded-lg text-left transition-colors
                ${
                  triggerType === type.value
                    ? 'bg-green-600 border-2 border-green-500'
                    : 'bg-gray-700 border-2 border-gray-600 hover:border-gray-500'
                }
                ${type.value !== 'manual' ? 'opacity-50 cursor-not-allowed' : ''}
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

      <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
        <h4 className="text-xs font-semibold text-gray-400 mb-1 uppercase">
          Note
        </h4>
        <p className="text-xs text-gray-300">
          Currently, only manual triggers are supported. Other trigger types will be added in future updates.
        </p>
      </div>
    </div>
  );
};
