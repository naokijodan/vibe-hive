import React, { useState, useEffect } from 'react';
import type {
  WorkflowNodeData,
  ConditionalOperator,
  SimpleCondition,
  ConditionGroup,
  LogicalOperator,
} from '../../../../shared/types/workflow';

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

type ConditionMode = 'simple' | 'advanced';

export const ConditionalNodeSettings: React.FC<ConditionalNodeSettingsProps> = ({ data, onChange }) => {
  // Determine initial mode based on existing data
  const [mode, setMode] = useState<ConditionMode>(() => {
    if (data.conditionGroup) return 'advanced';
    return 'simple';
  });

  // Simple mode: single condition
  const [simpleCondition, setSimpleCondition] = useState<SimpleCondition>(() => {
    return data.condition || { field: '', operator: 'equals', value: '' };
  });

  // Advanced mode: condition group
  const [conditionGroup, setConditionGroup] = useState<ConditionGroup>(() => {
    return data.conditionGroup || {
      operator: 'AND',
      conditions: [{ field: '', operator: 'equals', value: '' }],
    };
  });

  const handleModeChange = (newMode: ConditionMode) => {
    setMode(newMode);
    if (newMode === 'simple') {
      // Migrate first condition from group to simple
      const firstCondition = conditionGroup.conditions[0] || { field: '', operator: 'equals', value: '' };
      setSimpleCondition(firstCondition);
      onChange({ condition: firstCondition, conditionGroup: undefined });
    } else {
      // Migrate simple to group
      const newGroup: ConditionGroup = {
        operator: 'AND',
        conditions: [simpleCondition],
      };
      setConditionGroup(newGroup);
      onChange({ condition: undefined, conditionGroup: newGroup });
    }
  };

  const handleSimpleFieldChange = (field: string) => {
    const updated = { ...simpleCondition, field };
    setSimpleCondition(updated);
    onChange({ condition: updated });
  };

  const handleSimpleOperatorChange = (operator: ConditionalOperator) => {
    const updated = { ...simpleCondition, operator };
    setSimpleCondition(updated);
    onChange({ condition: updated });
  };

  const handleSimpleValueChange = (value: string) => {
    const updated = { ...simpleCondition, value };
    setSimpleCondition(updated);
    onChange({ condition: updated });
  };

  const handleLogicalOperatorChange = (operator: LogicalOperator) => {
    const updated = { ...conditionGroup, operator };
    setConditionGroup(updated);
    onChange({ conditionGroup: updated });
  };

  const handleConditionChange = (index: number, field: keyof SimpleCondition, value: any) => {
    const updated = { ...conditionGroup };
    updated.conditions[index] = { ...updated.conditions[index], [field]: value };
    setConditionGroup(updated);
    onChange({ conditionGroup: updated });
  };

  const handleAddCondition = () => {
    const updated = { ...conditionGroup };
    updated.conditions.push({ field: '', operator: 'equals', value: '' });
    setConditionGroup(updated);
    onChange({ conditionGroup: updated });
  };

  const handleRemoveCondition = (index: number) => {
    if (conditionGroup.conditions.length <= 1) return; // Keep at least one
    const updated = { ...conditionGroup };
    updated.conditions.splice(index, 1);
    setConditionGroup(updated);
    onChange({ conditionGroup: updated });
  };

  const renderPreview = () => {
    if (mode === 'simple') {
      return (
        <code className="text-xs text-gray-300">
          {simpleCondition.field || '(field)'} {simpleCondition.operator} {simpleCondition.value || '(value)'}
        </code>
      );
    } else {
      const parts = conditionGroup.conditions.map((cond, idx) => (
        <span key={idx}>
          {idx > 0 && <span className="text-blue-400 mx-1">{conditionGroup.operator}</span>}
          ({cond.field || '(field)'} {cond.operator} {cond.value || '(value)'})
        </span>
      ));
      return <code className="text-xs text-gray-300">{parts}</code>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Mode</label>
        <div className="flex space-x-2">
          <button
            onClick={() => handleModeChange('simple')}
            className={`
              flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${mode === 'simple'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }
            `}
          >
            Simple
          </button>
          <button
            onClick={() => handleModeChange('advanced')}
            className={`
              flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${mode === 'advanced'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }
            `}
          >
            Advanced
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {mode === 'simple' ? 'Single condition' : 'Multiple conditions with AND/OR'}
        </p>
      </div>

      {mode === 'simple' ? (
        // Simple Mode
        <>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Field Path</label>
            <input
              type="text"
              value={simpleCondition.field}
              onChange={(e) => handleSimpleFieldChange(e.target.value)}
              placeholder="e.g., status, output.exitCode"
              className="
                w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            />
            <p className="text-xs text-gray-500 mt-1">Use dot notation for nested fields</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Operator</label>
            <select
              value={simpleCondition.operator}
              onChange={(e) => handleSimpleOperatorChange(e.target.value as ConditionalOperator)}
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Value</label>
            <input
              type="text"
              value={simpleCondition.value}
              onChange={(e) => handleSimpleValueChange(e.target.value)}
              placeholder="comparison value"
              className="
                w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            />
            <p className="text-xs text-gray-500 mt-1">Value to compare against</p>
          </div>
        </>
      ) : (
        // Advanced Mode
        <>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Logical Operator</label>
            <div className="flex space-x-2">
              <button
                onClick={() => handleLogicalOperatorChange('AND')}
                className={`
                  flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${conditionGroup.operator === 'AND'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }
                `}
              >
                AND (All must match)
              </button>
              <button
                onClick={() => handleLogicalOperatorChange('OR')}
                className={`
                  flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${conditionGroup.operator === 'OR'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }
                `}
              >
                OR (Any can match)
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Conditions</label>
              <button
                onClick={handleAddCondition}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
              >
                + Add Condition
              </button>
            </div>

            <div className="space-y-3">
              {conditionGroup.conditions.map((cond, idx) => (
                <div key={idx} className="p-3 bg-gray-700/50 rounded-lg border border-gray-600 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-400">Condition {idx + 1}</span>
                    {conditionGroup.conditions.length > 1 && (
                      <button
                        onClick={() => handleRemoveCondition(idx)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={cond.field}
                    onChange={(e) => handleConditionChange(idx, 'field', e.target.value)}
                    placeholder="Field path"
                    className="
                      w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm
                      text-white placeholder-gray-500
                      focus:outline-none focus:ring-1 focus:ring-blue-500
                    "
                  />

                  <select
                    value={cond.operator}
                    onChange={(e) => handleConditionChange(idx, 'operator', e.target.value as ConditionalOperator)}
                    className="
                      w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm
                      text-white focus:outline-none focus:ring-1 focus:ring-blue-500
                    "
                  >
                    {operators.map(op => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={cond.value}
                    onChange={(e) => handleConditionChange(idx, 'value', e.target.value)}
                    placeholder="Value"
                    className="
                      w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm
                      text-white placeholder-gray-500
                      focus:outline-none focus:ring-1 focus:ring-blue-500
                    "
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Preview */}
      <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
        <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Condition Preview</h4>
        {renderPreview()}
      </div>
    </div>
  );
};
