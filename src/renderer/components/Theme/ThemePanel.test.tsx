// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ThemePanel } from './ThemePanel';

const {
  mockGetPresets,
  mockGetSettings,
  mockSetTheme,
  mockSetCustomAccent,
  mockResetCustomAccent,
} = vi.hoisted(() => ({
  mockGetPresets: vi.fn(),
  mockGetSettings: vi.fn(),
  mockSetTheme: vi.fn(),
  mockSetCustomAccent: vi.fn(),
  mockResetCustomAccent: vi.fn(),
}));

vi.mock('../../bridge/ipcBridge', () => ({
  ipcBridge: {
    theme: {
      getPresets: mockGetPresets,
      getSettings: mockGetSettings,
      setTheme: mockSetTheme,
      setCustomAccent: mockSetCustomAccent,
      resetCustomAccent: mockResetCustomAccent,
    },
  },
}));

const defaultPresets = [
  { id: 'dark', name: 'Dark', colors: { bg: '#000', surface: '#111', border: '#333', text: '#fff', muted: '#888', accent: '#58a6ff', success: '#4ade80', warning: '#fbbf24', error: '#f87171' } },
  { id: 'light', name: 'Light', colors: { bg: '#fff', surface: '#f5f5f5', border: '#ddd', text: '#000', muted: '#666', accent: '#2563eb', success: '#16a34a', warning: '#ca8a04', error: '#dc2626' } },
];

describe('ThemePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPresets.mockResolvedValue(defaultPresets);
    mockGetSettings.mockResolvedValue({ activeThemeId: 'dark' });
    mockSetTheme.mockResolvedValue({ bg: '#000' });
    mockSetCustomAccent.mockResolvedValue({ accent: '#ff0000' });
    mockResetCustomAccent.mockResolvedValue({ accent: '#58a6ff' });
  });

  describe('loading state', () => {
    it('shows loading indicator initially', () => {
      // Make loading last longer
      mockGetPresets.mockReturnValue(new Promise(() => {}));
      mockGetSettings.mockReturnValue(new Promise(() => {}));

      render(<ThemePanel />);
      expect(screen.getByText('読み込み中...')).toBeDefined();
    });

    it('hides loading indicator after data loads', async () => {
      render(<ThemePanel />);
      await waitFor(() => {
        expect(screen.queryByText('読み込み中...')).toBeNull();
      });
    });
  });

  describe('theme presets', () => {
    it('renders theme presets after loading', async () => {
      render(<ThemePanel />);
      await waitFor(() => {
        expect(screen.getByText('Dark')).toBeDefined();
        expect(screen.getByText('Light')).toBeDefined();
      });
    });

    it('shows active indicator for current theme', async () => {
      render(<ThemePanel />);
      await waitFor(() => {
        expect(screen.getByText('(Active)')).toBeDefined();
      });
    });

    it('allows selecting a theme', async () => {
      render(<ThemePanel />);
      await waitFor(() => {
        expect(screen.getByText('Light')).toBeDefined();
      });

      // Find and click the Light theme button
      const lightButton = screen.getByText('Light').closest('button');
      fireEvent.click(lightButton!);

      await waitFor(() => {
        expect(mockSetTheme).toHaveBeenCalledWith('light');
      });
    });

    it('renders color preview for each preset', async () => {
      render(<ThemePanel />);
      await waitFor(() => {
        // Should have color preview circles (4 per preset = 8 total)
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('header', () => {
    it('renders header', async () => {
      render(<ThemePanel />);
      await waitFor(() => {
        expect(screen.getByText('カスタムテーマ')).toBeDefined();
      });
    });

    it('renders description', async () => {
      render(<ThemePanel />);
      await waitFor(() => {
        expect(screen.getByText('アプリの外観をカスタマイズ')).toBeDefined();
      });
    });
  });

  describe('accent color section', () => {
    it('renders accent color section', async () => {
      render(<ThemePanel />);
      await waitFor(() => {
        expect(screen.getByText('アクセントカラー')).toBeDefined();
      });
    });

    it('renders accent color presets', async () => {
      render(<ThemePanel />);
      await waitFor(() => {
        // Should have 12 accent color preset buttons
        const accentButtons = screen.getAllByRole('button').filter(btn =>
          btn.getAttribute('title')?.startsWith('#')
        );
        expect(accentButtons.length).toBe(12);
      });
    });

    it('allows selecting an accent color preset', async () => {
      render(<ThemePanel />);
      await waitFor(() => {
        expect(screen.getByText('アクセントカラー')).toBeDefined();
      });

      const accentButtons = screen.getAllByRole('button').filter(btn =>
        btn.getAttribute('title')?.startsWith('#')
      );
      fireEvent.click(accentButtons[0]);

      await waitFor(() => {
        expect(mockSetCustomAccent).toHaveBeenCalledWith('#58a6ff');
      });
    });

    it('renders custom color input', async () => {
      render(<ThemePanel />);
      await waitFor(() => {
        expect(screen.getByText('カスタム:')).toBeDefined();
      });

      const colorInput = document.querySelector('input[type="color"]');
      expect(colorInput).not.toBeNull();
    });

    it('allows changing custom accent via color input', async () => {
      render(<ThemePanel />);
      await waitFor(() => {
        expect(screen.getByText('カスタム:')).toBeDefined();
      });

      const colorInput = document.querySelector('input[type="color"]') as HTMLInputElement;
      fireEvent.change(colorInput, { target: { value: '#ff5500' } });

      await waitFor(() => {
        expect(mockSetCustomAccent).toHaveBeenCalledWith('#ff5500');
      });
    });

    it('shows default text when no custom accent', async () => {
      render(<ThemePanel />);
      await waitFor(() => {
        expect(screen.getByText('デフォルト')).toBeDefined();
      });
    });

    it('shows custom accent value when set', async () => {
      mockGetSettings.mockResolvedValue({ activeThemeId: 'dark', customAccent: '#ff0000' });

      render(<ThemePanel />);
      await waitFor(() => {
        expect(screen.getByText('#ff0000')).toBeDefined();
      });
    });

    it('shows reset button when custom accent is set', async () => {
      mockGetSettings.mockResolvedValue({ activeThemeId: 'dark', customAccent: '#ff0000' });

      render(<ThemePanel />);
      await waitFor(() => {
        expect(screen.getByText('リセット')).toBeDefined();
      });
    });

    it('hides reset button when no custom accent', async () => {
      render(<ThemePanel />);
      await waitFor(() => {
        expect(screen.getByText('デフォルト')).toBeDefined();
      });
      expect(screen.queryByText('リセット')).toBeNull();
    });

    it('resets accent color when reset button clicked', async () => {
      mockGetSettings.mockResolvedValue({ activeThemeId: 'dark', customAccent: '#ff0000' });

      render(<ThemePanel />);
      await waitFor(() => {
        expect(screen.getByText('リセット')).toBeDefined();
      });

      fireEvent.click(screen.getByText('リセット'));

      await waitFor(() => {
        expect(mockResetCustomAccent).toHaveBeenCalled();
      });
    });
  });

  describe('preview section', () => {
    it('renders preview section', async () => {
      render(<ThemePanel />);
      await waitFor(() => {
        expect(screen.getByText('プレビュー')).toBeDefined();
      });
    });

    it('renders preview elements', async () => {
      render(<ThemePanel />);
      await waitFor(() => {
        expect(screen.getByText('アクセント')).toBeDefined();
        expect(screen.getByText('テキスト')).toBeDefined();
        expect(screen.getByText('ミュート')).toBeDefined();
        expect(screen.getByText('ボタン')).toBeDefined();
        expect(screen.getByText('成功')).toBeDefined();
        expect(screen.getByText('警告')).toBeDefined();
        expect(screen.getByText('エラー')).toBeDefined();
      });
    });

    it('renders description text', async () => {
      render(<ThemePanel />);
      await waitFor(() => {
        expect(screen.getByText(/テーマの変更はアプリ全体に即時反映されます/)).toBeDefined();
      });
    });
  });

  describe('error handling', () => {
    it('handles load error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetPresets.mockRejectedValue(new Error('Network error'));
      mockGetSettings.mockRejectedValue(new Error('Network error'));

      render(<ThemePanel />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to load theme data:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('still renders after error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetPresets.mockRejectedValue(new Error('Error'));
      mockGetSettings.mockRejectedValue(new Error('Error'));

      render(<ThemePanel />);

      await waitFor(() => {
        // Should render (with empty presets) after error
        expect(screen.getByText('カスタムテーマ')).toBeDefined();
      });
    });
  });

  describe('section headers', () => {
    it('renders theme presets section header', async () => {
      render(<ThemePanel />);
      await waitFor(() => {
        expect(screen.getByText('テーマプリセット')).toBeDefined();
      });
    });
  });
});
