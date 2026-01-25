import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, AgentStatus } from '../../../shared/types';
import { useAgentStore } from '../../stores/agentStore';
import { useTaskStore } from '../../stores/taskStore';

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

const statusBadgeColors: Record<AgentStatus, { bg: string; text: string; label: string }> = {
  idle: { bg: 'bg-gray-700', text: 'text-gray-300', label: 'Idle' },
  thinking: { bg: 'bg-blue-900', text: 'text-blue-300', label: 'Thinking' },
  executing: { bg: 'bg-green-900', text: 'text-green-300', label: 'Executing' },
  running: { bg: 'bg-green-900', text: 'text-green-300', label: 'Running' },
  waiting_input: { bg: 'bg-yellow-900', text: 'text-yellow-300', label: 'Waiting' },
  error: { bg: 'bg-red-900', text: 'text-red-300', label: 'Error' },
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

  const { agents, assignTaskToAgent } = useAgentStore();
  const { updateTask } = useTaskStore();
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assignedAgent = agents.find((a) => a.id === task.assignedAgentId);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    if (showAgentDropdown) {
      const handleClickOutside = () => setShowAgentDropdown(false);
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showAgentDropdown]);

  const handleAssignAgent = async (agentId: string | null, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await assignTaskToAgent(task.id, agentId);
      await updateTask(task.id, { assignedAgentId: agentId });
      setShowAgentDropdown(false);
    } catch (error) {
      console.error('Failed to assign agent:', error);
    }
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
        <div className="relative flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAgentDropdown(!showAgentDropdown);
            }}
            className="text-xs text-hive-muted hover:text-hive-accent transition-colors"
          >
            {assignedAgent ? `🤖 ${assignedAgent.name}` : '未割当'}
          </button>
          {assignedAgent && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded ${statusBadgeColors[assignedAgent.status].bg} ${statusBadgeColors[assignedAgent.status].text}`}
            >
              {statusBadgeColors[assignedAgent.status].label}
            </span>
          )}
          {showAgentDropdown && (
            <div className="absolute z-10 mt-1 w-40 bg-hive-surface border border-hive-border rounded shadow-lg">
              <button
                onClick={(e) => handleAssignAgent(null, e)}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-hive-accent/20 text-hive-muted"
              >
                未割当
              </button>
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={(e) => handleAssignAgent(agent.id, e)}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-hive-accent/20 ${
                    agent.id === task.assignedAgentId ? 'bg-hive-accent/10 text-hive-accent' : 'text-white'
                  }`}
                >
                  🤖 {agent.name}
                </button>
              ))}
            </div>
          )}
        </div>
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
