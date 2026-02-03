// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

const {
  mockOnAgentOutput,
  mockOnAgentExit,
  mockOnAgentError,
  mockOnAgentLoading,
  mockOnAgentTaskComplete,
  mockAgentInput,
  mockAgentResize,
  mockAppendOutput,
  mockGetOutput,
  mockClearOutput,
} = vi.hoisted(() => ({
  mockOnAgentOutput: vi.fn(),
  mockOnAgentExit: vi.fn(),
  mockOnAgentError: vi.fn(),
  mockOnAgentLoading: vi.fn(),
  mockOnAgentTaskComplete: vi.fn(),
  mockAgentInput: vi.fn(),
  mockAgentResize: vi.fn(),
  mockAppendOutput: vi.fn(),
  mockGetOutput: vi.fn(() => []),
  mockClearOutput: vi.fn(),
}));

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  } as unknown as typeof ResizeObserver;

  // Setup window.electronAPI
  (window as any).electronAPI = {
    onAgentOutput: mockOnAgentOutput,
    onAgentExit: mockOnAgentExit,
    onAgentError: mockOnAgentError,
    onAgentLoading: mockOnAgentLoading,
    onAgentTaskComplete: mockOnAgentTaskComplete,
    agentInput: mockAgentInput,
    agentResize: mockAgentResize,
  };
});

vi.mock('xterm', () => {
  class MockTerminal {
    loadAddon = vi.fn();
    open = vi.fn();
    dispose = vi.fn();
    focus = vi.fn();
    onData = vi.fn(() => ({ dispose: vi.fn() }));
    write = vi.fn();
    writeln = vi.fn();
    clear = vi.fn();
    scrollToBottom = vi.fn();
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

vi.mock('../../stores/terminalOutputStore', () => {
  const state = {
    getOutput: mockGetOutput,
    appendOutput: mockAppendOutput,
    clearOutput: mockClearOutput,
  };
  const fn = (selector: (s: typeof state) => unknown) => selector(state);
  fn.getState = () => state;
  return { useTerminalOutputStore: fn };
});

import { AgentOutputPanel } from './AgentOutputPanel';

describe('AgentOutputPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOutput.mockReturnValue([]);
    // Setup unsubscribe functions for IPC listeners
    mockOnAgentOutput.mockReturnValue(() => {});
    mockOnAgentExit.mockReturnValue(() => {});
    mockOnAgentError.mockReturnValue(() => {});
    mockOnAgentLoading.mockReturnValue(() => {});
    mockOnAgentTaskComplete.mockReturnValue(() => {});
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<AgentOutputPanel taskId="t1" taskTitle="Test Task" />);
      expect(container.innerHTML).not.toBe('');
    });

    it('displays task title', () => {
      render(<AgentOutputPanel taskId="t1" taskTitle="My Test Task" />);
      expect(screen.getByText(/My Test Task/)).toBeTruthy();
    });

    it('shows robot emoji for normal mode', () => {
      render(<AgentOutputPanel taskId="t1" taskTitle="Test" />);
      expect(screen.getByText(/🤖/)).toBeTruthy();
    });

    it('shows document emoji for read-only mode', () => {
      render(<AgentOutputPanel taskId="t1" taskTitle="Test" isReadOnly={true} />);
      expect(screen.getByText(/📄/)).toBeTruthy();
    });

    it('shows read-only badge when isReadOnly', () => {
      render(<AgentOutputPanel taskId="t1" taskTitle="Test" isReadOnly={true} />);
      expect(screen.getByText('読み取り専用')).toBeTruthy();
    });

    it('does not show read-only badge when not isReadOnly', () => {
      render(<AgentOutputPanel taskId="t1" taskTitle="Test" isReadOnly={false} />);
      expect(screen.queryByText('読み取り専用')).toBeNull();
    });
  });

  describe('status indicator', () => {
    it('shows gray indicator when not connected and not active', () => {
      const { container } = render(<AgentOutputPanel taskId="t1" taskTitle="Test" isActive={false} />);
      expect(container.innerHTML).toContain('bg-gray-500');
    });

    it('shows green pulsing indicator when active', () => {
      const { container } = render(<AgentOutputPanel taskId="t1" taskTitle="Test" isActive={true} />);
      expect(container.innerHTML).toContain('bg-green-500');
      expect(container.innerHTML).toContain('animate-pulse');
    });
  });

  describe('buttons', () => {
    it('renders scroll to bottom button', () => {
      render(<AgentOutputPanel taskId="t1" taskTitle="Test" />);
      expect(screen.getByTitle('最下部へスクロール')).toBeTruthy();
    });

    it('renders Clear button', () => {
      render(<AgentOutputPanel taskId="t1" taskTitle="Test" />);
      expect(screen.getByText('Clear')).toBeTruthy();
    });

    it('does not show Resume button when not read-only', () => {
      const mockResume = vi.fn();
      render(<AgentOutputPanel taskId="t1" taskTitle="Test" onResumeConversation={mockResume} />);
      expect(screen.queryByText('▶ 続ける')).toBeNull();
    });

    it('shows Resume button when read-only with callback', () => {
      const mockResume = vi.fn();
      render(
        <AgentOutputPanel
          taskId="t1"
          taskTitle="Test"
          isReadOnly={true}
          onResumeConversation={mockResume}
        />
      );
      expect(screen.getByText('▶ 続ける')).toBeTruthy();
    });

    it('calls onResumeConversation when Resume button clicked', () => {
      const mockResume = vi.fn();
      render(
        <AgentOutputPanel
          taskId="t1"
          taskTitle="Test"
          isReadOnly={true}
          onResumeConversation={mockResume}
        />
      );
      fireEvent.click(screen.getByText('▶ 続ける'));
      expect(mockResume).toHaveBeenCalledWith('t1');
    });

    it('does not show Resume button when no callback provided', () => {
      render(
        <AgentOutputPanel
          taskId="t1"
          taskTitle="Test"
          isReadOnly={true}
        />
      );
      expect(screen.queryByText('▶ 続ける')).toBeNull();
    });
  });

  describe('loading state', () => {
    it('shows loading overlay when isLoading and not read-only', () => {
      render(<AgentOutputPanel taskId="t1" taskTitle="Test" isReadOnly={false} />);
      expect(screen.getByText('Claude Code を起動中...')).toBeTruthy();
    });

    it('does not show loading overlay when read-only', () => {
      render(<AgentOutputPanel taskId="t1" taskTitle="Test" isReadOnly={true} />);
      expect(screen.queryByText('Claude Code を起動中...')).toBeNull();
    });

    it('shows spinner in loading overlay', () => {
      const { container } = render(<AgentOutputPanel taskId="t1" taskTitle="Test" isReadOnly={false} />);
      expect(container.innerHTML).toContain('animate-spin');
    });
  });

  describe('unmounting', () => {
    it('cleans up on unmount', () => {
      const { unmount } = render(<AgentOutputPanel taskId="t1" taskTitle="Test" />);
      unmount();
      // Should not throw errors during cleanup
    });
  });

  describe('container click', () => {
    it('renders clickable container area', () => {
      const { container } = render(<AgentOutputPanel taskId="t1" taskTitle="Test" />);
      const terminalContainer = container.querySelector('.absolute.inset-0');
      expect(terminalContainer).toBeTruthy();
    });
  });

  describe('props', () => {
    it('accepts all props without error', () => {
      const mockExit = vi.fn();
      const mockComplete = vi.fn();
      const mockResume = vi.fn();

      const { container } = render(
        <AgentOutputPanel
          taskId="t1"
          taskTitle="Test Task"
          isActive={true}
          isReadOnly={false}
          onAgentExit={mockExit}
          onTaskComplete={mockComplete}
          onResumeConversation={mockResume}
        />
      );
      expect(container.innerHTML).not.toBe('');
    });

    it('accepts taskId prop', () => {
      const { container } = render(<AgentOutputPanel taskId="unique-task-id" taskTitle="Test" />);
      expect(container.innerHTML).not.toBe('');
    });

    it('defaults isActive to false', () => {
      const { container } = render(<AgentOutputPanel taskId="t1" taskTitle="Test" />);
      expect(container.innerHTML).not.toContain('bg-green-500');
    });

    it('defaults isReadOnly to false', () => {
      render(<AgentOutputPanel taskId="t1" taskTitle="Test" />);
      expect(screen.queryByText('読み取り専用')).toBeNull();
    });
  });

  describe('header elements', () => {
    it('renders header with border', () => {
      const { container } = render(<AgentOutputPanel taskId="t1" taskTitle="Test" />);
      expect(container.innerHTML).toContain('border-gray-800');
    });

    it('renders terminal container', () => {
      const { container } = render(<AgentOutputPanel taskId="t1" taskTitle="Test" />);
      expect(container.querySelector('.flex-1')).toBeTruthy();
    });

    it('renders header background', () => {
      const { container } = render(<AgentOutputPanel taskId="t1" taskTitle="Test" />);
      expect(container.innerHTML).toContain('bg-gray-900');
    });
  });

  describe('different taskIds', () => {
    it('handles different taskIds', () => {
      const { rerender } = render(<AgentOutputPanel taskId="t1" taskTitle="Task 1" />);
      expect(screen.getByText(/Task 1/)).toBeTruthy();

      rerender(<AgentOutputPanel taskId="t2" taskTitle="Task 2" />);
      expect(screen.getByText(/Task 2/)).toBeTruthy();
    });

    it('handles numeric taskIds in string form', () => {
      render(<AgentOutputPanel taskId="123" taskTitle="Numeric Task" />);
      expect(screen.getByText(/Numeric Task/)).toBeTruthy();
    });

    it('handles taskIds with special characters', () => {
      render(<AgentOutputPanel taskId="task-with-dashes_and_underscores" taskTitle="Special Task" />);
      expect(screen.getByText(/Special Task/)).toBeTruthy();
    });
  });

  describe('main container styling', () => {
    it('has full height class', () => {
      const { container } = render(<AgentOutputPanel taskId="t1" taskTitle="Test" />);
      expect(container.innerHTML).toContain('h-full');
    });

    it('has flex column layout', () => {
      const { container } = render(<AgentOutputPanel taskId="t1" taskTitle="Test" />);
      expect(container.innerHTML).toContain('flex-col');
    });

    it('has dark background', () => {
      const { container } = render(<AgentOutputPanel taskId="t1" taskTitle="Test" />);
      expect(container.innerHTML).toContain('bg-[#0d1117]');
    });
  });

  describe('header layout', () => {
    it('has flex layout in header', () => {
      const { container } = render(<AgentOutputPanel taskId="t1" taskTitle="Test" />);
      expect(container.innerHTML).toContain('items-center');
      expect(container.innerHTML).toContain('justify-between');
    });

    it('has padding in header', () => {
      const { container } = render(<AgentOutputPanel taskId="t1" taskTitle="Test" />);
      expect(container.innerHTML).toContain('px-3');
      expect(container.innerHTML).toContain('py-2');
    });
  });

  describe('button styling', () => {
    it('has hover styles on buttons', () => {
      const { container } = render(<AgentOutputPanel taskId="t1" taskTitle="Test" />);
      expect(container.innerHTML).toContain('hover:bg-gray-800');
    });

    it('resume button has green styling', () => {
      const mockResume = vi.fn();
      const { container } = render(
        <AgentOutputPanel
          taskId="t1"
          taskTitle="Test"
          isReadOnly={true}
          onResumeConversation={mockResume}
        />
      );
      expect(container.innerHTML).toContain('bg-green-600');
    });
  });

  describe('status indicator styling', () => {
    it('has rounded indicator', () => {
      const { container } = render(<AgentOutputPanel taskId="t1" taskTitle="Test" />);
      expect(container.innerHTML).toContain('rounded-full');
    });

    it('has small indicator size', () => {
      const { container } = render(<AgentOutputPanel taskId="t1" taskTitle="Test" />);
      expect(container.innerHTML).toContain('w-2');
      expect(container.innerHTML).toContain('h-2');
    });
  });

  describe('terminal area', () => {
    it('has relative positioning', () => {
      const { container } = render(<AgentOutputPanel taskId="t1" taskTitle="Test" />);
      expect(container.innerHTML).toContain('relative');
    });

    it('has overflow hidden', () => {
      const { container } = render(<AgentOutputPanel taskId="t1" taskTitle="Test" />);
      expect(container.innerHTML).toContain('overflow-hidden');
    });
  });
});
