import * as pty from 'node-pty';
import { BrowserWindow } from 'electron';
import * as os from 'os';
import { terminalLogRepository } from './db/TerminalLogRepository';

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
      return sessionId;
    }

    const shell = '/bin/zsh';
    const home = process.env.HOME || '/Users/' + process.env.USER || '/tmp';

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

    // Send data to renderer and save to database
    ptyProcess.onData((data: string) => {
      // Save to database
      terminalLogRepository.append(sessionId, data);

      // Send to renderer
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('pty:data', sessionId, data);
      }
    });

    // Handle exit
    ptyProcess.onExit(({ exitCode }) => {
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

    // Restore recent logs (last 100 entries) when session is created
    setTimeout(() => {
      try {
        const recentLogs = terminalLogRepository.getBySessionId(sessionId, 100);
        if (recentLogs.length > 0 && this.mainWindow && !this.mainWindow.isDestroyed()) {
          // Send each log entry to renderer to restore terminal state
          for (const log of recentLogs) {
            this.mainWindow.webContents.send('pty:data', sessionId, log.data);
          }
        }
      } catch (error) {
        console.error('Failed to restore terminal logs:', error);
      }
    }, 100); // Small delay to ensure renderer is ready

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
