import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../../shared/types';

interface TaskCardProps {
  task: Task;
  onClick?: (task: Task) => void;
  isDragOverlay?: boolean;
}

const priorityColors = {
  low: 'border-l-gray-500',
  medium: 'border-l-blue-500',
  high: 'border-l-yellow-500',
  urgent: 'border-l-red-500',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, isDragOverlay }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // DragOverlay用のシンプルなレンダリング
  if (isDragOverlay) {
    return (
      <div
        className={`
          bg-hive-surface border border-hive-accent rounded-lg p-3
          border-l-4 ${priorityColors[task.priority]}
          shadow-xl
        `}
      >
        <h4 className="text-sm font-medium text-white mb-1">{task.title}</h4>
        {task.description && (
          <p className="text-xs text-hive-muted line-clamp-2">{task.description}</p>
        )}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-hive-surface border border-hive-border rounded-lg p-3
        border-l-4 ${priorityColors[task.priority]}
        cursor-grab active:cursor-grabbing
        hover:border-hive-accent/50 transition-all
        ${isDragging ? 'opacity-30' : ''}
      `}
      onClick={() => !isDragging && onClick?.(task)}
    >
      <h4 className="text-sm font-medium text-white mb-1">{task.title}</h4>
      {task.description && (
        <p className="text-xs text-hive-muted line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-hive-muted">
          {task.assignedAgentId ? `🤖 ${task.assignedAgentId}` : '未割当'}
        </span>
        <span
          className={`text-xs px-1.5 py-0.5 rounded ${
            task.priority === 'urgent'
              ? 'bg-red-900 text-red-300'
              : task.priority === 'high'
              ? 'bg-yellow-900 text-yellow-300'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          {task.priority}
        </span>
      </div>
    </div>
  );
};
