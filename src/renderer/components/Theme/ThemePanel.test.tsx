// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemePanel } from './ThemePanel';

vi.mock('../../bridge/ipcBridge', () => ({
  ipcBridge: {
    theme: {
      getPresets: vi.fn().mockResolvedValue([
        { id: 'dark', name: 'Dark', colors: { bg: '#000', surface: '#111', border: '#333', text: '#fff', muted: '#888', accent: '#58a6ff', success: '#4ade80', warning: '#fbbf24', error: '#f87171' } },
        { id: 'light', name: 'Light', colors: { bg: '#fff', surface: '#f5f5f5', border: '#ddd', text: '#000', muted: '#666', accent: '#2563eb', success: '#16a34a', warning: '#ca8a04', error: '#dc2626' } },
      ]),
      getSettings: vi.fn().mockResolvedValue({ activeThemeId: 'dark' }),
      setTheme: vi.fn().mockResolvedValue({}),
      setCustomAccent: vi.fn().mockResolvedValue({}),
      resetCustomAccent: vi.fn().mockResolvedValue({}),
    },
  },
}));

describe('ThemePanel', () => {
  it('renders theme presets after loading', async () => {
    render(<ThemePanel />);
    await waitFor(() => {
      expect(screen.getByText('Dark')).toBeDefined();
      expect(screen.getByText('Light')).toBeDefined();
    });
  });

  it('renders header', async () => {
    render(<ThemePanel />);
    await waitFor(() => {
      expect(screen.getByText('カスタムテーマ')).toBeDefined();
    });
  });

  it('renders accent color section', async () => {
    render(<ThemePanel />);
    await waitFor(() => {
      expect(screen.getByText('アクセントカラー')).toBeDefined();
    });
  });

  it('renders preview section', async () => {
    render(<ThemePanel />);
    await waitFor(() => {
      expect(screen.getByText('プレビュー')).toBeDefined();
    });
  });
});
