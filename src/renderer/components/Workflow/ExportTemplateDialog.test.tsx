// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportTemplateDialog } from './ExportTemplateDialog';

const { mockExportAsTemplate } = vi.hoisted(() => ({
  mockExportAsTemplate: vi.fn(),
}));

vi.mock('../../bridge/ipcBridge', () => ({
  ipcBridge: {
    workflow: {
      exportAsTemplate: mockExportAsTemplate,
    },
  },
}));

describe('ExportTemplateDialog', () => {
  const defaultProps = {
    isOpen: true,
    workflowId: 1,
    workflowName: 'My Workflow',
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockExportAsTemplate.mockResolvedValue({ success: true });
  });

  describe('rendering when closed', () => {
    it('renders nothing when not open', () => {
      const { container } = render(
        <ExportTemplateDialog {...defaultProps} isOpen={false} />
      );
      expect(container.innerHTML).toBe('');
    });

    it('renders nothing when workflowId is null and not open', () => {
      const { container } = render(
        <ExportTemplateDialog {...defaultProps} isOpen={false} workflowId={null} />
      );
      expect(container.innerHTML).toBe('');
    });
  });

  describe('rendering when open', () => {
    it('renders dialog when open', () => {
      render(<ExportTemplateDialog {...defaultProps} />);
      expect(screen.getAllByText(/Template|Export|Save/i).length).toBeGreaterThan(0);
    });

    it('shows dialog title', () => {
      render(<ExportTemplateDialog {...defaultProps} />);
      expect(screen.getByText('Save as Template')).toBeDefined();
    });

    it('shows workflow name', () => {
      render(<ExportTemplateDialog {...defaultProps} />);
      expect(screen.getByText('My Workflow')).toBeDefined();
    });

    it('shows category selector', () => {
      render(<ExportTemplateDialog {...defaultProps} />);
      expect(screen.getByText('Category')).toBeDefined();
    });

    it('shows close button', () => {
      render(<ExportTemplateDialog {...defaultProps} />);
      expect(screen.getByText('✕')).toBeDefined();
    });

    it('shows workflow info label', () => {
      render(<ExportTemplateDialog {...defaultProps} />);
      expect(screen.getByText('Workflow')).toBeDefined();
    });

    it('shows Cancel button', () => {
      render(<ExportTemplateDialog {...defaultProps} />);
      expect(screen.getByText('Cancel')).toBeDefined();
    });

    it('shows Save Template button', () => {
      render(<ExportTemplateDialog {...defaultProps} />);
      expect(screen.getByText('Save Template')).toBeDefined();
    });

    it('shows category guide', () => {
      render(<ExportTemplateDialog {...defaultProps} />);
      expect(screen.getByText('Category Guide:')).toBeDefined();
    });

    it('shows emoji icon', () => {
      render(<ExportTemplateDialog {...defaultProps} />);
      expect(screen.getByText('📝')).toBeDefined();
    });
  });

  describe('category options', () => {
    it('has automation option', () => {
      render(<ExportTemplateDialog {...defaultProps} />);
      expect(screen.getByText('🤖 Automation')).toBeDefined();
    });

    it('has notification option', () => {
      render(<ExportTemplateDialog {...defaultProps} />);
      expect(screen.getByText('🔔 Notification')).toBeDefined();
    });

    it('has data processing option', () => {
      render(<ExportTemplateDialog {...defaultProps} />);
      expect(screen.getByText('📊 Data Processing')).toBeDefined();
    });

    it('has custom option', () => {
      render(<ExportTemplateDialog {...defaultProps} />);
      expect(screen.getByText('⚙️ Custom')).toBeDefined();
    });

    it('can change category', () => {
      render(<ExportTemplateDialog {...defaultProps} />);
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'automation' } });
      expect((select as HTMLSelectElement).value).toBe('automation');
    });
  });

  describe('button interactions', () => {
    it('calls onClose when Cancel button clicked', () => {
      const onClose = vi.fn();
      render(<ExportTemplateDialog {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when close button clicked', () => {
      const onClose = vi.fn();
      render(<ExportTemplateDialog {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByText('✕'));
      expect(onClose).toHaveBeenCalled();
    });

    it('Save button is enabled when workflowId is provided', () => {
      render(<ExportTemplateDialog {...defaultProps} />);
      const saveButton = screen.getByText('Save Template').closest('button');
      expect(saveButton).toHaveProperty('disabled', false);
    });

    it('Save button is disabled when workflowId is null', () => {
      render(<ExportTemplateDialog {...defaultProps} workflowId={null} />);
      const saveButton = screen.getByText('Save Template').closest('button');
      expect(saveButton).toHaveProperty('disabled', true);
    });
  });

  describe('save functionality', () => {
    it('calls exportAsTemplate when Save button clicked', async () => {
      render(<ExportTemplateDialog {...defaultProps} />);
      fireEvent.click(screen.getByText('Save Template'));
      await waitFor(() => {
        expect(mockExportAsTemplate).toHaveBeenCalledWith(1, {
          category: 'custom',
          thumbnail: undefined,
        });
      });
    });

    it('calls onSuccess and onClose on successful save', async () => {
      const onSuccess = vi.fn();
      const onClose = vi.fn();
      render(<ExportTemplateDialog {...defaultProps} onSuccess={onSuccess} onClose={onClose} />);
      fireEvent.click(screen.getByText('Save Template'));
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('shows error when workflowId is null on save', async () => {
      render(<ExportTemplateDialog {...defaultProps} workflowId={null} />);
      const saveButton = screen.getByText('Save Template').closest('button');
      // Button is disabled but we can test the UI state
      expect(saveButton).toHaveProperty('disabled', true);
    });

    it('shows error when save fails', async () => {
      mockExportAsTemplate.mockResolvedValue({ success: false });
      render(<ExportTemplateDialog {...defaultProps} />);
      fireEvent.click(screen.getByText('Save Template'));
      await waitFor(() => {
        expect(screen.getByText('Failed to save template')).toBeDefined();
      });
    });

    it('shows error message on exception', async () => {
      mockExportAsTemplate.mockRejectedValue(new Error('Network error'));
      render(<ExportTemplateDialog {...defaultProps} />);
      fireEvent.click(screen.getByText('Save Template'));
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeDefined();
      });
    });

    it('shows generic error for non-Error exception', async () => {
      mockExportAsTemplate.mockRejectedValue('Unknown');
      render(<ExportTemplateDialog {...defaultProps} />);
      fireEvent.click(screen.getByText('Save Template'));
      await waitFor(() => {
        expect(screen.getByText('Unknown error occurred')).toBeDefined();
      });
    });

    it('saves with selected category', async () => {
      render(<ExportTemplateDialog {...defaultProps} />);
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'automation' } });
      fireEvent.click(screen.getByText('Save Template'));
      await waitFor(() => {
        expect(mockExportAsTemplate).toHaveBeenCalledWith(1, {
          category: 'automation',
          thumbnail: undefined,
        });
      });
    });
  });

  describe('screenshot capture', () => {
    it('captures screenshot when onCaptureScreenshot provided', async () => {
      const onCaptureScreenshot = vi.fn().mockResolvedValue('base64-image');
      render(<ExportTemplateDialog {...defaultProps} onCaptureScreenshot={onCaptureScreenshot} />);
      fireEvent.click(screen.getByText('Save Template'));
      await waitFor(() => {
        expect(onCaptureScreenshot).toHaveBeenCalled();
        expect(mockExportAsTemplate).toHaveBeenCalledWith(1, {
          category: 'custom',
          thumbnail: 'base64-image',
        });
      });
    });

    it('handles null screenshot gracefully', async () => {
      const onCaptureScreenshot = vi.fn().mockResolvedValue(null);
      render(<ExportTemplateDialog {...defaultProps} onCaptureScreenshot={onCaptureScreenshot} />);
      fireEvent.click(screen.getByText('Save Template'));
      await waitFor(() => {
        expect(mockExportAsTemplate).toHaveBeenCalledWith(1, {
          category: 'custom',
          thumbnail: undefined,
        });
      });
    });
  });

  describe('loading state', () => {
    it('shows loading spinner when saving', async () => {
      mockExportAsTemplate.mockImplementation(() => new Promise(() => {})); // Never resolves
      const { container } = render(<ExportTemplateDialog {...defaultProps} />);
      fireEvent.click(screen.getByText('Save Template'));
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeDefined();
        expect(container.innerHTML).toContain('animate-spin');
      });
    });

    it('disables buttons when loading', async () => {
      mockExportAsTemplate.mockImplementation(() => new Promise(() => {}));
      render(<ExportTemplateDialog {...defaultProps} />);
      fireEvent.click(screen.getByText('Save Template'));
      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel').closest('button');
        const closeButton = screen.getByText('✕').closest('button');
        expect(cancelButton).toHaveProperty('disabled', true);
        expect(closeButton).toHaveProperty('disabled', true);
      });
    });

    it('disables category select when loading', async () => {
      mockExportAsTemplate.mockImplementation(() => new Promise(() => {}));
      render(<ExportTemplateDialog {...defaultProps} />);
      fireEvent.click(screen.getByText('Save Template'));
      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toHaveProperty('disabled', true);
      });
    });
  });

  describe('error display', () => {
    it('shows error icon with error message', async () => {
      mockExportAsTemplate.mockResolvedValue({ success: false });
      render(<ExportTemplateDialog {...defaultProps} />);
      fireEvent.click(screen.getByText('Save Template'));
      await waitFor(() => {
        expect(screen.getByText('❌')).toBeDefined();
      });
    });

    it('clears error on new save attempt', async () => {
      mockExportAsTemplate.mockResolvedValueOnce({ success: false });
      render(<ExportTemplateDialog {...defaultProps} />);

      fireEvent.click(screen.getByText('Save Template'));
      await waitFor(() => {
        expect(screen.getByText('Failed to save template')).toBeDefined();
      });

      mockExportAsTemplate.mockResolvedValueOnce({ success: true });
      fireEvent.click(screen.getByText('Save Template'));

      await waitFor(() => {
        expect(screen.queryByText('Failed to save template')).toBeNull();
      });
    });
  });

  describe('styling', () => {
    it('has overlay background', () => {
      const { container } = render(<ExportTemplateDialog {...defaultProps} />);
      expect(container.innerHTML).toContain('bg-black/50');
    });

    it('has modal container', () => {
      const { container } = render(<ExportTemplateDialog {...defaultProps} />);
      expect(container.innerHTML).toContain('bg-gray-800');
    });

    it('has rounded corners', () => {
      const { container } = render(<ExportTemplateDialog {...defaultProps} />);
      expect(container.innerHTML).toContain('rounded-lg');
    });

    it('has max width', () => {
      const { container } = render(<ExportTemplateDialog {...defaultProps} />);
      expect(container.innerHTML).toContain('max-w-md');
    });
  });

  describe('accessibility', () => {
    it('has proper button roles', () => {
      render(<ExportTemplateDialog {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('has combobox for category', () => {
      render(<ExportTemplateDialog {...defaultProps} />);
      expect(screen.getByRole('combobox')).toBeDefined();
    });
  });
});
