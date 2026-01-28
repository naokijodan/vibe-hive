import React, { useState, useEffect } from 'react';
import type { WorkflowNodeData, SubworkflowConfig } from '../../../../shared/types/workflow';
import { useWorkflowStore } from '../../../stores/workflowStore';

interface SubworkflowNodeSettingsProps {
  data: WorkflowNodeData;
  onChange: (data: Partial<WorkflowNodeData>) => void;
}

export const SubworkflowNodeSettings: React.FC<SubworkflowNodeSettingsProps> = ({ data, onChange }) => {
  const { workflows, loadWorkflows } = useWorkflowStore();
  const subworkflowConfig = data.subworkflowConfig || {
    workflowId: 0,
    inputMapping: {},
    outputMapping: {},
  };

  const [config, setConfig] = useState<SubworkflowConfig>(subworkflowConfig);
  const [inputMappingEntries, setInputMappingEntries] = useState<Array<{ key: string; value: string }>>(
    Object.entries(config.inputMapping || {}).map(([key, value]) => ({ key, value }))
  );
  const [outputMappingEntries, setOutputMappingEntries] = useState<Array<{ key: string; value: string }>>(
    Object.entries(config.outputMapping || {}).map(([key, value]) => ({ key, value }))
  );

  useEffect(() => {
    loadWorkflows();
  }, []);

  const handleWorkflowChange = (workflowId: number) => {
    const updated = { ...config, workflowId };
    setConfig(updated);
    onChange({ subworkflowConfig: updated });
  };

  const handleAddInputMapping = () => {
    setInputMappingEntries([...inputMappingEntries, { key: '', value: '' }]);
  };

  const handleRemoveInputMapping = (index: number) => {
    const updated = [...inputMappingEntries];
    updated.splice(index, 1);
    setInputMappingEntries(updated);
    updateInputMapping(updated);
  };

  const handleInputMappingChange = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...inputMappingEntries];
    updated[index][field] = value;
    setInputMappingEntries(updated);
    updateInputMapping(updated);
  };

  const updateInputMapping = (entries: Array<{ key: string; value: string }>) => {
    const mapping = entries.reduce((acc, entry) => {
      if (entry.key) acc[entry.key] = entry.value;
      return acc;
    }, {} as Record<string, string>);
    const updated = { ...config, inputMapping: mapping };
    setConfig(updated);
    onChange({ subworkflowConfig: updated });
  };

  const handleAddOutputMapping = () => {
    setOutputMappingEntries([...outputMappingEntries, { key: '', value: '' }]);
  };

  const handleRemoveOutputMapping = (index: number) => {
    const updated = [...outputMappingEntries];
    updated.splice(index, 1);
    setOutputMappingEntries(updated);
    updateOutputMapping(updated);
  };

  const handleOutputMappingChange = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...outputMappingEntries];
    updated[index][field] = value;
    setOutputMappingEntries(updated);
    updateOutputMapping(updated);
  };

  const updateOutputMapping = (entries: Array<{ key: string; value: string }>) => {
    const mapping = entries.reduce((acc, entry) => {
      if (entry.key) acc[entry.key] = entry.value;
      return acc;
    }, {} as Record<string, string>);
    const updated = { ...config, outputMapping: mapping };
    setConfig(updated);
    onChange({ subworkflowConfig: updated });
  };

  const selectedWorkflow = workflows.find(w => w.id === config.workflowId);

  return (
    <div className="space-y-4">
      {/* Workflow Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Target Workflow</label>
        <select
          value={config.workflowId || ''}
          onChange={(e) => handleWorkflowChange(parseInt(e.target.value, 10))}
          className="
            w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
            text-white focus:outline-none focus:ring-2 focus:ring-indigo-500
          "
        >
          <option value="">Select workflow...</option>
          {workflows.map(workflow => (
            <option key={workflow.id} value={workflow.id}>
              {workflow.name}
            </option>
          ))}
        </select>
        {selectedWorkflow && (
          <p className="text-xs text-gray-500 mt-1">{selectedWorkflow.description}</p>
        )}
      </div>

      {/* Input Mapping */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">Input Mapping</label>
          <button
            onClick={handleAddInputMapping}
            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded transition-colors"
          >
            + Add
          </button>
        </div>
        <div className="space-y-2">
          {inputMappingEntries.length === 0 ? (
            <div className="text-xs text-gray-500 italic">No input mappings</div>
          ) : (
            inputMappingEntries.map((entry, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={entry.key}
                  onChange={(e) => handleInputMappingChange(idx, 'key', e.target.value)}
                  placeholder="Child input field"
                  className="
                    flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm
                    text-white placeholder-gray-500
                    focus:outline-none focus:ring-1 focus:ring-indigo-500
                  "
                />
                <span className="text-gray-500 text-sm">←</span>
                <input
                  type="text"
                  value={entry.value}
                  onChange={(e) => handleInputMappingChange(idx, 'value', e.target.value)}
                  placeholder="Parent field"
                  className="
                    flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm
                    text-white placeholder-gray-500
                    focus:outline-none focus:ring-1 focus:ring-indigo-500
                  "
                />
                <button
                  onClick={() => handleRemoveInputMapping(idx)}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Map parent workflow data to child workflow input
        </p>
      </div>

      {/* Output Mapping */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">Output Mapping</label>
          <button
            onClick={handleAddOutputMapping}
            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded transition-colors"
          >
            + Add
          </button>
        </div>
        <div className="space-y-2">
          {outputMappingEntries.length === 0 ? (
            <div className="text-xs text-gray-500 italic">No output mappings</div>
          ) : (
            outputMappingEntries.map((entry, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={entry.key}
                  onChange={(e) => handleOutputMappingChange(idx, 'key', e.target.value)}
                  placeholder="Parent field"
                  className="
                    flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm
                    text-white placeholder-gray-500
                    focus:outline-none focus:ring-1 focus:ring-indigo-500
                  "
                />
                <span className="text-gray-500 text-sm">←</span>
                <input
                  type="text"
                  value={entry.value}
                  onChange={(e) => handleOutputMappingChange(idx, 'value', e.target.value)}
                  placeholder="Child output field"
                  className="
                    flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm
                    text-white placeholder-gray-500
                    focus:outline-none focus:ring-1 focus:ring-indigo-500
                  "
                />
                <button
                  onClick={() => handleRemoveOutputMapping(idx)}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Map child workflow output to parent workflow data
        </p>
      </div>

      {/* Info */}
      <div className="p-3 bg-indigo-900/20 rounded-lg border border-indigo-700/50">
        <div className="text-xs font-semibold text-indigo-300 mb-1">Subworkflow Execution</div>
        <div className="text-xs text-indigo-200/80 space-y-1">
          <div>• The selected workflow will be executed as a child</div>
          <div>• Input mapping passes data from parent to child</div>
          <div>• Output mapping returns data from child to parent</div>
          <div>• Recursive calls are detected and prevented</div>
        </div>
      </div>
    </div>
  );
};
