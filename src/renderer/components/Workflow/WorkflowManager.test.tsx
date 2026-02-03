// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorkflowManager } from './WorkflowManager';

const {
  mockLoadWorkflow,
  mockSetCurrentWorkflow,
  mockCreateTemplate,
  mockApplyTemplate,
} = vi.hoisted(() => ({
  mockLoadWorkflow: vi.fn(),
  mockSetCurrentWorkflow: vi.fn(),
  mockCreateTemplate: vi.fn(),
  mockApplyTemplate: vi.fn(),
}));

let mockCurrentWorkflow: any = null;

vi.mock('./WorkflowList', () => ({
  WorkflowList: ({ onCreateNew, onSelectWorkflow }: any) => (
    <div>
      <button onClick={onCreateNew}>New</button>
      <button onClick={() => onSelectWorkflow({ id: 1, name: 'Test Workflow' })}>SelectWorkflow</button>
      WorkflowList
    </div>
  ),
}));

vi.mock('./WorkflowCanvas', () => ({
  WorkflowCanvas: () => <div>WorkflowCanvas</div>,
}));

vi.mock('./WorkflowCreateModal', () => ({
  WorkflowCreateModal: ({ isOpen, onClose, onCreated }: any) => (
    isOpen ? (
      <div data-testid="create-modal">
        <button onClick={onClose}>CloseModal</button>
        <button onClick={() => onCreated(123)}>CreateWorkflow</button>
        CreateModal
      </div>
    ) : null
  ),
}));

vi.mock('./ExecutionHistory', () => ({
  ExecutionHistory: ({ onSelectExecution }: any) => (
    <div>
      <button onClick={() => onSelectExecution({ id: 1, status: 'completed' })}>SelectExecution</button>
      ExecutionHistory
    </div>
  ),
}));

vi.mock('./ExecutionDetails', () => ({
  ExecutionDetails: ({ execution }: any) => (
    <div>ExecutionDetails {execution ? `(${execution.id})` : '(none)'}</div>
  ),
}));

vi.mock('../TemplateGallery', () => ({
  TemplateGallery: ({ onApply, onCreateNew }: any) => (
    <div>
      <button onClick={() => onApply(1)}>ApplyTemplate</button>
      <button onClick={onCreateNew}>CreateNewTemplate</button>
      TemplateGallery
    </div>
  ),
}));

vi.mock('../SaveAsTemplateDialog', () => ({
  SaveAsTemplateDialog: ({ isOpen, onClose, onSave }: any) => (
    isOpen ? (
      <div data-testid="save-template-dialog">
        <button onClick={onClose}>CloseSaveDialog</button>
        <button onClick={() => onSave({ name: 'Template', description: 'Desc', category: 'custom' })}>
          SaveTemplate
        </button>
        SaveAsTemplateDialog
      </div>
    ) : null
  ),
}));

vi.mock('../ApplyTemplateDialog', () => ({
  ApplyTemplateDialog: ({ isOpen, onClose, onApply, template }: any) => (
    isOpen ? (
      <div data-testid="apply-template-dialog">
        <button onClick={onClose}>CloseApplyDialog</button>
        <button onClick={onApply}>ApplyConfirm</button>
        ApplyTemplateDialog {template?.name || ''}
      </div>
    ) : null
  ),
}));

vi.mock('../../stores/workflowStore', () => ({
  useWorkflowStore: () => ({
    currentWorkflow: mockCurrentWorkflow,
    setCurrentWorkflow: mockSetCurrentWorkflow,
    loadWorkflow: mockLoadWorkflow,
  }),
}));

vi.mock('../../stores/workflowTemplateStore', () => {
  const state = {
    createTemplate: mockCreateTemplate,
    applyTemplate: mockApplyTemplate,
    templates: [{ id: 1, name: 'Test Template' }],
  };
  const fn = () => state;
  fn.getState = () => state;
  return { useWorkflowTemplateStore: fn };
});

vi.mock('../../stores/sessionStore', () => ({
  useSessionStore: () => ({ activeSessionId: '1' }),
}));

describe('WorkflowManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentWorkflow = null;
  });

  describe('rendering', () => {
    it('renders workflow list and tabs', () => {
      render(<WorkflowManager />);
      expect(screen.getByText('WorkflowList')).toBeDefined();
    });

    it('renders canvas tab by default', () => {
      render(<WorkflowManager />);
      expect(screen.getAllByText(/Canvas|キャンバス|canvas/i).length).toBeGreaterThan(0);
    });

    it('renders new workflow button', () => {
      render(<WorkflowManager />);
      expect(screen.getByText('New')).toBeDefined();
    });

    it('renders workflow canvas component', () => {
      render(<WorkflowManager />);
      expect(screen.getByText('WorkflowCanvas')).toBeDefined();
    });

    it('renders execution history tab', () => {
      render(<WorkflowManager />);
      expect(screen.getAllByText(/History|実行履歴/i).length).toBeGreaterThan(0);
    });

    it('renders templates tab', () => {
      render(<WorkflowManager />);
      expect(screen.getAllByText(/Template/i).length).toBeGreaterThan(0);
    });

    it('renders container', () => {
      const { container } = render(<WorkflowManager />);
      expect(container.innerHTML).not.toBe('');
    });

    it('has flex layout', () => {
      const { container } = render(<WorkflowManager />);
      expect(container.innerHTML).toContain('flex');
    });

    it('has dark background', () => {
      const { container } = render(<WorkflowManager />);
      expect(container.innerHTML).toContain('bg-gray-900');
    });
  });

  describe('tab navigation', () => {
    it('shows canvas tab content by default', () => {
      render(<WorkflowManager />);
      expect(screen.getByText('WorkflowCanvas')).toBeDefined();
    });

    it('switches to history tab when clicked', () => {
      render(<WorkflowManager />);
      const historyTab = screen.getAllByText(/History/i)[0];
      fireEvent.click(historyTab);
      expect(screen.getByText('ExecutionHistory')).toBeDefined();
    });

    it('switches to templates tab when clicked', () => {
      render(<WorkflowManager />);
      const templatesTab = screen.getAllByText(/Templates/i)[0];
      fireEvent.click(templatesTab);
      expect(screen.getByText('TemplateGallery')).toBeDefined();
    });

    it('shows execution details in history tab', () => {
      render(<WorkflowManager />);
      const historyTab = screen.getAllByText(/History/i)[0];
      fireEvent.click(historyTab);
      expect(screen.getByText(/ExecutionDetails/)).toBeDefined();
    });

    it('can switch back to canvas from history', () => {
      render(<WorkflowManager />);
      const historyTab = screen.getAllByText(/History/i)[0];
      fireEvent.click(historyTab);
      const canvasTab = screen.getAllByText(/Canvas/i)[0];
      fireEvent.click(canvasTab);
      expect(screen.getByText('WorkflowCanvas')).toBeDefined();
    });
  });

  describe('tab styling', () => {
    it('active tab has different styling', () => {
      const { container } = render(<WorkflowManager />);
      expect(container.innerHTML).toContain('border-blue-500');
    });

    it('inactive tabs have transparent border', () => {
      const { container } = render(<WorkflowManager />);
      expect(container.innerHTML).toContain('border-transparent');
    });
  });

  describe('workflow selection', () => {
    it('calls loadWorkflow when workflow selected', async () => {
      render(<WorkflowManager />);
      fireEvent.click(screen.getByText('SelectWorkflow'));
      await waitFor(() => {
        expect(mockLoadWorkflow).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('create modal', () => {
    it('opens create modal when New button clicked', () => {
      render(<WorkflowManager />);
      fireEvent.click(screen.getByText('New'));
      expect(screen.getByTestId('create-modal')).toBeDefined();
    });

    it('closes create modal', () => {
      render(<WorkflowManager />);
      fireEvent.click(screen.getByText('New'));
      fireEvent.click(screen.getByText('CloseModal'));
      expect(screen.queryByTestId('create-modal')).toBeNull();
    });

    it('loads workflow after creation', async () => {
      render(<WorkflowManager />);
      fireEvent.click(screen.getByText('New'));
      fireEvent.click(screen.getByText('CreateWorkflow'));
      await waitFor(() => {
        expect(mockLoadWorkflow).toHaveBeenCalledWith(123);
      });
    });
  });

  describe('execution selection', () => {
    it('selects execution in history tab', () => {
      render(<WorkflowManager />);
      const historyTab = screen.getAllByText(/History/i)[0];
      fireEvent.click(historyTab);
      fireEvent.click(screen.getByText('SelectExecution'));
      expect(screen.getByText('ExecutionDetails (1)')).toBeDefined();
    });
  });

  describe('save as template', () => {
    it('does not show Save as Template button when no workflow', () => {
      render(<WorkflowManager />);
      expect(screen.queryByText('Save as Template')).toBeNull();
    });

    it('shows Save as Template button when workflow exists', () => {
      mockCurrentWorkflow = { id: 1, nodes: [], edges: [] };
      render(<WorkflowManager />);
      expect(screen.getByText('Save as Template')).toBeDefined();
    });

    it('opens save template dialog when button clicked', () => {
      mockCurrentWorkflow = { id: 1, nodes: [], edges: [] };
      render(<WorkflowManager />);
      fireEvent.click(screen.getByText('Save as Template'));
      expect(screen.getByTestId('save-template-dialog')).toBeDefined();
    });

    it('closes save template dialog', () => {
      mockCurrentWorkflow = { id: 1, nodes: [], edges: [] };
      render(<WorkflowManager />);
      fireEvent.click(screen.getByText('Save as Template'));
      fireEvent.click(screen.getByText('CloseSaveDialog'));
      expect(screen.queryByTestId('save-template-dialog')).toBeNull();
    });

    it('calls createTemplate when saving template', async () => {
      mockCurrentWorkflow = { id: 1, nodes: [{ id: 'n1' }], edges: [{ id: 'e1' }] };
      render(<WorkflowManager />);
      fireEvent.click(screen.getByText('Save as Template'));
      fireEvent.click(screen.getByText('SaveTemplate'));
      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalledWith({
          name: 'Template',
          description: 'Desc',
          category: 'custom',
          nodes: [{ id: 'n1' }],
          edges: [{ id: 'e1' }],
        });
      });
    });
  });

  describe('apply template', () => {
    it('opens apply template dialog from gallery', () => {
      render(<WorkflowManager />);
      const templatesTab = screen.getAllByText(/Templates/i)[0];
      fireEvent.click(templatesTab);
      fireEvent.click(screen.getByText('ApplyTemplate'));
      expect(screen.getByTestId('apply-template-dialog')).toBeDefined();
    });

    it('closes apply template dialog', () => {
      render(<WorkflowManager />);
      const templatesTab = screen.getAllByText(/Templates/i)[0];
      fireEvent.click(templatesTab);
      fireEvent.click(screen.getByText('ApplyTemplate'));
      fireEvent.click(screen.getByText('CloseApplyDialog'));
      expect(screen.queryByTestId('apply-template-dialog')).toBeNull();
    });

    it('applies template and switches to canvas', async () => {
      render(<WorkflowManager />);
      const templatesTab = screen.getAllByText(/Templates/i)[0];
      fireEvent.click(templatesTab);
      fireEvent.click(screen.getByText('ApplyTemplate'));
      fireEvent.click(screen.getByText('ApplyConfirm'));
      await waitFor(() => {
        expect(mockApplyTemplate).toHaveBeenCalledWith(1, 1);
      });
    });
  });

  describe('template gallery actions', () => {
    it('opens save dialog from template gallery create button', () => {
      mockCurrentWorkflow = { id: 1, nodes: [], edges: [] };
      render(<WorkflowManager />);
      const templatesTab = screen.getAllByText(/Templates/i)[0];
      fireEvent.click(templatesTab);
      fireEvent.click(screen.getByText('CreateNewTemplate'));
      expect(screen.getByTestId('save-template-dialog')).toBeDefined();
    });
  });

  describe('cleanup', () => {
    it('clears current workflow on unmount', () => {
      const { unmount } = render(<WorkflowManager />);
      unmount();
      expect(mockSetCurrentWorkflow).toHaveBeenCalledWith(null);
    });
  });

  describe('layout structure', () => {
    it('has workflow list sidebar', () => {
      render(<WorkflowManager />);
      expect(screen.getByText('WorkflowList')).toBeDefined();
    });

    it('has tab header', () => {
      const { container } = render(<WorkflowManager />);
      expect(container.innerHTML).toContain('border-b');
      expect(container.innerHTML).toContain('border-gray-700');
    });

    it('has flex-1 for main content', () => {
      const { container } = render(<WorkflowManager />);
      expect(container.innerHTML).toContain('flex-1');
    });

    it('has overflow-hidden for tab content', () => {
      const { container } = render(<WorkflowManager />);
      expect(container.innerHTML).toContain('overflow-hidden');
    });
  });

  describe('history tab layout', () => {
    it('shows execution history sidebar', () => {
      render(<WorkflowManager />);
      const historyTab = screen.getAllByText(/History/i)[0];
      fireEvent.click(historyTab);
      expect(screen.getByText('ExecutionHistory')).toBeDefined();
    });

    it('shows execution details panel', () => {
      render(<WorkflowManager />);
      const historyTab = screen.getAllByText(/History/i)[0];
      fireEvent.click(historyTab);
      expect(screen.getByText(/ExecutionDetails/)).toBeDefined();
    });
  });

  describe('tab icons', () => {
    it('renders SVG icons in tabs', () => {
      const { container } = render(<WorkflowManager />);
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('canvas tab has icon', () => {
      const { container } = render(<WorkflowManager />);
      expect(container.querySelector('svg')).toBeTruthy();
    });
  });

  describe('button styling', () => {
    it('Save as Template button has proper styling', () => {
      mockCurrentWorkflow = { id: 1, nodes: [], edges: [] };
      const { container } = render(<WorkflowManager />);
      expect(container.innerHTML).toContain('bg-blue-600');
    });
  });

  describe('responsive behavior', () => {
    it('has full height layout', () => {
      const { container } = render(<WorkflowManager />);
      expect(container.innerHTML).toContain('h-full');
    });
  });
});
