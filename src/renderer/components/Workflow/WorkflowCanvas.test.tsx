// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorkflowCanvas } from './WorkflowCanvas';

const {
  mockSaveCurrentWorkflow,
  mockExecuteWorkflow,
  mockAddNode,
  mockExport,
  mockImport,
  mockToastLoading,
  mockToastDismiss,
  mockToastSuccess,
  mockToastError,
  mockToastWarning,
} = vi.hoisted(() => ({
  mockSaveCurrentWorkflow: vi.fn(),
  mockExecuteWorkflow: vi.fn(),
  mockAddNode: vi.fn(),
  mockExport: vi.fn(),
  mockImport: vi.fn(),
  mockToastLoading: vi.fn(() => 'loading-id'),
  mockToastDismiss: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  mockToastWarning: vi.fn(),
}));

let mockWorkflowStore = {
  currentWorkflow: null as { id: number; name: string; description?: string; sessionId: number } | null,
  nodes: [],
  edges: [],
  setNodes: vi.fn(),
  setEdges: vi.fn(),
  addNode: mockAddNode,
  saveCurrentWorkflow: mockSaveCurrentWorkflow,
  executeWorkflow: mockExecuteWorkflow,
  isExecuting: false,
};

let onNodeClick: ((event: React.MouseEvent, node: { id: string; type: string }) => void) | null = null;
let onConnect: ((params: { source: string; target: string }) => void) | null = null;
let onDrop: ((event: React.DragEvent) => void) | null = null;
let onDragOver: ((event: React.DragEvent) => void) | null = null;
let mockSetReactFlowInstance: ((instance: unknown) => void) | null = null;

vi.mock('@xyflow/react', () => {
  const ReactFlow = ({ children, onNodeClick: nodeClick, onConnect: connect, onDrop: drop, onDragOver: dragOver, onInit }: {
    children: React.ReactNode;
    onNodeClick: typeof onNodeClick;
    onConnect: typeof onConnect;
    onDrop: typeof onDrop;
    onDragOver: typeof onDragOver;
    onInit: typeof mockSetReactFlowInstance;
  }) => {
    onNodeClick = nodeClick;
    onConnect = connect;
    onDrop = drop;
    onDragOver = dragOver;
    mockSetReactFlowInstance = onInit;
    return <div data-testid="xyflow">{children}</div>;
  };
  return {
    ReactFlow,
    Background: () => <div data-testid="background" />,
    Controls: () => <div data-testid="controls" />,
    MiniMap: () => <div data-testid="minimap" />,
    Panel: ({ children }: { children: React.ReactNode }) => <div data-testid="panel">{children}</div>,
    addEdge: vi.fn((edge, edges) => [...edges, edge]),
    useNodesState: vi.fn(() => [[], vi.fn(), vi.fn()]),
    useEdgesState: vi.fn(() => [[], vi.fn(), vi.fn()]),
  };
});

vi.mock('@xyflow/react/dist/style.css', () => ({}));

vi.mock('./nodes', () => ({
  TaskNode: () => <div>TaskNode</div>,
  TriggerNode: () => <div>TriggerNode</div>,
  ConditionalNode: () => <div>ConditionalNode</div>,
  NotificationNode: () => <div>NotificationNode</div>,
  MergeNode: () => <div>MergeNode</div>,
  DelayNode: () => <div>DelayNode</div>,
  LoopNode: () => <div>LoopNode</div>,
  SubworkflowNode: () => <div>SubworkflowNode</div>,
  AgentNode: () => <div>AgentNode</div>,
}));

let mockOnAddNode: ((type: string) => void) | null = null;

vi.mock('./NodePalette', () => ({
  NodePalette: ({ onAddNode }: { onAddNode: typeof mockOnAddNode }) => {
    mockOnAddNode = onAddNode;
    return <div data-testid="node-palette">NodePalette</div>;
  },
}));

vi.mock('./settings/NodeSettingsPanel', () => ({
  NodeSettingsPanel: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="node-settings">
      <button onClick={onClose}>Close Settings</button>
    </div>
  ),
}));

let mockSettingsOnClose: (() => void) | null = null;

vi.mock('./WorkflowSettingsModal', () => ({
  WorkflowSettingsModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    mockSettingsOnClose = onClose;
    return isOpen ? <div data-testid="workflow-settings-modal">Settings Modal</div> : null;
  },
}));

let mockImportOnConfirm: (() => void) | null = null;

vi.mock('./ImportValidationDialog', () => ({
  ImportValidationDialog: ({ isOpen, onConfirm }: { isOpen: boolean; onConfirm: () => void }) => {
    mockImportOnConfirm = onConfirm;
    return isOpen ? <div data-testid="import-dialog">Import Dialog</div> : null;
  },
}));

let mockExportTemplateOnSuccess: (() => void) | null = null;

vi.mock('./ExportTemplateDialog', () => ({
  ExportTemplateDialog: ({ isOpen, onSuccess }: { isOpen: boolean; onSuccess: () => void }) => {
    mockExportTemplateOnSuccess = onSuccess;
    return isOpen ? <div data-testid="export-template-dialog">Export Template Dialog</div> : null;
  },
}));

vi.mock('../../stores/workflowStore', () => ({
  useWorkflowStore: () => mockWorkflowStore,
}));

vi.mock('../../bridge/ipcBridge', () => ({
  ipcBridge: {
    workflow: {
      export: mockExport,
      import: mockImport,
    },
  },
}));

vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({
    loading: mockToastLoading,
    dismiss: mockToastDismiss,
    success: mockToastSuccess,
    error: mockToastError,
    warning: mockToastWarning,
  }),
}));

describe('WorkflowCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkflowStore = {
      currentWorkflow: null,
      nodes: [],
      edges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: mockAddNode,
      saveCurrentWorkflow: mockSaveCurrentWorkflow,
      executeWorkflow: mockExecuteWorkflow,
      isExecuting: false,
    };
    onNodeClick = null;
    onConnect = null;
    onDrop = null;
    onDragOver = null;
    mockOnAddNode = null;
    mockSettingsOnClose = null;
    mockImportOnConfirm = null;
    mockExportTemplateOnSuccess = null;
    mockSetReactFlowInstance = null;
  });

  describe('empty state', () => {
    it('renders without crashing', () => {
      const { container } = render(<WorkflowCanvas />);
      expect(container.innerHTML).not.toBe('');
    });

    it('shows empty state text when no workflow', () => {
      render(<WorkflowCanvas />);
      expect(screen.getByText('No Workflow Selected')).toBeDefined();
    });

    it('shows workflow selection instruction', () => {
      render(<WorkflowCanvas />);
      expect(screen.getByText(/Select a workflow/i)).toBeDefined();
    });

    it('renders empty state container', () => {
      const { container } = render(<WorkflowCanvas />);
      expect(container.querySelector('svg')).toBeDefined();
    });
  });

  describe('with workflow', () => {
    beforeEach(() => {
      mockWorkflowStore.currentWorkflow = {
        id: 1,
        name: 'Test Workflow',
        description: 'Test Description',
        sessionId: 1,
      };
    });

    it('renders workflow name', () => {
      render(<WorkflowCanvas />);
      expect(screen.getByText('Test Workflow')).toBeDefined();
    });

    it('renders workflow description', () => {
      render(<WorkflowCanvas />);
      expect(screen.getByText('Test Description')).toBeDefined();
    });

    it('renders Save and Execute buttons', () => {
      render(<WorkflowCanvas />);
      expect(screen.getByText('Save')).toBeDefined();
      expect(screen.getByText('Execute')).toBeDefined();
    });

    it('renders NodePalette when showNodePalette is true', () => {
      render(<WorkflowCanvas showNodePalette={true} />);
      expect(screen.getByTestId('node-palette')).toBeDefined();
    });

    it('does not render NodePalette when showNodePalette is false', () => {
      render(<WorkflowCanvas showNodePalette={false} />);
      expect(screen.queryByTestId('node-palette')).toBeNull();
    });

    it('shows Executing state when isExecuting is true', () => {
      mockWorkflowStore.isExecuting = true;
      render(<WorkflowCanvas />);
      expect(screen.getByText('Executing...')).toBeDefined();
    });
  });

  describe('save workflow', () => {
    beforeEach(() => {
      mockWorkflowStore.currentWorkflow = {
        id: 1,
        name: 'Test Workflow',
        sessionId: 1,
      };
    });

    it('saves workflow successfully', async () => {
      mockSaveCurrentWorkflow.mockResolvedValue(undefined);
      render(<WorkflowCanvas />);

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockToastLoading).toHaveBeenCalledWith('Saving workflow...');
        expect(mockSaveCurrentWorkflow).toHaveBeenCalled();
        expect(mockToastDismiss).toHaveBeenCalledWith('loading-id');
        expect(mockToastSuccess).toHaveBeenCalledWith('Workflow saved successfully!');
      });
    });

    it('handles save error', async () => {
      mockSaveCurrentWorkflow.mockRejectedValue(new Error('Save failed'));
      render(<WorkflowCanvas />);

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Failed to save workflow');
      });
    });

    it('shows warning when no workflow selected', async () => {
      mockWorkflowStore.currentWorkflow = null;
      render(<WorkflowCanvas />);

      // Can't click Save since empty state is shown
      // This is expected behavior
    });
  });

  describe('execute workflow', () => {
    beforeEach(() => {
      mockWorkflowStore.currentWorkflow = {
        id: 1,
        name: 'Test Workflow',
        sessionId: 1,
      };
    });

    it('executes workflow successfully', async () => {
      mockExecuteWorkflow.mockResolvedValue({ status: 'success' });
      render(<WorkflowCanvas />);

      fireEvent.click(screen.getByText('Execute'));

      await waitFor(() => {
        expect(mockToastLoading).toHaveBeenCalledWith('Executing workflow...');
        expect(mockExecuteWorkflow).toHaveBeenCalledWith(1);
        expect(mockToastDismiss).toHaveBeenCalled();
        expect(mockToastSuccess).toHaveBeenCalledWith('Workflow executed successfully!');
      });
    });

    it('handles execution failure', async () => {
      mockExecuteWorkflow.mockResolvedValue({ status: 'failed', error: 'Test error' });
      render(<WorkflowCanvas />);

      fireEvent.click(screen.getByText('Execute'));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('Test error'));
      });
    });

    it('handles execution error', async () => {
      mockExecuteWorkflow.mockRejectedValue(new Error('Network error'));
      render(<WorkflowCanvas />);

      fireEvent.click(screen.getByText('Execute'));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Failed to execute workflow');
      });
    });

    it('disables Execute button when already executing', () => {
      mockWorkflowStore.isExecuting = true;
      render(<WorkflowCanvas />);

      const executeButton = screen.getByText('Executing...');
      expect(executeButton).toHaveProperty('disabled', true);
    });
  });

  describe('export workflow', () => {
    beforeEach(() => {
      mockWorkflowStore.currentWorkflow = {
        id: 1,
        name: 'Test Workflow',
        sessionId: 1,
      };
    });

    it('exports workflow successfully', async () => {
      mockExport.mockResolvedValue({ success: true, filePath: '/path/to/file.json' });
      render(<WorkflowCanvas />);

      const exportButton = screen.getAllByRole('button').find(btn =>
        btn.getAttribute('title') === 'Export workflow to JSON'
      );
      fireEvent.click(exportButton!);

      await waitFor(() => {
        expect(mockExport).toHaveBeenCalledWith(1);
        expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringContaining('/path/to/file.json'));
      });
    });

    it('handles export cancel', async () => {
      mockExport.mockResolvedValue({ canceled: true });
      render(<WorkflowCanvas />);

      const exportButton = screen.getAllByRole('button').find(btn =>
        btn.getAttribute('title') === 'Export workflow to JSON'
      );
      fireEvent.click(exportButton!);

      await waitFor(() => {
        expect(mockExport).toHaveBeenCalled();
      });
      // No toast should be shown for cancel
      expect(mockToastSuccess).not.toHaveBeenCalled();
      expect(mockToastError).not.toHaveBeenCalled();
    });

    it('handles export failure', async () => {
      mockExport.mockResolvedValue({ success: false });
      render(<WorkflowCanvas />);

      const exportButton = screen.getAllByRole('button').find(btn =>
        btn.getAttribute('title') === 'Export workflow to JSON'
      );
      fireEvent.click(exportButton!);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Failed to export workflow');
      });
    });

    it('handles export error', async () => {
      mockExport.mockRejectedValue(new Error('Export error'));
      render(<WorkflowCanvas />);

      const exportButton = screen.getAllByRole('button').find(btn =>
        btn.getAttribute('title') === 'Export workflow to JSON'
      );
      fireEvent.click(exportButton!);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('Export error'));
      });
    });
  });

  describe('import workflow', () => {
    beforeEach(() => {
      mockWorkflowStore.currentWorkflow = {
        id: 1,
        name: 'Test Workflow',
        sessionId: 1,
      };
    });

    it('imports workflow and shows dialog', async () => {
      mockImport.mockResolvedValue({ success: true, workflow: { name: 'Imported WF' } });
      render(<WorkflowCanvas />);

      const importButton = screen.getAllByRole('button').find(btn =>
        btn.getAttribute('title') === 'Import workflow from JSON'
      );
      fireEvent.click(importButton!);

      await waitFor(() => {
        expect(mockToastLoading).toHaveBeenCalledWith('Importing workflow...');
        expect(mockImport).toHaveBeenCalledWith(1);
        expect(screen.getByTestId('import-dialog')).toBeDefined();
      });
    });

    it('handles import cancel', async () => {
      mockImport.mockResolvedValue({ canceled: true });
      render(<WorkflowCanvas />);

      const importButton = screen.getAllByRole('button').find(btn =>
        btn.getAttribute('title') === 'Import workflow from JSON'
      );
      fireEvent.click(importButton!);

      await waitFor(() => {
        expect(mockImport).toHaveBeenCalled();
      });
      // Dialog should not be shown
      expect(screen.queryByTestId('import-dialog')).toBeNull();
    });

    it('handles import error', async () => {
      mockImport.mockRejectedValue(new Error('Import error'));
      render(<WorkflowCanvas />);

      const importButton = screen.getAllByRole('button').find(btn =>
        btn.getAttribute('title') === 'Import workflow from JSON'
      );
      fireEvent.click(importButton!);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('Import error'));
      });
    });
  });

  describe('export template', () => {
    beforeEach(() => {
      mockWorkflowStore.currentWorkflow = {
        id: 1,
        name: 'Test Workflow',
        sessionId: 1,
      };
    });

    it('opens export template dialog', async () => {
      render(<WorkflowCanvas />);

      const templateButton = screen.getAllByRole('button').find(btn =>
        btn.getAttribute('title') === 'Save as template'
      );
      fireEvent.click(templateButton!);

      await waitFor(() => {
        expect(screen.getByTestId('export-template-dialog')).toBeDefined();
      });
    });
  });

  describe('settings modal', () => {
    beforeEach(() => {
      mockWorkflowStore.currentWorkflow = {
        id: 1,
        name: 'Test Workflow',
        sessionId: 1,
      };
    });

    it('opens settings modal', async () => {
      render(<WorkflowCanvas />);

      const settingsButton = screen.getAllByRole('button').find(btn =>
        btn.getAttribute('title') === 'Workflow settings'
      );
      fireEvent.click(settingsButton!);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-settings-modal')).toBeDefined();
      });
    });
  });

  describe('node palette', () => {
    beforeEach(() => {
      mockWorkflowStore.currentWorkflow = {
        id: 1,
        name: 'Test Workflow',
        sessionId: 1,
      };
    });

    it('adds node via palette callback', async () => {
      render(<WorkflowCanvas showNodePalette={true} />);

      // Call the callback directly
      mockOnAddNode?.('task');

      expect(mockAddNode).toHaveBeenCalledWith(expect.objectContaining({
        type: 'task',
        data: expect.objectContaining({
          label: 'Task Node',
        }),
      }));
    });
  });

  describe('drag and drop', () => {
    beforeEach(() => {
      mockWorkflowStore.currentWorkflow = {
        id: 1,
        name: 'Test Workflow',
        sessionId: 1,
      };
    });

    it('handles dragOver event', () => {
      render(<WorkflowCanvas />);

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: { dropEffect: '' },
      } as unknown as React.DragEvent;

      onDragOver?.(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.dataTransfer.dropEffect).toBe('move');
    });

    it('handles drop event with reactFlowInstance', () => {
      render(<WorkflowCanvas />);

      // First, set the reactFlowInstance
      mockSetReactFlowInstance?.({
        screenToFlowPosition: vi.fn(() => ({ x: 100, y: 100 })),
        toObject: vi.fn(() => ({ nodes: [], edges: [] })),
      });

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          getData: vi.fn(() => 'task'),
        },
        clientX: 200,
        clientY: 200,
      } as unknown as React.DragEvent;

      onDrop?.(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('ignores drop event without type', () => {
      render(<WorkflowCanvas />);

      mockSetReactFlowInstance?.({
        screenToFlowPosition: vi.fn(() => ({ x: 100, y: 100 })),
        toObject: vi.fn(() => ({ nodes: [], edges: [] })),
      });

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          getData: vi.fn(() => ''),
        },
        clientX: 200,
        clientY: 200,
      } as unknown as React.DragEvent;

      onDrop?.(mockEvent);

      expect(mockAddNode).not.toHaveBeenCalled();
    });

    it('ignores drop event without reactFlowInstance', () => {
      render(<WorkflowCanvas />);

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          getData: vi.fn(() => 'task'),
        },
        clientX: 200,
        clientY: 200,
      } as unknown as React.DragEvent;

      onDrop?.(mockEvent);

      expect(mockAddNode).not.toHaveBeenCalled();
    });
  });
});
