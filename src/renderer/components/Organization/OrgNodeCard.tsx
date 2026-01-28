import React from 'react';
import { Handle, Position } from 'reactflow';
import type { OrgNode } from '../../../shared/types/organization';
import { useAgentStore } from '../../stores/agentStore';

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
      <h3 className="text-white font-medium mb-2 break-words">{node.name}</h3>

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
