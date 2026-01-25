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
  blocked: { bg: 'bg-orange-900', text: 'text-orange-300', label: 'Blocked' },
  failed: { bg: 'bg-red-900', text: 'text-red-300', label: 'Failed' },
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
  const isAgentError = assignedAgent?.status === 'error' || assignedAgent?.status === 'failed';
  const isAgentBlocked = assignedAgent?.status === 'blocked';

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

  // Determine card styling based on agent status
  const getCardStyles = () => {
    if (isAgentError) {
      return {
        bg: 'bg-red-950/50 border-red-500',
        borderLeft: 'border-l-red-500',
        hover: 'hover:border-red-400',
        ring: 'ring-1 ring-red-500/30',
      };
    }
    if (isAgentBlocked) {
      return {
        bg: 'bg-orange-950/50 border-orange-500',
        borderLeft: 'border-l-orange-500',
        hover: 'hover:border-orange-400',
        ring: 'ring-1 ring-orange-500/30',
      };
    }
    return {
      bg: 'bg-hive-surface border-hive-border',
      borderLeft: priorityColors[task.priority],
      hover: 'hover:border-hive-accent/50',
      ring: '',
    };
  };

  const cardStyles = getCardStyles();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        ${cardStyles.bg}
        border rounded-lg p-3
        border-l-4 ${cardStyles.borderLeft}
        cursor-grab active:cursor-grabbing
        ${cardStyles.hover} transition-all
        ${isDragging ? 'opacity-30' : ''}
        ${cardStyles.ring}
      `}
      onClick={() => !isDragging && onClick?.(task)}
    >
      <div className="flex items-center gap-2 mb-1">
        {isAgentError && <span className="text-red-400 text-sm">⚠</span>}
        {isAgentBlocked && <span className="text-orange-400 text-sm">⏸</span>}
        <h4 className={`text-sm font-medium ${
          isAgentError ? 'text-red-300' :
          isAgentBlocked ? 'text-orange-300' :
          'text-white'
        }`}>{task.title}</h4>
      </div>
      {task.description && (
        <p className={`text-xs line-clamp-2 ${
          isAgentError ? 'text-red-400/70' :
          isAgentBlocked ? 'text-orange-400/70' :
          'text-hive-muted'
        }`}>{task.description}</p>
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
