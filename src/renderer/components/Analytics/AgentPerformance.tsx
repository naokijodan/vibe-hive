import React from 'react';
import type { Task } from '../../../shared/types/task';
import type { Agent } from '../../../shared/types/agent';
import type { ExecutionRecord } from '../../../shared/types/execution';

interface AgentPerformanceProps {
  agents: Agent[];
  tasks: Task[];
  executions: ExecutionRecord[];
}

interface AgentStats {
  agent: Agent;
  assignedCount: number;
  completedCount: number;
  failedExecutions: number;
  successRate: number;
}

export const AgentPerformance: React.FC<AgentPerformanceProps> = ({ agents, tasks, executions }) => {
  const stats: AgentStats[] = agents.map(agent => {
    const assigned = tasks.filter(t => t.assignedAgentId === agent.id);
    const completed = assigned.filter(t => t.status === 'done');
    const agentExecutions = executions.filter(e =>
      assigned.some(t => t.id === e.taskId)
    );
    const failed = agentExecutions.filter(e => e.status === 'failed');
    const totalExec = agentExecutions.filter(e => e.status === 'completed' || e.status === 'failed').length;
    const successRate = totalExec > 0 ? Math.round(((totalExec - failed.length) / totalExec) * 100) : 0;

    return {
      agent,
      assignedCount: assigned.length,
      completedCount: completed.length,
      failedExecutions: failed.length,
      successRate,
    };
  }).sort((a, b) => b.completedCount - a.completedCount);

  const statusColors: Record<string, string> = {
    idle: 'bg-gray-500',
    thinking: 'bg-yellow-500',
    executing: 'bg-blue-500',
    running: 'bg-blue-500',
    waiting_input: 'bg-orange-500',
    error: 'bg-red-500',
    blocked: 'bg-red-400',
    failed: 'bg-red-600',
  };

  if (agents.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Agent Performance</h3>
        <p className="text-sm text-gray-500 text-center py-8">No agents registered</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Agent Performance</h3>
      <div className="space-y-3">
        {stats.map(({ agent, assignedCount, completedCount, failedExecutions, successRate }) => (
          <div key={agent.id} className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${statusColors[agent.status] || 'bg-gray-500'}`} />
                <span className="text-sm font-medium text-gray-200">{agent.name}</span>
                <span className="text-xs text-gray-500 capitalize">{agent.role}</span>
              </div>
              <span className="text-xs text-gray-500">{agent.status}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-blue-400">{assignedCount}</p>
                <p className="text-[10px] text-gray-500">Assigned</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-400">{completedCount}</p>
                <p className="text-[10px] text-gray-500">Done</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-400">{failedExecutions}</p>
                <p className="text-[10px] text-gray-500">Failed</p>
              </div>
              <div>
                <p className={`text-lg font-bold ${successRate >= 80 ? 'text-green-400' : successRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {assignedCount > 0 ? `${successRate}%` : '-'}
                </p>
                <p className="text-[10px] text-gray-500">Success</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
