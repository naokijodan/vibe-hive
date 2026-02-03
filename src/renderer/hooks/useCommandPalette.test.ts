// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('../stores/sessionStore', () => ({
  useSessionStore: () => ({
    sessions: [{ id: 's1', name: 'Session 1' }],
    switchSession: vi.fn(),
  }),
}));

vi.mock('../stores/aiAssistantStore', () => {
  const state = { openPanel: vi.fn() };
  const fn = () => state;
  fn.getState = () => state;
  return { useAIAssistantStore: fn };
});

import { useCommandPalette } from './useCommandPalette';

describe('useCommandPalette', () => {
  const defaultProps = {
    currentView: 'kanban' as any,
    setCurrentView: vi.fn(),
    setIsSessionModalOpen: vi.fn(),
    setShowBashTerminal: vi.fn(),
    setIsGitPanelOpen: vi.fn(),
    setIsSettingsPanelOpen: vi.fn(),
  };

  it('returns an array of commands', () => {
    const { result } = renderHook(() => useCommandPalette(defaultProps));
    expect(Array.isArray(result.current)).toBe(true);
    expect(result.current.length).toBeGreaterThan(10);
  });

  it('includes view commands', () => {
    const { result } = renderHook(() => useCommandPalette(defaultProps));
    const ids = result.current.map(c => c.id);
    expect(ids).toContain('view-kanban');
    expect(ids).toContain('view-organization');
    expect(ids).toContain('view-analytics');
    expect(ids).toContain('view-theme');
  });

  it('includes session switch commands for each session', () => {
    const { result } = renderHook(() => useCommandPalette(defaultProps));
    const ids = result.current.map(c => c.id);
    expect(ids).toContain('session-switch-s1');
  });

  it('includes git commands when setIsGitPanelOpen provided', () => {
    const { result } = renderHook(() => useCommandPalette(defaultProps));
    const ids = result.current.map(c => c.id);
    expect(ids).toContain('git-open');
    expect(ids).toContain('git-commit');
  });

  it('excludes git commands when setIsGitPanelOpen not provided', () => {
    const { result } = renderHook(() =>
      useCommandPalette({ ...defaultProps, setIsGitPanelOpen: undefined })
    );
    const ids = result.current.map(c => c.id);
    expect(ids).not.toContain('git-open');
  });

  it('includes AI assistant command', () => {
    const { result } = renderHook(() => useCommandPalette(defaultProps));
    const ids = result.current.map(c => c.id);
    expect(ids).toContain('ai-assistant');
  });

  it('settings command calls setIsSettingsPanelOpen when available', () => {
    const setIsSettingsPanelOpen = vi.fn();
    const { result } = renderHook(() =>
      useCommandPalette({ ...defaultProps, setIsSettingsPanelOpen })
    );
    const settingsCmd = result.current.find(c => c.id === 'view-settings');
    settingsCmd!.action();
    expect(setIsSettingsPanelOpen).toHaveBeenCalledWith(true);
  });

  it('settings command calls setCurrentView when setIsSettingsPanelOpen not provided', () => {
    const setCurrentView = vi.fn();
    const { result } = renderHook(() =>
      useCommandPalette({ ...defaultProps, setCurrentView, setIsSettingsPanelOpen: undefined })
    );
    const settingsCmd = result.current.find(c => c.id === 'view-settings');
    settingsCmd!.action();
    expect(setCurrentView).toHaveBeenCalledWith('settings');
  });

  it('view-kanban command calls setCurrentView', () => {
    const setCurrentView = vi.fn();
    const { result } = renderHook(() =>
      useCommandPalette({ ...defaultProps, setCurrentView })
    );
    const cmd = result.current.find(c => c.id === 'view-kanban');
    cmd!.action();
    expect(setCurrentView).toHaveBeenCalledWith('kanban');
  });

  it('view-organization command calls setCurrentView', () => {
    const setCurrentView = vi.fn();
    const { result } = renderHook(() =>
      useCommandPalette({ ...defaultProps, setCurrentView })
    );
    const cmd = result.current.find(c => c.id === 'view-organization');
    cmd!.action();
    expect(setCurrentView).toHaveBeenCalledWith('organization');
  });

  it('session-new command calls setIsSessionModalOpen', () => {
    const setIsSessionModalOpen = vi.fn();
    const { result } = renderHook(() =>
      useCommandPalette({ ...defaultProps, setIsSessionModalOpen })
    );
    const cmd = result.current.find(c => c.id === 'session-new');
    cmd!.action();
    expect(setIsSessionModalOpen).toHaveBeenCalledWith(true);
  });

  it('terminal-bash command calls setShowBashTerminal', () => {
    const setShowBashTerminal = vi.fn();
    const { result } = renderHook(() =>
      useCommandPalette({ ...defaultProps, setShowBashTerminal })
    );
    const cmd = result.current.find(c => c.id === 'terminal-bash');
    cmd!.action();
    expect(setShowBashTerminal).toHaveBeenCalled();
  });

  it('includes view-theme command', () => {
    const { result } = renderHook(() => useCommandPalette(defaultProps));
    const ids = result.current.map(c => c.id);
    expect(ids).toContain('view-theme');
  });

  it('includes view-claude-hooks command', () => {
    const { result } = renderHook(() => useCommandPalette(defaultProps));
    const ids = result.current.map(c => c.id);
    expect(ids).toContain('view-claude-hooks');
  });
});
