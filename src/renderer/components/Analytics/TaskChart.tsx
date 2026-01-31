import React from 'react';
import type { Task, TaskStatus } from '../../../shared/types/task';

interface TaskChartProps {
  tasks: Task[];
}

const statusConfig: Record<TaskStatus, { label: string; color: string; bgColor: string }> = {
  backlog: { label: 'Backlog', color: 'bg-gray-500', bgColor: 'bg-gray-500/20' },
  todo: { label: 'Todo', color: 'bg-blue-500', bgColor: 'bg-blue-500/20' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-500', bgColor: 'bg-yellow-500/20' },
  review: { label: 'Review', color: 'bg-purple-500', bgColor: 'bg-purple-500/20' },
  done: { label: 'Done', color: 'bg-green-500', bgColor: 'bg-green-500/20' },
};

export const TaskChart: React.FC<TaskChartProps> = ({ tasks }) => {
  const total = tasks.length;
  const statusCounts: Record<TaskStatus, number> = {
    backlog: 0, todo: 0, in_progress: 0, review: 0, done: 0,
  };

  tasks.forEach(t => { statusCounts[t.status]++; });

  const maxCount = Math.max(...Object.values(statusCounts), 1);

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Task Distribution</h3>

      {total === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No tasks yet</p>
      ) : (
        <div className="space-y-3">
          {(Object.entries(statusConfig) as [TaskStatus, typeof statusConfig[TaskStatus]][]).map(([status, cfg]) => {
            const count = statusCounts[status];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const barWidth = Math.round((count / maxCount) * 100);
            return (
              <div key={status}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">{cfg.label}</span>
                  <span className="text-xs text-gray-500">{count} ({pct}%)</span>
                </div>
                <div className={`h-5 rounded ${cfg.bgColor} overflow-hidden`}>
                  <div
                    className={`h-full ${cfg.color} rounded transition-all duration-500`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stacked bar summary */}
      {total > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-700">
          <div className="h-3 rounded-full overflow-hidden flex">
            {(Object.entries(statusConfig) as [TaskStatus, typeof statusConfig[TaskStatus]][]).map(([status, cfg]) => {
              const pct = (statusCounts[status] / total) * 100;
              return pct > 0 ? (
                <div key={status} className={`${cfg.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
              ) : null;
            })}
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">{total} total tasks</p>
        </div>
      )}
    </div>
  );
};
