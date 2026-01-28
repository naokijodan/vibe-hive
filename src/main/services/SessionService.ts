import { SessionRepository } from './db/SessionRepository';
import type { Session, SessionConfig, SessionStatus } from '../../shared/types/session';

class SessionService {
  private repository: SessionRepository;
  private activeSessionId: string | null = null;

  constructor() {
    this.repository = new SessionRepository();
    // 起動時にアクティブセッションを復元
    const activeSession = this.repository.getActive();
    if (activeSession) {
      this.activeSessionId = activeSession.id;
    }
  }

  createSession(config: SessionConfig): Session {
    const session = this.repository.create(config);
    return session;
  }

  getSession(id: string): Session | null {
    return this.repository.getById(id);
  }

  listSessions(): Session[] {
    return this.repository.getAll();
  }

  deleteSession(id: string): void {
    this.repository.delete(id);
    
    // アクティブセッションが削除された場合
    if (this.activeSessionId === id) {
      this.activeSessionId = null;
    }
  }

  switchSession(id: string): Session {
    const session = this.repository.getById(id);
    if (!session) {
      throw new Error(`Session not found: ${id}`);
    }

    this.repository.setActive(id);
    this.activeSessionId = id;

    return session;
  }

  getActiveSession(): Session | null {
    if (!this.activeSessionId) {
      return this.repository.getActive();
    }
    return this.repository.getById(this.activeSessionId);
  }

  updateStatus(id: string, status: SessionStatus): Session {
    return this.repository.updateStatus(id, status);
  }

  updateSession(id: string, updates: Partial<SessionConfig>): Session {
    return this.repository.update(id, updates);
  }
}

// シングルトンインスタンス
let instance: SessionService | null = null;

export function getSessionService(): SessionService {
  if (!instance) {
    instance = new SessionService();
  }
  return instance;
}

export { SessionService };
