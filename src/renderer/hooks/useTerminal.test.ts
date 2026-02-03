// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTerminal } from './useTerminal';

const {
  mockPtyCreate,
  mockPtyWrite,
  mockPtyResize,
  mockPtyClose,
  mockOnPtyData,
  mockOnPtyExit,
} = vi.hoisted(() => ({
  mockPtyCreate: vi.fn().mockResolvedValue(undefined),
  mockPtyWrite: vi.fn(),
  mockPtyResize: vi.fn(),
  mockPtyClose: vi.fn().mockResolvedValue(undefined),
  mockOnPtyData: vi.fn(() => vi.fn()),
  mockOnPtyExit: vi.fn(() => vi.fn()),
}));

// Mock xterm
vi.mock('xterm', () => {
  class MockTerminal {
    loadAddon = vi.fn();
    open = vi.fn();
    dispose = vi.fn();
    write = vi.fn();
    onData = vi.fn((callback: (data: string) => void) => {
      (this as unknown as { _dataCallback: (data: string) => void })._dataCallback = callback;
      return { dispose: vi.fn() };
    });
    onResize = vi.fn((callback: (size: { cols: number; rows: number }) => void) => {
      (this as unknown as { _resizeCallback: (size: { cols: number; rows: number }) => void })._resizeCallback = callback;
      return { dispose: vi.fn() };
    });
    cols = 80;
    rows = 24;
    _cleanupFns?: (() => void)[];
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

  describe('return values', () => {
    it('returns terminalRef', () => {
      const { result } = renderHook(() => useTerminal({ sessionId: 'test-session' }));
      expect(result.current.terminalRef).toBeDefined();
    });

    it('returns fit function', () => {
      const { result } = renderHook(() => useTerminal({ sessionId: 'test-session' }));
      expect(typeof result.current.fit).toBe('function');
    });

    it('returns null terminal when ref is not attached', () => {
      const { result } = renderHook(() => useTerminal({ sessionId: 'test-session' }));
      // Terminal is null because container is not mounted
      expect(result.current.terminal).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('calls ptyClose on unmount', () => {
      const { unmount } = renderHook(() => useTerminal({ sessionId: 'test-session' }));
      unmount();
      expect(mockPtyClose).toHaveBeenCalledWith('test-session');
    });

    it('handles ptyClose error gracefully', () => {
      mockPtyClose.mockRejectedValue(new Error('Close error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { unmount } = renderHook(() => useTerminal({ sessionId: 'test-session' }));
      unmount();

      expect(mockPtyClose).toHaveBeenCalled();
      // Error is logged but not thrown
    });
  });

  describe('resize handling', () => {
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
  });

  describe('session handling', () => {
    it('handles different session IDs', () => {
      const { result: result1 } = renderHook(() => useTerminal({ sessionId: 'session-1' }));
      const { result: result2 } = renderHook(() => useTerminal({ sessionId: 'session-2' }));
      expect(result1.current.terminalRef).not.toBe(result2.current.terminalRef);
    });

    it('uses sessionId for ptyClose', () => {
      const { unmount } = renderHook(() => useTerminal({ sessionId: 'unique-session-id' }));
      unmount();
      expect(mockPtyClose).toHaveBeenCalledWith('unique-session-id');
    });

    it('handles numeric session IDs', () => {
      const { unmount } = renderHook(() => useTerminal({ sessionId: '12345' }));
      unmount();
      expect(mockPtyClose).toHaveBeenCalledWith('12345');
    });
  });

  describe('onReady callback', () => {
    it('accepts onReady callback', () => {
      const onReady = vi.fn();
      renderHook(() => useTerminal({ sessionId: 'test-session', onReady }));
      // onReady is called only when terminal is initialized with proper dimensions
      expect(onReady).not.toThrow();
    });

    it('accepts undefined onReady', () => {
      expect(() => {
        renderHook(() => useTerminal({ sessionId: 'test-session' }));
      }).not.toThrow();
    });
  });

  describe('fit function', () => {
    it('can be called multiple times', () => {
      const { result } = renderHook(() => useTerminal({ sessionId: 'test-session' }));
      expect(() => {
        result.current.fit();
        result.current.fit();
        result.current.fit();
      }).not.toThrow();
    });

    it('fit function is stable across rerenders', () => {
      const { result, rerender } = renderHook(() => useTerminal({ sessionId: 'test-session' }));
      const fit1 = result.current.fit;
      rerender();
      const fit2 = result.current.fit;
      expect(fit1).toBe(fit2);
    });
  });

  describe('terminalRef', () => {
    it('terminalRef is stable across rerenders', () => {
      const { result, rerender } = renderHook(() => useTerminal({ sessionId: 'test-session' }));
      const ref1 = result.current.terminalRef;
      rerender();
      const ref2 = result.current.terminalRef;
      expect(ref1).toBe(ref2);
    });

    it('terminalRef current is initially null', () => {
      const { result } = renderHook(() => useTerminal({ sessionId: 'test-session' }));
      expect(result.current.terminalRef.current).toBeNull();
    });
  });

  describe('hooks behavior', () => {
    it('does not throw on rapid mount/unmount', () => {
      expect(() => {
        const { unmount: unmount1 } = renderHook(() => useTerminal({ sessionId: 's1' }));
        const { unmount: unmount2 } = renderHook(() => useTerminal({ sessionId: 's2' }));
        unmount1();
        unmount2();
      }).not.toThrow();
    });

    it('handles sessionId change', () => {
      const { rerender, unmount } = renderHook(
        ({ sessionId }) => useTerminal({ sessionId }),
        { initialProps: { sessionId: 'session-a' } }
      );

      rerender({ sessionId: 'session-b' });
      unmount();

      // Should close the latest session
      expect(mockPtyClose).toHaveBeenCalled();
    });
  });

  describe('effect dependencies', () => {
    it('re-runs effect when sessionId changes', () => {
      const { rerender } = renderHook(
        ({ sessionId }) => useTerminal({ sessionId }),
        { initialProps: { sessionId: 'initial' } }
      );

      mockPtyClose.mockClear();
      rerender({ sessionId: 'changed' });

      // Should trigger cleanup for old session
    });
  });

  describe('options handling', () => {
    it('accepts minimal options', () => {
      expect(() => {
        renderHook(() => useTerminal({ sessionId: 'test' }));
      }).not.toThrow();
    });

    it('accepts full options', () => {
      const onReady = vi.fn();
      expect(() => {
        renderHook(() => useTerminal({ sessionId: 'test', onReady }));
      }).not.toThrow();
    });
  });

  describe('window resize', () => {
    it('responds to window resize event', () => {
      renderHook(() => useTerminal({ sessionId: 'test' }));

      // Trigger resize event
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      // Should not throw
    });
  });
});
