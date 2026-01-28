import React, { useEffect, useState } from 'react';
import type { Node } from '@xyflow/react';
import type { WorkflowNodeData } from '../../../../shared/types/workflow';
import { useWorkflowStore } from '../../../stores/workflowStore';
import { TaskNodeSettings } from './TaskNodeSettings';
import { ConditionalNodeSettings } from './ConditionalNodeSettings';
import { DelayNodeSettings } from './DelayNodeSettings';
import { TriggerNodeSettings } from './TriggerNodeSettings';
import { NotificationNodeSettings } from './NotificationNodeSettings';
import { LoopNodeSettings } from './LoopNodeSettings';
import { SubworkflowNodeSettings } from './SubworkflowNodeSettings';
import { AgentNodeSettings } from './AgentNodeSettings';
import { validateWorkflowNode, type ValidationResult } from '../../../utils/validation';

interface NodeSettingsPanelProps {
  selectedNode: Node<WorkflowNodeData> | null;
  onClose: () => void;
}

export const NodeSettingsPanel: React.FC<NodeSettingsPanelProps> = ({ selectedNode, onClose }) => {
  const updateNode = useWorkflowStore(state => state.updateNode);
  const [validation, setValidation] = useState<ValidationResult>({ valid: true, errors: [], warnings: [] });

  // Validate node whenever data changes
  useEffect(() => {
    if (selectedNode) {
      const result = validateWorkflowNode(selectedNode.type || '', selectedNode.data);
      setValidation(result);
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="w-80 bg-gray-800 border-l border-gray-700 flex items-center justify-center">
        <div className="text-center px-6">
          <svg
            className="w-16 h-16 mx-auto text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-gray-400">
            Select a node to configure its settings
          </p>
        </div>
      </div>
    );
  }

  const handleChange = (updates: Partial<WorkflowNodeData>) => {
    updateNode(selectedNode.id, {
      data: {
        ...selectedNode.data,
        ...updates,
      },
    });
  };

  const renderSettings = () => {
    switch (selectedNode.type) {
      case 'task':
        return <TaskNodeSettings data={selectedNode.data} onChange={handleChange} />;
      case 'conditional':
        return <ConditionalNodeSettings data={selectedNode.data} onChange={handleChange} />;
      case 'delay':
        return <DelayNodeSettings data={selectedNode.data} onChange={handleChange} />;
      case 'trigger':
        return <TriggerNodeSettings data={selectedNode.data} onChange={handleChange} />;
      case 'notification':
        return <NotificationNodeSettings data={selectedNode.data} onChange={handleChange} />;
      case 'loop':
        return <LoopNodeSettings data={selectedNode.data} onChange={handleChange} />;
      case 'subworkflow':
        return <SubworkflowNodeSettings data={selectedNode.data} onChange={handleChange} />;
      case 'agent':
        return <AgentNodeSettings data={selectedNode.data} onChange={handleChange} />;
      case 'merge':
        return (
          <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
            <p className="text-sm text-gray-300">
              Merge nodes have no configurable settings. They automatically combine inputs from multiple sources.
            </p>
          </div>
        );
      default:
        return (
          <div className="p-3 bg-yellow-900/30 rounded-lg border border-yellow-700">
            <p className="text-sm text-yellow-300">
              Unknown node type: {selectedNode.type}
            </p>
          </div>
        );
    }
  };

  const getNodeTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      task: 'Task',
      trigger: 'Trigger',
      conditional: 'Conditional',
      notification: 'Notification',
      delay: 'Delay',
      merge: 'Merge',
      loop: 'Loop',
      subworkflow: 'Subworkflow',
      agent: 'AI Agent',
    };
    return labels[type] || type;
  };

  const getNodeTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      task: '⚙️',
      trigger: '▶️',
      conditional: '🔀',
      notification: '📢',
      delay: '⏱️',
      merge: '🔗',
      loop: '🔄',
      subworkflow: '📋',
      agent: '🤖',
    };
    return icons[type] || '❓';
  };

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-xl">{getNodeTypeIcon(selectedNode.type || '')}</span>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {getNodeTypeLabel(selectedNode.type || '')} Settings
            </h3>
            <p className="text-xs text-gray-500">{selectedNode.data.label}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="
            p-1 rounded hover:bg-gray-700 transition-colors
            text-gray-400 hover:text-white
          "
          title="Close settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Validation Messages */}
        {(validation.errors.length > 0 || validation.warnings.length > 0) && (
          <div className="mb-4 space-y-2">
            {/* Errors */}
            {validation.errors.map((error, index) => (
              <div
                key={`error-${index}`}
                className="p-3 bg-red-900/30 rounded-lg border border-red-700"
              >
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            ))}

            {/* Warnings */}
            {validation.warnings.map((warning, index) => (
              <div
                key={`warning-${index}`}
                className="p-3 bg-yellow-900/30 rounded-lg border border-yellow-700"
              >
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-yellow-300">{warning}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {renderSettings()}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-700 bg-gray-900/50">
        <div className="text-xs text-gray-500">
          <span className="font-medium">Node ID:</span>{' '}
          <span className="text-gray-400 font-mono">{selectedNode.id}</span>
        </div>
      </div>
    </div>
  );
};
