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
});
