// Collaboration Service - WebSocket-based real-time collaboration
import { WebSocketServer, WebSocket } from 'ws';
import { BrowserWindow } from 'electron';
import { randomUUID } from 'crypto';
import type {
  CollabUser,
  CollabEvent,
  CollabChatMessage,
  CollabConnectionStatus,
  CollabSettings,
} from '../../shared/types/collaboration';

interface ConnectedClient {
  ws: WebSocket;
  user: CollabUser;
}

class CollaborationService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ConnectedClient> = new Map();
  private roomToken: string | null = null;
  private mainWindow: BrowserWindow | null = null;
  private port = 3101;
  private localUser: CollabUser | null = null;
  private role: 'host' | 'guest' | 'disconnected' = 'disconnected';
  private guestWs: WebSocket | null = null;
  private roomSessionId: string | null = null;
  private chatHistory: CollabChatMessage[] = [];

  setMainWindow(win: BrowserWindow): void {
    this.mainWindow = win;
  }

  /**
   * Host a collaboration room
   */
  async startHost(sessionId: string, settings: CollabSettings, port?: number): Promise<{ success: boolean; port: number; error?: string }> {
    if (this.wss) {
      return { success: false, port: this.port, error: 'Server already running' };
    }

    this.port = port || 3101;
    this.roomSessionId = sessionId;
    this.localUser = {
      id: randomUUID(),
      nickname: settings.nickname || 'Host',
      color: settings.color || '#f59e0b',
      joinedAt: new Date().toISOString(),
    };
    this.role = 'host';
    this.chatHistory = [];
    this.roomToken = randomUUID();

    return new Promise((resolve) => {
      try {
        // Security: Bind to localhost only to prevent external access
        this.wss = new WebSocketServer({ port: this.port, host: '127.0.0.1' });

        this.wss.on('listening', () => {
          this.emitStatus();
          resolve({ success: true, port: this.port });
        });

        this.wss.on('error', (err) => {
          console.error('Collab WebSocket error:', err);
          this.wss = null;
          this.role = 'disconnected';
          resolve({ success: false, port: this.port, error: err.message });
        });

        this.wss.on('connection', (ws) => {
          this.handleNewConnection(ws);
        });
      } catch (err) {
        resolve({ success: false, port: this.port, error: String(err) });
      }
    });
  }

  /**
   * Join as guest
   */
  async joinRoom(host: string, port: number, settings: CollabSettings): Promise<{ success: boolean; error?: string }> {
    if (this.guestWs || this.wss) {
      return { success: false, error: 'Already connected' };
    }

    this.localUser = {
      id: randomUUID(),
      nickname: settings.nickname || 'Guest',
      color: settings.color || '#3b82f6',
      joinedAt: new Date().toISOString(),
    };
    this.role = 'guest';
    this.chatHistory = [];

    return new Promise((resolve) => {
      try {
        const url = `ws://${host}:${port}`;
        this.guestWs = new WebSocket(url);

        this.guestWs.on('open', () => {
          // Send join message
          this.sendToServer({
            type: 'user:joined',
            userId: this.localUser!.id,
            timestamp: new Date().toISOString(),
            payload: this.localUser,
          });
          this.emitStatus();
          resolve({ success: true });
        });

        this.guestWs.on('message', (data) => {
          try {
            const event = JSON.parse(data.toString()) as CollabEvent;
            this.handleIncomingEvent(event);
          } catch {
            // ignore
          }
        });

        this.guestWs.on('close', () => {
          this.guestWs = null;
          this.role = 'disconnected';
          this.emitStatus();
          this.emitToRenderer('collab:disconnected', {});
        });

        this.guestWs.on('error', (err) => {
          this.guestWs = null;
          this.role = 'disconnected';
          resolve({ success: false, error: err.message });
        });
      } catch (err) {
        resolve({ success: false, error: String(err) });
      }
    });
  }

  /**
   * Stop hosting or disconnect
   */
  async disconnect(): Promise<void> {
    if (this.role === 'host' && this.wss) {
      // Notify all clients
      this.broadcast({
        type: 'user:left',
        userId: this.localUser?.id || '',
        timestamp: new Date().toISOString(),
        payload: { reason: 'host_disconnected' },
      });
      this.wss.close();
      this.wss = null;
      this.clients.clear();
    }

    if (this.role === 'guest' && this.guestWs) {
      this.sendToServer({
        type: 'user:left',
        userId: this.localUser?.id || '',
        timestamp: new Date().toISOString(),
        payload: this.localUser,
      });
      this.guestWs.close();
      this.guestWs = null;
    }

    this.role = 'disconnected';
    this.roomSessionId = null;
    this.localUser = null;
    this.chatHistory = [];
    this.emitStatus();
  }

  /**
   * Send a chat message
   */
  sendChat(message: string): CollabChatMessage | null {
    if (!this.localUser) return null;

    const chatMsg: CollabChatMessage = {
      id: randomUUID(),
      userId: this.localUser.id,
      nickname: this.localUser.nickname,
      color: this.localUser.color,
      message,
      timestamp: new Date().toISOString(),
    };

    this.chatHistory.push(chatMsg);

    const event: CollabEvent = {
      type: 'chat:message',
      userId: this.localUser.id,
      timestamp: chatMsg.timestamp,
      payload: chatMsg,
    };

    if (this.role === 'host') {
      this.broadcast(event);
    } else if (this.role === 'guest') {
      this.sendToServer(event);
    }

    this.emitToRenderer('collab:chat', chatMsg);
    return chatMsg;
  }

  /**
   * Broadcast a task change event
   */
  broadcastTaskEvent(eventType: 'task:updated' | 'task:created' | 'task:deleted' | 'task:moved', payload: unknown): void {
    if (!this.localUser) return;

    const event: CollabEvent = {
      type: eventType,
      userId: this.localUser.id,
      timestamp: new Date().toISOString(),
      payload,
    };

    if (this.role === 'host') {
      this.broadcast(event);
    } else if (this.role === 'guest') {
      this.sendToServer(event);
    }
  }

  /**
   * Get connection status
   */
  getStatus(): CollabConnectionStatus {
    let userCount = 0;
    if (this.role === 'host') {
      userCount = this.clients.size + 1; // +1 for host
    } else if (this.role === 'guest') {
      userCount = 0; // guest doesn't know total
    }

    return {
      connected: this.role !== 'disconnected',
      role: this.role,
      roomSessionId: this.roomSessionId || undefined,
      userCount,
      serverPort: this.role === 'host' ? this.port : undefined,
    };
  }

  /**
   * Get connected users
   */
  getUsers(): CollabUser[] {
    const users: CollabUser[] = [];
    if (this.localUser) users.push(this.localUser);
    for (const client of this.clients.values()) {
      users.push(client.user);
    }
    return users;
  }

  /**
   * Get chat history
   */
  getChatHistory(): CollabChatMessage[] {
    return [...this.chatHistory];
  }

  // --- Private methods ---

  private handleNewConnection(ws: WebSocket): void {
    const tempId = randomUUID();

    ws.on('message', (data) => {
      try {
        const event = JSON.parse(data.toString()) as CollabEvent;

        if (event.type === 'user:joined') {
          const user = event.payload as CollabUser;
          this.clients.set(user.id, { ws, user });
          this.emitStatus();
          this.emitToRenderer('collab:userJoined', user);

          // Send current users list to new client
          const usersEvent: CollabEvent = {
            type: 'user:joined',
            userId: 'server',
            timestamp: new Date().toISOString(),
            payload: { users: this.getUsers(), chatHistory: this.chatHistory },
          };
          ws.send(JSON.stringify(usersEvent));

          // Broadcast to other clients
          this.broadcastExcept(user.id, event);
        } else if (event.type === 'user:left') {
          this.clients.delete(event.userId);
          this.emitStatus();
          this.emitToRenderer('collab:userLeft', event.payload);
          this.broadcastExcept(event.userId, event);
        } else {
          // Relay to all other clients and to renderer
          this.broadcastExcept(event.userId, event);
          this.handleIncomingEvent(event);
        }
      } catch {
        // ignore
      }
    });

    ws.on('close', () => {
      // Find and remove the client
      for (const [id, client] of this.clients.entries()) {
        if (client.ws === ws) {
          this.clients.delete(id);
          this.emitStatus();
          this.emitToRenderer('collab:userLeft', client.user);
          this.broadcastExcept(id, {
            type: 'user:left',
            userId: id,
            timestamp: new Date().toISOString(),
            payload: client.user,
          });
          break;
        }
      }
    });
  }

  private handleIncomingEvent(event: CollabEvent): void {
    switch (event.type) {
      case 'chat:message':
        this.chatHistory.push(event.payload as CollabChatMessage);
        this.emitToRenderer('collab:chat', event.payload);
        break;
      case 'task:updated':
      case 'task:created':
      case 'task:deleted':
      case 'task:moved':
        this.emitToRenderer('collab:taskEvent', event);
        break;
      case 'user:joined': {
        const data = event.payload as { users?: CollabUser[]; chatHistory?: CollabChatMessage[] };
        if (data.users) {
          this.emitToRenderer('collab:usersSync', data.users);
        }
        if (data.chatHistory) {
          this.chatHistory = data.chatHistory;
          this.emitToRenderer('collab:chatSync', data.chatHistory);
        }
        break;
      }
      case 'user:left':
        this.emitToRenderer('collab:userLeft', event.payload);
        break;
    }
  }

  private broadcast(event: CollabEvent): void {
    const msg = JSON.stringify(event);
    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(msg);
      }
    }
  }

  private broadcastExcept(excludeUserId: string, event: CollabEvent): void {
    const msg = JSON.stringify(event);
    for (const [id, client] of this.clients.entries()) {
      if (id !== excludeUserId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(msg);
      }
    }
  }

  private sendToServer(event: CollabEvent): void {
    if (this.guestWs && this.guestWs.readyState === WebSocket.OPEN) {
      this.guestWs.send(JSON.stringify(event));
    }
  }

  private emitToRenderer(channel: string, data: unknown): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  private emitStatus(): void {
    this.emitToRenderer('collab:status', this.getStatus());
  }
}

let collaborationService: CollaborationService | null = null;

export function getCollaborationService(): CollaborationService {
  if (!collaborationService) {
    collaborationService = new CollaborationService();
  }
  return collaborationService;
}
