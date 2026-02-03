// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    expect(screen.getByText(/Researcher/)).toBeDefined();
    expect(screen.getByText(/Designer/)).toBeDefined();
  });

  it('renders name input field', () => {
    render(
      <AddNodeModal isOpen={true} onClose={vi.fn()} onAdd={vi.fn()} availableNodes={[]} />
    );
    expect(screen.getByPlaceholderText('開発チーム、バックエンドエンジニアなど...')).toBeDefined();
    expect(screen.getByText('名前 *')).toBeDefined();
  });

  it('renders type selection', () => {
    render(
      <AddNodeModal isOpen={true} onClose={vi.fn()} onAdd={vi.fn()} availableNodes={[]} />
    );
    expect(screen.getByText('タイプ *')).toBeDefined();
    expect(screen.getAllByText(/チーム/).length).toBeGreaterThan(0);
  });

  it('calls onClose when backdrop clicked', () => {
    const onClose = vi.fn();
    render(
      <AddNodeModal isOpen={true} onClose={onClose} onAdd={vi.fn()} availableNodes={[]} />
    );
    // Click the backdrop (first div with fixed class)
    const backdrop = document.querySelector('.fixed.inset-0');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('applies template when preset clicked', () => {
    render(
      <AddNodeModal isOpen={true} onClose={vi.fn()} onAdd={vi.fn()} availableNodes={[]} />
    );
    fireEvent.click(screen.getByText(/Coder/));
    // After clicking Coder preset, system prompt should be updated
    // We can check the textarea has content
    const textarea = document.querySelector('textarea');
    expect(textarea?.value).toContain('コード');
  });

  it('calls onAdd when form submitted with name', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <AddNodeModal isOpen={true} onClose={onClose} onAdd={onAdd} availableNodes={[]} />
    );
    const input = screen.getByPlaceholderText('開発チーム、バックエンドエンジニアなど...');
    fireEvent.change(input, { target: { value: 'Backend Team' } });

    const form = document.querySelector('form');
    if (form) {
      fireEvent.submit(form);
      await waitFor(() => {
        expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
          name: 'Backend Team',
          type: 'team',
        }));
      });
    }
  });

  it('closes after successful submit', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <AddNodeModal isOpen={true} onClose={onClose} onAdd={onAdd} availableNodes={[]} />
    );
    const input = screen.getByPlaceholderText('開発チーム、バックエンドエンジニアなど...');
    fireEvent.change(input, { target: { value: 'My Team' } });

    const form = document.querySelector('form');
    if (form) {
      fireEvent.submit(form);
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    }
  });
});
