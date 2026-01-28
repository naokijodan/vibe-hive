import React from 'react';
import type { Node } from '@xyflow/react';
import type { WorkflowNodeData } from '../../../../shared/types/workflow';
import { useWorkflowStore } from '../../../stores/workflowStore';
import { TaskNodeSettings } from './TaskNodeSettings';
import { ConditionalNodeSettings } from './ConditionalNodeSettings';
import { DelayNodeSettings } from './DelayNodeSettings';
import { TriggerNodeSettings } from './TriggerNodeSettings';
import { NotificationNodeSettings } from './NotificationNodeSettings';

interface NodeSettingsPanelProps {
  selectedNode: Node<WorkflowNodeData> | null;
  onClose: () => void;
}

export const NodeSettingsPanel: React.FC<NodeSettingsPanelProps> = ({ selectedNode, onClose }) => {
  const updateNode = useWorkflowStore(state => state.updateNode);

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
