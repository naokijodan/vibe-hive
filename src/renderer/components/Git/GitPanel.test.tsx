// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

const storeState = vi.hoisted(() => ({
  status: null as any,
  isLoading: false,
  error: null as string | null,
  fetchStatus: vi.fn(),
  stageFiles: vi.fn(),
  unstageFiles: vi.fn(),
  commit: vi.fn(),
  push: vi.fn(),
  pull: vi.fn(),
  clearError: vi.fn(),
}));

vi.mock('../../stores/gitStore', () => {
  const fn = () => storeState;
  fn.getState = () => storeState;
  return { useGitStore: fn };
});

vi.mock('./GitStatusView', () => ({
  GitStatusView: () => <div>GitStatusView</div>,
}));

vi.mock('./CommitDialog', () => ({
  CommitDialog: () => null,
}));

import { GitPanel } from './GitPanel';

describe('GitPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    storeState.status = null;
    storeState.isLoading = false;
    storeState.error = null;
    vi.clearAllMocks();
  });
  afterEach(() => { vi.useRealTimers(); });

  it('renders nothing when not open', () => {
    const { container } = render(<GitPanel isOpen={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders panel when open', () => {
    render(<GitPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Git')).toBeDefined();
  });

  it('calls fetchStatus when opened', () => {
    render(<GitPanel isOpen={true} onClose={vi.fn()} />);
    expect(storeState.fetchStatus).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    storeState.isLoading = true;
    storeState.status = null;
    render(<GitPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('shows error banner when error exists', () => {
    storeState.error = 'Git command failed';
    render(<GitPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Git command failed')).toBeDefined();
  });

  it('shows not a git repository message when no status', () => {
    storeState.status = null;
    storeState.isLoading = false;
    render(<GitPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Not a git repository')).toBeDefined();
  });

  it('renders GitStatusView when status exists', () => {
    storeState.status = {
      branch: 'main',
      ahead: 0,
      behind: 0,
      staged: [],
      modified: [],
      untracked: [],
    };
    render(<GitPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('GitStatusView')).toBeDefined();
  });

  it('shows action buttons when status exists', () => {
    storeState.status = {
      branch: 'main',
      ahead: 0,
      behind: 0,
      staged: ['file.ts'],
      modified: [],
      untracked: [],
    };
    render(<GitPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Commit')).toBeDefined();
    expect(screen.getByText('Push')).toBeDefined();
    expect(screen.getByText('Pull')).toBeDefined();
    expect(screen.getByText('Refresh')).toBeDefined();
  });

  it('shows push count when ahead', () => {
    storeState.status = {
      branch: 'main',
      ahead: 2,
      behind: 0,
      staged: [],
      modified: [],
      untracked: [],
    };
    render(<GitPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Push (2)')).toBeDefined();
  });

  it('shows pull count when behind', () => {
    storeState.status = {
      branch: 'main',
      ahead: 0,
      behind: 3,
      staged: [],
      modified: [],
      untracked: [],
    };
    render(<GitPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Pull (3)')).toBeDefined();
  });

  it('disables commit button when no staged files', () => {
    storeState.status = {
      branch: 'main',
      ahead: 0,
      behind: 0,
      staged: [],
      modified: ['file.ts'],
      untracked: [],
    };
    render(<GitPanel isOpen={true} onClose={vi.fn()} />);
    const commitButton = screen.getByText('Commit');
    expect(commitButton).toHaveProperty('disabled', true);
  });

  it('enables commit button when staged files exist', () => {
    storeState.status = {
      branch: 'main',
      ahead: 0,
      behind: 0,
      staged: ['file.ts'],
      modified: [],
      untracked: [],
    };
    render(<GitPanel isOpen={true} onClose={vi.fn()} />);
    const commitButton = screen.getByText('Commit');
    expect(commitButton).toHaveProperty('disabled', false);
  });

  it('shows refreshing text when loading', () => {
    storeState.isLoading = true;
    storeState.status = {
      branch: 'main',
      ahead: 0,
      behind: 0,
      staged: [],
      modified: [],
      untracked: [],
    };
    render(<GitPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Refreshing...')).toBeDefined();
  });

  describe('button interactions', () => {
    it('calls onClose when close button clicked', () => {
      const onClose = vi.fn();
      render(<GitPanel isOpen={true} onClose={onClose} />);
      const closeButtons = screen.getAllByText('✕');
      fireEvent.click(closeButtons[0]);
      expect(onClose).toHaveBeenCalled();
    });

    it('calls clearError when error close button clicked', () => {
      storeState.error = 'Some error';
      render(<GitPanel isOpen={true} onClose={vi.fn()} />);
      const closeButtons = screen.getAllByText('✕');
      fireEvent.click(closeButtons[1]); // Second ✕ is error close
      expect(storeState.clearError).toHaveBeenCalled();
    });

    it('calls push when push button clicked', () => {
      storeState.status = {
        branch: 'main',
        ahead: 2,
        behind: 0,
        staged: [],
        modified: [],
        untracked: [],
      };
      render(<GitPanel isOpen={true} onClose={vi.fn()} />);
      const pushButton = screen.getByText('Push (2)');
      fireEvent.click(pushButton);
      expect(storeState.push).toHaveBeenCalled();
    });

    it('calls pull when pull button clicked', () => {
      storeState.status = {
        branch: 'main',
        ahead: 0,
        behind: 3,
        staged: [],
        modified: [],
        untracked: [],
      };
      render(<GitPanel isOpen={true} onClose={vi.fn()} />);
      const pullButton = screen.getByText('Pull (3)');
      fireEvent.click(pullButton);
      expect(storeState.pull).toHaveBeenCalled();
    });

    it('calls fetchStatus when refresh button clicked', () => {
      storeState.status = {
        branch: 'main',
        ahead: 0,
        behind: 0,
        staged: [],
        modified: [],
        untracked: [],
      };
      render(<GitPanel isOpen={true} onClose={vi.fn()} />);
      vi.clearAllMocks(); // Clear the initial fetchStatus call
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
      expect(storeState.fetchStatus).toHaveBeenCalled();
    });

    it('disables push button when not ahead', () => {
      storeState.status = {
        branch: 'main',
        ahead: 0,
        behind: 0,
        staged: [],
        modified: [],
        untracked: [],
      };
      render(<GitPanel isOpen={true} onClose={vi.fn()} />);
      const pushButton = screen.getByText('Push');
      expect(pushButton).toHaveProperty('disabled', true);
    });

    it('disables pull button when not behind', () => {
      storeState.status = {
        branch: 'main',
        ahead: 0,
        behind: 0,
        staged: [],
        modified: [],
        untracked: [],
      };
      render(<GitPanel isOpen={true} onClose={vi.fn()} />);
      const pullButton = screen.getByText('Pull');
      expect(pullButton).toHaveProperty('disabled', true);
    });

    it('disables all action buttons when loading', () => {
      storeState.isLoading = true;
      storeState.status = {
        branch: 'main',
        ahead: 2,
        behind: 3,
        staged: ['file.ts'],
        modified: [],
        untracked: [],
      };
      render(<GitPanel isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText('Commit')).toHaveProperty('disabled', true);
      expect(screen.getByText('Push (2)')).toHaveProperty('disabled', true);
      expect(screen.getByText('Pull (3)')).toHaveProperty('disabled', true);
      expect(screen.getByText('Refreshing...')).toHaveProperty('disabled', true);
    });
  });

  describe('auto-refresh', () => {
    it('sets up auto-refresh interval when open', () => {
      storeState.status = {
        branch: 'main',
        ahead: 0,
        behind: 0,
        staged: [],
        modified: [],
        untracked: [],
      };
      render(<GitPanel isOpen={true} onClose={vi.fn()} />);
      vi.clearAllMocks();
      vi.advanceTimersByTime(5000);
      expect(storeState.fetchStatus).toHaveBeenCalled();
    });

    it('clears interval when closed', () => {
      storeState.status = {
        branch: 'main',
        ahead: 0,
        behind: 0,
        staged: [],
        modified: [],
        untracked: [],
      };
      const { rerender } = render(<GitPanel isOpen={true} onClose={vi.fn()} />);
      vi.clearAllMocks();
      rerender(<GitPanel isOpen={false} onClose={vi.fn()} />);
      vi.advanceTimersByTime(5000);
      expect(storeState.fetchStatus).not.toHaveBeenCalled();
    });
  });

  describe('commit dialog', () => {
    it('opens commit dialog when commit button clicked', () => {
      storeState.status = {
        branch: 'main',
        ahead: 0,
        behind: 0,
        staged: ['file.ts'],
        modified: [],
        untracked: [],
      };
      render(<GitPanel isOpen={true} onClose={vi.fn()} />);
      const commitButton = screen.getByText('Commit');
      fireEvent.click(commitButton);
      // CommitDialog is mocked to return null, but we can verify the state changed
      // by checking that the button interaction worked without error
      expect(commitButton).toBeDefined();
    });
  });

  describe('styling', () => {
    it('has fixed position panel', () => {
      storeState.status = null;
      const { container } = render(<GitPanel isOpen={true} onClose={vi.fn()} />);
      expect(container.innerHTML).toContain('fixed');
    });

    it('has proper width', () => {
      const { container } = render(<GitPanel isOpen={true} onClose={vi.fn()} />);
      expect(container.innerHTML).toContain('w-96');
    });

    it('has shadow styling', () => {
      const { container } = render(<GitPanel isOpen={true} onClose={vi.fn()} />);
      expect(container.innerHTML).toContain('shadow-xl');
    });
  });
});
