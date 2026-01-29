import React from 'react';
import type { WorkflowTemplate } from '../../shared/types/template';
import { formatDistanceToNow } from 'date-fns';

interface TemplateCardProps {
  template: WorkflowTemplate;
  onApply?: (templateId: number) => void;
  onEdit?: (templateId: number) => void;
  onDelete?: (templateId: number) => void;
  isSelected?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  automation: 'Automation',
  notification: 'Notification',
  'data-processing': 'Data Processing',
  custom: 'Custom',
};

const CATEGORY_COLORS: Record<string, string> = {
  automation: 'bg-blue-100 text-blue-800',
  notification: 'bg-purple-100 text-purple-800',
  'data-processing': 'bg-green-100 text-green-800',
  custom: 'bg-gray-100 text-gray-800',
};

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onApply,
  onEdit,
  onDelete,
  isSelected = false,
}) => {
  const categoryLabel = CATEGORY_LABELS[template.category] || template.category;
  const categoryColor = CATEGORY_COLORS[template.category] || CATEGORY_COLORS.custom;

  return (
    <div
      className={`
        relative rounded-lg border bg-white shadow-sm transition-all hover:shadow-md
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'}
      `}
    >
      {/* Thumbnail or Placeholder */}
      <div className="h-32 w-full rounded-t-lg bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {template.thumbnail ? (
          <img
            src={template.thumbnail}
            alt={template.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg
              className="h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="mb-2 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {template.name}
            </h3>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {template.description}
            </p>
          </div>
          {template.isBuiltIn && (
            <span className="ml-2 shrink-0 rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-800">
              Built-in
            </span>
          )}
        </div>

        {/* Metadata */}
        <div className="mt-3 flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColor}`}>
            {categoryLabel}
          </span>
          <span className="text-xs text-gray-500">
            {template.nodes.length} nodes
          </span>
          {!template.isBuiltIn && (
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(template.updatedAt, { addSuffix: true })}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          {onApply && (
            <button
              onClick={() => onApply(template.id)}
              className="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          )}
          {onEdit && !template.isBuiltIn && (
            <button
              onClick={() => onEdit(template.id)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Edit
            </button>
          )}
          {onDelete && !template.isBuiltIn && (
            <button
              onClick={() => onDelete(template.id)}
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
