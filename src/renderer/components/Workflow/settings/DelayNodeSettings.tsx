import React from 'react';
import type { WorkflowNodeData } from '../../../../shared/types/workflow';

interface DelayNodeSettingsProps {
  data: WorkflowNodeData;
  onChange: (data: Partial<WorkflowNodeData>) => void;
}

export const DelayNodeSettings: React.FC<DelayNodeSettingsProps> = ({ data, onChange }) => {
  const delayMs = data.delayMs || 1000;

  const handleDelayChange = (value: string) => {
    const ms = parseInt(value, 10);
    if (!isNaN(ms) && ms >= 0) {
      onChange({ delayMs: ms });
    }
  };

  const handlePresetClick = (ms: number) => {
    onChange({ delayMs: ms });
  };

  const presets = [
    { label: '1 second', ms: 1000 },
    { label: '5 seconds', ms: 5000 },
    { label: '10 seconds', ms: 10000 },
    { label: '30 seconds', ms: 30000 },
    { label: '1 minute', ms: 60000 },
    { label: '5 minutes', ms: 300000 },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Delay Duration (milliseconds)
        </label>
        <input
          type="number"
          value={delayMs}
          onChange={(e) => handleDelayChange(e.target.value)}
          min="0"
          step="100"
          className="
            w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
            text-white focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        />
        <p className="text-xs text-gray-500 mt-1">
          {delayMs < 1000
            ? `${delayMs}ms`
            : delayMs < 60000
            ? `${(delayMs / 1000).toFixed(1)}s`
            : `${(delayMs / 60000).toFixed(1)}min`}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Quick Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          {presets.map(preset => (
            <button
              key={preset.ms}
              onClick={() => handlePresetClick(preset.ms)}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  delayMs === preset.ms
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
        <h4 className="text-xs font-semibold text-gray-400 mb-1 uppercase">
          Info
        </h4>
        <p className="text-xs text-gray-300">
          The workflow will pause for the specified duration before continuing to the next node.
        </p>
      </div>
    </div>
  );
};
