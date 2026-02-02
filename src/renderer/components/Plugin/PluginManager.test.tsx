// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PluginManager } from './PluginManager';

const mockLoadPlugins = vi.fn();
const mockLoadPluginsDir = vi.fn();
const mockActivatePlugin = vi.fn();
const mockDeactivatePlugin = vi.fn();
const mockRefreshPlugins = vi.fn();

vi.mock('../../stores/pluginStore', () => ({
  usePluginStore: () => ({
    plugins: [
      { id: 'p1', manifest: { displayName: 'Test Plugin', version: '1.0.0', description: 'A plugin', author: 'Dev', permissions: ['fs'] }, status: 'installed', path: '/p', settings: {} },
      { id: 'p2', manifest: { displayName: 'Active Plugin', version: '2.0.0', description: 'Active', author: 'Dev', permissions: [] }, status: 'active', path: '/p2', settings: {} },
    ],
    pluginsDir: '/plugins',
    isLoading: false,
    error: null,
    loadPlugins: mockLoadPlugins,
    activatePlugin: mockActivatePlugin,
    deactivatePlugin: mockDeactivatePlugin,
    updateSetting: vi.fn(),
    refreshPlugins: mockRefreshPlugins,
    loadPluginsDir: mockLoadPluginsDir,
  }),
}));

describe('PluginManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads plugins on mount', () => {
    render(<PluginManager />);
    expect(mockLoadPlugins).toHaveBeenCalled();
    expect(mockLoadPluginsDir).toHaveBeenCalled();
  });

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

  it('shows plugins directory', () => {
    render(<PluginManager />);
    expect(screen.getByText('/plugins')).toBeDefined();
  });

  it('has refresh button', () => {
    render(<PluginManager />);
    const refreshBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('Refresh') || b.textContent?.includes('更新'));
    expect(refreshBtn).toBeDefined();
  });
});
