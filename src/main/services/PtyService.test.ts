import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockKill = vi.fn();
const mockWrite = vi.fn();
const mockResize = vi.fn();
const mockOnData = vi.fn();
const mockOnExit = vi.fn();

vi.mock('node-pty', () => ({
  spawn: vi.fn(() => ({
    kill: mockKill,
    write: mockWrite,
    resize: mockResize,
    onData: mockOnData,
    onExit: mockOnExit,
  })),
}));

vi.mock('electron', () => ({
  BrowserWindow: class {},
}));

vi.mock('./db/TerminalLogRepository', () => ({
  terminalLogRepository: {
    append: vi.fn(),
    getBySessionId: vi.fn(() => []),
  },
}));

import { ptyService } from './PtyService';

describe('PtyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('setMainWindow sets window', () => {
    const mockWindow = { webContents: { send: vi.fn() }, isDestroyed: () => false } as any;
    ptyService.setMainWindow(mockWindow);
  });

  it('create creates a new session', () => {
    const sessionId = ptyService.create('pty-test-1');
    expect(sessionId).toBe('pty-test-1');
  });

  it('create returns existing session id if already exists', () => {
    ptyService.create('pty-dup');
    const result = ptyService.create('pty-dup');
    expect(result).toBe('pty-dup');
  });

  it('create with custom cols and rows', () => {
    const sessionId = ptyService.create('pty-size', 100, 50);
    expect(sessionId).toBe('pty-size');
  });

  it('write writes data to pty', () => {
    ptyService.create('pty-write');
    ptyService.write('pty-write', 'test data');
    expect(mockWrite).toHaveBeenCalledWith('test data');
  });

  it('write does nothing for non-existent session', () => {
    ptyService.write('non-existent-pty', 'data');
    // Should not throw
  });

  it('resize resizes pty', () => {
    ptyService.create('pty-resize');
    ptyService.resize('pty-resize', 120, 40);
    expect(mockResize).toHaveBeenCalledWith(120, 40);
  });

  it('resize does nothing for non-existent session', () => {
    ptyService.resize('non-existent-pty', 100, 50);
    // Should not throw
  });

  it('close closes session', () => {
    ptyService.create('pty-close');
    ptyService.close('pty-close');
    expect(mockKill).toHaveBeenCalled();
  });

  it('close does nothing for non-existent session', () => {
    ptyService.close('non-existent-pty');
    // Should not throw
  });

  it('getSession returns session', () => {
    ptyService.create('pty-get');
    const session = ptyService.getSession('pty-get');
    expect(session).toBeDefined();
    expect(session?.id).toBe('pty-get');
  });

  it('getSession returns undefined for non-existent', () => {
    const session = ptyService.getSession('non-existent-pty');
    expect(session).toBeUndefined();
  });

  it('getAllSessions returns all session ids', () => {
    ptyService.create('pty-all-1');
    ptyService.create('pty-all-2');
    const sessions = ptyService.getAllSessions();
    expect(sessions.length).toBeGreaterThanOrEqual(2);
  });

  it('closeAll closes all sessions', () => {
    ptyService.create('pty-closeall-1');
    ptyService.create('pty-closeall-2');
    ptyService.closeAll();
  });
});
