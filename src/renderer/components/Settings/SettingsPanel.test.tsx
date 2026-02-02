// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SettingsPanel } from './SettingsPanel';

vi.mock('../../stores/settingsStore', () => ({
  useSettingsStore: () => ({
    settings: {
      git: { autoCommit: false, commitPrefix: '' },
      app: { language: 'ja', theme: 'dark' },
      agent: { defaultModel: 'claude', providers: {} },
      webhook: { enabled: false },
      notification: { enabled: true },
    },
    isLoading: false,
    error: null,
    loadSettings: vi.fn(),
    updateGitSettings: vi.fn(),
    updateAppSettings: vi.fn(),
    updateAgentSettings: vi.fn(),
    resetSettings: vi.fn(),
    clearError: vi.fn(),
  }),
}));

vi.mock('./GitSettings', () => ({ GitSettings: () => <div>GitSettings</div> }));
vi.mock('./AppSettings', () => ({ AppSettings: () => <div>AppSettings</div> }));
vi.mock('./WebhookSettings', () => ({ WebhookSettings: () => <div>WebhookSettings</div> }));
vi.mock('./NotificationSettings', () => ({ NotificationSettings: () => <div>NotificationSettings</div> }));
vi.mock('./AgentModelSettings', () => ({ AgentModelSettings: () => <div>AgentModelSettings</div> }));

describe('SettingsPanel', () => {
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
});
