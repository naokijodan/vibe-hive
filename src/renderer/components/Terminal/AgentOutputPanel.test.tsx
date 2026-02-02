// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

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
    clear = vi.fn();
  }
  return { Terminal: MockTerminal };
});

vi.mock('xterm-addon-fit', () => {
  class MockFitAddon { fit = vi.fn(); }
  return { FitAddon: MockFitAddon };
});

vi.mock('xterm/css/xterm.css', () => ({}));

vi.mock('../../stores/terminalOutputStore', () => {
  const state = {
    getOutput: vi.fn(() => ''),
    appendOutput: vi.fn(),
    clearOutput: vi.fn(),
  };
  const fn = () => state;
  fn.getState = () => state;
  return { useTerminalOutputStore: fn };
});

import { AgentOutputPanel } from './AgentOutputPanel';

describe('AgentOutputPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<AgentOutputPanel taskId="t1" taskTitle="Test" />);
    expect(container.innerHTML).not.toBe('');
  });
});
