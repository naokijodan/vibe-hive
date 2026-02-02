// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandPalette, Command } from './CommandPalette';

// jsdom doesn't have scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

const makeCommands = (): Command[] => [
  { id: 'c1', label: 'タスクボード', description: 'カンバン表示', category: 'ビュー', action: vi.fn(), keywords: ['kanban'] },
  { id: 'c2', label: '分析', description: '統計を表示', category: 'ビュー', action: vi.fn(), keywords: ['analytics'] },
  { id: 'c3', label: 'Git Push', description: 'リモートにプッシュ', category: 'Git', action: vi.fn(), keywords: ['push'] },
];

describe('CommandPalette', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not open', () => {
    const { container } = render(<CommandPalette isOpen={false} onClose={onClose} commands={makeCommands()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders commands grouped by category when open', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} commands={makeCommands()} />);
    expect(screen.getByText('タスクボード')).toBeDefined();
    expect(screen.getByText('Git Push')).toBeDefined();
    expect(screen.getByPlaceholderText('コマンドを検索...')).toBeDefined();
  });

  it('filters commands by search query', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} commands={makeCommands()} />);
    const input = screen.getByPlaceholderText('コマンドを検索...');
    fireEvent.change(input, { target: { value: 'push' } });
    expect(screen.getByText('Git Push')).toBeDefined();
    expect(screen.queryByText('タスクボード')).toBeNull();
  });

  it('shows no-results message when no commands match', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} commands={makeCommands()} />);
    const input = screen.getByPlaceholderText('コマンドを検索...');
    fireEvent.change(input, { target: { value: 'zzzzzzz' } });
    expect(screen.getByText('コマンドが見つかりません')).toBeDefined();
  });

  it('executes command and closes on click', () => {
    const cmds = makeCommands();
    render(<CommandPalette isOpen={true} onClose={onClose} commands={cmds} />);
    fireEvent.click(screen.getByText('タスクボード'));
    expect(cmds[0].action).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on backdrop click', () => {
    const { container } = render(<CommandPalette isOpen={true} onClose={onClose} commands={makeCommands()} />);
    const backdrop = container.querySelector('.fixed.inset-0');
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalled();
  });

  it('does not close when clicking inside the palette', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} commands={makeCommands()} />);
    const input = screen.getByPlaceholderText('コマンドを検索...');
    fireEvent.click(input);
    // onClose should not be called for inner clicks (only backdrop)
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows command count', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} commands={makeCommands()} />);
    expect(screen.getByText('3 / 3')).toBeDefined();
  });

  it('shows filtered count after search', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} commands={makeCommands()} />);
    fireEvent.change(screen.getByPlaceholderText('コマンドを検索...'), { target: { value: 'Git' } });
    expect(screen.getByText('1 / 3')).toBeDefined();
  });
});
