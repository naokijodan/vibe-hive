import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface TerminalPanelProps {
  agentId?: string;
  agentName?: string;
  isActive?: boolean;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  agentId = 'default',
  agentName = 'Terminal',
  isActive = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isReady, setIsReady] = useState(false);
  const sessionId = `pty-${agentId}`;

  const initTerminal = useCallback(async () => {
    // Prevent re-initialization if terminal already exists
    if (!containerRef.current) return;
    if (terminalRef.current) {
      // Terminal exists, just refocus
      terminalRef.current.focus();
      return;
    }

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

    terminal.open(containerRef.current);

    // Delay fit to ensure container is sized
    setTimeout(() => {
      fitAddon.fit();
    }, 100);

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Check if electronAPI is available
    if (typeof window !== 'undefined' && window.electronAPI?.ptyCreate) {
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
          if (sid === sessionId && terminalRef.current) {
            terminalRef.current.write(data);
          }
        });

        // Listen for PTY exit
        const unsubscribeExit = window.electronAPI.onPtyExit((sid: string, exitCode: number) => {
          if (sid === sessionId && terminalRef.current) {
            terminalRef.current.write(`\r\n\x1b[33m[Process exited with code ${exitCode}]\x1b[0m\r\n`);
          }
        });

        // Store cleanup functions
        (terminal as unknown as { _cleanup: (() => void)[] })._cleanup = [
          unsubscribeData,
          unsubscribeExit,
        ];

        setIsReady(true);
      } catch (error) {
        console.error('Failed to create PTY session:', error);
        terminal.write('\x1b[31mFailed to create terminal session\x1b[0m\r\n');
        terminal.write('\x1b[33mRunning in demo mode...\x1b[0m\r\n\r\n');
        terminal.write(`\x1b[32m🐝 Vibe Hive Terminal - ${agentName}\x1b[0m\r\n`);
        terminal.write('\x1b[90m' + '─'.repeat(40) + '\x1b[0m\r\n\r\n');
      }
    } else {
      // Demo mode when not in Electron
      terminal.write(`\x1b[32m🐝 Vibe Hive Terminal - ${agentName}\x1b[0m\r\n`);
      terminal.write('\x1b[90m' + '─'.repeat(40) + '\x1b[0m\r\n\r\n');
      terminal.write('\x1b[33m[Demo Mode - PTY not available]\x1b[0m\r\n\r\n');
      terminal.write('$ ');

      terminal.onData((data: string) => {
        // Echo input in demo mode
        if (data === '\r') {
          terminal.write('\r\n$ ');
        } else if (data === '\x7f') {
          // Backspace
          terminal.write('\b \b');
        } else {
          terminal.write(data);
        }
      });
    }
  }, [agentName, sessionId]);

  // Handle resize
  const handleResize = useCallback(() => {
    if (fitAddonRef.current) {
      fitAddonRef.current.fit();
    }
  }, []);

  useEffect(() => {
    initTerminal();

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      // Note: Don't dispose terminal or close PTY on unmount
      // This allows the session to persist across tab switches
      // The session will be closed when the app closes (via PtyService.closeAll)
    };
  }, [initTerminal, handleResize]);

  // Focus terminal when clicking container
  const handleClick = () => {
    terminalRef.current?.focus();
  };

  return (
    <div className="h-full flex flex-col bg-[#0d1117]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isActive ? 'bg-green-500 animate-pulse' : isReady ? 'bg-blue-500' : 'bg-gray-500'
            }`}
          />
          <span className="text-sm font-medium text-gray-300">{agentName}</span>
          {agentId && (
            <span className="text-xs text-gray-500">({agentId})</span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => terminalRef.current?.clear()}
            className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-gray-300"
          >
            <span className="text-xs">Clear</span>
          </button>
        </div>
      </div>

      {/* Terminal Container */}
      <div
        ref={containerRef}
        className="flex-1 p-1"
        onClick={handleClick}
        style={{ minHeight: '200px' }}
      />
    </div>
  );
};
