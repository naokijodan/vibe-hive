import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { Task, TaskStatus } from '../../../shared/types';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskMove?: (taskId: string, newStatus: TaskStatus) => void;
}

interface Column {
  id: TaskStatus;
  title: string;
  type: 'running' | 'waiting' | 'done';
}

const columns: Column[] = [
  { id: 'in_progress', title: '稼働中', type: 'running' },
  { id: 'todo', title: 'TODO', type: 'waiting' },
  { id: 'review', title: '確認待ち', type: 'waiting' },
  { id: 'done', title: '終了', type: 'done' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onTaskClick,
  onTaskMove,
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const targetColumn = columns.find((col) => col.id === overId);
    if (targetColumn) {
      onTaskMove?.(taskId, targetColumn.id);
      return;
    }

    // Check if dropped on another task (find its column)
    const targetTask = tasks.find((t) => t.id === overId);
    if (targetTask) {
      onTaskMove?.(taskId, targetTask.status);
    }
  };

  const getTasksByStatus = (status: TaskStatus): Task[] => {
    return tasks.filter((task) => task.status === status);
  };

  return (
    <div className="h-full p-4 overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 h-full">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              type={column.type}
              tasks={getTasksByStatus(column.id)}
              onTaskClick={onTaskClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="rotate-2">
              <TaskCard task={activeTask} isDragOverlay />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
