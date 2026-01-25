import * as pty from 'node-pty';
import { BrowserWindow } from 'electron';
import * as os from 'os';

interface PtySession {
  id: string;
  pty: pty.IPty;
  cols: number;
  rows: number;
}

class PtyService {
  private sessions: Map<string, PtySession> = new Map();
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  create(sessionId: string, cols = 80, rows = 24): string {
    // Check if session already exists
    if (this.sessions.has(sessionId)) {
      console.log(`PTY session ${sessionId} already exists, reusing`);
      return sessionId;
    }

    const shell = '/bin/zsh';
    const home = process.env.HOME || '/Users/' + process.env.USER || '/tmp';

    console.log(`Creating PTY session ${sessionId} with shell ${shell}, cwd: ${home}`);

    const ptyProcess = pty.spawn(shell, ['--login'], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: home,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        HOME: home,
        SHELL: shell,
      } as { [key: string]: string },
    });

    // Send data to renderer
    ptyProcess.onData((data: string) => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('pty:data', sessionId, data);
      }
    });

    // Handle exit
    ptyProcess.onExit(({ exitCode }) => {
      console.log(`PTY session ${sessionId} exited with code ${exitCode}`);
      this.sessions.delete(sessionId);
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('pty:exit', sessionId, exitCode);
      }
    });

    this.sessions.set(sessionId, {
      id: sessionId,
      pty: ptyProcess,
      cols,
      rows,
    });

    return sessionId;
  }

  write(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pty.write(data);
    }
  }

  resize(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pty.resize(cols, rows);
      session.cols = cols;
      session.rows = rows;
    }
  }

  close(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pty.kill();
      this.sessions.delete(sessionId);
    }
  }

  closeAll(): void {
    for (const [sessionId] of this.sessions) {
      this.close(sessionId);
    }
  }

  getSession(sessionId: string): PtySession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): string[] {
    return Array.from(this.sessions.keys());
  }
}

export const ptyService = new PtyService();
