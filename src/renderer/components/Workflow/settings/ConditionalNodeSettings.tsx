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

type ConditionMode = 'simple' | 'advanced' | 'expert';

export const ConditionalNodeSettings: React.FC<ConditionalNodeSettingsProps> = ({ data, onChange }) => {
  // Determine initial mode based on existing data
  const [mode, setMode] = useState<ConditionMode>(() => {
    if (data.conditionGroup?.groups && data.conditionGroup.groups.length > 0) return 'expert';
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

  // Expert mode: nested condition groups
  const [expertGroup, setExpertGroup] = useState<ConditionGroup>(() => {
    return data.conditionGroup || {
      operator: 'OR',
      conditions: [],
      groups: [
        {
          operator: 'AND',
          conditions: [{ field: '', operator: 'equals', value: '' }],
        }
      ],
    };
  });

  const handleModeChange = (newMode: ConditionMode) => {
    setMode(newMode);
    if (newMode === 'simple') {
      // Migrate to simple mode
      let firstCondition: SimpleCondition;
      if (mode === 'expert' && expertGroup.groups && expertGroup.groups[0]) {
        firstCondition = expertGroup.groups[0].conditions[0] || { field: '', operator: 'equals', value: '' };
      } else {
        firstCondition = conditionGroup.conditions[0] || { field: '', operator: 'equals', value: '' };
      }
      setSimpleCondition(firstCondition);
      onChange({ condition: firstCondition, conditionGroup: undefined });
    } else if (newMode === 'advanced') {
      // Migrate to advanced mode
      let newGroup: ConditionGroup;
      if (mode === 'simple') {
        newGroup = {
          operator: 'AND',
          conditions: [simpleCondition],
        };
      } else if (mode === 'expert' && expertGroup.groups && expertGroup.groups[0]) {
        newGroup = expertGroup.groups[0];
      } else {
        newGroup = conditionGroup;
      }
      setConditionGroup(newGroup);
      onChange({ condition: undefined, conditionGroup: newGroup });
    } else if (newMode === 'expert') {
      // Migrate to expert mode
      let newExpertGroup: ConditionGroup;
      if (mode === 'simple') {
        newExpertGroup = {
          operator: 'OR',
          conditions: [],
          groups: [
            {
              operator: 'AND',
              conditions: [simpleCondition],
            }
          ],
        };
      } else {
        // From advanced
        newExpertGroup = {
          operator: 'OR',
          conditions: [],
          groups: [conditionGroup],
        };
      }
      setExpertGroup(newExpertGroup);
      onChange({ condition: undefined, conditionGroup: newExpertGroup });
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

  // Expert mode handlers
  const handleExpertLogicalOperatorChange = (operator: LogicalOperator) => {
    const updated = { ...expertGroup, operator };
    setExpertGroup(updated);
    onChange({ conditionGroup: updated });
  };

  const handleAddGroup = () => {
    const updated = { ...expertGroup };
    if (!updated.groups) updated.groups = [];
    updated.groups.push({
      operator: 'AND',
      conditions: [{ field: '', operator: 'equals', value: '' }],
    });
    setExpertGroup(updated);
    onChange({ conditionGroup: updated });
  };

  const handleRemoveGroup = (groupIndex: number) => {
    if (!expertGroup.groups || expertGroup.groups.length <= 1) return; // Keep at least one
    const updated = { ...expertGroup };
    updated.groups!.splice(groupIndex, 1);
    setExpertGroup(updated);
    onChange({ conditionGroup: updated });
  };

  const handleGroupOperatorChange = (groupIndex: number, operator: LogicalOperator) => {
    const updated = { ...expertGroup };
    if (updated.groups) {
      updated.groups[groupIndex] = { ...updated.groups[groupIndex], operator };
    }
    setExpertGroup(updated);
    onChange({ conditionGroup: updated });
  };

  const handleGroupConditionChange = (groupIndex: number, condIndex: number, field: keyof SimpleCondition, value: any) => {
    const updated = { ...expertGroup };
    if (updated.groups) {
      const group = updated.groups[groupIndex];
      group.conditions[condIndex] = { ...group.conditions[condIndex], [field]: value };
    }
    setExpertGroup(updated);
    onChange({ conditionGroup: updated });
  };

  const handleAddGroupCondition = (groupIndex: number) => {
    const updated = { ...expertGroup };
    if (updated.groups) {
      updated.groups[groupIndex].conditions.push({ field: '', operator: 'equals', value: '' });
    }
    setExpertGroup(updated);
    onChange({ conditionGroup: updated });
  };

  const handleRemoveGroupCondition = (groupIndex: number, condIndex: number) => {
    const updated = { ...expertGroup };
    if (updated.groups && updated.groups[groupIndex].conditions.length > 1) {
      updated.groups[groupIndex].conditions.splice(condIndex, 1);
    }
    setExpertGroup(updated);
    onChange({ conditionGroup: updated });
  };

  const renderPreview = () => {
    if (mode === 'simple') {
      return (
        <code className="text-xs text-gray-300">
          {simpleCondition.field || '(field)'} {simpleCondition.operator} {simpleCondition.value || '(value)'}
        </code>
      );
    } else if (mode === 'advanced') {
      const parts = conditionGroup.conditions.map((cond, idx) => (
        <span key={idx}>
          {idx > 0 && <span className="text-blue-400 mx-1">{conditionGroup.operator}</span>}
          ({cond.field || '(field)'} {cond.operator} {cond.value || '(value)'})
        </span>
      ));
      return <code className="text-xs text-gray-300">{parts}</code>;
    } else {
      // Expert mode
      const groups = expertGroup.groups || [];
      const groupParts = groups.map((group, gIdx) => {
        const condParts = group.conditions.map((cond, cIdx) => (
          <span key={`${gIdx}-${cIdx}`}>
            {cIdx > 0 && <span className="text-green-400 mx-1">{group.operator}</span>}
            {cond.field || '(field)'} {cond.operator} {cond.value || '(value)'}
          </span>
        ));
        return (
          <div key={gIdx} className="inline-block">
            {gIdx > 0 && <div className="text-orange-400 my-1 text-center font-bold">{expertGroup.operator}</div>}
            <div className="px-2 py-1 bg-gray-800/50 rounded border border-gray-600">
              ({condParts})
            </div>
          </div>
        );
      });
      return <div className="text-xs text-gray-300 space-y-1">{groupParts}</div>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Mode</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleModeChange('simple')}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-colors
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
              px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${mode === 'advanced'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }
            `}
          >
            Advanced
          </button>
          <button
            onClick={() => handleModeChange('expert')}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${mode === 'expert'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }
            `}
          >
            Expert
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {mode === 'simple' && 'Single condition'}
          {mode === 'advanced' && 'Multiple conditions with AND/OR'}
          {mode === 'expert' && 'Nested groups with complex logic'}
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
      ) : mode === 'advanced' ? (
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
      ) : (
        // Expert Mode
        <>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Top-Level Logical Operator</label>
            <div className="flex space-x-2">
              <button
                onClick={() => handleExpertLogicalOperatorChange('AND')}
                className={`
                  flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${expertGroup.operator === 'AND'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }
                `}
              >
                AND
              </button>
              <button
                onClick={() => handleExpertLogicalOperatorChange('OR')}
                className={`
                  flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${expertGroup.operator === 'OR'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }
                `}
              >
                OR
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Operator between groups</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Condition Groups</label>
              <button
                onClick={handleAddGroup}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg transition-colors"
              >
                + Add Group
              </button>
            </div>

            <div className="space-y-4">
              {(expertGroup.groups || []).map((group, gIdx) => (
                <div key={gIdx} className="p-4 bg-gray-700/30 rounded-lg border-2 border-purple-600/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-purple-300">Group {gIdx + 1}</span>
                    {(expertGroup.groups?.length || 0) > 1 && (
                      <button
                        onClick={() => handleRemoveGroup(gIdx)}
                        className="text-red-400 hover:text-red-300 text-xs font-medium"
                      >
                        Remove Group
                      </button>
                    )}
                  </div>

                  {/* Group operator */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Group Operator</label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleGroupOperatorChange(gIdx, 'AND')}
                        className={`
                          flex-1 px-3 py-1 rounded text-xs font-medium transition-colors
                          ${group.operator === 'AND'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          }
                        `}
                      >
                        AND
                      </button>
                      <button
                        onClick={() => handleGroupOperatorChange(gIdx, 'OR')}
                        className={`
                          flex-1 px-3 py-1 rounded text-xs font-medium transition-colors
                          ${group.operator === 'OR'
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          }
                        `}
                      >
                        OR
                      </button>
                    </div>
                  </div>

                  {/* Group conditions */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-gray-400">Conditions</label>
                      <button
                        onClick={() => handleAddGroupCondition(gIdx)}
                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                      >
                        + Add
                      </button>
                    </div>

                    <div className="space-y-2">
                      {group.conditions.map((cond, cIdx) => (
                        <div key={cIdx} className="p-2 bg-gray-800/50 rounded border border-gray-600 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Condition {cIdx + 1}</span>
                            {group.conditions.length > 1 && (
                              <button
                                onClick={() => handleRemoveGroupCondition(gIdx, cIdx)}
                                className="text-red-400 hover:text-red-300 text-xs"
                              >
                                ✕
                              </button>
                            )}
                          </div>

                          <input
                            type="text"
                            value={cond.field}
                            onChange={(e) => handleGroupConditionChange(gIdx, cIdx, 'field', e.target.value)}
                            placeholder="Field path"
                            className="
                              w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-xs
                              text-white placeholder-gray-500
                              focus:outline-none focus:ring-1 focus:ring-purple-500
                            "
                          />

                          <select
                            value={cond.operator}
                            onChange={(e) => handleGroupConditionChange(gIdx, cIdx, 'operator', e.target.value as ConditionalOperator)}
                            className="
                              w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-xs
                              text-white focus:outline-none focus:ring-1 focus:ring-purple-500
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
                            onChange={(e) => handleGroupConditionChange(gIdx, cIdx, 'value', e.target.value)}
                            placeholder="Value"
                            className="
                              w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-xs
                              text-white placeholder-gray-500
                              focus:outline-none focus:ring-1 focus:ring-purple-500
                            "
                          />
                        </div>
                      ))}
                    </div>
                  </div>
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
