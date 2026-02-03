// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PluginManager } from './PluginManager';

const {
  mockLoadPlugins,
  mockLoadPluginsDir,
  mockActivatePlugin,
  mockDeactivatePlugin,
  mockRefreshPlugins,
  mockUpdateSetting,
} = vi.hoisted(() => ({
  mockLoadPlugins: vi.fn(),
  mockLoadPluginsDir: vi.fn(),
  mockActivatePlugin: vi.fn(),
  mockDeactivatePlugin: vi.fn(),
  mockRefreshPlugins: vi.fn(),
  mockUpdateSetting: vi.fn(),
}));

let mockPlugins: any[] = [];
let mockPluginsDir = '/plugins';
let mockIsLoading = false;
let mockError: string | null = null;

vi.mock('../../stores/pluginStore', () => ({
  usePluginStore: () => ({
    plugins: mockPlugins,
    pluginsDir: mockPluginsDir,
    isLoading: mockIsLoading,
    error: mockError,
    loadPlugins: mockLoadPlugins,
    activatePlugin: mockActivatePlugin,
    deactivatePlugin: mockDeactivatePlugin,
    updateSetting: mockUpdateSetting,
    refreshPlugins: mockRefreshPlugins,
    loadPluginsDir: mockLoadPluginsDir,
  }),
}));

describe('PluginManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActivatePlugin.mockResolvedValue({ success: true });
    mockDeactivatePlugin.mockResolvedValue({ success: true });
    mockPlugins = [
      {
        id: 'p1',
        manifest: {
          displayName: 'Test Plugin',
          version: '1.0.0',
          description: 'A plugin',
          author: 'Dev',
          permissions: ['fs'],
          settingsSchema: [],
        },
        status: 'installed',
        path: '/plugins/test',
        settings: {},
      },
      {
        id: 'p2',
        manifest: {
          displayName: 'Active Plugin',
          version: '2.0.0',
          description: 'Active',
          author: 'Dev',
          permissions: [],
          settingsSchema: [],
        },
        status: 'active',
        path: '/plugins/active',
        settings: {},
      },
    ];
    mockPluginsDir = '/plugins';
    mockIsLoading = false;
    mockError = null;
  });

  describe('initialization', () => {
    it('loads plugins on mount', () => {
      render(<PluginManager />);
      expect(mockLoadPlugins).toHaveBeenCalled();
      expect(mockLoadPluginsDir).toHaveBeenCalled();
    });
  });

  describe('plugin list rendering', () => {
    it('renders plugin list', () => {
      render(<PluginManager />);
      expect(screen.getByText('Test Plugin')).toBeDefined();
      expect(screen.getByText('Active Plugin')).toBeDefined();
    });

    it('shows plugin versions', () => {
      render(<PluginManager />);
      expect(screen.getByText('v1.0.0')).toBeDefined();
      expect(screen.getByText('v2.0.0')).toBeDefined();
    });

    it('shows status badges', () => {
      render(<PluginManager />);
      expect(screen.getByText('installed')).toBeDefined();
      expect(screen.getByText('active')).toBeDefined();
    });

    it('shows plugin descriptions', () => {
      render(<PluginManager />);
      expect(screen.getByText('A plugin')).toBeDefined();
      expect(screen.getByText('Active')).toBeDefined();
    });

    it('shows author names', () => {
      render(<PluginManager />);
      const byDevElements = screen.getAllByText(/by Dev/);
      expect(byDevElements.length).toBeGreaterThan(0);
    });

    it('shows "No description" for plugins without description', () => {
      mockPlugins = [{
        id: 'p1',
        manifest: { displayName: 'NoDesc', version: '1.0.0', permissions: [], settingsSchema: [] },
        status: 'installed',
        path: '/p',
        settings: {},
      }];
      render(<PluginManager />);
      expect(screen.getByText('No description')).toBeDefined();
    });
  });

  describe('plugins directory', () => {
    it('shows plugins directory', () => {
      render(<PluginManager />);
      expect(screen.getByText('/plugins')).toBeDefined();
    });

    it('shows "Loading..." when pluginsDir is empty', () => {
      mockPluginsDir = '';
      render(<PluginManager />);
      expect(screen.getByText('Loading...')).toBeDefined();
    });

    it('shows plugin directory label', () => {
      render(<PluginManager />);
      expect(screen.getByText('Plugin Directory')).toBeDefined();
    });

    it('shows manifest.json instruction', () => {
      render(<PluginManager />);
      expect(screen.getByText('manifest.json')).toBeDefined();
    });
  });

  describe('header', () => {
    it('renders title', () => {
      render(<PluginManager />);
      expect(screen.getByText('Plugin Manager')).toBeDefined();
    });

    it('renders subtitle', () => {
      render(<PluginManager />);
      expect(screen.getByText('Manage third-party extensions')).toBeDefined();
    });

    it('has refresh button', () => {
      render(<PluginManager />);
      expect(screen.getByText('Refresh')).toBeDefined();
    });

    it('calls refreshPlugins when Refresh button clicked', () => {
      render(<PluginManager />);
      fireEvent.click(screen.getByText('Refresh'));
      expect(mockRefreshPlugins).toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('shows Refreshing... when loading', () => {
      mockIsLoading = true;
      render(<PluginManager />);
      expect(screen.getByText('Refreshing...')).toBeDefined();
    });

    it('disables refresh button when loading', () => {
      mockIsLoading = true;
      render(<PluginManager />);
      const button = screen.getByText('Refreshing...').closest('button');
      expect(button).toHaveProperty('disabled', true);
    });
  });

  describe('error state', () => {
    it('shows error message when error exists', () => {
      mockError = 'Failed to load plugins';
      render(<PluginManager />);
      expect(screen.getByText('Failed to load plugins')).toBeDefined();
    });
  });

  describe('empty state', () => {
    it('shows empty state when no plugins', () => {
      mockPlugins = [];
      render(<PluginManager />);
      expect(screen.getByText('No Plugins Installed')).toBeDefined();
    });

    it('shows puzzle emoji in empty state', () => {
      mockPlugins = [];
      render(<PluginManager />);
      expect(screen.getByText('🧩')).toBeDefined();
    });

    it('shows plugin structure example in empty state', () => {
      mockPlugins = [];
      render(<PluginManager />);
      expect(screen.getByText('Plugin Structure:')).toBeDefined();
    });

    it('shows folder structure in empty state', () => {
      mockPlugins = [];
      render(<PluginManager />);
      expect(screen.getByText(/my-plugin/)).toBeDefined();
    });
  });

  describe('plugin toggle', () => {
    it('activates installed plugin', async () => {
      render(<PluginManager />);
      // Find the checkbox for the installed plugin
      const checkboxes = screen.getAllByRole('checkbox');
      const installedCheckbox = checkboxes.find(cb => !(cb as HTMLInputElement).checked);
      fireEvent.click(installedCheckbox!);
      await waitFor(() => {
        expect(mockActivatePlugin).toHaveBeenCalledWith('p1');
      });
    });

    it('deactivates active plugin', async () => {
      render(<PluginManager />);
      // Find the checkbox for the active plugin
      const checkboxes = screen.getAllByRole('checkbox');
      const activeCheckbox = checkboxes.find(cb => (cb as HTMLInputElement).checked);
      fireEvent.click(activeCheckbox!);
      await waitFor(() => {
        expect(mockDeactivatePlugin).toHaveBeenCalledWith('p2');
      });
    });

    it('shows action error when activation fails', async () => {
      mockActivatePlugin.mockResolvedValue({ success: false, error: 'Activation failed' });
      render(<PluginManager />);
      const checkboxes = screen.getAllByRole('checkbox');
      const installedCheckbox = checkboxes.find(cb => !(cb as HTMLInputElement).checked);
      fireEvent.click(installedCheckbox!);
      await waitFor(() => {
        expect(screen.getByText('Activation failed')).toBeDefined();
      });
    });

    it('shows default error when activation fails without message', async () => {
      mockActivatePlugin.mockResolvedValue({ success: false });
      render(<PluginManager />);
      const checkboxes = screen.getAllByRole('checkbox');
      const installedCheckbox = checkboxes.find(cb => !(cb as HTMLInputElement).checked);
      fireEvent.click(installedCheckbox!);
      await waitFor(() => {
        expect(screen.getByText('Failed to activate')).toBeDefined();
      });
    });

    it('shows error when deactivation fails', async () => {
      mockDeactivatePlugin.mockResolvedValue({ success: false, error: 'Deactivation failed' });
      render(<PluginManager />);
      const checkboxes = screen.getAllByRole('checkbox');
      const activeCheckbox = checkboxes.find(cb => (cb as HTMLInputElement).checked);
      fireEvent.click(activeCheckbox!);
      await waitFor(() => {
        expect(screen.getByText('Deactivation failed')).toBeDefined();
      });
    });
  });

  describe('plugin selection and expansion', () => {
    it('expands plugin details on click', () => {
      render(<PluginManager />);
      fireEvent.click(screen.getByText('Test Plugin'));
      expect(screen.getByText(/ID: p1/)).toBeDefined();
    });

    it('shows permissions when expanded', () => {
      render(<PluginManager />);
      fireEvent.click(screen.getByText('Test Plugin'));
      expect(screen.getByText('Permissions')).toBeDefined();
      expect(screen.getByText('fs')).toBeDefined();
    });

    it('shows path when expanded', () => {
      render(<PluginManager />);
      fireEvent.click(screen.getByText('Test Plugin'));
      expect(screen.getByText(/Path: \/plugins\/test/)).toBeDefined();
    });

    it('collapses plugin on second click', () => {
      render(<PluginManager />);
      fireEvent.click(screen.getByText('Test Plugin'));
      expect(screen.getByText(/ID: p1/)).toBeDefined();
      fireEvent.click(screen.getByText('Test Plugin'));
      expect(screen.queryByText(/ID: p1/)).toBeNull();
    });

    it('does not show permissions section when no permissions', () => {
      render(<PluginManager />);
      fireEvent.click(screen.getByText('Active Plugin'));
      expect(screen.queryByText('Permissions')).toBeNull();
    });
  });

  describe('plugin error status', () => {
    it('shows plugin error message', () => {
      mockPlugins = [{
        id: 'err',
        manifest: { displayName: 'Error Plugin', version: '1.0.0', permissions: [], settingsSchema: [] },
        status: 'error',
        path: '/p',
        settings: {},
        error: 'Plugin crashed',
      }];
      render(<PluginManager />);
      expect(screen.getByText('Plugin crashed')).toBeDefined();
    });

    it('disables toggle for error status plugins', () => {
      mockPlugins = [{
        id: 'err',
        manifest: { displayName: 'Error Plugin', version: '1.0.0', permissions: [], settingsSchema: [] },
        status: 'error',
        path: '/p',
        settings: {},
      }];
      render(<PluginManager />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveProperty('disabled', true);
    });

    it('shows error badge', () => {
      mockPlugins = [{
        id: 'err',
        manifest: { displayName: 'Error Plugin', version: '1.0.0', permissions: [], settingsSchema: [] },
        status: 'error',
        path: '/p',
        settings: {},
      }];
      render(<PluginManager />);
      expect(screen.getByText('error')).toBeDefined();
    });
  });

  describe('disabled status', () => {
    it('shows disabled badge', () => {
      mockPlugins = [{
        id: 'dis',
        manifest: { displayName: 'Disabled Plugin', version: '1.0.0', permissions: [], settingsSchema: [] },
        status: 'disabled',
        path: '/p',
        settings: {},
      }];
      render(<PluginManager />);
      expect(screen.getByText('disabled')).toBeDefined();
    });
  });

  describe('settings form', () => {
    it('shows settings section when plugin has settingsSchema', () => {
      mockPlugins = [{
        id: 's1',
        manifest: {
          displayName: 'Settings Plugin',
          version: '1.0.0',
          permissions: [],
          settingsSchema: [
            { key: 'enabled', label: 'Enable Feature', type: 'boolean', default: false },
          ],
        },
        status: 'active',
        path: '/p',
        settings: { enabled: true },
      }];
      render(<PluginManager />);
      fireEvent.click(screen.getByText('Settings Plugin'));
      expect(screen.getByText('Settings')).toBeDefined();
      expect(screen.getByText('Enable Feature')).toBeDefined();
    });

    it('handles boolean setting change', async () => {
      mockPlugins = [{
        id: 's1',
        manifest: {
          displayName: 'Settings Plugin',
          version: '1.0.0',
          permissions: [],
          settingsSchema: [
            { key: 'enabled', label: 'Enable Feature', type: 'boolean', default: false, description: 'Enable this feature' },
          ],
        },
        status: 'active',
        path: '/p',
        settings: { enabled: false },
      }];
      render(<PluginManager />);
      fireEvent.click(screen.getByText('Settings Plugin'));
      // Settings checkbox is at index 1 (after the toggle checkbox)
      const checkboxes = screen.getAllByRole('checkbox');
      const settingsCheckbox = checkboxes[1];
      fireEvent.click(settingsCheckbox);
      await waitFor(() => {
        expect(mockUpdateSetting).toHaveBeenCalledWith('s1', 'enabled', true);
      });
    });

    it('handles text setting change', async () => {
      mockPlugins = [{
        id: 's1',
        manifest: {
          displayName: 'Settings Plugin',
          version: '1.0.0',
          permissions: [],
          settingsSchema: [
            { key: 'name', label: 'Name', type: 'string', default: '' },
          ],
        },
        status: 'active',
        path: '/p',
        settings: { name: '' },
      }];
      render(<PluginManager />);
      fireEvent.click(screen.getByText('Settings Plugin'));
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });
      await waitFor(() => {
        expect(mockUpdateSetting).toHaveBeenCalledWith('s1', 'name', 'test');
      });
    });

    it('handles number setting change', async () => {
      mockPlugins = [{
        id: 's1',
        manifest: {
          displayName: 'Settings Plugin',
          version: '1.0.0',
          permissions: [],
          settingsSchema: [
            { key: 'count', label: 'Count', type: 'number', default: 0 },
          ],
        },
        status: 'active',
        path: '/p',
        settings: { count: 0 },
      }];
      render(<PluginManager />);
      fireEvent.click(screen.getByText('Settings Plugin'));
      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '5' } });
      await waitFor(() => {
        expect(mockUpdateSetting).toHaveBeenCalledWith('s1', 'count', 5);
      });
    });

    it('handles select setting change', async () => {
      mockPlugins = [{
        id: 's1',
        manifest: {
          displayName: 'Settings Plugin',
          version: '1.0.0',
          permissions: [],
          settingsSchema: [
            {
              key: 'theme',
              label: 'Theme',
              type: 'select',
              default: 'light',
              options: [{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }],
            },
          ],
        },
        status: 'active',
        path: '/p',
        settings: { theme: 'light' },
      }];
      render(<PluginManager />);
      fireEvent.click(screen.getByText('Settings Plugin'));
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'dark' } });
      await waitFor(() => {
        expect(mockUpdateSetting).toHaveBeenCalledWith('s1', 'theme', 'dark');
      });
    });

    it('disables settings when plugin is not active', () => {
      mockPlugins = [{
        id: 's1',
        manifest: {
          displayName: 'Settings Plugin',
          version: '1.0.0',
          permissions: [],
          settingsSchema: [
            { key: 'name', label: 'Name', type: 'string', default: '' },
          ],
        },
        status: 'installed',
        path: '/p',
        settings: { name: '' },
      }];
      render(<PluginManager />);
      fireEvent.click(screen.getByText('Settings Plugin'));
      const input = screen.getByRole('textbox');
      expect(input).toHaveProperty('disabled', true);
    });
  });

  describe('styling', () => {
    it('has overflow-auto container', () => {
      const { container } = render(<PluginManager />);
      expect(container.innerHTML).toContain('overflow-auto');
    });

    it('has max-width container', () => {
      const { container } = render(<PluginManager />);
      expect(container.innerHTML).toContain('max-w-4xl');
    });

    it('has padding', () => {
      const { container } = render(<PluginManager />);
      expect(container.innerHTML).toContain('p-6');
    });
  });
});
