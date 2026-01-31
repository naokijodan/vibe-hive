import React, { useEffect } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { useAgentStore } from '../../stores/agentStore';
import { useExecutionStore } from '../../stores/executionStore';
import { StatCard } from './StatCard';
import { TaskChart } from './TaskChart';
import { AgentPerformance } from './AgentPerformance';
import { TimelineChart } from './TimelineChart';
import { PriorityBreakdown } from './PriorityBreakdown';

export const AnalyticsDashboard: React.FC = () => {
  const { tasks, loadTasks } = useTaskStore();
  const { agents, loadAgents } = useAgentStore();
  const { executions, loadExecutions } = useExecutionStore();

  useEffect(() => {
    loadTasks();
    loadAgents();
    loadExecutions();
  }, [loadTasks, loadAgents, loadExecutions]);

  // Compute summary stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const activeAgents = agents.filter(a => a.status === 'executing' || a.status === 'running' || a.status === 'thinking').length;

  // Average completion time (for tasks with completedAt)
  const completedWithTime = tasks.filter(t => t.completedAt && t.createdAt);
  let avgCompletionTime = '-';
  if (completedWithTime.length > 0) {
    const totalMs = completedWithTime.reduce((sum, t) => {
      const created = new Date(t.createdAt).getTime();
      const completed = new Date(t.completedAt!).getTime();
      return sum + (completed - created);
    }, 0);
    const avgMs = totalMs / completedWithTime.length;
    if (avgMs < 60000) {
      avgCompletionTime = `${Math.round(avgMs / 1000)}s`;
    } else if (avgMs < 3600000) {
      avgCompletionTime = `${Math.round(avgMs / 60000)}m`;
    } else {
      avgCompletionTime = `${(avgMs / 3600000).toFixed(1)}h`;
    }
  }

  const totalExecutions = executions.length;
  const failedExecutions = executions.filter(e => e.status === 'failed').length;
  const executionSuccessRate = totalExecutions > 0
    ? Math.round(((totalExecutions - failedExecutions) / totalExecutions) * 100)
    : 0;

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-white">Analytics Dashboard</h2>
          <p className="text-sm text-gray-500">Project overview and performance metrics</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <StatCard
            label="Total Tasks"
            value={totalTasks}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
            color="blue"
          />
          <StatCard
            label="Completed"
            value={completedTasks}
            subValue={`${completionRate}% completion rate`}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            color="green"
          />
          <StatCard
            label="In Progress"
            value={inProgressTasks}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            color="yellow"
          />
          <StatCard
            label="Active Agents"
            value={activeAgents}
            subValue={`${agents.length} total`}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            color="purple"
          />
          <StatCard
            label="Avg Time"
            value={avgCompletionTime}
            subValue="to completion"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            color="cyan"
          />
          <StatCard
            label="Exec Success"
            value={totalExecutions > 0 ? `${executionSuccessRate}%` : '-'}
            subValue={`${totalExecutions} executions`}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            color={executionSuccessRate >= 80 ? 'green' : executionSuccessRate >= 50 ? 'yellow' : 'red'}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TaskChart tasks={tasks} />
          <TimelineChart tasks={tasks} executions={executions} />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AgentPerformance agents={agents} tasks={tasks} executions={executions} />
          <PriorityBreakdown tasks={tasks} />
        </div>
      </div>
    </div>
  );
};
