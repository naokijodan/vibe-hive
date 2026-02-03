// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const { mockSwitchSession, mockOpenPanel } = vi.hoisted(() => ({
  mockSwitchSession: vi.fn(),
  mockOpenPanel: vi.fn(),
}));

let mockSessions = [{ id: 's1', name: 'Session 1' }];

vi.mock('../stores/sessionStore', () => ({
  useSessionStore: () => ({
    sessions: mockSessions,
    switchSession: mockSwitchSession,
  }),
}));

vi.mock('../stores/aiAssistantStore', () => {
  const state = { openPanel: mockOpenPanel };
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockSessions = [{ id: 's1', name: 'Session 1' }];
  });

  describe('basic functionality', () => {
    it('returns an array of commands', () => {
      const { result } = renderHook(() => useCommandPalette(defaultProps));
      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current.length).toBeGreaterThan(10);
    });

    it('all commands have required properties', () => {
      const { result } = renderHook(() => useCommandPalette(defaultProps));
      result.current.forEach((cmd) => {
        expect(cmd).toHaveProperty('id');
        expect(cmd).toHaveProperty('label');
        expect(cmd).toHaveProperty('action');
        expect(typeof cmd.action).toBe('function');
      });
    });

    it('all commands have optional properties when defined', () => {
      const { result } = renderHook(() => useCommandPalette(defaultProps));
      result.current.forEach((cmd) => {
        if (cmd.description) {
          expect(typeof cmd.description).toBe('string');
        }
        if (cmd.category) {
          expect(typeof cmd.category).toBe('string');
        }
        if (cmd.keywords) {
          expect(Array.isArray(cmd.keywords)).toBe(true);
        }
      });
    });
  });

  describe('view commands', () => {
    it('includes view commands', () => {
      const { result } = renderHook(() => useCommandPalette(defaultProps));
      const ids = result.current.map((c) => c.id);
      expect(ids).toContain('view-kanban');
      expect(ids).toContain('view-organization');
      expect(ids).toContain('view-analytics');
      expect(ids).toContain('view-theme');
    });

    it('view-kanban command calls setCurrentView', () => {
      const setCurrentView = vi.fn();
      const { result } = renderHook(() =>
        useCommandPalette({ ...defaultProps, setCurrentView })
      );
      const cmd = result.current.find((c) => c.id === 'view-kanban');
      cmd!.action();
      expect(setCurrentView).toHaveBeenCalledWith('kanban');
    });

    it('view-organization command calls setCurrentView', () => {
      const setCurrentView = vi.fn();
      const { result } = renderHook(() =>
        useCommandPalette({ ...defaultProps, setCurrentView })
      );
      const cmd = result.current.find((c) => c.id === 'view-organization');
      cmd!.action();
      expect(setCurrentView).toHaveBeenCalledWith('organization');
    });

    it('view-history command calls setCurrentView', () => {
      const setCurrentView = vi.fn();
      const { result } = renderHook(() =>
        useCommandPalette({ ...defaultProps, setCurrentView })
      );
      const cmd = result.current.find((c) => c.id === 'view-history');
      cmd!.action();
      expect(setCurrentView).toHaveBeenCalledWith('history');
    });

    it('view-analytics command calls setCurrentView', () => {
      const setCurrentView = vi.fn();
      const { result } = renderHook(() =>
        useCommandPalette({ ...defaultProps, setCurrentView })
      );
      const cmd = result.current.find((c) => c.id === 'view-analytics');
      cmd!.action();
      expect(setCurrentView).toHaveBeenCalledWith('analytics');
    });

    it('view-coordination command calls setCurrentView', () => {
      const setCurrentView = vi.fn();
      const { result } = renderHook(() =>
        useCommandPalette({ ...defaultProps, setCurrentView })
      );
      const cmd = result.current.find((c) => c.id === 'view-coordination');
      cmd!.action();
      expect(setCurrentView).toHaveBeenCalledWith('coordination');
    });

    it('view-notifications command calls setCurrentView', () => {
      const setCurrentView = vi.fn();
      const { result } = renderHook(() =>
        useCommandPalette({ ...defaultProps, setCurrentView })
      );
      const cmd = result.current.find((c) => c.id === 'view-notifications');
      cmd!.action();
      expect(setCurrentView).toHaveBeenCalledWith('notifications');
    });

    it('view-export-import command calls setCurrentView', () => {
      const setCurrentView = vi.fn();
      const { result } = renderHook(() =>
        useCommandPalette({ ...defaultProps, setCurrentView })
      );
      const cmd = result.current.find((c) => c.id === 'view-export-import');
      cmd!.action();
      expect(setCurrentView).toHaveBeenCalledWith('export-import');
    });

    it('view-theme command calls setCurrentView', () => {
      const setCurrentView = vi.fn();
      const { result } = renderHook(() =>
        useCommandPalette({ ...defaultProps, setCurrentView })
      );
      const cmd = result.current.find((c) => c.id === 'view-theme');
      cmd!.action();
      expect(setCurrentView).toHaveBeenCalledWith('theme');
    });

    it('view-claude-hooks command calls setCurrentView', () => {
      const setCurrentView = vi.fn();
      const { result } = renderHook(() =>
        useCommandPalette({ ...defaultProps, setCurrentView })
      );
      const cmd = result.current.find((c) => c.id === 'view-claude-hooks');
      cmd!.action();
      expect(setCurrentView).toHaveBeenCalledWith('claude-hooks');
    });
  });

  describe('settings command', () => {
    it('settings command calls setIsSettingsPanelOpen when available', () => {
      const setIsSettingsPanelOpen = vi.fn();
      const { result } = renderHook(() =>
        useCommandPalette({ ...defaultProps, setIsSettingsPanelOpen })
      );
      const settingsCmd = result.current.find((c) => c.id === 'view-settings');
      settingsCmd!.action();
      expect(setIsSettingsPanelOpen).toHaveBeenCalledWith(true);
    });

    it('settings command calls setCurrentView when setIsSettingsPanelOpen not provided', () => {
      const setCurrentView = vi.fn();
      const { result } = renderHook(() =>
        useCommandPalette({ ...defaultProps, setCurrentView, setIsSettingsPanelOpen: undefined })
      );
      const settingsCmd = result.current.find((c) => c.id === 'view-settings');
      settingsCmd!.action();
      expect(setCurrentView).toHaveBeenCalledWith('settings');
    });
  });

  describe('session commands', () => {
    it('includes session switch commands for each session', () => {
      const { result } = renderHook(() => useCommandPalette(defaultProps));
      const ids = result.current.map((c) => c.id);
      expect(ids).toContain('session-switch-s1');
    });

    it('session-new command calls setIsSessionModalOpen', () => {
      const setIsSessionModalOpen = vi.fn();
      const { result } = renderHook(() =>
        useCommandPalette({ ...defaultProps, setIsSessionModalOpen })
      );
      const cmd = result.current.find((c) => c.id === 'session-new');
      cmd!.action();
      expect(setIsSessionModalOpen).toHaveBeenCalledWith(true);
    });

    it('session switch command calls switchSession with correct id', () => {
      const { result } = renderHook(() => useCommandPalette(defaultProps));
      const cmd = result.current.find((c) => c.id === 'session-switch-s1');
      cmd!.action();
      expect(mockSwitchSession).toHaveBeenCalledWith('s1');
    });

    it('handles multiple sessions', () => {
      mockSessions = [
        { id: 's1', name: 'Session 1' },
        { id: 's2', name: 'Session 2' },
        { id: 's3', name: 'Session 3' },
      ];
      const { result } = renderHook(() => useCommandPalette(defaultProps));
      const ids = result.current.map((c) => c.id);
      expect(ids).toContain('session-switch-s1');
      expect(ids).toContain('session-switch-s2');
      expect(ids).toContain('session-switch-s3');
    });

    it('handles empty sessions', () => {
      mockSessions = [];
      const { result } = renderHook(() => useCommandPalette(defaultProps));
      const sessionSwitchCmds = result.current.filter((c) =>
        c.id.startsWith('session-switch-')
      );
      expect(sessionSwitchCmds.length).toBe(0);
    });
  });

  describe('terminal commands', () => {
    it('terminal-agent command calls setShowBashTerminal with false', () => {
      const setShowBashTerminal = vi.fn();
      const { result } = renderHook(() =>
        useCommandPalette({ ...defaultProps, setShowBashTerminal })
      );
      const cmd = result.current.find((c) => c.id === 'terminal-agent');
      cmd!.action();
      expect(setShowBashTerminal).toHaveBeenCalledWith(false);
    });

    it('terminal-bash command calls setShowBashTerminal with true', () => {
      const setShowBashTerminal = vi.fn();
      const { result } = renderHook(() =>
        useCommandPalette({ ...defaultProps, setShowBashTerminal })
      );
      const cmd = result.current.find((c) => c.id === 'terminal-bash');
      cmd!.action();
      expect(setShowBashTerminal).toHaveBeenCalledWith(true);
    });
  });

  describe('git commands', () => {
    it('includes git commands when setIsGitPanelOpen provided', () => {
      const { result } = renderHook(() => useCommandPalette(defaultProps));
      const ids = result.current.map((c) => c.id);
      expect(ids).toContain('git-open');
      expect(ids).toContain('git-commit');
      expect(ids).toContain('git-push');
      expect(ids).toContain('git-pull');
    });

    it('excludes git commands when setIsGitPanelOpen not provided', () => {
      const { result } = renderHook(() =>
        useCommandPalette({ ...defaultProps, setIsGitPanelOpen: undefined })
      );
      const ids = result.current.map((c) => c.id);
      expect(ids).not.toContain('git-open');
      expect(ids).not.toContain('git-commit');
      expect(ids).not.toContain('git-push');
      expect(ids).not.toContain('git-pull');
    });

    it('git-open command calls setIsGitPanelOpen', () => {
      const setIsGitPanelOpen = vi.fn();
      const { result } = renderHook(() =>
        useCommandPalette({ ...defaultProps, setIsGitPanelOpen })
      );
      const cmd = result.current.find((c) => c.id === 'git-open');
      cmd!.action();
      expect(setIsGitPanelOpen).toHaveBeenCalledWith(true);
    });

    it('git-commit command calls setIsGitPanelOpen', () => {
      const setIsGitPanelOpen = vi.fn();
      const { result } = renderHook(() =>
        useCommandPalette({ ...defaultProps, setIsGitPanelOpen })
      );
      const cmd = result.current.find((c) => c.id === 'git-commit');
      cmd!.action();
      expect(setIsGitPanelOpen).toHaveBeenCalledWith(true);
    });

    it('git-push command calls setIsGitPanelOpen', () => {
      const setIsGitPanelOpen = vi.fn();
      const { result } = renderHook(() =>
        useCommandPalette({ ...defaultProps, setIsGitPanelOpen })
      );
      const cmd = result.current.find((c) => c.id === 'git-push');
      cmd!.action();
      expect(setIsGitPanelOpen).toHaveBeenCalledWith(true);
    });

    it('git-pull command calls setIsGitPanelOpen', () => {
      const setIsGitPanelOpen = vi.fn();
      const { result } = renderHook(() =>
        useCommandPalette({ ...defaultProps, setIsGitPanelOpen })
      );
      const cmd = result.current.find((c) => c.id === 'git-pull');
      cmd!.action();
      expect(setIsGitPanelOpen).toHaveBeenCalledWith(true);
    });
  });

  describe('AI assistant command', () => {
    it('includes AI assistant command', () => {
      const { result } = renderHook(() => useCommandPalette(defaultProps));
      const ids = result.current.map((c) => c.id);
      expect(ids).toContain('ai-assistant');
    });

    it('AI assistant command calls openPanel', () => {
      const { result } = renderHook(() => useCommandPalette(defaultProps));
      const cmd = result.current.find((c) => c.id === 'ai-assistant');
      cmd!.action();
      expect(mockOpenPanel).toHaveBeenCalled();
    });
  });

  describe('command categories', () => {
    it('has view commands in ビュー category', () => {
      const { result } = renderHook(() => useCommandPalette(defaultProps));
      const viewCmds = result.current.filter((c) => c.id.startsWith('view-'));
      viewCmds.forEach((cmd) => {
        expect(cmd.category).toBe('ビュー');
      });
    });

    it('has session commands in セッション category', () => {
      const { result } = renderHook(() => useCommandPalette(defaultProps));
      const sessionCmds = result.current.filter((c) => c.id.startsWith('session-'));
      sessionCmds.forEach((cmd) => {
        expect(cmd.category).toBe('セッション');
      });
    });

    it('has terminal commands in ターミナル category', () => {
      const { result } = renderHook(() => useCommandPalette(defaultProps));
      const terminalCmds = result.current.filter((c) => c.id.startsWith('terminal-'));
      terminalCmds.forEach((cmd) => {
        expect(cmd.category).toBe('ターミナル');
      });
    });

    it('has git commands in Git category', () => {
      const { result } = renderHook(() => useCommandPalette(defaultProps));
      const gitCmds = result.current.filter((c) => c.id.startsWith('git-'));
      gitCmds.forEach((cmd) => {
        expect(cmd.category).toBe('Git');
      });
    });

    it('has AI command in AI category', () => {
      const { result } = renderHook(() => useCommandPalette(defaultProps));
      const cmd = result.current.find((c) => c.id === 'ai-assistant');
      expect(cmd!.category).toBe('AI');
    });
  });

  describe('command keywords', () => {
    it('view commands have relevant keywords', () => {
      const { result } = renderHook(() => useCommandPalette(defaultProps));
      const kanbanCmd = result.current.find((c) => c.id === 'view-kanban');
      expect(kanbanCmd!.keywords).toContain('kanban');
    });

    it('session commands have relevant keywords', () => {
      const { result } = renderHook(() => useCommandPalette(defaultProps));
      const cmd = result.current.find((c) => c.id === 'session-new');
      expect(cmd!.keywords).toContain('session');
    });

    it('terminal commands have relevant keywords', () => {
      const { result } = renderHook(() => useCommandPalette(defaultProps));
      const cmd = result.current.find((c) => c.id === 'terminal-bash');
      expect(cmd!.keywords).toContain('bash');
      expect(cmd!.keywords).toContain('terminal');
    });

    it('git commands have relevant keywords', () => {
      const { result } = renderHook(() => useCommandPalette(defaultProps));
      const cmd = result.current.find((c) => c.id === 'git-commit');
      expect(cmd!.keywords).toContain('git');
      expect(cmd!.keywords).toContain('commit');
    });
  });

  describe('memoization', () => {
    it('returns stable reference when dependencies do not change', () => {
      const { result, rerender } = renderHook(() => useCommandPalette(defaultProps));
      const firstResult = result.current;
      rerender();
      expect(result.current).toBe(firstResult);
    });
  });
});
