import React, { useState, useEffect } from 'react';
import type {
  TaskTemplate,
  TaskTemplateCreateInput,
  TaskTemplateUpdateInput,
  SubtaskTemplateData,
} from '../../../shared/types/taskTemplate';
import { TaskPriority, TaskStatus } from '../../../shared/types/task';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskTemplateCreateInput | TaskTemplateUpdateInput) => Promise<void>;
  template?: TaskTemplate | null;
  mode: 'create' | 'edit';
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  template,
  mode,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('todo');
  const [taskRole, setTaskRole] = useState('');
  const [taskCommand, setTaskCommand] = useState('');
  const [subtasksText, setSubtasksText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with template data when editing
  useEffect(() => {
    if (mode === 'edit' && template) {
      setName(template.name);
      setDescription(template.description || '');
      setCategory(template.category || '');
      setTaskTitle(template.taskData.title);
      setTaskDescription(template.taskData.description || '');
      setTaskPriority(template.taskData.priority);
      setTaskStatus(template.taskData.status);
      setTaskRole(template.taskData.role || '');
      setTaskCommand(template.taskData.command || '');
      setSubtasksText(
        template.subtasks?.map((st) => `${st.title}${st.description ? ': ' + st.description : ''}`).join('\n') || ''
      );
    } else if (mode === 'create') {
      // Reset form
      setName('');
      setDescription('');
      setCategory('');
      setTaskTitle('');
      setTaskDescription('');
      setTaskPriority('medium');
      setTaskStatus('todo');
      setTaskRole('');
      setTaskCommand('');
      setSubtasksText('');
    }
  }, [mode, template]);

  const handleSubmit = async () => {
    if (!name.trim() || !taskTitle.trim()) {
      alert('テンプレート名とタスクタイトルは必須です');
      return;
    }

    setIsSubmitting(true);
    try {
      // Parse subtasks
      const subtasks: SubtaskTemplateData[] = subtasksText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line)
        .map((line) => {
          const colonIndex = line.indexOf(':');
          if (colonIndex > 0) {
            return {
              title: line.substring(0, colonIndex).trim(),
              description: line.substring(colonIndex + 1).trim(),
            };
          }
          return { title: line };
        });

      const data: TaskTemplateCreateInput | TaskTemplateUpdateInput = {
        name: name.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        taskData: {
          title: taskTitle.trim(),
          description: taskDescription.trim() || undefined,
          priority: taskPriority,
          status: taskStatus,
          role: taskRole.trim() || undefined,
          command: taskCommand.trim() || undefined,
        },
        subtasks: subtasks.length > 0 ? subtasks : undefined,
      };

      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Failed to submit template:', error);
      alert('テンプレートの保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-hive-surface border border-hive-border rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-white mb-4">
          {mode === 'create' ? 'テンプレート作成' : 'テンプレート編集'}
        </h2>

        <div className="space-y-4">
          {/* Template Basic Info */}
          <div className="border-b border-hive-border pb-4">
            <h3 className="text-sm font-medium text-white mb-3">テンプレート情報</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-hive-muted mb-1">
                  テンプレート名 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例：Reactコンポーネント作成"
                  className="w-full bg-hive-bg border border-hive-border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-hive-accent"
                />
              </div>

              <div>
                <label className="block text-xs text-hive-muted mb-1">説明</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="このテンプレートの説明"
                  className="w-full h-16 bg-hive-bg border border-hive-border rounded px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-hive-accent"
                />
              </div>

              <div>
                <label className="block text-xs text-hive-muted mb-1">カテゴリ</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="例：フロントエンド, バックエンド, テスト"
                  className="w-full bg-hive-bg border border-hive-border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-hive-accent"
                />
              </div>
            </div>
          </div>

          {/* Task Data */}
          <div className="border-b border-hive-border pb-4">
            <h3 className="text-sm font-medium text-white mb-3">タスク設定</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-hive-muted mb-1">
                  タスクタイトル *
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="タスクのタイトル"
                  className="w-full bg-hive-bg border border-hive-border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-hive-accent"
                />
              </div>

              <div>
                <label className="block text-xs text-hive-muted mb-1">
                  タスク説明 / コマンド
                </label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="タスクの詳細説明"
                  className="w-full h-20 bg-hive-bg border border-hive-border rounded px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-hive-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-hive-muted mb-1">優先度</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full bg-hive-bg border border-hive-border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-hive-accent"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                    <option value="urgent">緊急</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-hive-muted mb-1">
                    初期ステータス
                  </label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                    className="w-full bg-hive-bg border border-hive-border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-hive-accent"
                  >
                    <option value="backlog">バックログ</option>
                    <option value="todo">TODO</option>
                    <option value="in_progress">進行中</option>
                    <option value="review">レビュー</option>
                    <option value="done">完了</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-hive-muted mb-1">
                  エージェント役割（オプション）
                </label>
                <textarea
                  value={taskRole}
                  onChange={(e) => setTaskRole(e.target.value)}
                  placeholder="例：あなたはReactとTypeScriptの専門家です"
                  className="w-full h-16 bg-hive-bg border border-hive-border rounded px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-hive-accent"
                />
              </div>
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <h3 className="text-sm font-medium text-white mb-3">サブタスク（オプション）</h3>
            <p className="text-xs text-hive-muted mb-2">
              1行に1つのサブタスク。「タイトル: 説明」の形式で入力できます
            </p>
            <textarea
              value={subtasksText}
              onChange={(e) => setSubtasksText(e.target.value)}
              placeholder="コンポーネントファイル作成: src/components/MyComponent.tsx を作成&#10;スタイル実装: TailwindCSSでスタイリング&#10;テスト作成"
              className="w-full h-24 bg-hive-bg border border-hive-border rounded px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-hive-accent font-mono"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm text-hive-muted hover:text-white transition-colors disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm bg-hive-accent text-white rounded hover:bg-hive-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '保存中...' : mode === 'create' ? '作成' : '更新'}
          </button>
        </div>
      </div>
    </div>
  );
};
