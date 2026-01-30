import React, { useEffect, useState } from 'react';
import { useWorkflowTemplateStore } from '../stores/workflowTemplateStore';
import { TemplateCard } from './TemplateCard';
import { EditTemplateDialog } from './EditTemplateDialog';
import type { TemplateCategory, WorkflowTemplate, TemplateUpdateInput } from '../../shared/types/template';

interface TemplateGalleryProps {
  onApply: (templateId: number) => void;
  onEdit?: (templateId: number) => void;
  onDelete?: (templateId: number) => void;
  onCreateNew?: () => void;
}

const CATEGORIES: { value: TemplateCategory | null; label: string }[] = [
  { value: null, label: 'All Templates' },
  { value: 'automation', label: 'Automation' },
  { value: 'notification', label: 'Notification' },
  { value: 'data-processing', label: 'Data Processing' },
  { value: 'custom', label: 'Custom' },
];

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  onApply,
  onEdit,
  onDelete,
  onCreateNew,
}) => {
  const {
    templates,
    selectedCategory,
    isLoading,
    error,
    loadTemplates,
    setSelectedCategory,
    updateTemplate,
  } = useWorkflowTemplateStore();

  const [editingTemplate, setEditingTemplate] = useState<WorkflowTemplate | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleCategoryChange = (category: TemplateCategory | null) => {
    setSelectedCategory(category);
  };

  const handleEdit = (templateId: number) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setEditingTemplate(template);
      setShowEditDialog(true);
    }
    // Also call the optional onEdit prop if provided
    onEdit?.(templateId);
  };

  const handleEditSave = async (id: number, data: TemplateUpdateInput) => {
    await updateTemplate(id, data);
    setShowEditDialog(false);
    setEditingTemplate(null);
  };

  // Filter templates by category and search query
  const filteredTemplates = templates.filter((template) => {
    // Category filter
    if (selectedCategory && template.category !== selectedCategory) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = template.name.toLowerCase().includes(query);
      const matchDesc = template.description?.toLowerCase().includes(query);
      return matchName || matchDesc;
    }

    return true;
  });

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <p className="font-medium">Error loading templates</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Workflow Templates</h2>
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Save Current as Template
            </button>
          )}
        </div>

        {/* Search Box */}
        <div className="mt-4 relative">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                block w-full rounded-lg border border-gray-300 bg-white
                py-2 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-500
                focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
              "
              placeholder="Search templates..."
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {CATEGORIES.map((category) => (
            <button
              key={category.label}
              onClick={() => handleCategoryChange(category.value)}
              className={`
                shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors
                ${
                  selectedCategory === category.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">Loading templates...</div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
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
            <p className="mt-4 text-lg font-medium text-gray-900">No templates found</p>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery
                ? `No templates match "${searchQuery}"`
                : selectedCategory
                ? 'Try selecting a different category'
                : 'Create your first template to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onApply={onApply}
                onEdit={handleEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Template Dialog */}
      <EditTemplateDialog
        isOpen={showEditDialog}
        template={editingTemplate}
        onClose={() => {
          setShowEditDialog(false);
          setEditingTemplate(null);
        }}
        onSave={handleEditSave}
      />
    </div>
  );
};
