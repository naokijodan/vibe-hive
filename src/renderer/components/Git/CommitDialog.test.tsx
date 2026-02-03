// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  it('renders commit message textarea', () => {
    render(
      <CommitDialog isOpen={true} onClose={vi.fn()} onCommit={vi.fn()} stagedCount={2} />
    );
    expect(screen.getByPlaceholderText('Commit message (required)')).toBeDefined();
  });

  it('renders commit tips', () => {
    render(
      <CommitDialog isOpen={true} onClose={vi.fn()} onCommit={vi.fn()} stagedCount={2} />
    );
    expect(screen.getByText('Commit message tips:')).toBeDefined();
  });

  it('commit button is disabled when message is empty', () => {
    render(
      <CommitDialog isOpen={true} onClose={vi.fn()} onCommit={vi.fn()} stagedCount={2} />
    );
    const commitBtn = screen.getByText('Commit');
    expect(commitBtn).toHaveProperty('disabled', true);
  });

  it('commit button is enabled when message is provided', () => {
    render(
      <CommitDialog isOpen={true} onClose={vi.fn()} onCommit={vi.fn()} stagedCount={2} />
    );
    const textarea = screen.getByPlaceholderText('Commit message (required)');
    fireEvent.change(textarea, { target: { value: 'feat: add feature' } });
    const commitBtn = screen.getByText('Commit');
    expect(commitBtn).toHaveProperty('disabled', false);
  });

  it('calls onClose when Cancel clicked', () => {
    const onClose = vi.fn();
    render(
      <CommitDialog isOpen={true} onClose={onClose} onCommit={vi.fn()} stagedCount={2} />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when X clicked', () => {
    const onClose = vi.fn();
    render(
      <CommitDialog isOpen={true} onClose={onClose} onCommit={vi.fn()} stagedCount={2} />
    );
    fireEvent.click(screen.getByText('✕'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onCommit when form submitted with message', async () => {
    const onCommit = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();
    render(
      <CommitDialog isOpen={true} onClose={onClose} onCommit={onCommit} stagedCount={2} />
    );
    const textarea = screen.getByPlaceholderText('Commit message (required)');
    fireEvent.change(textarea, { target: { value: 'feat: new feature' } });
    fireEvent.click(screen.getByText('Commit'));
    await waitFor(() => {
      expect(onCommit).toHaveBeenCalledWith('feat: new feature');
    });
  });

  it('closes dialog after successful commit', async () => {
    const onCommit = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();
    render(
      <CommitDialog isOpen={true} onClose={onClose} onCommit={onCommit} stagedCount={2} />
    );
    const textarea = screen.getByPlaceholderText('Commit message (required)');
    fireEvent.change(textarea, { target: { value: 'fix: bug' } });
    fireEvent.click(screen.getByText('Commit'));
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('does not close dialog if commit fails', async () => {
    const onCommit = vi.fn().mockResolvedValue(false);
    const onClose = vi.fn();
    render(
      <CommitDialog isOpen={true} onClose={onClose} onCommit={onCommit} stagedCount={2} />
    );
    const textarea = screen.getByPlaceholderText('Commit message (required)');
    fireEvent.change(textarea, { target: { value: 'fix: bug' } });
    fireEvent.click(screen.getByText('Commit'));
    await waitFor(() => {
      expect(onCommit).toHaveBeenCalled();
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
