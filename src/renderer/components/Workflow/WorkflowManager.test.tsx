// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { WorkflowManager } from './WorkflowManager';

vi.mock('./WorkflowList', () => ({
  WorkflowList: ({ onCreateNew }: any) => <div><button onClick={onCreateNew}>New</button>WorkflowList</div>,
}));

vi.mock('./WorkflowCanvas', () => ({
  WorkflowCanvas: () => <div>WorkflowCanvas</div>,
}));

vi.mock('./WorkflowCreateModal', () => ({
  WorkflowCreateModal: () => null,
}));

vi.mock('./ExecutionHistory', () => ({
  ExecutionHistory: () => <div>ExecutionHistory</div>,
}));

vi.mock('./ExecutionDetails', () => ({
  ExecutionDetails: () => null,
}));

vi.mock('../TemplateGallery', () => ({
  TemplateGallery: () => <div>TemplateGallery</div>,
}));

vi.mock('../SaveAsTemplateDialog', () => ({
  SaveAsTemplateDialog: () => null,
}));

vi.mock('../ApplyTemplateDialog', () => ({
  ApplyTemplateDialog: () => null,
}));

vi.mock('../../stores/workflowStore', () => ({
  useWorkflowStore: () => ({
    currentWorkflow: null,
    setCurrentWorkflow: vi.fn(),
    loadWorkflow: vi.fn(),
  }),
}));

vi.mock('../../stores/workflowTemplateStore', () => ({
  useWorkflowTemplateStore: () => ({
    createTemplate: vi.fn(),
    applyTemplate: vi.fn(),
  }),
}));

vi.mock('../../stores/sessionStore', () => ({
  useSessionStore: () => ({ activeSessionId: 's1' }),
}));

describe('WorkflowManager', () => {
  it('renders workflow list and tabs', () => {
    render(<WorkflowManager />);
    expect(screen.getByText('WorkflowList')).toBeDefined();
  });

  it('renders canvas tab by default', () => {
    render(<WorkflowManager />);
    expect(screen.getAllByText(/Canvas|キャンバス|canvas/i).length).toBeGreaterThan(0);
  });
});
