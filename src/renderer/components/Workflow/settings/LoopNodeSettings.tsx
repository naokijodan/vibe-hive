import React, { useState } from 'react';
import type { WorkflowNodeData, LoopType, LoopConfig } from '../../../../shared/types/workflow';

interface LoopNodeSettingsProps {
  data: WorkflowNodeData;
  onChange: (data: Partial<WorkflowNodeData>) => void;
}

export const LoopNodeSettings: React.FC<LoopNodeSettingsProps> = ({ data, onChange }) => {
  const loopConfig = data.loopConfig || {
    type: 'forEach',
    maxIterations: 100,
  };

  const [config, setConfig] = useState<LoopConfig>(loopConfig);

  const handleChange = (updates: Partial<LoopConfig>) => {
    const updated = { ...config, ...updates };
    setConfig(updated);
    onChange({ loopConfig: updated });
  };

  return (
    <div className="space-y-4">
      {/* Loop Type */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Loop Type</label>
        <select
          value={config.type}
          onChange={(e) => handleChange({ type: e.target.value as LoopType })}
          className="
            w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
            text-white focus:outline-none focus:ring-2 focus:ring-orange-500
          "
        >
          <option value="forEach">For Each (Array)</option>
          <option value="count">Count (Fixed Number)</option>
          <option value="while">While (Conditional)</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {config.type === 'forEach' && 'Iterate over array elements'}
          {config.type === 'count' && 'Repeat a fixed number of times'}
          {config.type === 'while' && 'Loop while condition is true'}
        </p>
      </div>

      {/* For Each Configuration */}
      {config.type === 'forEach' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Array Path</label>
          <input
            type="text"
            value={config.arrayPath || ''}
            onChange={(e) => handleChange({ arrayPath: e.target.value })}
            placeholder="e.g., items, data.results"
            className="
              w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
              text-white placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-orange-500
            "
          />
          <p className="text-xs text-gray-500 mt-1">
            Path to array in input data (use dot notation)
          </p>
        </div>
      )}

      {/* Count Configuration */}
      {config.type === 'count' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Iteration Count</label>
          <input
            type="number"
            value={config.count || 1}
            onChange={(e) => handleChange({ count: parseInt(e.target.value, 10) })}
            min="1"
            max="1000"
            className="
              w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
              text-white placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-orange-500
            "
          />
          <p className="text-xs text-gray-500 mt-1">
            Number of times to repeat (1-1000)
          </p>
        </div>
      )}

      {/* While Configuration */}
      {config.type === 'while' && (
        <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
          <div className="text-sm text-gray-300 mb-2">While Condition</div>
          <div className="text-xs text-gray-400 mb-2">
            Condition configuration is complex. For now, use simple mode with a condition field.
          </div>
          <div className="text-xs text-gray-500">
            Note: Advanced condition group support will be added in future updates.
          </div>
        </div>
      )}

      {/* Max Iterations (Safety) */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Max Iterations (Safety Limit)</label>
        <input
          type="number"
          value={config.maxIterations}
          onChange={(e) => handleChange({ maxIterations: parseInt(e.target.value, 10) })}
          min="1"
          max="10000"
          className="
            w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
            text-white placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-orange-500
          "
        />
        <p className="text-xs text-gray-500 mt-1">
          Maximum iterations to prevent infinite loops (default: 100)
        </p>
      </div>

      {/* Preview */}
      <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
        <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Loop Summary</h4>
        <div className="text-xs text-gray-300 space-y-1">
          <div>
            <span className="text-gray-500">Type:</span>{' '}
            <span className="font-semibold">
              {config.type === 'forEach' && 'For Each'}
              {config.type === 'count' && 'Count'}
              {config.type === 'while' && 'While'}
            </span>
          </div>
          {config.type === 'forEach' && (
            <div>
              <span className="text-gray-500">Array:</span>{' '}
              <code className="font-mono">{config.arrayPath || '(not set)'}</code>
            </div>
          )}
          {config.type === 'count' && (
            <div>
              <span className="text-gray-500">Iterations:</span>{' '}
              <span className="font-mono">{config.count || 1}</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">Max:</span>{' '}
            <span className="font-mono">{config.maxIterations}</span>
          </div>
        </div>
      </div>

      {/* Usage Info */}
      <div className="p-3 bg-orange-900/20 rounded-lg border border-orange-700/50">
        <div className="text-xs font-semibold text-orange-300 mb-1">Loop Node Usage</div>
        <div className="text-xs text-orange-200/80">
          The loop node will execute all connected child nodes for each iteration.
          The current iteration index and value will be available in the execution context.
        </div>
      </div>
    </div>
  );
};
