// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCommandPalette } from './useCommandPalette';

// Mock Zustand stores
vi.mock('../stores/sessionStore', () => ({
  useSessionStore: () => ({
    sessions: [
      { id: 's1', name: 'Dev Session' },
      { id: 's2', name: 'Test Session' },
    ],
    switchSession: vi.fn(),
  }),
}));

vi.mock('../stores/aiAssistantStore', () => ({
  useAIAssistantStore: Object.assign(vi.fn(() => ({})), {
    getState: () => ({ openPanel: vi.fn() }),
  }),
}));

describe('useCommandPalette', () => {
  const defaultProps = {
    currentView: 'kanban' as const,
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
    expect(ids).toContain('session-switch-s2');
  });

  it('includes terminal commands', () => {
    const { result } = renderHook(() => useCommandPalette(defaultProps));
    const ids = result.current.map(c => c.id);
    expect(ids).toContain('terminal-agent');
    expect(ids).toContain('terminal-bash');
  });

  it('includes git commands when setIsGitPanelOpen is provided', () => {
    const { result } = renderHook(() => useCommandPalette(defaultProps));
    const ids = result.current.map(c => c.id);
    expect(ids).toContain('git-open');
    expect(ids).toContain('git-commit');
    expect(ids).toContain('git-push');
    expect(ids).toContain('git-pull');
  });

  it('excludes git commands when setIsGitPanelOpen is not provided', () => {
    const props = { ...defaultProps, setIsGitPanelOpen: undefined };
    const { result } = renderHook(() => useCommandPalette(props));
    const ids = result.current.map(c => c.id);
    expect(ids).not.toContain('git-open');
  });

  it('view command actions call setCurrentView', () => {
    const { result } = renderHook(() => useCommandPalette(defaultProps));
    const kanbanCmd = result.current.find(c => c.id === 'view-kanban');
    kanbanCmd?.action();
    expect(defaultProps.setCurrentView).toHaveBeenCalledWith('kanban');
  });

  it('settings command uses setIsSettingsPanelOpen when available', () => {
    const { result } = renderHook(() => useCommandPalette(defaultProps));
    const settingsCmd = result.current.find(c => c.id === 'view-settings');
    settingsCmd?.action();
    expect(defaultProps.setIsSettingsPanelOpen).toHaveBeenCalledWith(true);
  });

  it('settings command falls back to setCurrentView when panel setter absent', () => {
    const props = { ...defaultProps, setIsSettingsPanelOpen: undefined };
    const { result } = renderHook(() => useCommandPalette(props));
    const settingsCmd = result.current.find(c => c.id === 'view-settings');
    settingsCmd?.action();
    expect(props.setCurrentView).toHaveBeenCalledWith('settings');
  });

  it('includes AI assistant command', () => {
    const { result } = renderHook(() => useCommandPalette(defaultProps));
    const ids = result.current.map(c => c.id);
    expect(ids).toContain('ai-assistant');
  });

  it('all commands have required fields', () => {
    const { result } = renderHook(() => useCommandPalette(defaultProps));
    for (const cmd of result.current) {
      expect(cmd.id).toBeDefined();
      expect(cmd.label).toBeDefined();
      expect(cmd.category).toBeDefined();
      expect(typeof cmd.action).toBe('function');
    }
  });
});
