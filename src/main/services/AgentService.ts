import { spawn, ChildProcess } from 'child_process';
import { BrowserWindow } from 'electron';

export type AgentType = 'claude' | 'codex';

interface AgentSession {
  id: string;
  type: AgentType;
  process: ChildProcess;
  cwd: string;
}

class AgentService {
  private sessions: Map<string, AgentSession> = new Map();
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  start(sessionId: string, type: AgentType, cwd: string): string {
    // Check if session already exists
    if (this.sessions.has(sessionId)) {
      console.log(`Agent session ${sessionId} already exists, stopping first`);
      this.stop(sessionId);
    }

    // Determine the command based on agent type
    const command = type === 'claude' ? 'claude' : 'codex';

    console.log(`Starting ${type} agent session ${sessionId} in ${cwd}`);

    // Spawn the process
    const agentProcess = spawn(command, [], {
      cwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
      },
      shell: true,
    });

    // Handle stdout
    agentProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('agent:output', sessionId, output);
      }
    });

    // Handle stderr
    agentProcess.stderr?.on('data', (data: Buffer) => {
      const output = data.toString();
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('agent:output', sessionId, output);
      }
    });

    // Handle process exit
    agentProcess.on('exit', (code, signal) => {
      console.log(`Agent session ${sessionId} exited with code ${code}, signal ${signal}`);
      this.sessions.delete(sessionId);
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('agent:exit', sessionId, code || 0);
      }
    });

    // Handle process error
    agentProcess.on('error', (error) => {
      console.error(`Agent session ${sessionId} error:`, error);
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('agent:error', sessionId, error.message);
      }
    });

    this.sessions.set(sessionId, {
      id: sessionId,
      type,
      process: agentProcess,
      cwd,
    });

    return sessionId;
  }

  stop(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      console.log(`Stopping agent session ${sessionId}`);
      session.process.kill('SIGTERM');
      this.sessions.delete(sessionId);
    }
  }

  input(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (session && session.process.stdin) {
      session.process.stdin.write(data);
    } else {
      console.warn(`Agent session ${sessionId} not found or stdin not available`);
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
