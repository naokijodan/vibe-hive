// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsPanel } from './SettingsPanel';

const { mockFns, mockState } = vi.hoisted(() => ({
  mockFns: {
    loadSettings: vi.fn(),
    updateGitSettings: vi.fn(),
    updateAppSettings: vi.fn(),
    updateAgentSettings: vi.fn(),
    resetSettings: vi.fn().mockResolvedValue(undefined),
    clearError: vi.fn(),
  },
  mockState: {
    settings: {
      git: { autoCommit: false, commitPrefix: '' },
      app: { language: 'ja', theme: 'dark' },
      agent: { defaultModel: 'claude', providers: {} },
      webhook: { enabled: false },
      notification: { enabled: true },
    } as any,
    isLoading: false,
    error: null as string | null,
  },
}));

vi.mock('../../stores/settingsStore', () => ({
  useSettingsStore: () => ({
    ...mockState,
    ...mockFns,
  }),
}));

vi.mock('./GitSettings', () => ({ GitSettings: () => <div>GitSettings</div> }));
vi.mock('./AppSettings', () => ({ AppSettings: () => <div>AppSettings</div> }));
vi.mock('./WebhookSettings', () => ({ WebhookSettings: () => <div>WebhookSettings</div> }));
vi.mock('./NotificationSettings', () => ({ NotificationSettings: () => <div>NotificationSettings</div> }));
vi.mock('./AgentModelSettings', () => ({ AgentModelSettings: () => <div>AgentModelSettings</div> }));

describe('SettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.settings = {
      git: { autoCommit: false, commitPrefix: '' },
      app: { language: 'ja', theme: 'dark' },
      agent: { defaultModel: 'claude', providers: {} },
      webhook: { enabled: false },
      notification: { enabled: true },
    };
    mockState.isLoading = false;
    mockState.error = null;
  });

  it('renders nothing when not open', () => {
    const { container } = render(<SettingsPanel isOpen={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders tabs when open', () => {
    render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Git')).toBeDefined();
  });

  it('renders GitSettings by default', () => {
    render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('GitSettings')).toBeDefined();
  });

  it('switches to App tab', () => {
    render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('App'));
    expect(screen.getByText('AppSettings')).toBeDefined();
  });

  it('switches to Agent tab', () => {
    render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('AI Models'));
    expect(screen.getByText('AgentModelSettings')).toBeDefined();
  });

  it('switches to Webhook tab', () => {
    render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Webhook'));
    expect(screen.getByText('WebhookSettings')).toBeDefined();
  });

  it('switches to Notification tab', () => {
    render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Notification'));
    expect(screen.getByText('NotificationSettings')).toBeDefined();
  });

  it('switches to About tab', () => {
    render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('About'));
    expect(screen.getByText('Settings')).toBeDefined();
  });

  describe('load settings', () => {
    it('calls loadSettings when opened', () => {
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      expect(mockFns.loadSettings).toHaveBeenCalled();
    });
  });

  describe('close button', () => {
    it('renders close button in header', () => {
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      const closeButtons = screen.getAllByText('✕');
      expect(closeButtons.length).toBeGreaterThan(0);
    });

    it('renders footer close button', () => {
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText('Close')).toBeDefined();
    });

    it('calls onClose when close button clicked', async () => {
      vi.useFakeTimers();
      const onClose = vi.fn();
      render(<SettingsPanel isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByText('Close'));
      vi.advanceTimersByTime(100);
      expect(onClose).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('error state', () => {
    it('shows error banner when error exists', () => {
      mockState.error = 'Failed to load settings';
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText('Failed to load settings')).toBeDefined();
    });

    it('calls clearError when error close button clicked', () => {
      mockState.error = 'Some error';
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      const closeButtons = screen.getAllByText('✕');
      // The error close button is the second one
      fireEvent.click(closeButtons[1]);
      expect(mockFns.clearError).toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('shows loading message when isLoading and no settings', () => {
      mockState.isLoading = true;
      mockState.settings = null;
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText('Loading settings...')).toBeDefined();
    });
  });

  describe('no settings state', () => {
    it('shows failed message when settings is null and not loading', () => {
      mockState.settings = null;
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText('Failed to load settings')).toBeDefined();
    });
  });

  describe('About tab content', () => {
    it('shows version info', () => {
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('About'));
      expect(screen.getByText('0.2.0')).toBeDefined();
    });

    it('shows license info', () => {
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('About'));
      expect(screen.getByText('MIT')).toBeDefined();
    });

    it('shows author info', () => {
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('About'));
      expect(screen.getByText('Vibe Hive Team')).toBeDefined();
    });

    it('shows links section', () => {
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('About'));
      expect(screen.getByText('Links')).toBeDefined();
    });

    it('shows GitHub link', () => {
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('About'));
      expect(screen.getByText(/GitHub Repository/)).toBeDefined();
    });

    it('shows documentation link', () => {
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('About'));
      expect(screen.getByText(/Documentation/)).toBeDefined();
    });

    it('shows report issue link', () => {
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('About'));
      expect(screen.getByText(/Report Issue/)).toBeDefined();
    });

    it('shows developer tools button', () => {
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('About'));
      expect(screen.getByText('Open Developer Tools')).toBeDefined();
    });

    it('shows reset all settings button', () => {
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('About'));
      expect(screen.getByText('Reset All Settings')).toBeDefined();
    });

    it('shows danger zone section', () => {
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('About'));
      expect(screen.getByText('Danger Zone')).toBeDefined();
    });
  });

  describe('reset all settings', () => {
    it('calls resetSettings when confirmed', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('About'));
      fireEvent.click(screen.getByText('Reset All Settings'));
      await waitFor(() => {
        expect(mockFns.resetSettings).toHaveBeenCalled();
      });
      vi.restoreAllMocks();
    });

    it('does not call resetSettings when cancelled', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('About'));
      fireEvent.click(screen.getByText('Reset All Settings'));
      expect(mockFns.resetSettings).not.toHaveBeenCalled();
      vi.restoreAllMocks();
    });

    it('disables reset button when loading', () => {
      mockState.isLoading = true;
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('About'));
      const resetButton = screen.getByText('Reset All Settings');
      expect(resetButton).toHaveProperty('disabled', true);
    });
  });

  describe('developer tools', () => {
    it('opens devtools when button clicked and API available', () => {
      const mockToggleDevTools = vi.fn();
      (window as any).electronAPI = { toggleDevTools: mockToggleDevTools };
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('About'));
      fireEvent.click(screen.getByText('Open Developer Tools'));
      expect(mockToggleDevTools).toHaveBeenCalled();
      delete (window as any).electronAPI;
    });

    it('shows alert when API not available', () => {
      vi.spyOn(window, 'alert').mockImplementation(() => {});
      (window as any).electronAPI = undefined;
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('About'));
      fireEvent.click(screen.getByText('Open Developer Tools'));
      expect(window.alert).toHaveBeenCalled();
      vi.restoreAllMocks();
    });
  });

  describe('backdrop click', () => {
    it('closes panel when clicking backdrop', async () => {
      vi.useFakeTimers();
      const onClose = vi.fn();
      render(<SettingsPanel isOpen={true} onClose={onClose} />);
      const backdrop = document.querySelector('.fixed.inset-0');
      fireEvent.click(backdrop!);
      vi.advanceTimersByTime(100);
      expect(onClose).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('does not close when clicking modal content', async () => {
      vi.useFakeTimers();
      const onClose = vi.fn();
      render(<SettingsPanel isOpen={true} onClose={onClose} />);
      const modal = document.querySelector('.bg-hive-bg.border');
      fireEvent.click(modal!);
      vi.advanceTimersByTime(100);
      expect(onClose).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('styling', () => {
    it('has z-50 for overlay', () => {
      const { container } = render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      expect(container.innerHTML).toContain('z-50');
    });

    it('has shadow styling', () => {
      const { container } = render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      expect(container.innerHTML).toContain('shadow-xl');
    });

    it('has max width constraint', () => {
      const { container } = render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      expect(container.innerHTML).toContain('max-w-3xl');
    });
  });
});
