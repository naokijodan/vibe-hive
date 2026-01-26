import * as pty from 'node-pty';
import { BrowserWindow } from 'electron';

export type AgentType = 'claude' | 'codex';

interface AgentSession {
  id: string;
  type: AgentType;
  ptyProcess: pty.IPty;
  cwd: string;
}

class AgentService {
  private sessions: Map<string, AgentSession> = new Map();
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  start(sessionId: string, type: AgentType, cwd: string, initialPrompt?: string): string {
    // Check if session already exists
    if (this.sessions.has(sessionId)) {
      console.log(`Agent session ${sessionId} already exists, stopping first`);
      this.stop(sessionId);
    }

    // Use inline wrapper for reliable ready detection
    // bash -c 'echo SIGNAL; exec command' pattern:
    // - Outputs ready signal immediately
    // - exec replaces bash with the actual command (no extra process)
    const READY_SIGNAL = 'VIBE_HIVE_READY';
    const claudePath = '/Users/naokijodan/.local/bin/claude';

    const command = 'bash';
    const args = type === 'claude'
      ? ['-c', `echo "${READY_SIGNAL}"; exec ${claudePath}`]
      : ['-c', `echo "${READY_SIGNAL}"; exec codex`];

    console.log(`Starting ${type} agent session ${sessionId} in ${cwd}`);

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


    // Handle output
    ptyProcess.onData((data: string) => {
      // Filter out the ready signal from displayed output
      let outputData = data;
      if (!readySignalReceived && data.includes(READY_SIGNAL)) {
        readySignalReceived = true;
        console.log(`Bash ready signal received for session ${sessionId}`);
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
          console.log(`Claude CLI ready for session ${sessionId}`);

          // Send loading complete status
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('agent:loading', sessionId, false);
          }

          // Send initial prompt now that Claude CLI is ready
          if (initialPrompt && !initialPromptSent) {
            initialPromptSent = true;
            console.log(`Sending initial prompt to session ${sessionId}`);
            // Small delay to ensure input is accepted
            setTimeout(() => {
              ptyProcess.write(initialPrompt + '\n');
            }, 200);
          }
        }
      }
    });

    // Handle process exit
    ptyProcess.onExit(({ exitCode, signal }) => {
      console.log(`Agent session ${sessionId} exited with code ${exitCode}, signal ${signal}`);
      this.sessions.delete(sessionId);
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('agent:exit', sessionId, exitCode);
      }
    });

    this.sessions.set(sessionId, {
      id: sessionId,
      type,
      ptyProcess,
      cwd,
    });

    return sessionId;
  }

  stop(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      console.log(`Stopping agent session ${sessionId}`);
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
      console.log(`Resizing agent session ${sessionId} to ${cols}x${rows}`);
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
