import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from '../../../../shared/types/workflow';

export const NotificationNode: React.FC<NodeProps<WorkflowNodeData>> = ({ data, selected }) => {
  const notificationType = data.notificationType || 'discord';

  const getNotificationIcon = () => {
    switch (notificationType) {
      case 'discord':
        return '💬';
      case 'slack':
        return '💼';
      case 'email':
        return '📧';
      default:
        return '📢';
    }
  };

  const getNotificationColor = () => {
    switch (notificationType) {
      case 'discord':
        return '#5865F2';
      case 'slack':
        return '#4A154B';
      case 'email':
        return '#EA4335';
      default:
        return '#8B5CF6';
    }
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 min-w-[180px] ${
        selected ? 'shadow-lg' : ''
      }`}
      style={{
        backgroundColor: '#1f2937',
        borderColor: selected ? getNotificationColor() : '#4b5563',
        boxShadow: selected ? `0 0 20px ${getNotificationColor()}50` : 'none',
      }}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400" />

      <div className="flex items-center space-x-2 mb-2">
        <span className="text-2xl">{getNotificationIcon()}</span>
        <div className="flex-1">
          <div className="text-xs text-gray-400 uppercase font-semibold">Notification</div>
          <div className="text-sm text-white font-medium">{data.label}</div>
        </div>
      </div>

      <div className="text-xs space-y-1">
        <div className="flex items-center space-x-2">
          <span className="text-gray-500">Type:</span>
          <span
            className="px-2 py-0.5 rounded text-white font-medium"
            style={{ backgroundColor: getNotificationColor() }}
          >
            {notificationType}
          </span>
        </div>
        {data.config?.title && (
          <div className="text-gray-400 truncate">
            Title: {data.config.title}
          </div>
        )}
        {data.config?.message && (
          <div className="text-gray-400 truncate">
            Message: {data.config.message.substring(0, 30)}
            {data.config.message.length > 30 ? '...' : ''}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-gray-400" />
    </div>
  );
};
