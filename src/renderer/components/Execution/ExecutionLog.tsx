import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { useExecutionStore } from '../../stores/executionStore';
import { useTaskStore } from '../../stores/taskStore';
import ipcBridge from '../../bridge/ipcBridge';
import type { ExecutionRecord } from '../../../shared/types/execution';

interface ExecutionLogProps {
  execution: ExecutionRecord | null;
}

export const ExecutionLog: React.FC<ExecutionLogProps> = ({ execution }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { tasks } = useTaskStore();

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    const terminal = new Terminal({
      cursorBlink: false,
      fontSize: 12,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#0a0e14',
        foreground: '#b3b1ad',
        cursor: '#ffcc66',
      },
      convertEol: true,
      disableStdin: true, // Read-only terminal
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Handle terminal resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  // Handle execution change
  useEffect(() => {
    if (!xtermRef.current || !execution) {
      xtermRef.current?.clear();
      return;
    }

    const terminal = xtermRef.current;
    terminal.clear();

    // Display execution header
    const task = tasks.find((t) => t.id === execution.taskId);
    terminal.writeln(`\x1b[1;36m===== Execution Log =====\x1b[0m`);
    terminal.writeln(`\x1b[1mTask:\x1b[0m ${task?.title || 'Unknown'}`);
    terminal.writeln(`\x1b[1mStatus:\x1b[0m ${execution.status}`);
    terminal.writeln(
      `\x1b[1mStarted:\x1b[0m ${new Date(execution.startedAt).toLocaleString('ja-JP')}`
    );
    if (execution.completedAt) {
      terminal.writeln(
        `\x1b[1mCompleted:\x1b[0m ${new Date(execution.completedAt).toLocaleString('ja-JP')}`
      );
    }
    if (execution.exitCode !== undefined) {
      const exitColor = execution.exitCode === 0 ? '\x1b[32m' : '\x1b[31m';
      terminal.writeln(`\x1b[1mExit Code:\x1b[0m ${exitColor}${execution.exitCode}\x1b[0m`);
    }
    if (execution.errorMessage) {
      terminal.writeln(`\x1b[1;31mError:\x1b[0m ${execution.errorMessage}`);
    }
    terminal.writeln(`\x1b[1;36m=========================\x1b[0m\n`);

    // Subscribe to terminal output if execution is running
    if (execution.status === 'running' && execution.sessionId) {
      const unsubscribe = ipcBridge.terminal.onData((sessionId: string, data: string) => {
        if (sessionId === execution.sessionId) {
          terminal.write(data);
        }
      });

      return () => {
        unsubscribe();
      };
    } else {
      // For completed executions, show message
      if (execution.status === 'completed') {
        terminal.writeln('\x1b[1;32m✓ Execution completed successfully\x1b[0m');
      } else if (execution.status === 'failed') {
        terminal.writeln('\x1b[1;31m✗ Execution failed\x1b[0m');
      } else if (execution.status === 'cancelled') {
        terminal.writeln('\x1b[1;33m⊘ Execution was cancelled\x1b[0m');
      }
    }
  }, [execution, tasks]);

  const getTaskTitle = (taskId: string): string => {
    const task = tasks.find((t) => t.id === taskId);
    return task?.title || 'Unknown Task';
  };

  if (!execution) {
    return (
      <div className="h-full flex items-center justify-center bg-hive-bg text-hive-muted">
        <div className="text-center">
          <p className="text-sm mb-2">実行ログを表示するには、</p>
          <p className="text-sm">左側の実行一覧から選択してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-hive-bg">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-hive-border bg-hive-surface">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{getTaskTitle(execution.taskId)}</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded ${
              execution.status === 'running'
                ? 'bg-blue-600 text-white'
                : execution.status === 'completed'
                ? 'bg-green-600 text-white'
                : execution.status === 'failed'
                ? 'bg-red-600 text-white'
                : 'bg-gray-600 text-white'
            }`}
          >
            {execution.status}
          </span>
        </div>
        <div className="text-xs text-hive-muted">
          {new Date(execution.startedAt).toLocaleTimeString('ja-JP')}
        </div>
      </div>

      {/* Terminal */}
      <div className="flex-1 overflow-hidden">
        <div ref={terminalRef} className="w-full h-full" />
      </div>
    </div>
  );
};
