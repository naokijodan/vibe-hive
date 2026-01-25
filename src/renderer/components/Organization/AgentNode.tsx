import React from 'react';
import type { Agent, AgentStatus, AgentRole } from '../../../shared/types';

interface AgentNodeProps {
  agent: Agent;
  onClick?: (agent: Agent) => void;
}

const statusColors: Record<AgentStatus, { bg: string; ring: string }> = {
  idle: { bg: 'bg-gray-500', ring: 'ring-gray-500/30' },
  thinking: { bg: 'bg-blue-500', ring: 'ring-blue-500/30' },
  executing: { bg: 'bg-green-500', ring: 'ring-green-500/30' },
  waiting_input: { bg: 'bg-yellow-500', ring: 'ring-yellow-500/30' },
  error: { bg: 'bg-red-500', ring: 'ring-red-500/30' },
  running: { bg: 'bg-green-500', ring: 'ring-green-500/30' },
};

const roleIcons: Record<AgentRole, string> = {
  orchestrator: '👔',
  developer: '💻',
  reviewer: '🔍',
  tester: '🧪',
  custom: '🤖',
};

const roleLabels: Record<AgentRole, string> = {
  orchestrator: 'Orchestrator',
  developer: 'Developer',
  reviewer: 'Reviewer',
  tester: 'Tester',
  custom: 'Custom',
};

export const AgentNode: React.FC<AgentNodeProps> = ({ agent, onClick }) => {
  const statusStyle = statusColors[agent.status];
  const isActive = agent.status === 'executing' || agent.status === 'thinking' || agent.status === 'running';

  return (
    <div
      className={`
        relative bg-hive-surface border border-hive-border rounded-lg p-4
        cursor-pointer hover:border-hive-accent/50 transition-all
        min-w-[160px] max-w-[200px]
        ${isActive ? `ring-2 ${statusStyle.ring}` : ''}
      `}
      onClick={() => onClick?.(agent)}
    >
      {/* Status indicator */}
      <div className="absolute -top-1 -right-1">
        <span
          className={`
            block w-3 h-3 rounded-full ${statusStyle.bg}
            ${isActive ? 'animate-pulse' : ''}
          `}
        />
      </div>

      {/* Role icon */}
      <div className="text-2xl mb-2 text-center">
        {roleIcons[agent.role]}
      </div>

      {/* Agent name */}
      <h4 className="text-white font-medium text-sm text-center truncate">
        {agent.name}
      </h4>

      {/* Role label */}
      <p className="text-hive-muted text-xs text-center mt-1">
        {roleLabels[agent.role]}
      </p>

      {/* Capabilities (if any) */}
      {agent.capabilities && agent.capabilities.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 justify-center">
          {agent.capabilities.slice(0, 2).map((cap) => (
            <span
              key={cap}
              className="text-[10px] bg-hive-bg px-1.5 py-0.5 rounded text-hive-muted"
            >
              {cap}
            </span>
          ))}
          {agent.capabilities.length > 2 && (
            <span className="text-[10px] text-hive-muted">
              +{agent.capabilities.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
