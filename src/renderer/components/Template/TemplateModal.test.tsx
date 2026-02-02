// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TemplateModal } from './TemplateModal';

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

describe('TemplateModal', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <TemplateModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn()} mode="create" />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders create form when open', () => {
    render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} mode="create" />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
