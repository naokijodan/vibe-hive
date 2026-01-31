import React from 'react';
import type { Task, TaskPriority } from '../../../shared/types/task';

interface PriorityBreakdownProps {
  tasks: Task[];
}

const priorityConfig: Record<TaskPriority, { label: string; color: string; icon: string }> = {
  urgent: { label: 'Urgent', color: 'text-red-400', icon: '🔴' },
  high: { label: 'High', color: 'text-orange-400', icon: '🟠' },
  medium: { label: 'Medium', color: 'text-yellow-400', icon: '🟡' },
  low: { label: 'Low', color: 'text-gray-400', icon: '⚪' },
};

export const PriorityBreakdown: React.FC<PriorityBreakdownProps> = ({ tasks }) => {
  const activeTasks = tasks.filter(t => t.status !== 'done');

  const counts: Record<TaskPriority, number> = { urgent: 0, high: 0, medium: 0, low: 0 };
  activeTasks.forEach(t => { counts[t.priority]++; });

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Active Tasks by Priority</h3>

      {activeTasks.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">No active tasks</p>
      ) : (
        <div className="space-y-2">
          {(Object.entries(priorityConfig) as [TaskPriority, typeof priorityConfig[TaskPriority]][]).map(([priority, cfg]) => {
            const count = counts[priority];
            return (
              <div key={priority} className="flex items-center justify-between py-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{cfg.icon}</span>
                  <span className={`text-sm ${cfg.color}`}>{cfg.label}</span>
                </div>
                <span className={`text-sm font-bold ${cfg.color}`}>{count}</span>
              </div>
            );
          })}
          <div className="pt-2 mt-2 border-t border-gray-700 flex items-center justify-between">
            <span className="text-xs text-gray-500">Total active</span>
            <span className="text-sm font-bold text-gray-300">{activeTasks.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};
