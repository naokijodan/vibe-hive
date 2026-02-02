// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GitStatusView } from './GitStatusView';

const defaultProps = {
  branch: 'main',
  ahead: 0,
  behind: 0,
  staged: [] as string[],
  modified: [] as string[],
  untracked: [] as string[],
  selectedFiles: new Set<string>(),
  onToggleFile: vi.fn(),
  onStageSelected: vi.fn(),
  onUnstageSelected: vi.fn(),
};

describe('GitStatusView', () => {
  it('shows branch name', () => {
    render(<GitStatusView {...defaultProps} />);
    expect(screen.getByText(/Branch: main/)).toBeDefined();
  });

  it('shows clean working directory', () => {
    render(<GitStatusView {...defaultProps} />);
    expect(screen.getByText('Working directory clean')).toBeDefined();
  });

  it('shows ahead/behind indicators', () => {
    render(<GitStatusView {...defaultProps} ahead={2} behind={1} />);
    expect(screen.getByText(/↑2/)).toBeDefined();
    expect(screen.getByText(/↓1/)).toBeDefined();
  });

  it('shows staged files', () => {
    render(<GitStatusView {...defaultProps} staged={['file1.ts']} />);
    expect(screen.getByText('file1.ts')).toBeDefined();
    expect(screen.getByText(/Staged/)).toBeDefined();
  });

  it('shows modified files', () => {
    render(<GitStatusView {...defaultProps} modified={['app.ts']} />);
    expect(screen.getByText('app.ts')).toBeDefined();
    expect(screen.getByText(/Changes/)).toBeDefined();
  });

  it('shows untracked files', () => {
    render(<GitStatusView {...defaultProps} untracked={['new.ts']} />);
    expect(screen.getByText('new.ts')).toBeDefined();
  });

  it('calls onToggleFile on checkbox click', () => {
    const onToggle = vi.fn();
    render(<GitStatusView {...defaultProps} modified={['test.ts']} onToggleFile={onToggle} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledWith('test.ts');
  });

  it('calls onStageSelected', () => {
    const onStage = vi.fn();
    render(<GitStatusView {...defaultProps} modified={['test.ts']} selectedFiles={new Set(['test.ts'])} onStageSelected={onStage} />);
    fireEvent.click(screen.getByText('Stage Selected'));
    expect(onStage).toHaveBeenCalled();
  });
});
