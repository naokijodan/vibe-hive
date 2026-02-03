// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ExportTemplateDialog } from './ExportTemplateDialog';

vi.mock('../../bridge/ipcBridge', () => ({
  ipcBridge: {
    workflowTemplate: {
      saveAsTemplate: vi.fn(),
    },
  },
}));

describe('ExportTemplateDialog', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <ExportTemplateDialog isOpen={false} workflowId={null} workflowName="" onClose={vi.fn()} onSuccess={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders dialog when open', () => {
    render(
      <ExportTemplateDialog isOpen={true} workflowId={1} workflowName="My WF" onClose={vi.fn()} onSuccess={vi.fn()} />
    );
    expect(screen.getAllByText(/Template|Export|Save/i).length).toBeGreaterThan(0);
  });

  it('shows dialog title', () => {
    render(
      <ExportTemplateDialog isOpen={true} workflowId={1} workflowName="My WF" onClose={vi.fn()} onSuccess={vi.fn()} />
    );
    expect(screen.getByText('Save as Template')).toBeDefined();
  });

  it('shows workflow name', () => {
    render(
      <ExportTemplateDialog isOpen={true} workflowId={1} workflowName="My WF" onClose={vi.fn()} onSuccess={vi.fn()} />
    );
    expect(screen.getByText('My WF')).toBeDefined();
  });

  it('shows category selector', () => {
    render(
      <ExportTemplateDialog isOpen={true} workflowId={1} workflowName="My WF" onClose={vi.fn()} onSuccess={vi.fn()} />
    );
    expect(screen.getByText('Category')).toBeDefined();
  });

  it('shows close button', () => {
    render(
      <ExportTemplateDialog isOpen={true} workflowId={1} workflowName="My WF" onClose={vi.fn()} onSuccess={vi.fn()} />
    );
    expect(screen.getByText('✕')).toBeDefined();
  });

  it('shows workflow info label', () => {
    render(
      <ExportTemplateDialog isOpen={true} workflowId={1} workflowName="My WF" onClose={vi.fn()} onSuccess={vi.fn()} />
    );
    expect(screen.getByText('Workflow')).toBeDefined();
  });
});
