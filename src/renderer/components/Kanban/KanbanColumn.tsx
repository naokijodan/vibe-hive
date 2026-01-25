import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '../../../shared/types';
import { TaskCard } from './TaskCard';

type ColumnType = 'running' | 'waiting' | 'done';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  type: ColumnType;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

const columnStyles: Record<ColumnType, { bg: string; border: string; dot: string }> = {
  running: {
    bg: 'bg-green-900/10',
    border: 'border-green-500',
    dot: 'bg-green-500',
  },
  waiting: {
    bg: 'bg-yellow-900/10',
    border: 'border-yellow-500',
    dot: 'bg-yellow-500',
  },
  done: {
    bg: 'bg-gray-900/10',
    border: 'border-gray-500',
    dot: 'bg-gray-500',
  },
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  type,
  tasks,
  onTaskClick,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const styles = columnStyles[type];
  const taskIds = tasks.map((t) => t.id);

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col w-80 ${styles.bg} rounded-lg border-t-2 ${styles.border}
        transition-all duration-200
        ${isOver ? 'ring-2 ring-hive-accent/50 scale-[1.02]' : ''}
      `}
    >
      {/* Header */}
      <div className="p-3 border-b border-hive-border">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
            {title}
          </h3>
          <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Tasks */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px] max-h-[calc(100vh-250px)]">
          {tasks.length === 0 ? (
            <div className="text-hive-muted text-sm text-center py-8 border-2 border-dashed border-hive-border rounded-lg">
              ドロップしてタスクを追加
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={onTaskClick} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};
