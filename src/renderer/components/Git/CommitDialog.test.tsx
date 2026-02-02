// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CommitDialog } from './CommitDialog';

describe('CommitDialog', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <CommitDialog isOpen={false} onClose={vi.fn()} onCommit={vi.fn()} stagedCount={0} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders dialog when open', () => {
    render(
      <CommitDialog isOpen={true} onClose={vi.fn()} onCommit={vi.fn()} stagedCount={3} />
    );
    expect(screen.getByText('Commit Changes')).toBeDefined();
    expect(screen.getByText('3 files staged')).toBeDefined();
    expect(screen.getByText('Commit')).toBeDefined();
    expect(screen.getByText('Cancel')).toBeDefined();
  });

  it('shows singular for 1 file', () => {
    render(
      <CommitDialog isOpen={true} onClose={vi.fn()} onCommit={vi.fn()} stagedCount={1} />
    );
    expect(screen.getByText('1 file staged')).toBeDefined();
  });
});
