import React from 'react';
import { Handle, Position } from 'reactflow';
import type { OrgNode } from '../../../shared/types/organization';
import type { AgentType } from '../../../shared/types/workflow';
import type { NodeExecutionStatus } from '../../../shared/types/orchestration';
import { useAgentStore } from '../../stores/agentStore';
import { useOrganizationStore } from '../../stores/organizationStore';

const AGENT_TYPE_LABELS: Record<AgentType, { icon: string; label: string }> = {
  'claude-code': { icon: '🤖', label: 'Claude' },
  'codex': { icon: '⚡', label: 'Codex' },
  'gemini': { icon: '💎', label: 'Gemini' },
  'ollama': { icon: '🦙', label: 'Ollama' },
  'custom': { icon: '🔧', label: 'Custom' },
};

const STATUS_INDICATOR: Record<NodeExecutionStatus, { color: string; label: string; animate: boolean }> = {
  idle: { color: 'bg-gray-500', label: '', animate: false },
  running: { color: 'bg-blue-400', label: '実行中', animate: true },
  completed: { color: 'bg-green-400', label: '完了', animate: false },
  failed: { color: 'bg-red-400', label: '失敗', animate: false },
};

interface OrgNodeCardProps {
  data: {
    node: OrgNode;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    isSelected: boolean;
  };
}

export const OrgNodeCard: React.FC<OrgNodeCardProps> = ({ data }) => {
  const { node, onSelect, onDelete, isSelected } = data;
  const { agents } = useAgentStore();
  const execution = useOrganizationStore(s => s.nodeExecutions.get(node.id));
  const execStatus = execution?.status ?? 'idle';

  const assignedAgents = agents.filter(agent =>
    node.assignedAgentIds?.includes(agent.id)
  );

  const isTeam = node.type === 'team';
  const bgColor = isTeam ? 'bg-blue-900/30' : 'bg-purple-900/30';
  const borderColor = isSelected
    ? 'border-hive-accent'
    : isTeam
    ? 'border-blue-500/50'
    : 'border-purple-500/50';

  return (
    <div
      onClick={() => onSelect(node.id)}
      className={`
        px-4 py-3 rounded-lg border-2 ${bgColor} ${borderColor}
        min-w-[200px] max-w-[250px]
        cursor-pointer hover:border-hive-accent/70 transition-all
        ${isSelected ? 'ring-2 ring-hive-accent/30' : ''}
      `}
    >
      {/* Top handle for incoming connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-hive-accent"
      />

      {/* Node header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {isTeam ? '👥' : '🎭'}
          </span>
          <span className="text-xs px-2 py-0.5 bg-hive-bg rounded text-hive-muted">
            {node.type}
          </span>
          {execStatus !== 'idle' && (
            <span className={`inline-block w-2 h-2 rounded-full ${STATUS_INDICATOR[execStatus].color} ${STATUS_INDICATOR[execStatus].animate ? 'animate-pulse' : ''}`}
              title={STATUS_INDICATOR[execStatus].label}
            />
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
          className="text-red-400 hover:text-red-300 text-xs"
          title="ノードを削除"
        >
          ✕
        </button>
      </div>

      {/* Node name */}
      <h3 className="text-white font-medium mb-1 break-words">{node.name}</h3>

      {/* Badges: agent type + execution strategy */}
      <div className="flex flex-wrap gap-1 mb-2">
        {node.preferredAgentType && (
          <span className="text-[10px] px-1.5 py-0.5 bg-indigo-900/50 text-indigo-300 rounded">
            {AGENT_TYPE_LABELS[node.preferredAgentType]?.icon} {AGENT_TYPE_LABELS[node.preferredAgentType]?.label}
          </span>
        )}
        {isTeam && node.executionStrategy && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            node.executionStrategy === 'sequential'
              ? 'bg-amber-900/50 text-amber-300'
              : 'bg-emerald-900/50 text-emerald-300'
          }`}>
            {node.executionStrategy === 'sequential' ? '⏩ 直列' : '⚡ 並列'}
          </span>
        )}
      </div>

      {/* Description */}
      {node.description && (
        <p className="text-xs text-hive-muted mb-2 line-clamp-2">
          {node.description}
        </p>
      )}

      {/* Assigned agents */}
      {assignedAgents.length > 0 && (
        <div className="mt-2 pt-2 border-t border-hive-border">
          <div className="text-[10px] text-hive-muted mb-1">
            割り当て ({assignedAgents.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {assignedAgents.slice(0, 3).map(agent => (
              <div
                key={agent.id}
                className="text-[10px] px-1.5 py-0.5 bg-hive-bg rounded text-white"
                title={agent.name}
              >
                🤖 {agent.name}
              </div>
            ))}
            {assignedAgents.length > 3 && (
              <div className="text-[10px] px-1.5 py-0.5 bg-hive-bg rounded text-hive-muted">
                +{assignedAgents.length - 3}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom handle for outgoing connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-hive-accent"
      />
    </div>
  );
};
