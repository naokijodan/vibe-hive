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

const STATUS_BAR_COLORS: Record<NodeExecutionStatus, string> = {
  idle: 'bg-gray-600',
  running: 'bg-blue-400',
  completed: 'bg-green-400',
  failed: 'bg-red-500',
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

  // Phase B-6: Highlight logic
  const selectedNodeId = useOrganizationStore(s => s.selectedNodeId);
  const highlightedNodeIds = useOrganizationStore(s => s.highlightedNodeIds);
  const isDimmed = selectedNodeId
    && selectedNodeId !== node.id
    && highlightedNodeIds.size > 0
    && !highlightedNodeIds.has(node.id);

  const isTeam = node.type === 'team';

  // Phase C-7: Progress for team nodes
  const nodeExecutions = useOrganizationStore(s => s.nodeExecutions);
  const nodes = useOrganizationStore(s => s.nodes);
  const childProgress = (() => {
    if (!isTeam) return null;
    const children = nodes.filter(n => n.parentId === node.id);
    if (children.length === 0) return null;
    const completed = children.filter(c => {
      const exec = nodeExecutions.get(c.id);
      return exec?.status === 'completed';
    }).length;
    return { completed, total: children.length, percent: Math.round((completed / children.length) * 100) };
  })();

  // Phase A-2: failed時は背景を赤Tintに変更
  const bgColor = execStatus === 'failed'
    ? 'bg-red-900/15'
    : isTeam ? 'bg-blue-900/30' : 'bg-purple-900/30';

  // 枠線はタイプ/選択状態に専念
  const borderColor = isSelected
    ? 'border-hive-accent'
    : isTeam
    ? 'border-blue-500/50'
    : 'border-purple-500/50';

  return (
    <div
      onClick={() => onSelect(node.id)}
      className={`
        relative overflow-hidden
        rounded-lg border-2 ${bgColor} ${borderColor}
        min-w-[200px] max-w-[250px]
        cursor-pointer hover:border-hive-accent/70 transition-all
        ${isSelected ? 'ring-2 ring-hive-accent/30' : ''}
        ${execStatus === 'running' ? 'animate-glow' : ''}
        ${isDimmed ? 'opacity-25 transition-opacity duration-300' : 'opacity-100'}
      `}
    >
      {/* Phase A-1: 左端ステータスカラーバー */}
      <div className={`
        absolute left-0 top-0 bottom-0 w-1.5
        ${STATUS_BAR_COLORS[execStatus]}
        ${execStatus === 'running' ? 'animate-pulse' : ''}
      `} />

      {/* Top handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-hive-accent"
      />

      {/* Content area with left padding for status bar */}
      <div className="pl-4 pr-4 py-3">
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
        <h3 className="text-white font-medium mb-1 break-words">{node.name}</h3>

        {/* Phase B-5: Badges - icons only, max 2 visible + SP flag */}
        <div className="flex items-center gap-1.5 mb-2">
          {node.preferredAgentType && (
            <span
              className="text-sm cursor-help"
              title={AGENT_TYPE_LABELS[node.preferredAgentType]?.label}
            >
              {AGENT_TYPE_LABELS[node.preferredAgentType]?.icon}
            </span>
          )}
          {isTeam && node.executionStrategy && (
            <span
              className="text-sm cursor-help"
              title={node.executionStrategy === 'sequential' ? '直列実行' : '並列実行'}
            >
              {node.executionStrategy === 'sequential' ? '⏩' : '⚡'}
            </span>
          )}
          {node.systemPrompt && (
            <span
              className="text-xs text-cyan-400 cursor-help"
              title={node.systemPrompt.slice(0, 100) + (node.systemPrompt.length > 100 ? '...' : '')}
            >
              📝
            </span>
          )}
        </div>

        {/* Description */}
        {node.description && (
          <p className="text-xs text-hive-muted mb-2 line-clamp-2">
            {node.description}
          </p>
        )}

        {/* Phase C-8: Micro metrics */}
        {execution && execStatus !== 'idle' && (execution.duration || execution.tokenCount) && (
          <div className="text-[10px] text-hive-muted flex gap-2 mb-1">
            {execution.duration != null && (
              <span>⏱ {execution.duration < 1000 ? `${execution.duration}ms` : `${(execution.duration / 1000).toFixed(1)}s`}</span>
            )}
            {execution.tokenCount != null && (
              <span>📊 {execution.tokenCount}tok</span>
            )}
          </div>
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
      </div>

      {/* Phase C-7: Progress bar for team nodes */}
      {childProgress && childProgress.total > 0 && execStatus !== 'idle' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
          <div
            className="h-full bg-green-400 transition-all duration-500"
            style={{ width: `${childProgress.percent}%` }}
          />
        </div>
      )}

      {/* Bottom handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-hive-accent"
      />
    </div>
  );
};
