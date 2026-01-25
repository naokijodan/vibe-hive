import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface UseTerminalOptions {
  sessionId: string;
  onReady?: () => void;
}

export function useTerminal({ sessionId, onReady }: UseTerminalOptions) {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const isInitializedRef = useRef(false);

  const initTerminal = useCallback(async () => {
    if (!terminalRef.current || isInitializedRef.current) return;

    // Create xterm instance
    const terminal = new Terminal({
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#f0b429',
        cursorAccent: '#0d1117',
        selectionBackground: '#3b82f6',
        black: '#0d1117',
        red: '#ff7b72',
        green: '#7ee787',
        yellow: '#f0b429',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39c5cf',
        white: '#c9d1d9',
        brightBlack: '#6e7681',
        brightRed: '#ffa198',
        brightGreen: '#a5f2b8',
        brightYellow: '#f8e3a1',
        brightBlue: '#79c0ff',
        brightMagenta: '#d2a8ff',
        brightCyan: '#56d4dd',
        brightWhite: '#ffffff',
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;
    isInitializedRef.current = true;

    // Create PTY session
    try {
      const { cols, rows } = terminal;
      await window.electronAPI.ptyCreate(sessionId, cols, rows);

      // Send input to PTY
      terminal.onData((data: string) => {
        window.electronAPI.ptyWrite(sessionId, data);
      });

      // Handle resize
      terminal.onResize(({ cols, rows }) => {
        window.electronAPI.ptyResize(sessionId, cols, rows);
      });

      // Listen for PTY data
      const unsubscribeData = window.electronAPI.onPtyData((sid: string, data: string) => {
        if (sid === sessionId && xtermRef.current) {
          xtermRef.current.write(data);
        }
      });

      // Listen for PTY exit
      const unsubscribeExit = window.electronAPI.onPtyExit((sid: string, exitCode: number) => {
        if (sid === sessionId && xtermRef.current) {
          xtermRef.current.write(`\r\n\x1b[33m[Process exited with code ${exitCode}]\x1b[0m\r\n`);
        }
      });

      // Store cleanup functions
      (terminal as unknown as { _cleanupFns: (() => void)[] })._cleanupFns = [
        unsubscribeData,
        unsubscribeExit,
      ];

      onReady?.();
    } catch (error) {
      console.error('Failed to create PTY session:', error);
      terminal.write('\x1b[31mFailed to create terminal session\x1b[0m\r\n');
    }
  }, [sessionId, onReady]);

  // Handle resize
  const handleResize = useCallback(() => {
    if (fitAddonRef.current && xtermRef.current) {
      fitAddonRef.current.fit();
    }
  }, []);

  useEffect(() => {
    initTerminal();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      // Cleanup
      if (xtermRef.current) {
        const cleanupFns = (xtermRef.current as unknown as { _cleanupFns?: (() => void)[] })._cleanupFns;
        cleanupFns?.forEach((fn) => fn());
        xtermRef.current.dispose();
      }

      // Close PTY session
      window.electronAPI.ptyClose(sessionId).catch(console.error);
    };
  }, [initTerminal, handleResize, sessionId]);

  return {
    terminalRef,
    terminal: xtermRef.current,
    fit: handleResize,
  };
}
