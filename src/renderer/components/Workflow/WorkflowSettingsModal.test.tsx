// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { mockUpdateWorkflow } = vi.hoisted(() => ({
  mockUpdateWorkflow: vi.fn(),
}));

vi.mock('../../stores/workflowStore', () => ({
  useWorkflowStore: () => ({
    updateWorkflow: mockUpdateWorkflow,
  }),
}));

import { WorkflowSettingsModal } from './WorkflowSettingsModal';

const createMockWorkflow = (overrides = {}) => ({
  id: 1,
  name: 'Test Workflow',
  description: 'Test description',
  status: 'draft' as const,
  nodes: [],
  edges: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  autoCreateTask: false,
  ...overrides,
});

describe('WorkflowSettingsModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateWorkflow.mockResolvedValue({ id: 1 });
  });

  describe('visibility', () => {
    it('renders nothing when not open', () => {
      const { container } = render(
        <WorkflowSettingsModal
          isOpen={false}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders modal when open', () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );
      expect(screen.getByText('Workflow Settings')).toBeTruthy();
    });
  });

  describe('form fields', () => {
    it('renders name input with workflow name', () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );
      expect(screen.getByLabelText(/Name/)).toBeTruthy();
      expect(screen.getByDisplayValue('Test Workflow')).toBeTruthy();
    });

    it('renders description textarea with workflow description', () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );
      expect(screen.getByLabelText(/Description/)).toBeTruthy();
      expect(screen.getByDisplayValue('Test description')).toBeTruthy();
    });

    it('renders status select with workflow status', () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );
      expect(screen.getByLabelText(/Status/)).toBeTruthy();
      const select = screen.getByLabelText(/Status/) as HTMLSelectElement;
      expect(select.value).toBe('draft');
    });

    it('renders auto-create task checkbox', () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );
      expect(screen.getByLabelText(/Auto-create task/)).toBeTruthy();
    });

    it('shows auto-create task checked when workflow has it enabled', () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow({ autoCreateTask: true }) as any}
        />
      );
      const checkbox = screen.getByLabelText(/Auto-create task/) as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('allows changing name', () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );
      const nameInput = screen.getByLabelText(/Name/) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'New Name' } });
      expect(nameInput.value).toBe('New Name');
    });

    it('allows changing description', () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );
      const descInput = screen.getByLabelText(/Description/) as HTMLTextAreaElement;
      fireEvent.change(descInput, { target: { value: 'New description' } });
      expect(descInput.value).toBe('New description');
    });

    it('allows changing status', () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );
      const select = screen.getByLabelText(/Status/) as HTMLSelectElement;
      fireEvent.change(select, { target: { value: 'active' } });
      expect(select.value).toBe('active');
    });

    it('allows toggling auto-create task', () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );
      const checkbox = screen.getByLabelText(/Auto-create task/) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('buttons', () => {
    it('renders Cancel button', () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );
      expect(screen.getByText('Cancel')).toBeTruthy();
    });

    it('renders Save button', () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );
      expect(screen.getByText('Save')).toBeTruthy();
    });

    it('calls onClose when Cancel clicked', () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );
      fireEvent.click(screen.getByText('Cancel'));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when X button clicked', () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find((btn) => btn.querySelector('svg'));
      fireEvent.click(closeButton!);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('disables Save button when name is empty', () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );
      const nameInput = screen.getByLabelText(/Name/);
      fireEvent.change(nameInput, { target: { value: '' } });
      const saveButton = screen.getByText('Save');
      expect(saveButton).toHaveProperty('disabled', true);
    });

    it('disables Save button when name is whitespace only', () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );
      const nameInput = screen.getByLabelText(/Name/);
      fireEvent.change(nameInput, { target: { value: '   ' } });
      const saveButton = screen.getByText('Save');
      expect(saveButton).toHaveProperty('disabled', true);
    });
  });

  describe('form submission', () => {
    it('saves workflow on submit', async () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );

      const nameInput = screen.getByLabelText(/Name/);
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateWorkflow).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 1,
            name: 'Updated Name',
          })
        );
      });
    });

    it('includes all fields when saving', async () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );

      const nameInput = screen.getByLabelText(/Name/);
      fireEvent.change(nameInput, { target: { value: 'New Name' } });

      const descInput = screen.getByLabelText(/Description/);
      fireEvent.change(descInput, { target: { value: 'New Desc' } });

      const statusSelect = screen.getByLabelText(/Status/);
      fireEvent.change(statusSelect, { target: { value: 'active' } });

      const checkbox = screen.getByLabelText(/Auto-create task/);
      fireEvent.click(checkbox);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateWorkflow).toHaveBeenCalledWith({
          id: 1,
          name: 'New Name',
          description: 'New Desc',
          status: 'active',
          autoCreateTask: true,
        });
      });
    });

    it('calls onClose after successful save', async () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('shows Saving state during submission', async () => {
      let resolveSave: (value: { id: number }) => void;
      mockUpdateWorkflow.mockReturnValue(
        new Promise((resolve) => {
          resolveSave = resolve;
        })
      );

      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeTruthy();
      });

      resolveSave!({ id: 1 });

      await waitFor(() => {
        expect(screen.queryByText('Saving...')).toBeNull();
      });
    });

    it('trims whitespace from name', async () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );

      const nameInput = screen.getByLabelText(/Name/);
      fireEvent.change(nameInput, { target: { value: '  Trimmed Name  ' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateWorkflow).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Trimmed Name',
          })
        );
      });
    });

    it('sets description to undefined when empty', async () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );

      const descInput = screen.getByLabelText(/Description/);
      fireEvent.change(descInput, { target: { value: '' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateWorkflow).toHaveBeenCalledWith(
          expect.objectContaining({
            description: undefined,
          })
        );
      });
    });
  });

  describe('error handling', () => {
    it('shows error when update returns null', async () => {
      mockUpdateWorkflow.mockResolvedValue(null);

      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to update workflow')).toBeTruthy();
      });
    });

    it('shows error message from exception', async () => {
      mockUpdateWorkflow.mockRejectedValue(new Error('Network error'));

      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeTruthy();
      });
    });

    it('shows generic error for non-Error exceptions', async () => {
      mockUpdateWorkflow.mockRejectedValue('Unknown error');

      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to update workflow')).toBeTruthy();
      });
    });
  });

  describe('close behavior', () => {
    it('resets form when cancelled', () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );

      const nameInput = screen.getByLabelText(/Name/) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Changed Name' } });
      expect(nameInput.value).toBe('Changed Name');

      fireEvent.click(screen.getByText('Cancel'));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not close when saving', async () => {
      let resolveSave: (value: { id: number }) => void;
      mockUpdateWorkflow.mockReturnValue(
        new Promise((resolve) => {
          resolveSave = resolve;
        })
      );

      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeTruthy();
      });

      // Try to close while saving
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // onClose should not be called because isSaving is true
      expect(mockOnClose).not.toHaveBeenCalled();

      resolveSave!({ id: 1 });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('disables inputs while saving', async () => {
      let resolveSave: (value: { id: number }) => void;
      mockUpdateWorkflow.mockReturnValue(
        new Promise((resolve) => {
          resolveSave = resolve;
        })
      );

      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Name/) as HTMLInputElement;
        expect(nameInput.disabled).toBe(true);

        const descInput = screen.getByLabelText(/Description/) as HTMLTextAreaElement;
        expect(descInput.disabled).toBe(true);

        const statusSelect = screen.getByLabelText(/Status/) as HTMLSelectElement;
        expect(statusSelect.disabled).toBe(true);

        const checkbox = screen.getByLabelText(/Auto-create task/) as HTMLInputElement;
        expect(checkbox.disabled).toBe(true);
      });

      resolveSave!({ id: 1 });
    });
  });

  describe('workflow prop changes', () => {
    it('updates form when workflow prop changes', () => {
      const workflow1 = createMockWorkflow({ name: 'Workflow 1' });
      const workflow2 = createMockWorkflow({ id: 2, name: 'Workflow 2' });

      const { rerender } = render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={workflow1 as any}
        />
      );

      expect(screen.getByDisplayValue('Workflow 1')).toBeTruthy();

      rerender(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={workflow2 as any}
        />
      );

      expect(screen.getByDisplayValue('Workflow 2')).toBeTruthy();
    });

    it('updates status when workflow prop changes', () => {
      const workflow1 = createMockWorkflow({ status: 'draft' as const });
      const workflow2 = createMockWorkflow({ status: 'active' as const });

      const { rerender } = render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={workflow1 as any}
        />
      );

      let select = screen.getByLabelText(/Status/) as HTMLSelectElement;
      expect(select.value).toBe('draft');

      rerender(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={workflow2 as any}
        />
      );

      select = screen.getByLabelText(/Status/) as HTMLSelectElement;
      expect(select.value).toBe('active');
    });
  });

  describe('status options', () => {
    it('renders all status options', () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );

      expect(screen.getByRole('option', { name: 'Draft' })).toBeTruthy();
      expect(screen.getByRole('option', { name: 'Active' })).toBeTruthy();
      expect(screen.getByRole('option', { name: 'Paused' })).toBeTruthy();
    });

    it('allows selecting paused status', () => {
      render(
        <WorkflowSettingsModal
          isOpen={true}
          onClose={mockOnClose}
          workflow={createMockWorkflow() as any}
        />
      );

      const select = screen.getByLabelText(/Status/) as HTMLSelectElement;
      fireEvent.change(select, { target: { value: 'paused' } });
      expect(select.value).toBe('paused');
    });
  });
});
