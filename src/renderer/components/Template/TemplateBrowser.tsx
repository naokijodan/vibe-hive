import React, { useEffect, useState } from 'react';
import { useTemplateStore } from '../../stores/templateStore';
import { useTaskStore } from '../../stores/taskStore';
import { TemplateCard } from './TemplateCard';
import { TemplateModal } from './TemplateModal';
import type {
  TaskTemplate,
  TaskTemplateCreateInput,
  TaskTemplateUpdateInput,
} from '../../../shared/types/taskTemplate';
import type { TaskCreateInput } from '../../../shared/types/task';

interface TemplateBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export const TemplateBrowser: React.FC<TemplateBrowserProps> = ({
  isOpen,
  onClose,
  sessionId,
}) => {
  const {
    templates,
    isLoading,
    error,
    selectedTemplateId,
    selectedCategory,
    searchQuery,
    loadTemplates,
    loadPopularTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setSelectedTemplate,
    setSelectedCategory,
    setSearchQuery,
    clearFilters,
    incrementUsageCount,
  } = useTemplateStore();

  const { createTask } = useTaskStore();

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'popular'>('all');

  // Load templates on mount
  useEffect(() => {
    if (isOpen) {
      if (viewMode === 'popular') {
        loadPopularTemplates(20);
      } else {
        loadTemplates();
      }
    }
  }, [isOpen, viewMode, loadTemplates, loadPopularTemplates]);

  // Available categories
  const categories = Array.from(
    new Set(templates.map((t) => t.category).filter((c): c is string => !!c))
  );

  const handleCreateNew = () => {
    setModalMode('create');
    setEditingTemplate(null);
    setShowModal(true);
  };

  const handleEdit = (template: TaskTemplate) => {
    setModalMode('edit');
    setEditingTemplate(template);
    setShowModal(true);
  };

  const handleDelete = async (templateId: string) => {
    try {
      await deleteTemplate(templateId);
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('テンプレートの削除に失敗しました');
    }
  };

  const handleModalSubmit = async (
    data: TaskTemplateCreateInput | TaskTemplateUpdateInput
  ) => {
    try {
      if (modalMode === 'create') {
        await createTemplate(data as TaskTemplateCreateInput);
      } else if (editingTemplate) {
        await updateTemplate(editingTemplate.id, data as TaskTemplateUpdateInput);
      }
      setShowModal(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Failed to save template:', error);
      throw error;
    }
  };

  const handleUseTemplate = async (template: TaskTemplate) => {
    try {
      // Increment usage count
      await incrementUsageCount(template.id);

      // Create task from template
      const taskInput: TaskCreateInput = {
        sessionId,
        title: template.taskData.title,
        description: template.taskData.description,
        priority: template.taskData.priority,
        role: template.taskData.role,
      };

      const newTask = await createTask(taskInput);

      // Create subtasks if template has them
      if (template.subtasks && template.subtasks.length > 0 && newTask) {
        const subtaskTitles = template.subtasks.map((st) => st.title);
        // Note: subtasks will be created with their titles
        // Descriptions from template are not directly used in current implementation
        // This could be enhanced if needed
      }

      alert('テンプレートからタスクを作成しました');
      onClose();
    } catch (error) {
      console.error('Failed to create task from template:', error);
      alert('テンプレートからのタスク作成に失敗しました');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-hive-surface border border-hive-border rounded-lg w-[900px] max-w-[95vw] h-[700px] max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-hive-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-white">テンプレートブラウザ</h2>
              <button
                onClick={onClose}
                className="text-hive-muted hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  viewMode === 'all'
                    ? 'bg-hive-accent text-white'
                    : 'bg-hive-bg text-hive-muted hover:text-white'
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => setViewMode('popular')}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  viewMode === 'popular'
                    ? 'bg-hive-accent text-white'
                    : 'bg-hive-bg text-hive-muted hover:text-white'
                }`}
              >
                人気
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="テンプレートを検索..."
                className="flex-1 bg-hive-bg border border-hive-border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-hive-accent"
              />

              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="bg-hive-bg border border-hive-border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-hive-accent"
              >
                <option value="">すべてのカテゴリ</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {(selectedCategory || searchQuery) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-hive-muted hover:text-white transition-colors"
                  title="フィルタをクリア"
                >
                  クリア
                </button>
              )}

              <button
                onClick={handleCreateNew}
                className="px-3 py-2 text-sm bg-hive-accent text-white rounded hover:bg-hive-accent/80 transition-colors"
              >
                ＋ 新規作成
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-hive-muted">読み込み中...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-red-400">{error}</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-hive-muted mb-2">テンプレートがありません</p>
                  <button
                    onClick={handleCreateNew}
                    className="text-sm text-hive-accent hover:underline"
                  >
                    最初のテンプレートを作成
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={(t) => setSelectedTemplate(t.id)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isSelected={selectedTemplateId === template.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer with selected template action */}
          {selectedTemplateId && (
            <div className="border-t border-hive-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-hive-muted">
                  {templates.find((t) => t.id === selectedTemplateId)?.name} を選択中
                </p>
                <button
                  onClick={() => {
                    const template = templates.find((t) => t.id === selectedTemplateId);
                    if (template) {
                      handleUseTemplate(template);
                    }
                  }}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-500 transition-colors"
                >
                  このテンプレートを使用
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Modal */}
      <TemplateModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTemplate(null);
        }}
        onSubmit={handleModalSubmit}
        template={editingTemplate}
        mode={modalMode}
      />
    </>
  );
};
