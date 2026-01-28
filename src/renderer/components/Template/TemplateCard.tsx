import React from 'react';
import type { TaskTemplate } from '../../../shared/types/taskTemplate';

interface TemplateCardProps {
  template: TaskTemplate;
  onSelect: (template: TaskTemplate) => void;
  onEdit: (template: TaskTemplate) => void;
  onDelete: (templateId: string) => void;
  isSelected?: boolean;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  onEdit,
  onDelete,
  isSelected,
}) => {
  return (
    <div
      className={`
        bg-hive-surface border rounded-lg p-3
        cursor-pointer transition-all
        ${
          isSelected
            ? 'border-hive-accent ring-2 ring-hive-accent/30'
            : 'border-hive-border hover:border-hive-accent/50'
        }
      `}
      onClick={() => onSelect(template)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-white mb-1">{template.name}</h4>
          {template.description && (
            <p className="text-xs text-hive-muted line-clamp-2">{template.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-2">
          {template.category && (
            <span className="px-1.5 py-0.5 bg-blue-900/50 text-blue-300 rounded">
              {template.category}
            </span>
          )}
          <span className="text-hive-muted">使用回数: {template.usageCount}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(template);
            }}
            className="px-2 py-0.5 bg-yellow-900/50 text-yellow-300 rounded hover:bg-yellow-800/50 transition-colors"
            title="編集"
          >
            編集
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('このテンプレートを削除しますか？')) {
                onDelete(template.id);
              }
            }}
            className="px-2 py-0.5 bg-red-900/50 text-red-300 rounded hover:bg-red-800/50 transition-colors"
            title="削除"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
};
