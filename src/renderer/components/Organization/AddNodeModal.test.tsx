// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AddNodeModal } from './AddNodeModal';

describe('AddNodeModal', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <AddNodeModal isOpen={false} onClose={vi.fn()} onAdd={vi.fn()} availableNodes={[]} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders form when open', () => {
    render(
      <AddNodeModal isOpen={true} onClose={vi.fn()} onAdd={vi.fn()} availableNodes={[]} />
    );
    expect(screen.getByText('新しいノードを追加')).toBeDefined();
  });

  it('renders template preset buttons', () => {
    render(
      <AddNodeModal isOpen={true} onClose={vi.fn()} onAdd={vi.fn()} availableNodes={[]} />
    );
    expect(screen.getByText(/Manager/)).toBeDefined();
    expect(screen.getByText(/Coder/)).toBeDefined();
    expect(screen.getByText(/Reviewer/)).toBeDefined();
  });
});
