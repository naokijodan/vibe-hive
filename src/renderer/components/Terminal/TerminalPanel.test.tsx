// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { TerminalPanel } from './TerminalPanel';

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  } as any;
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

describe('TerminalPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<TerminalPanel />);
    expect(container.innerHTML).not.toBe('');
  });

  it('renders with custom agent name', () => {
    const { container } = render(<TerminalPanel agentName="Test Agent" agentId="a1" />);
    expect(container.innerHTML).not.toBe('');
  });

  it('renders terminal container', () => {
    const { container } = render(<TerminalPanel />);
    const terminalDiv = container.querySelector('div');
    expect(terminalDiv).not.toBeNull();
  });

  it('renders with session ID', () => {
    const { container } = render(<TerminalPanel sessionId="s1" />);
    expect(container.innerHTML).not.toBe('');
  });
});
