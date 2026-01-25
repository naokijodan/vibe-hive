import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface AgentOutputPanelProps {
  taskId: string;
  taskTitle: string;
  isActive?: boolean;
  onAgentExit?: (taskId: string, exitCode: number) => void;
}

export const AgentOutputPanel: React.FC<AgentOutputPanelProps> = ({
  taskId,
  taskTitle,
  isActive = false,
  onAgentExit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const sessionId = `agent-${taskId}`;

  const initTerminal = useCallback(async () => {
    if (!containerRef.current) return;
    if (terminalRef.current) {
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
      disableStdin: true, // Agent output is read-only
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.open(containerRef.current);

    setTimeout(() => {
      fitAddon.fit();
    }, 100);

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Welcome message
    terminal.write(`\x1b[32m🤖 タスク実行中: ${taskTitle}\x1b[0m\r\n`);
    terminal.write('\x1b[90m' + '─'.repeat(50) + '\x1b[0m\r\n\r\n');

    // Listen for agent output
    if (typeof window !== 'undefined' && window.electronAPI?.onAgentOutput) {
      const unsubscribeOutput = window.electronAPI.onAgentOutput((sid: string, data: string) => {
        if (sid === sessionId && terminalRef.current) {
          setIsConnected(true);
          terminalRef.current.write(data);
        }
      });

      const unsubscribeExit = window.electronAPI.onAgentExit((sid: string, exitCode: number) => {
        if (sid === sessionId && terminalRef.current) {
          const statusColor = exitCode === 0 ? '\x1b[32m' : '\x1b[31m';
          const statusText = exitCode === 0 ? '完了' : 'エラー';
          terminalRef.current.write(`\r\n\r\n${statusColor}[Agent ${statusText} - Exit Code: ${exitCode}]\x1b[0m\r\n`);

          // Notify parent component
          onAgentExit?.(taskId, exitCode);
        }
      });

      const unsubscribeError = window.electronAPI.onAgentError((sid: string, error: string) => {
        if (sid === sessionId && terminalRef.current) {
          terminalRef.current.write(`\r\n\x1b[31m[Error: ${error}]\x1b[0m\r\n`);
        }
      });

      // Store cleanup functions
      (terminal as unknown as { _cleanup: (() => void)[] })._cleanup = [
        unsubscribeOutput,
        unsubscribeExit,
        unsubscribeError,
      ];
    }
  }, [taskId, taskTitle, sessionId, onAgentExit]);

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
    };
  }, [initTerminal, handleResize]);

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
              isActive ? 'bg-green-500 animate-pulse' : isConnected ? 'bg-blue-500' : 'bg-gray-500'
            }`}
          />
          <span className="text-sm font-medium text-gray-300">🤖 {taskTitle}</span>
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
