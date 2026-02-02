import * as pty from 'node-pty';
import * as path from 'path';
import * as fs from 'fs';
import { BrowserWindow } from 'electron';
import { terminalLogRepository } from './db/TerminalLogRepository';

export type AgentType = 'claude' | 'codex' | 'gemini' | 'ollama';

interface AgentSession {
  id: string;
  type: AgentType;
  ptyProcess: pty.IPty;
  cwd: string;
  taskExecutionState: 'idle' | 'executing' | 'completed';
  suppressExitEvent: boolean; // Don't send exit event when stopping for restart
}

class AgentService {
  private sessions: Map<string, AgentSession> = new Map();
  private mainWindow: BrowserWindow | null = null;
  private silentExitSessions: Set<string> = new Set(); // Sessions that should not send exit event
  private logBuffers: Map<string, string> = new Map(); // Buffered terminal output per session
  private logFlushTimers: Map<string, NodeJS.Timeout> = new Map();
  private static LOG_FLUSH_INTERVAL = 2000; // Flush every 2 seconds

  private bufferLogOutput(sessionId: string, data: string): void {
    const existing = this.logBuffers.get(sessionId) || '';
    this.logBuffers.set(sessionId, existing + data);

    if (!this.logFlushTimers.has(sessionId)) {
      const timer = setTimeout(() => {
        this.flushLogBuffer(sessionId);
      }, AgentService.LOG_FLUSH_INTERVAL);
      this.logFlushTimers.set(sessionId, timer);
    }
  }

  private flushLogBuffer(sessionId: string): void {
    const buffer = this.logBuffers.get(sessionId);
    if (buffer) {
      try {
        terminalLogRepository.append(sessionId, buffer);
      } catch {
        // Log persistence is non-critical
      }
      this.logBuffers.delete(sessionId);
    }
    const timer = this.logFlushTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.logFlushTimers.delete(sessionId);
    }
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  start(sessionId: string, type: AgentType, cwd: string, initialPrompt?: string): string {
    // Check if session already exists - stop it silently (don't trigger exit event)
    if (this.sessions.has(sessionId)) {
      this.stop(sessionId, true); // Silent stop - don't send exit event
    }

    // Use inline wrapper for reliable ready detection
    // bash -c 'echo SIGNAL; exec command' pattern:
    // - Outputs ready signal immediately
    // - exec replaces bash with the actual command (no extra process)
    const READY_SIGNAL = 'VIBE_HIVE_READY';

    // Get CLI path from settings
    const { getSettingsService } = require('./SettingsService');
    const settings = getSettingsService().getSettings();
    const agentSettings = settings.agent;

    const getCliPath = (agentType: AgentType): string => {
      const providerKey = agentType === 'claude' ? 'claude-code' : agentType;
      const provider = agentSettings.providers[providerKey as keyof typeof agentSettings.providers];
      if (provider?.cliPath) return provider.cliPath;
      // Fallback defaults
      switch (agentType) {
        case 'claude': return path.join(process.env.HOME || '', '.local', 'bin', 'claude');
        case 'codex': return '/opt/homebrew/bin/codex';
        case 'gemini': return 'gemini';
        case 'ollama': return 'ollama';
        default: return agentType;
      }
    };

    const cliPath = getCliPath(type);

    // Security: Validate CLI path to prevent shell injection
    const resolvedPath = path.resolve(cliPath);
    if (resolvedPath.includes(';') || resolvedPath.includes('&') || resolvedPath.includes('|') || resolvedPath.includes('`')) {
      throw new Error(`Invalid CLI path: contains shell metacharacters`);
    }

    // Use bash -c with single-quoted path to prevent injection
    const command = 'bash';
    const escapedPath = resolvedPath.replace(/'/g, "'\\''");
    const args = ['-c', `echo "${READY_SIGNAL}"; exec '${escapedPath}'`];

    // Build PATH with common locations for CLI tools
    const homedir = process.env.HOME || '';
    const additionalPaths = [
      `${homedir}/.local/bin`,
      '/usr/local/bin',
      '/opt/homebrew/bin',
    ];
    const currentPath = process.env.PATH || '';
    const newPath = [...additionalPaths, currentPath].join(':');

    // Spawn the process using node-pty for proper TTY support
    const ptyProcess = pty.spawn(command, args, {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        PATH: newPath,
      } as Record<string, string>,
    });

    // Track if we've sent the initial prompt
    let initialPromptSent = false;
    let readySignalReceived = false;
    let claudeCliReady = false;
    let taskExecutionStarted = false;
    let taskStartTime = 0;
    let lastActivityTime = Date.now();
    let lastOutputTime = Date.now();
    let promptCheckTimer: NodeJS.Timeout | null = null;
    let consecutivePromptDetections = 0;
    let lastPromptDetectionTime = 0;
    let taskCompletionSent = false;


    // Handle output
    ptyProcess.onData((data: string) => {
      // Filter out the ready signal from displayed output
      let outputData = data;
      if (!readySignalReceived && data.includes(READY_SIGNAL)) {
        readySignalReceived = true;
        outputData = data.replace(READY_SIGNAL, '').replace(/^\n/, '');
      }

      // Process \r (carriage return) to add line clear escape code
      // This ensures spinners don't leave artifacts when overwriting
      // \x1b[2K clears the entire current line
      if (outputData.includes('\r') && !outputData.includes('\n')) {
        // Replace lone \r with clear-line + \r for proper overwrite behavior
        outputData = outputData.replace(/\r/g, '\x1b[2K\r');
      }

      // Buffer output for persistent log storage (throttled)
      if (outputData) {
        this.bufferLogOutput(sessionId, outputData);
      }

      // Send output to renderer
      if (outputData && this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('agent:output', sessionId, outputData);
      }

      // Detect Claude CLI ready state:
      // Claude CLI shows ">" prompt or "╭" (top-left corner of UI box) when ready
      // Also check for common ready indicators
      if (!claudeCliReady && readySignalReceived) {
        const hasPromptIndicator = data.includes('>') ||
                                   data.includes('╭') ||
                                   data.includes('Try "') ||
                                   data.includes('? for shortcuts');

        if (hasPromptIndicator) {
          claudeCliReady = true;

          // Send loading complete status
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('agent:loading', sessionId, false);
          }

          // Send initial prompt now that Claude CLI is ready
          if (initialPrompt && !initialPromptSent) {
            initialPromptSent = true;
            taskExecutionStarted = true;
            taskStartTime = Date.now();
            taskCompletionSent = false;
            consecutivePromptDetections = 0;
            // Small delay to ensure input is accepted
            setTimeout(() => {
              ptyProcess.write(initialPrompt + '\n');
            }, 200);
          }
        }
      }

      // Update last activity time and output time
      lastActivityTime = Date.now();
      lastOutputTime = Date.now();

      // Task completion detection:
      // After initial prompt is sent, if Claude CLI returns to prompt state
      // We need multiple signals to avoid false positives:
      // 1. Task must have been running for at least 10 seconds
      // 2. Must detect prompt indicator 3+ consecutive times with 100ms+ gaps
      // 3. Must be idle for at least 8 seconds after last significant output
      if (taskExecutionStarted && claudeCliReady && !taskCompletionSent) {
        const timeSinceTaskStart = Date.now() - taskStartTime;
        const MIN_TASK_DURATION = 10000; // 10 seconds minimum task duration

        // Only start checking after minimum task duration
        if (timeSinceTaskStart < MIN_TASK_DURATION) {
          consecutivePromptDetections = 0;
        } else {
          // Check for prompt indicators (Claude's input prompt)
          // Only match patterns that strongly indicate a waiting-for-input state
          const hasPromptIndicator =
            // ANSI-positioned ">" prompt (most reliable signal)
            data.match(/\x1b\[\d+;\d+H>/) !== null ||
            // Claude's input box borders appearing together
            (data.includes('╭') && data.length < 200) ||
            (data.includes('╰') && data.length < 200) ||
            // "? for shortcuts" help hint (only in idle state)
            data.includes('? for shortcuts');

          const now = Date.now();
          if (hasPromptIndicator) {
            // Require at least 100ms gap between detections to avoid counting
            // a single burst of output as multiple detections
            if (now - lastPromptDetectionTime >= 100) {
              consecutivePromptDetections++;
              lastPromptDetectionTime = now;
            }
          } else if (data.length > 200) {
            // Reset if we get substantial output (real work happening)
            consecutivePromptDetections = 0;
          }

          // Require 3+ consecutive prompt detections
          if (consecutivePromptDetections >= 3) {
            if (promptCheckTimer) {
              clearTimeout(promptCheckTimer);
            }

            promptCheckTimer = setTimeout(() => {
              const idleTime = Date.now() - lastOutputTime;
              const IDLE_THRESHOLD = 8000; // 8 seconds idle

              if (idleTime >= IDLE_THRESHOLD && !taskCompletionSent) {
                taskCompletionSent = true;
                taskExecutionStarted = false;
                consecutivePromptDetections = 0;

                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                  this.mainWindow.webContents.send('agent:taskComplete', sessionId);
                }
              }
            }, 8000); // Wait 8 seconds before confirming
          }
        }
      }
    });

    // Handle process exit
    ptyProcess.onExit(({ exitCode, signal }) => {
      // Flush remaining log buffer before cleanup
      this.flushLogBuffer(sessionId);
      this.sessions.delete(sessionId);

      // Check if this is a silent exit (from restart)
      if (this.silentExitSessions.has(sessionId)) {
        this.silentExitSessions.delete(sessionId);
        return;
      }

      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('agent:exit', sessionId, exitCode);
      }
    });

    this.sessions.set(sessionId, {
      id: sessionId,
      type,
      ptyProcess,
      cwd,
      taskExecutionState: initialPrompt ? 'executing' : 'idle',
      suppressExitEvent: false,
    });

    return sessionId;
  }

  stop(sessionId: string, silent: boolean = false): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Mark session for silent exit before killing
      if (silent) {
        this.silentExitSessions.add(sessionId);
      }
      session.ptyProcess.kill();
      this.sessions.delete(sessionId);
    }
  }

  input(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.ptyProcess.write(data);
    } else {
      console.warn(`Agent session ${sessionId} not found`);
    }
  }

  resize(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.ptyProcess.resize(cols, rows);
    } else {
      console.warn(`Agent session ${sessionId} not found for resize`);
    }
  }

  stopAll(): void {
    for (const [sessionId] of this.sessions) {
      this.stop(sessionId);
    }
  }

  getSession(sessionId: string): AgentSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): Array<{ id: string; type: AgentType; cwd: string }> {
    return Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      type: session.type,
      cwd: session.cwd,
    }));
  }
}

export const agentService = new AgentService();
