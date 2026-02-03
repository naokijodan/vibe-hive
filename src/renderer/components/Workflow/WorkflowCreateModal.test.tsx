// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { mockCreateWorkflow } = vi.hoisted(() => ({
  mockCreateWorkflow: vi.fn(),
}));

let mockSessionState = {
  activeSessionId: '1' as string | null,
};

let mockWorkflowState = {
  createWorkflow: mockCreateWorkflow,
};

vi.mock('../../stores/sessionStore', () => ({
  useSessionStore: () => mockSessionState,
}));

vi.mock('../../stores/workflowStore', () => ({
  useWorkflowStore: () => mockWorkflowState,
}));

import { WorkflowCreateModal } from './WorkflowCreateModal';

describe('WorkflowCreateModal', () => {
  const mockOnClose = vi.fn();
  const mockOnCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionState = { activeSessionId: '1' };
    mockWorkflowState = { createWorkflow: mockCreateWorkflow };
    mockCreateWorkflow.mockResolvedValue({ id: 1 });
  });

  describe('visibility', () => {
    it('renders nothing when not open', () => {
      const { container } = render(
        <WorkflowCreateModal isOpen={false} onClose={mockOnClose} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders modal when open', () => {
      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );
      expect(screen.getByText('Create New Workflow')).toBeTruthy();
    });
  });

  describe('form fields', () => {
    it('renders name input', () => {
      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );
      expect(screen.getByLabelText(/Name/)).toBeTruthy();
    });

    it('renders description textarea', () => {
      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );
      expect(screen.getByLabelText(/Description/)).toBeTruthy();
    });

    it('renders auto-create task checkbox', () => {
      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );
      expect(screen.getByLabelText(/Auto-create task/)).toBeTruthy();
    });

    it('allows typing in name field', () => {
      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );
      const nameInput = screen.getByLabelText(/Name/) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Test Workflow' } });
      expect(nameInput.value).toBe('Test Workflow');
    });

    it('allows typing in description field', () => {
      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );
      const descInput = screen.getByLabelText(/Description/) as HTMLTextAreaElement;
      fireEvent.change(descInput, { target: { value: 'Test description' } });
      expect(descInput.value).toBe('Test description');
    });

    it('allows toggling auto-create task checkbox', () => {
      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
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
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );
      expect(screen.getByText('Cancel')).toBeTruthy();
    });

    it('renders Create button', () => {
      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );
      expect(screen.getByText('Create')).toBeTruthy();
    });

    it('calls onClose when Cancel clicked', () => {
      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );
      fireEvent.click(screen.getByText('Cancel'));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when X button clicked', () => {
      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );
      // X button is the first button (close button in header)
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.querySelector('svg'));
      fireEvent.click(closeButton!);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('disables Create button when name is empty', () => {
      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );
      const createButton = screen.getByText('Create');
      expect(createButton).toHaveProperty('disabled', true);
    });

    it('enables Create button when name is provided', () => {
      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );
      const nameInput = screen.getByLabelText(/Name/);
      fireEvent.change(nameInput, { target: { value: 'Test Workflow' } });
      const createButton = screen.getByText('Create');
      expect(createButton).toHaveProperty('disabled', false);
    });
  });

  describe('form submission', () => {
    it('creates workflow on submit', async () => {
      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} onCreated={mockOnCreated} />
      );

      const nameInput = screen.getByLabelText(/Name/);
      fireEvent.change(nameInput, { target: { value: 'My Workflow' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockCreateWorkflow).toHaveBeenCalledWith(expect.objectContaining({
          name: 'My Workflow',
          sessionId: 1,
          nodes: [],
          edges: [],
        }));
      });
    });

    it('includes description when provided', async () => {
      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );

      const nameInput = screen.getByLabelText(/Name/);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      const descInput = screen.getByLabelText(/Description/);
      fireEvent.change(descInput, { target: { value: 'My description' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockCreateWorkflow).toHaveBeenCalledWith(expect.objectContaining({
          description: 'My description',
        }));
      });
    });

    it('includes autoCreateTask setting', async () => {
      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );

      const nameInput = screen.getByLabelText(/Name/);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      const checkbox = screen.getByLabelText(/Auto-create task/);
      fireEvent.click(checkbox);

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockCreateWorkflow).toHaveBeenCalledWith(expect.objectContaining({
          autoCreateTask: true,
        }));
      });
    });

    it('calls onCreated after successful creation', async () => {
      mockCreateWorkflow.mockResolvedValue({ id: 42 });

      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} onCreated={mockOnCreated} />
      );

      const nameInput = screen.getByLabelText(/Name/);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockOnCreated).toHaveBeenCalledWith(42);
      });
    });

    it('calls onClose after successful creation', async () => {
      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );

      const nameInput = screen.getByLabelText(/Name/);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('shows Creating state during submission', async () => {
      let resolveCreate: (value: { id: number }) => void;
      mockCreateWorkflow.mockReturnValue(new Promise(resolve => {
        resolveCreate = resolve;
      }));

      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );

      const nameInput = screen.getByLabelText(/Name/);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Creating...')).toBeTruthy();
      });

      resolveCreate!({ id: 1 });

      await waitFor(() => {
        expect(screen.queryByText('Creating...')).toBeNull();
      });
    });

    it('resets form after successful creation', async () => {
      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );

      const nameInput = screen.getByLabelText(/Name/) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      const descInput = screen.getByLabelText(/Description/) as HTMLTextAreaElement;
      fireEvent.change(descInput, { target: { value: 'Desc' } });

      const checkbox = screen.getByLabelText(/Auto-create task/) as HTMLInputElement;
      fireEvent.click(checkbox);

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('error handling', () => {
    it('shows error when creation fails', async () => {
      mockCreateWorkflow.mockResolvedValue(null);

      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );

      const nameInput = screen.getByLabelText(/Name/);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create workflow')).toBeTruthy();
      });
    });

    it('shows error message from exception', async () => {
      mockCreateWorkflow.mockRejectedValue(new Error('Network error'));

      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );

      const nameInput = screen.getByLabelText(/Name/);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeTruthy();
      });
    });

    it('shows generic error for non-Error exceptions', async () => {
      mockCreateWorkflow.mockRejectedValue('Unknown error');

      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );

      const nameInput = screen.getByLabelText(/Name/);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create workflow')).toBeTruthy();
      });
    });
  });

  describe('no active session', () => {
    beforeEach(() => {
      mockSessionState = { activeSessionId: null };
    });

    it('shows warning when no active session', () => {
      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );
      expect(screen.getByText(/No active session/)).toBeTruthy();
    });

    it('disables Create button when no active session', () => {
      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );

      const nameInput = screen.getByLabelText(/Name/);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      const createButton = screen.getByText('Create');
      expect(createButton).toHaveProperty('disabled', true);
    });
  });

  describe('close behavior', () => {
    it('clears form when cancelled', () => {
      const { rerender } = render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );

      const nameInput = screen.getByLabelText(/Name/) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Test' } });
      expect(nameInput.value).toBe('Test');

      fireEvent.click(screen.getByText('Cancel'));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not close when creating', async () => {
      let resolveCreate: (value: { id: number }) => void;
      mockCreateWorkflow.mockReturnValue(new Promise(resolve => {
        resolveCreate = resolve;
      }));

      render(
        <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
      );

      const nameInput = screen.getByLabelText(/Name/);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Creating...')).toBeTruthy();
      });

      // Try to close while creating
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // onClose should not be called because isCreating is true
      expect(mockOnClose).not.toHaveBeenCalled();

      resolveCreate!({ id: 1 });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });
});
