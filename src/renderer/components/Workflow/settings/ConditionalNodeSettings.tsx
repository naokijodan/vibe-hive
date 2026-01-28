import React from 'react';
import type { WorkflowNodeData, ConditionalOperator } from '../../../../shared/types/workflow';

interface ConditionalNodeSettingsProps {
  data: WorkflowNodeData;
  onChange: (data: Partial<WorkflowNodeData>) => void;
}

const operators: { value: ConditionalOperator; label: string }[] = [
  { value: 'equals', label: 'Equals (==)' },
  { value: 'not_equals', label: 'Not Equals (!=)' },
  { value: 'greater_than', label: 'Greater Than (>)' },
  { value: 'less_than', label: 'Less Than (<)' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Not Contains' },
];

export const ConditionalNodeSettings: React.FC<ConditionalNodeSettingsProps> = ({ data, onChange }) => {
  const condition = data.condition || { field: '', operator: 'equals', value: '' };

  const handleFieldChange = (field: string) => {
    onChange({
      condition: { ...condition, field },
    });
  };

  const handleOperatorChange = (operator: ConditionalOperator) => {
    onChange({
      condition: { ...condition, operator },
    });
  };

  const handleValueChange = (value: string) => {
    onChange({
      condition: { ...condition, value },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Field Path
        </label>
        <input
          type="text"
          value={condition.field}
          onChange={(e) => handleFieldChange(e.target.value)}
          placeholder="e.g., status, output.exitCode"
          className="
            w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
            text-white placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        />
        <p className="text-xs text-gray-500 mt-1">
          Use dot notation for nested fields
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Operator
        </label>
        <select
          value={condition.operator}
          onChange={(e) => handleOperatorChange(e.target.value as ConditionalOperator)}
          className="
            w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
            text-white focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        >
          {operators.map(op => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Value
        </label>
        <input
          type="text"
          value={condition.value}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder="comparison value"
          className="
            w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
            text-white placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        />
        <p className="text-xs text-gray-500 mt-1">
          Value to compare against
        </p>
      </div>

      <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
        <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">
          Condition Preview
        </h4>
        <code className="text-xs text-gray-300">
          {condition.field || '(field)'} {condition.operator} {condition.value || '(value)'}
        </code>
      </div>
    </div>
  );
};
