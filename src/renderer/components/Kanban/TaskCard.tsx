import React, { useState, useEffect, memo } from 'react';
import toast from 'react-hot-toast';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, AgentStatus } from '../../../shared/types';
import { useAgentStore } from '../../stores/agentStore';
import { useTaskStore } from '../../stores/taskStore';
import { useExecutionStore } from '../../stores/executionStore';
import { useTemplateStore } from '../../stores/templateStore';
import ipcBridge from '../../bridge/ipcBridge';
import {
  FeedbackModal,
  SubtaskModal,
  DependencyModal,
  RoleModal,
  SaveTemplateModal,
} from './TaskCardModals';

interface TaskCardProps {
  task: Task;
  onClick?: (task: Task) => void;
  isDragOverlay?: boolean;
}

interface DependencyInfo {
  met: boolean;
  completed: number;
  total: number;
  blocking: Task[];
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

export const TaskCard: React.FC<TaskCardProps> = memo(({ task, onClick, isDragOverlay }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const { agents, assignTaskToAgent } = useAgentStore();
  const { updateTask, updateTaskStatus, tasks, checkDependencies, setReviewFeedback, createSubtasks, setDependencies, deleteTask } = useTaskStore();
  const { startExecution, runningExecutions } = useExecutionStore();
  const { createTemplate } = useTemplateStore();
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [subtaskText, setSubtaskText] = useState('');
  const [roleText, setRoleText] = useState(task.role || '');
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>(task.dependsOn || []);
  const [depInfo, setDepInfo] = useState<DependencyInfo | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Check dependencies on mount and when task changes
  useEffect(() => {
    if (task.dependsOn && task.dependsOn.length > 0) {
      checkDependencies(task.id).then(setDepInfo);
    } else {
      setDepInfo(null);
    }
  }, [task.id, task.dependsOn, checkDependencies]);

  // Check if task is ready to execute
  useEffect(() => {
    if (task.status === 'todo' || task.status === 'backlog') {
      ipcBridge.task.isReadyToExecute(task.id).then(setIsReady);
    } else {
      setIsReady(false);
    }
  }, [task.id, task.status, task.dependsOn]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assignedAgent = agents.find((a) => a.id === task.assignedAgentId);
  const isAgentError = assignedAgent?.status === 'error' || assignedAgent?.status === 'failed';
  const isAgentBlocked = assignedAgent?.status === 'blocked';
  const hasDependencyBlock = depInfo && !depInfo.met;
  const isReviewStatus = task.status === 'review';
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const isExecuting = runningExecutions.some((e) => e.taskId === task.id);

  // Handle feedback submission
  const handleFeedbackSubmit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (feedbackText.trim()) {
      await setReviewFeedback(task.id, feedbackText.trim());
      setFeedbackText('');
      setShowFeedbackModal(false);
    }
  };

  // Handle subtask creation
  const handleSubtaskSubmit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const titles = subtaskText.split('\n').map(t => t.trim()).filter(t => t);
    if (titles.length > 0) {
      await createSubtasks(task.id, titles);
      setSubtaskText('');
      setShowSubtaskModal(false);
    }
  };

  // Handle dependency update
  const handleDependencySubmit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await setDependencies(task.id, selectedDependencies);
    setShowDependencyModal(false);
  };

  // Handle role update
  const handleRoleSubmit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await updateTask(task.id, { role: roleText.trim() || undefined });
    setShowRoleModal(false);
  };

  // Handle save as template
  const handleSaveAsTemplate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!templateName.trim()) {
      toast.error('テンプレート名は必須です');
      return;
    }

    try {
      await createTemplate({
        name: templateName.trim(),
        description: templateDescription.trim() || undefined,
        category: templateCategory.trim() || undefined,
        taskData: {
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: 'todo', // Reset status to todo for template
          role: task.role,
        },
        subtasks: task.subtasks?.map((st) => ({
          title: st,
          description: '',
        })),
      });

      setTemplateName('');
      setTemplateDescription('');
      setTemplateCategory('');
      setShowSaveTemplateModal(false);
      toast.success('テンプレートを保存しました');
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('テンプレートの保存に失敗しました');
    }
  };

  // Handle start execution
  const handleStartExecution = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      // Use task description as command if available
      const command = task.description?.trim() || 'echo "No command specified"';

      // Start execution via ExecutionStore
      await startExecution(task.id, command);

      // Update task status to in_progress
      await updateTaskStatus(task.id, 'in_progress');
    } catch (error) {
      console.error('Failed to start execution:', error);
      // Show error to user (could add a toast notification here)
    }
  };

  // Available tasks for dependency selection (exclude self and children)
  const availableTasks = tasks.filter(t => t.id !== task.id && t.parentTaskId !== task.id);

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
      await updateTask(task.id, { assignedAgentId: agentId ?? undefined });
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

  // Determine card styling based on agent status and dependency blocks
  const getCardStyles = () => {
    if (isAgentError) {
      return {
        bg: 'bg-red-950/50 border-red-500',
        borderLeft: 'border-l-red-500',
        hover: 'hover:border-red-400',
        ring: 'ring-1 ring-red-500/30',
      };
    }
    if (isAgentBlocked || hasDependencyBlock) {
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
        {hasDependencyBlock && <span className="text-orange-400 text-sm" title="依存タスクが未完了">🔒</span>}
        {task.reviewFeedback && <span className="text-purple-400 text-sm" title="レビューフィードバックあり">💬</span>}
        {hasSubtasks && <span className="text-blue-400 text-sm" title={`サブタスク: ${task.subtasks?.length}`}>📋</span>}
        {isReady && !hasDependencyBlock && (task.status === 'todo' || task.status === 'backlog') && (
          <span className="text-green-400 text-sm font-bold" title="実行準備完了">✓</span>
        )}
        <h4 className={`text-sm font-medium flex-1 ${
          isAgentError ? 'text-red-300' :
          isAgentBlocked || hasDependencyBlock ? 'text-orange-300' :
          'text-white'
        }`}>{task.title}</h4>
      </div>

      {/* Dependency progress indicator */}
      {depInfo && depInfo.total > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-2 text-[10px]">
            <span className={depInfo.met ? 'text-green-400' : 'text-orange-400'}>
              依存: {depInfo.completed}/{depInfo.total}
            </span>
            <div className="flex-1 h-1 bg-gray-700 rounded overflow-hidden">
              <div
                className={`h-full ${depInfo.met ? 'bg-green-500' : 'bg-orange-500'}`}
                style={{ width: `${(depInfo.completed / depInfo.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
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

      {/* Action buttons row */}
      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-hive-border/50 flex-wrap">
        {/* Start execution button (only for todo/backlog status) */}
        {(task.status === 'todo' || task.status === 'backlog') && (
          <button
            onClick={handleStartExecution}
            disabled={hasDependencyBlock || isExecuting}
            className={`text-[10px] px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              isExecuting
                ? 'bg-blue-600/50 text-white cursor-wait'
                : hasDependencyBlock
                ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-500'
            }`}
            title={
              isExecuting
                ? '実行中...'
                : hasDependencyBlock
                ? '依存タスクが未完了'
                : 'Claude Codeで実行開始'
            }
          >
            {isExecuting ? (
              <>
                <span className="animate-spin">⚙</span>
                <span>実行中</span>
              </>
            ) : (
              <>▶ 実行</>
            )}
          </button>
        )}

        {/* Role setting button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setRoleText(task.role || '');
            setShowRoleModal(true);
          }}
          className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
            task.role
              ? 'bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800/50'
              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
          }`}
          title="エージェントの役割を設定"
        >
          🎭 役割
        </button>

        {/* Review feedback button (only for review status) */}
        {isReviewStatus && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowFeedbackModal(true);
            }}
            className="text-[10px] px-1.5 py-0.5 bg-purple-900/50 text-purple-300 rounded hover:bg-purple-800/50 transition-colors"
            title="レビューフィードバックを追加"
          >
            💬 FB
          </button>
        )}

        {/* Subtask decompose button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowSubtaskModal(true);
          }}
          className="text-[10px] px-1.5 py-0.5 bg-blue-900/50 text-blue-300 rounded hover:bg-blue-800/50 transition-colors"
          title="サブタスクに分解"
        >
          📋 分解
        </button>

        {/* Dependency button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDependencies(task.dependsOn || []);
            setShowDependencyModal(true);
          }}
          className="text-[10px] px-1.5 py-0.5 bg-gray-700/50 text-gray-300 rounded hover:bg-gray-600/50 transition-colors"
          title="依存関係を設定"
        >
          🔗 依存
        </button>

        {/* Save as Template button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setTemplateName(task.title);
            setTemplateDescription(task.description || '');
            setTemplateCategory('');
            setShowSaveTemplateModal(true);
          }}
          className="text-[10px] px-1.5 py-0.5 bg-purple-900/50 text-purple-300 rounded hover:bg-purple-800/50 transition-colors"
          title="テンプレートとして保存"
        >
          💾 保存
        </button>

        {/* Delete button */}
        {!confirmingDelete ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmingDelete(true);
            }}
            className="text-[10px] px-1.5 py-0.5 bg-red-900/30 text-red-400 rounded hover:bg-red-800/50 transition-colors ml-auto"
            title="タスクを削除"
          >
            🗑
          </button>
        ) : (
          <div className="flex items-center gap-1 ml-auto" onClick={(e) => e.stopPropagation()}>
            <span className="text-[10px] text-red-400">削除？</span>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                const success = await deleteTask(task.id);
                if (success) {
                  toast.success('タスクを削除しました');
                } else {
                  toast.error('削除に失敗しました');
                }
                setConfirmingDelete(false);
              }}
              className="text-[10px] px-1.5 py-0.5 bg-red-600 text-white rounded hover:bg-red-500 transition-colors"
            >
              はい
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmingDelete(false);
              }}
              className="text-[10px] px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            >
              いいえ
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showFeedbackModal && (
        <FeedbackModal
          feedbackText={feedbackText}
          setFeedbackText={setFeedbackText}
          onSubmit={handleFeedbackSubmit}
          onClose={(e) => { e.stopPropagation(); setShowFeedbackModal(false); }}
        />
      )}
      {showSubtaskModal && (
        <SubtaskModal
          subtaskText={subtaskText}
          setSubtaskText={setSubtaskText}
          onSubmit={handleSubtaskSubmit}
          onClose={(e) => { e.stopPropagation(); setShowSubtaskModal(false); }}
        />
      )}
      {showDependencyModal && (
        <DependencyModal
          availableTasks={availableTasks}
          selectedDependencies={selectedDependencies}
          setSelectedDependencies={setSelectedDependencies}
          onSubmit={handleDependencySubmit}
          onClose={(e) => { e.stopPropagation(); setShowDependencyModal(false); }}
        />
      )}
      {showRoleModal && (
        <RoleModal
          roleText={roleText}
          setRoleText={setRoleText}
          onSubmit={handleRoleSubmit}
          onClose={(e) => { e.stopPropagation(); setShowRoleModal(false); }}
        />
      )}
      {showSaveTemplateModal && (
        <SaveTemplateModal
          templateName={templateName}
          setTemplateName={setTemplateName}
          templateDescription={templateDescription}
          setTemplateDescription={setTemplateDescription}
          templateCategory={templateCategory}
          setTemplateCategory={setTemplateCategory}
          onSubmit={handleSaveAsTemplate}
          onClose={(e) => { e.stopPropagation(); setShowSaveTemplateModal(false); }}
        />
      )}
    </div>
  );
});
