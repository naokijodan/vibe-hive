// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SaveAsTemplateDialog } from './SaveAsTemplateDialog';

describe('SaveAsTemplateDialog', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <SaveAsTemplateDialog isOpen={false} onClose={vi.fn()} onSave={vi.fn()} currentWorkflow={{ nodes: [], edges: [] }} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders form when open', () => {
    render(
      <SaveAsTemplateDialog isOpen={true} onClose={vi.fn()} onSave={vi.fn()} currentWorkflow={{ nodes: [], edges: [] }} />
    );
    expect(screen.getAllByText(/Save|Template/i).length).toBeGreaterThan(0);
  });
});
