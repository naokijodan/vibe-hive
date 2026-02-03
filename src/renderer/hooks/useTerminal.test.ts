// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTerminal } from './useTerminal';

// Mock xterm
vi.mock('xterm', () => {
  const mockOnData = vi.fn();
  const mockOnResize = vi.fn();
  class MockTerminal {
    loadAddon = vi.fn();
    open = vi.fn();
    dispose = vi.fn();
    write = vi.fn();
    onData = mockOnData;
    onResize = mockOnResize;
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

describe('useTerminal', () => {
  const mockPtyCreate = vi.fn().mockResolvedValue(undefined);
  const mockPtyWrite = vi.fn();
  const mockPtyResize = vi.fn();
  const mockPtyClose = vi.fn().mockResolvedValue(undefined);
  const mockOnPtyData = vi.fn(() => vi.fn());
  const mockOnPtyExit = vi.fn(() => vi.fn());

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window.electronAPI
    Object.defineProperty(window, 'electronAPI', {
      value: {
        ptyCreate: mockPtyCreate,
        ptyWrite: mockPtyWrite,
        ptyResize: mockPtyResize,
        ptyClose: mockPtyClose,
        onPtyData: mockOnPtyData,
        onPtyExit: mockOnPtyExit,
      },
      writable: true,
      configurable: true,
    });

    // Mock requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns terminalRef', () => {
    const { result } = renderHook(() => useTerminal({ sessionId: 'test-session' }));
    expect(result.current.terminalRef).toBeDefined();
  });

  it('returns fit function', () => {
    const { result } = renderHook(() => useTerminal({ sessionId: 'test-session' }));
    expect(typeof result.current.fit).toBe('function');
  });

  it('calls ptyClose on unmount', () => {
    const { unmount } = renderHook(() => useTerminal({ sessionId: 'test-session' }));
    unmount();
    expect(mockPtyClose).toHaveBeenCalledWith('test-session');
  });

  it('adds resize event listener', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    renderHook(() => useTerminal({ sessionId: 'test-session' }));
    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('removes resize event listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useTerminal({ sessionId: 'test-session' }));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('fit function does not throw when called', () => {
    const { result } = renderHook(() => useTerminal({ sessionId: 'test-session' }));
    expect(() => result.current.fit()).not.toThrow();
  });

  it('handles different session IDs', () => {
    const { result: result1 } = renderHook(() => useTerminal({ sessionId: 'session-1' }));
    const { result: result2 } = renderHook(() => useTerminal({ sessionId: 'session-2' }));
    expect(result1.current.terminalRef).not.toBe(result2.current.terminalRef);
  });

  it('accepts onReady callback', () => {
    const onReady = vi.fn();
    renderHook(() => useTerminal({ sessionId: 'test-session', onReady }));
    expect(onReady).not.toThrow();
  });
});
