import React from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { WorkflowNodeData } from '../../../../shared/types/workflow';

export const AgentNode: React.FC<NodeProps<Node<WorkflowNodeData>>> = ({ data, selected }) => {
  const agentConfig = data.agentConfig;
  const agentType = agentConfig?.agentType || 'claude-code';
  const timeout = agentConfig?.timeout || 300000; // 5 minutes default

  const getAgentIcon = (): string => {
    switch (agentType) {
      case 'claude-code':
        return '🤖';
      case 'codex':
        return '🔮';
      case 'custom':
        return '⚙️';
      default:
        return '🤖';
    }
  };

  const getAgentLabel = (): string => {
    switch (agentType) {
      case 'claude-code':
        return 'Claude Code';
      case 'codex':
        return 'Codex';
      case 'custom':
        return 'Custom';
      default:
        return 'Agent';
    }
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-gray-800 min-w-[180px] ${
        selected ? 'border-pink-400 shadow-lg shadow-pink-400/50' : 'border-pink-600'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-pink-400" />

      <div className="flex items-center space-x-2 mb-2">
        <span className="text-2xl">{getAgentIcon()}</span>
        <div className="flex-1">
          <div className="text-xs text-gray-400 uppercase font-semibold">AI Agent</div>
          <div className="text-sm text-white font-medium">{data.label}</div>
        </div>
      </div>

      <div className="text-xs space-y-1">
        <div className="flex items-center space-x-2">
          <span className="text-gray-500">Type:</span>
          <span className="px-2 py-0.5 bg-pink-900/50 text-pink-300 rounded font-semibold">
            {getAgentLabel()}
          </span>
        </div>
        {agentConfig?.prompt && (
          <div className="text-gray-300 truncate" title={agentConfig.prompt}>
            "{agentConfig.prompt.substring(0, 30)}..."
          </div>
        )}
        <div className="text-gray-400 text-[10px]">
          Timeout: {timeout / 1000}s
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-pink-400" />
    </div>
  );
};
