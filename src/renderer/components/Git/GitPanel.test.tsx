// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

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
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('renders nothing when not open', () => {
    const { container } = render(<GitPanel isOpen={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders panel when open', () => {
    render(<GitPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Git')).toBeDefined();
  });
});
