import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import { Task, TaskStatus, TaskPriority } from '../../../shared/types';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { TemplateBrowser } from '../Template';
import { useTaskStore } from '../../stores/taskStore';
import ipcBridge from '../../bridge/ipcBridge';

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
  { id: 'todo', title: 'TODO', type: 'waiting' },
  { id: 'in_progress', title: '稼働中', type: 'running' },
  { id: 'review', title: '確認待ち', type: 'waiting' },
  { id: 'done', title: '終了', type: 'done' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onTaskClick,
  onTaskMove,
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [showOnlyReady, setShowOnlyReady] = useState(false);
  const [readyTaskIds, setReadyTaskIds] = useState<Set<string>>(new Set());
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);
  const { createTask } = useTaskStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load ready tasks when tasks change
  useEffect(() => {
    ipcBridge.task.getReadyTasks().then((readyTasks) => {
      setReadyTaskIds(new Set(readyTasks.map(t => t.id)));
    });
  }, [tasks]);

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
    let filteredTasks = tasks.filter((task) => task.status === status);

    // Apply ready filter if enabled
    if (showOnlyReady && (status === 'todo' || status === 'backlog')) {
      filteredTasks = filteredTasks.filter((task) => readyTaskIds.has(task.id));
    }

    return filteredTasks;
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;

    // Use the session ID from existing tasks, or create without session for now
    const existingSessionId = tasks.length > 0 ? tasks[0].sessionId : undefined;

    await createTask({
      sessionId: existingSessionId || 'default-session',
      title: newTaskTitle,
      description: newTaskDescription || undefined,
      priority: newTaskPriority,
    });

    // Reset form
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
    setIsAddingTask(false);
  };

  const handleCancelAdd = () => {
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
    setIsAddingTask(false);
  };

  return (
    <div className="h-full p-4 overflow-x-auto flex flex-col">
      {/* Header with Add Task Button */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-hive-text">タスクボード</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOnlyReady(!showOnlyReady)}
            className={`px-3 py-2 text-xs font-medium rounded transition-colors ${
              showOnlyReady
                ? 'bg-green-600 text-white'
                : 'bg-hive-surface border border-hive-border text-hive-muted hover:text-white'
            }`}
            title="実行準備完了タスクのみ表示"
          >
            {showOnlyReady ? '✓ Ready のみ' : 'すべて表示'}
          </button>
          <button
            onClick={() => setShowTemplateBrowser(true)}
            className="px-4 py-2 bg-purple-600 text-white font-medium rounded hover:bg-purple-500 text-sm"
            title="テンプレートから作成"
          >
            📋 テンプレート
          </button>
          <button
            onClick={() => setIsAddingTask(true)}
            className="px-4 py-2 bg-hive-accent text-black font-medium rounded hover:bg-hive-accent/80 text-sm"
          >
            + 新規タスク
          </button>
        </div>
      </div>

      {/* Add Task Modal */}
      {isAddingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-hive-surface border border-hive-border rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">新規タスク作成</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">タイトル *</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-hive-bg border border-hive-border rounded text-hive-text focus:outline-none focus:ring-2 focus:ring-hive-accent"
                  placeholder="タスク名を入力..."
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">説明</label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-hive-bg border border-hive-border rounded text-hive-text focus:outline-none focus:ring-2 focus:ring-hive-accent resize-none"
                  placeholder="説明を入力..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">優先度</label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 bg-hive-bg border border-hive-border rounded text-hive-text focus:outline-none focus:ring-2 focus:ring-hive-accent"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="urgent">緊急</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim()}
                className="flex-1 px-4 py-2 bg-hive-accent text-black font-medium rounded hover:bg-hive-accent/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                作成
              </button>
              <button
                onClick={handleCancelAdd}
                className="flex-1 px-4 py-2 bg-hive-bg border border-hive-border text-hive-text rounded hover:bg-hive-surface"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
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

      {/* Template Browser */}
      <TemplateBrowser
        isOpen={showTemplateBrowser}
        onClose={() => setShowTemplateBrowser(false)}
        sessionId={tasks.length > 0 ? tasks[0].sessionId : 'default-session'}
      />
    </div>
  );
};
