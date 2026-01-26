import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { useTerminalOutputStore } from '../../stores/terminalOutputStore';

interface AgentOutputPanelProps {
  taskId: string;
  taskTitle: string;
  isActive?: boolean;
  isReadOnly?: boolean; // For viewing completed task output
  onAgentExit?: (taskId: string, exitCode: number) => void;
  onTaskComplete?: (taskId: string) => void;
}

export const AgentOutputPanel: React.FC<AgentOutputPanelProps> = ({
  taskId,
  taskTitle,
  isActive = false,
  isReadOnly = false,
  onAgentExit,
  onTaskComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const cleanupRef = useRef<(() => void)[]>([]);
  const initializedRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(!isReadOnly);
  const sessionId = `agent-${taskId}`;

  const { appendOutput, getOutput } = useTerminalOutputStore();

  const handleResize = useCallback(() => {
    if (fitAddonRef.current && terminalRef.current) {
      try {
        fitAddonRef.current.fit();
        // Sync PTY size with xterm size (only if not read-only)
        if (!isReadOnly) {
          const { cols, rows } = terminalRef.current;
          if (window.electronAPI?.agentResize) {
            window.electronAPI.agentResize(sessionId, cols, rows);
          }
        }
      } catch (e) {
        // Ignore fit errors during unmount
      }
    }
  }, [sessionId, isReadOnly]);

  useEffect(() => {
    // Prevent double initialization (React StrictMode)
    if (initializedRef.current || !containerRef.current) return;
    initializedRef.current = true;

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
      cursorBlink: !isReadOnly,
      cursorStyle: 'block',
      allowTransparency: true,
      disableStdin: isReadOnly, // Disable input for read-only mode
      convertEol: false, // Keep CR handling as-is for proper spinner behavior
      scrollback: 5000, // Increased scrollback buffer
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.open(containerRef.current);

    // Initial fit with delay to ensure container is sized
    setTimeout(() => {
      try {
        fitAddon.fit();
        // Initial PTY size sync (only if not read-only)
        if (!isReadOnly) {
          const { cols, rows } = terminal;
          if (window.electronAPI?.agentResize) {
            window.electronAPI.agentResize(sessionId, cols, rows);
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }, 100);

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Restore previous output from store
    const previousOutput = getOutput(sessionId);
    if (previousOutput.length > 0) {
      setIsConnected(true);
      setIsLoading(false);
      previousOutput.forEach(data => {
        terminal.write(data);
      });
      // Scroll to bottom after restoring
      terminal.scrollToBottom();
    }

    // Handle user input - send to agent (only if not read-only)
    if (!isReadOnly) {
      terminal.onData((data: string) => {
        if (window.electronAPI?.agentInput) {
          window.electronAPI.agentInput(sessionId, data);
        }
      });
    }

    // Listen for agent output
    if (typeof window !== 'undefined' && window.electronAPI?.onAgentOutput) {
      const unsubscribeOutput = window.electronAPI.onAgentOutput((sid: string, data: string) => {
        if (sid === sessionId && terminalRef.current) {
          setIsConnected(true);
          setIsLoading(false);
          terminalRef.current.write(data);
          // Save to store for persistence
          appendOutput(sessionId, data);
          // Auto-scroll to bottom
          terminalRef.current.scrollToBottom();
        }
      });

      const unsubscribeExit = window.electronAPI.onAgentExit((sid: string, exitCode: number) => {
        if (sid === sessionId && terminalRef.current) {
          const statusColor = exitCode === 0 ? '\x1b[32m' : '\x1b[31m';
          const statusText = exitCode === 0 ? '完了' : 'エラー';
          const exitMessage = `\r\n\r\n${statusColor}[Agent ${statusText} - Exit Code: ${exitCode}]\x1b[0m\r\n`;
          terminalRef.current.write(exitMessage);
          appendOutput(sessionId, exitMessage);

          // Notify parent component
          onAgentExit?.(taskId, exitCode);
        }
      });

      const unsubscribeError = window.electronAPI.onAgentError((sid: string, error: string) => {
        if (sid === sessionId && terminalRef.current) {
          const errorMessage = `\r\n\x1b[31m[Error: ${error}]\x1b[0m\r\n`;
          terminalRef.current.write(errorMessage);
          appendOutput(sessionId, errorMessage);
        }
      });

      // Listen for loading state changes
      const unsubscribeLoading = window.electronAPI.onAgentLoading((sid: string, loading: boolean) => {
        if (sid === sessionId) {
          setIsLoading(loading);
        }
      });

      // Listen for task completion
      const unsubscribeTaskComplete = window.electronAPI.onAgentTaskComplete((sid: string) => {
        if (sid === sessionId && terminalRef.current) {
          const completeMessage = '\r\n\x1b[33m[タスク完了 - 確認待ちに移動します]\x1b[0m\r\n';
          terminalRef.current.write(completeMessage);
          appendOutput(sessionId, completeMessage);
          onTaskComplete?.(taskId);
        }
      });

      // Store cleanup functions
      cleanupRef.current = [unsubscribeOutput, unsubscribeExit, unsubscribeError, unsubscribeLoading, unsubscribeTaskComplete];
    }

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      // Clean up IPC listeners
      cleanupRef.current.forEach(fn => fn());
      cleanupRef.current = [];
      // Dispose terminal
      if (terminalRef.current) {
        terminalRef.current.dispose();
        terminalRef.current = null;
      }
      initializedRef.current = false;
    };
  }, [taskId, sessionId, isReadOnly, onAgentExit, onTaskComplete, handleResize, appendOutput, getOutput]);

  const handleClick = () => {
    terminalRef.current?.focus();
  };

  const handleScrollToBottom = () => {
    terminalRef.current?.scrollToBottom();
  };

  return (
    <div className="h-full flex flex-col bg-[#0d1117]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 bg-gray-900 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isActive ? 'bg-green-500 animate-pulse' : isConnected ? 'bg-blue-500' : 'bg-gray-500'
            }`}
          />
          <span className="text-sm font-medium text-gray-300">
            {isReadOnly ? '📄' : '🤖'} {taskTitle}
          </span>
          {isReadOnly && (
            <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">読み取り専用</span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleScrollToBottom}
            className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-gray-300"
            title="最下部へスクロール"
          >
            <span className="text-xs">↓</span>
          </button>
          <button
            onClick={() => terminalRef.current?.clear()}
            className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-gray-300"
          >
            <span className="text-xs">Clear</span>
          </button>
        </div>
      </div>

      {/* Terminal Container */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={containerRef}
          className="absolute inset-0 p-1"
          onClick={handleClick}
        />
        {/* Loading Overlay */}
        {isLoading && !isReadOnly && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]/80 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-hive-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-400">Claude Code を起動中...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
