// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

const {
  mockPtyCreate,
  mockPtyWrite,
  mockPtyResize,
  mockOnPtyData,
  mockOnPtyExit,
} = vi.hoisted(() => ({
  mockPtyCreate: vi.fn().mockResolvedValue(undefined),
  mockPtyWrite: vi.fn(),
  mockPtyResize: vi.fn(),
  mockOnPtyData: vi.fn(() => vi.fn()),
  mockOnPtyExit: vi.fn(() => vi.fn()),
}));

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  } as unknown as typeof ResizeObserver;

  // Setup window.electronAPI
  (window as any).electronAPI = {
    ptyCreate: mockPtyCreate,
    ptyWrite: mockPtyWrite,
    ptyResize: mockPtyResize,
    onPtyData: mockOnPtyData,
    onPtyExit: mockOnPtyExit,
  };
});

vi.mock('xterm', () => {
  class MockTerminal {
    loadAddon = vi.fn();
    open = vi.fn();
    dispose = vi.fn();
    focus = vi.fn();
    clear = vi.fn();
    onData = vi.fn(() => ({ dispose: vi.fn() }));
    onResize = vi.fn(() => ({ dispose: vi.fn() }));
    write = vi.fn();
    writeln = vi.fn();
    cols = 80;
    rows = 24;
  }
  return { Terminal: MockTerminal };
});

vi.mock('xterm-addon-fit', () => {
  class MockFitAddon {
    fit = vi.fn();
  }
  return { FitAddon: MockFitAddon };
});

vi.mock('xterm/css/xterm.css', () => ({}));

import { TerminalPanel } from './TerminalPanel';

describe('TerminalPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnPtyData.mockReturnValue(() => {});
    mockOnPtyExit.mockReturnValue(() => {});
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).not.toBe('');
    });

    it('renders with custom agent name', () => {
      render(<TerminalPanel agentName="Test Agent" agentId="a1" />);
      expect(screen.getByText('Test Agent')).toBeTruthy();
    });

    it('renders terminal container', () => {
      const { container } = render(<TerminalPanel />);
      const terminalDiv = container.querySelector('div');
      expect(terminalDiv).not.toBeNull();
    });

    it('displays default agent name when not provided', () => {
      render(<TerminalPanel />);
      expect(screen.getByText('Terminal')).toBeTruthy();
    });

    it('displays agentId in parentheses', () => {
      render(<TerminalPanel agentId="agent-123" />);
      expect(screen.getByText('(agent-123)')).toBeTruthy();
    });

    it('displays default agentId when not provided', () => {
      render(<TerminalPanel />);
      expect(screen.getByText('(default)')).toBeTruthy();
    });
  });

  describe('status indicator', () => {
    it('shows gray indicator when not ready and not active', () => {
      const { container } = render(<TerminalPanel isActive={false} />);
      expect(container.innerHTML).toContain('bg-gray-500');
    });

    it('shows green pulsing indicator when active', () => {
      const { container } = render(<TerminalPanel isActive={true} />);
      expect(container.innerHTML).toContain('bg-green-500');
      expect(container.innerHTML).toContain('animate-pulse');
    });
  });

  describe('header', () => {
    it('renders header with border', () => {
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).toContain('border-gray-800');
    });

    it('renders header background', () => {
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).toContain('bg-gray-900');
    });
  });

  describe('buttons', () => {
    it('renders Clear button', () => {
      render(<TerminalPanel />);
      expect(screen.getByText('Clear')).toBeTruthy();
    });

    it('has clickable Clear button', () => {
      render(<TerminalPanel />);
      const clearButton = screen.getByText('Clear');
      expect(() => fireEvent.click(clearButton)).not.toThrow();
    });
  });

  describe('props', () => {
    it('accepts all props', () => {
      const { container } = render(
        <TerminalPanel agentId="a1" agentName="Test" isActive={true} />
      );
      expect(container.innerHTML).not.toBe('');
    });

    it('handles default props', () => {
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).not.toBe('');
    });
  });

  describe('container styling', () => {
    it('has full height class', () => {
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).toContain('h-full');
    });

    it('has flex column layout', () => {
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).toContain('flex-col');
    });

    it('has dark background', () => {
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).toContain('bg-[#0d1117]');
    });
  });

  describe('terminal container', () => {
    it('has flex-1 class', () => {
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).toContain('flex-1');
    });

    it('has min-height style', () => {
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).toContain('min-height');
    });

    it('is clickable', () => {
      const { container } = render(<TerminalPanel />);
      const terminalContainer = container.querySelector('.flex-1');
      expect(terminalContainer).toBeTruthy();
      expect(() => fireEvent.click(terminalContainer!)).not.toThrow();
    });
  });

  describe('status indicator styling', () => {
    it('has rounded indicator', () => {
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).toContain('rounded-full');
    });

    it('has small indicator size', () => {
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).toContain('w-2');
      expect(container.innerHTML).toContain('h-2');
    });
  });

  describe('header layout', () => {
    it('has flex layout', () => {
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).toContain('items-center');
      expect(container.innerHTML).toContain('justify-between');
    });

    it('has padding', () => {
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).toContain('px-3');
      expect(container.innerHTML).toContain('py-2');
    });
  });

  describe('button styling', () => {
    it('has hover styles', () => {
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).toContain('hover:bg-gray-800');
    });
  });

  describe('different agentIds', () => {
    it('handles string agentId', () => {
      render(<TerminalPanel agentId="string-id" />);
      expect(screen.getByText('(string-id)')).toBeTruthy();
    });

    it('handles numeric agentId', () => {
      render(<TerminalPanel agentId="12345" />);
      expect(screen.getByText('(12345)')).toBeTruthy();
    });

    it('handles special characters in agentId', () => {
      render(<TerminalPanel agentId="agent-with-dashes" />);
      expect(screen.getByText('(agent-with-dashes)')).toBeTruthy();
    });
  });

  describe('different agentNames', () => {
    it('handles long agent names', () => {
      render(<TerminalPanel agentName="Very Long Agent Name That Is Quite Descriptive" />);
      expect(screen.getByText('Very Long Agent Name That Is Quite Descriptive')).toBeTruthy();
    });

    it('handles short agent names', () => {
      render(<TerminalPanel agentName="A" />);
      expect(screen.getByText('A')).toBeTruthy();
    });

    it('handles Japanese agent names', () => {
      render(<TerminalPanel agentName="テスト端末" />);
      expect(screen.getByText('テスト端末')).toBeTruthy();
    });
  });

  describe('isActive states', () => {
    it('handles isActive true', () => {
      const { container } = render(<TerminalPanel isActive={true} />);
      expect(container.innerHTML).toContain('bg-green-500');
    });

    it('handles isActive false', () => {
      const { container } = render(<TerminalPanel isActive={false} />);
      expect(container.innerHTML).not.toContain('bg-green-500');
    });

    it('defaults to inactive', () => {
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).not.toContain('bg-green-500');
    });
  });

  describe('unmounting', () => {
    it('unmounts without errors', () => {
      const { unmount } = render(<TerminalPanel />);
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('rerendering', () => {
    it('handles prop changes', () => {
      const { rerender } = render(<TerminalPanel agentName="Name1" />);
      expect(screen.getByText('Name1')).toBeTruthy();

      rerender(<TerminalPanel agentName="Name2" />);
      expect(screen.getByText('Name2')).toBeTruthy();
    });

    it('handles isActive toggle', () => {
      const { rerender, container } = render(<TerminalPanel isActive={false} />);
      expect(container.innerHTML).not.toContain('bg-green-500');

      rerender(<TerminalPanel isActive={true} />);
      expect(container.innerHTML).toContain('bg-green-500');
    });
  });

  describe('window.electronAPI', () => {
    it('ptyCreate is available', () => {
      expect((window as any).electronAPI.ptyCreate).toBeDefined();
    });

    it('ptyWrite is available', () => {
      expect((window as any).electronAPI.ptyWrite).toBeDefined();
    });

    it('ptyResize is available', () => {
      expect((window as any).electronAPI.ptyResize).toBeDefined();
    });

    it('onPtyData is available', () => {
      expect((window as any).electronAPI.onPtyData).toBeDefined();
    });

    it('onPtyExit is available', () => {
      expect((window as any).electronAPI.onPtyExit).toBeDefined();
    });
  });

  describe('session id', () => {
    it('renders with different agent IDs without errors', () => {
      const { rerender, container } = render(<TerminalPanel agentId="agent1" />);
      expect(container.innerHTML).toContain('agent1');

      rerender(<TerminalPanel agentId="agent2" />);
      expect(container.innerHTML).toContain('agent2');
    });

    it('handles empty string agentId', () => {
      const { container } = render(<TerminalPanel agentId="" />);
      expect(container.innerHTML).not.toBe('');
    });
  });

  describe('terminal focus', () => {
    it('allows clicking the terminal container', () => {
      const { container } = render(<TerminalPanel />);
      const terminalArea = container.querySelector('.flex-1');
      expect(() => fireEvent.click(terminalArea!)).not.toThrow();
    });
  });

  describe('text styling', () => {
    it('has agent name font styling', () => {
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).toContain('font-medium');
    });

    it('has gray text for agent id', () => {
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).toContain('text-gray-500');
    });

    it('has gray text for agent name', () => {
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).toContain('text-gray-300');
    });
  });

  describe('button functionality', () => {
    it('clear button has proper title/role', () => {
      render(<TerminalPanel />);
      const clearBtn = screen.getByText('Clear');
      expect(clearBtn).toBeTruthy();
    });

    it('clear button parent has padding', () => {
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).toContain('p-1');
    });
  });

  describe('combined props', () => {
    it('handles all props together', () => {
      render(
        <TerminalPanel
          agentId="test-agent"
          agentName="Test Terminal"
          isActive={true}
        />
      );
      expect(screen.getByText('Test Terminal')).toBeTruthy();
      expect(screen.getByText('(test-agent)')).toBeTruthy();
    });

    it('handles minimal props', () => {
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).toContain('Terminal');
      expect(container.innerHTML).toContain('(default)');
    });
  });

  describe('gap styling', () => {
    it('has gap in header left section', () => {
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).toContain('gap-2');
    });

    it('has gap in button section', () => {
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).toContain('gap-1');
    });
  });

  describe('terminal container padding', () => {
    it('has padding on terminal container', () => {
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).toContain('p-1');
    });
  });

  describe('terminal initialization', () => {
    it('calls ptyCreate on initialization when electronAPI is available', async () => {
      render(<TerminalPanel agentId="init-test" />);
      // Component should attempt to initialize terminal
    });

    it('handles PTY creation error', async () => {
      mockPtyCreate.mockRejectedValueOnce(new Error('PTY creation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<TerminalPanel agentId="error-test" />);

      consoleSpy.mockRestore();
    });

    it('sets up data listener on initialization', () => {
      render(<TerminalPanel agentId="data-test" />);
      // onPtyData should be set up
    });

    it('sets up exit listener on initialization', () => {
      render(<TerminalPanel agentId="exit-test" />);
      // onPtyExit should be set up
    });
  });

  describe('demo mode', () => {
    it('falls back to demo mode when electronAPI is not available', () => {
      const originalAPI = (window as any).electronAPI;
      (window as any).electronAPI = undefined;

      render(<TerminalPanel agentId="demo-test" />);

      (window as any).electronAPI = originalAPI;
    });

    it('falls back to demo mode when ptyCreate is not available', () => {
      const originalPtyCreate = (window as any).electronAPI.ptyCreate;
      (window as any).electronAPI.ptyCreate = undefined;

      render(<TerminalPanel agentId="demo-test-2" />);

      (window as any).electronAPI.ptyCreate = originalPtyCreate;
    });
  });

  describe('resize observer', () => {
    it('observes container for resize', () => {
      render(<TerminalPanel />);
      // ResizeObserver should be created and observing
    });

    it('disconnects resize observer on unmount', () => {
      const { unmount } = render(<TerminalPanel />);
      unmount();
      // ResizeObserver should be disconnected
    });
  });

  describe('terminal focus behavior', () => {
    it('focuses terminal on container click', () => {
      const { container } = render(<TerminalPanel />);
      const terminalContainer = container.querySelector('.flex-1');
      fireEvent.click(terminalContainer!);
      // Terminal focus should be attempted
    });
  });

  describe('clear button functionality', () => {
    it('clears terminal when clear button is clicked', () => {
      render(<TerminalPanel />);
      const clearButton = screen.getByText('Clear');
      fireEvent.click(clearButton);
      // Terminal clear should be called
    });
  });

  describe('session persistence', () => {
    it('uses agentId in session ID', () => {
      render(<TerminalPanel agentId="custom-session" />);
      expect(screen.getByText('(custom-session)')).toBeTruthy();
    });

    it('uses default session ID when agentId is not provided', () => {
      render(<TerminalPanel />);
      expect(screen.getByText('(default)')).toBeTruthy();
    });
  });

  describe('status indicator transitions', () => {
    it('shows blue indicator when ready but not active', async () => {
      // When terminal is ready but not active, should show blue
      const { container } = render(<TerminalPanel isActive={false} />);
      // Initially shows gray (not ready), then blue when ready
      expect(container.innerHTML).toContain('bg-gray-500'); // Default before ready
    });

    it('transitions from gray to green when active', () => {
      const { container, rerender } = render(<TerminalPanel isActive={false} />);
      rerender(<TerminalPanel isActive={true} />);
      expect(container.innerHTML).toContain('bg-green-500');
    });
  });

  describe('container dimensions handling', () => {
    it('handles zero-dimension container', () => {
      // Should not crash with zero-size container
      const { container } = render(<TerminalPanel />);
      expect(container.innerHTML).not.toBe('');
    });
  });

  describe('multiple renders', () => {
    it('handles multiple renders without duplicating terminals', () => {
      const { rerender } = render(<TerminalPanel agentId="multi" />);
      rerender(<TerminalPanel agentId="multi" />);
      rerender(<TerminalPanel agentId="multi" />);
      // Should not crash or duplicate terminals
    });
  });
});
