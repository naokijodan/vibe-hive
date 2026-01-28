import * as pty from 'node-pty';
import { BrowserWindow } from 'electron';

export type AgentType = 'claude' | 'codex';

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
    const claudePath = '/Users/naokijodan/.local/bin/claude';
    const codexPath = '/opt/homebrew/bin/codex';

    const command = 'bash';
    const args = type === 'claude'
      ? ['-c', `echo "${READY_SIGNAL}"; exec ${claudePath}`]
      : ['-c', `echo "${READY_SIGNAL}"; exec ${codexPath}`];

    // Build PATH with common locations for CLI tools
    const homedir = process.env.HOME || '/Users/naokijodan';
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
      // 1. Task must have been running for at least 5 seconds (reduced from 10)
      // 2. Must detect prompt indicator multiple times (2+ consecutive, reduced from 3)
      // 3. Must be idle for at least 5 seconds after last significant output (reduced from 10)
      if (taskExecutionStarted && claudeCliReady && !taskCompletionSent) {
        const timeSinceTaskStart = Date.now() - taskStartTime;
        const MIN_TASK_DURATION = 5000; // 5 seconds minimum task duration

        // Only start checking after minimum task duration
        if (timeSinceTaskStart < MIN_TASK_DURATION) {
          // Reset counter if we're still in early phase
          consecutivePromptDetections = 0;
        } else {
          // Check for prompt indicators (Claude's input prompt)
          // Claude Code shows various patterns when waiting for input
          const hasPromptIndicator =
            // Claude shows ">" at the start of a line when waiting for input
            data.match(/^>/m) !== null ||
            // Or the input box top border
            data.includes('╭') ||
            // The bottom border of the input box
            data.includes('╰') ||
            // Help hint
            data.includes('? for') ||
            // Empty prompt line with just cursor positioning
            data.match(/\x1b\[\d+;\d+H>/) !== null;

          if (hasPromptIndicator) {
            consecutivePromptDetections++;
          } else if (data.length > 100) {
            // Reset if we get substantial output (not just cursor movements)
            consecutivePromptDetections = 0;
          }

          // Require 2+ consecutive prompt detections (reduced from 3)
          if (consecutivePromptDetections >= 2) {
            // Clear any existing timer
            if (promptCheckTimer) {
              clearTimeout(promptCheckTimer);
            }

            // Set a timer to ensure we're really idle (reduced to 5 seconds)
            promptCheckTimer = setTimeout(() => {
              const idleTime = Date.now() - lastOutputTime;
              const IDLE_THRESHOLD = 5000; // 5 seconds idle (reduced from 10)

              // If idle for more than threshold and multiple prompts detected, task is complete
              if (idleTime >= IDLE_THRESHOLD && !taskCompletionSent) {
                taskCompletionSent = true;
                taskExecutionStarted = false; // Reset for next task
                consecutivePromptDetections = 0;

                // Send task complete event
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                  this.mainWindow.webContents.send('agent:taskComplete', sessionId);
                }
              }
            }, 5000); // Wait 5 seconds before confirming (reduced from 10)
          }
        }
      }
    });

    // Handle process exit
    ptyProcess.onExit(({ exitCode, signal }) => {
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
