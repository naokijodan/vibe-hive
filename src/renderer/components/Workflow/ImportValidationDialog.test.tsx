// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ImportValidationDialog } from './ImportValidationDialog';

describe('ImportValidationDialog', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <ImportValidationDialog isOpen={false} result={null} onClose={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows success message', () => {
    const result = { success: true, errors: [], warnings: [] } as any;
    render(<ImportValidationDialog isOpen={true} result={result} onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByText('Import Successful')).toBeDefined();
  });

  it('shows failure message', () => {
    const result = { success: false, errors: ['Bad format'], warnings: [] } as any;
    render(<ImportValidationDialog isOpen={true} result={result} onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByText('Import Failed')).toBeDefined();
  });

  it('shows error message content', () => {
    const result = { success: false, errors: ['Bad format'], warnings: [] } as any;
    render(<ImportValidationDialog isOpen={true} result={result} onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByText('Bad format')).toBeDefined();
  });

  it('shows warnings when present', () => {
    const result = { success: true, errors: [], warnings: ['Missing optional field'] } as any;
    render(<ImportValidationDialog isOpen={true} result={result} onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByText('Missing optional field')).toBeDefined();
  });

  it('shows confirm button on success', () => {
    const result = { success: true, errors: [], warnings: [] } as any;
    render(<ImportValidationDialog isOpen={true} result={result} onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByText('OK')).toBeDefined();
  });

  it('shows close button', () => {
    const result = { success: false, errors: ['Error'], warnings: [] } as any;
    render(<ImportValidationDialog isOpen={true} result={result} onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByText('Close')).toBeDefined();
  });
});
