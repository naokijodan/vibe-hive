import React, { useMemo } from 'react';
import type { Task } from '../../../shared/types/task';
import type { ExecutionRecord } from '../../../shared/types/execution';

interface TimelineChartProps {
  tasks: Task[];
  executions: ExecutionRecord[];
  days?: number;
}

interface DayData {
  date: string;
  label: string;
  completed: number;
  created: number;
  executions: number;
}

export const TimelineChart: React.FC<TimelineChartProps> = ({ tasks, executions, days = 7 }) => {
  const timeline = useMemo(() => {
    const now = new Date();
    const data: DayData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : date.toLocaleDateString('en', { weekday: 'short' });

      const completed = tasks.filter(t => {
        if (!t.completedAt) return false;
        const d = new Date(t.completedAt);
        return d.toISOString().split('T')[0] === dateStr;
      }).length;

      const created = tasks.filter(t => {
        const d = new Date(t.createdAt);
        return d.toISOString().split('T')[0] === dateStr;
      }).length;

      const execCount = executions.filter(e => {
        const d = new Date(e.startedAt);
        return d.toISOString().split('T')[0] === dateStr;
      }).length;

      data.push({ date: dateStr, label: dayLabel, completed, created, executions: execCount });
    }
    return data;
  }, [tasks, executions, days]);

  const maxVal = Math.max(...timeline.flatMap(d => [d.completed, d.created, d.executions]), 1);

  const barHeight = (val: number) => Math.max(Math.round((val / maxVal) * 80), val > 0 ? 4 : 0);

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Activity Timeline ({days} days)</h3>

      <div className="flex items-end justify-between space-x-1" style={{ height: '120px' }}>
        {timeline.map(day => (
          <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full">
            <div className="flex items-end space-x-[2px] flex-1 w-full justify-center">
              {/* Created */}
              <div
                className="w-2 bg-blue-500/70 rounded-t transition-all duration-300"
                style={{ height: `${barHeight(day.created)}px` }}
                title={`Created: ${day.created}`}
              />
              {/* Completed */}
              <div
                className="w-2 bg-green-500/70 rounded-t transition-all duration-300"
                style={{ height: `${barHeight(day.completed)}px` }}
                title={`Completed: ${day.completed}`}
              />
              {/* Executions */}
              <div
                className="w-2 bg-purple-500/70 rounded-t transition-all duration-300"
                style={{ height: `${barHeight(day.executions)}px` }}
                title={`Executions: ${day.executions}`}
              />
            </div>
            <span className="text-[9px] text-gray-500 mt-1 truncate w-full text-center">{day.label}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-4 mt-3 pt-2 border-t border-gray-700">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded bg-blue-500/70" />
          <span className="text-[10px] text-gray-500">Created</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded bg-green-500/70" />
          <span className="text-[10px] text-gray-500">Completed</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded bg-purple-500/70" />
          <span className="text-[10px] text-gray-500">Executions</span>
        </div>
      </div>
    </div>
  );
};
