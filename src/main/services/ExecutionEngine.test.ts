import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  BrowserWindow: class {},
}));

vi.mock('crypto', () => ({
  randomUUID: () => 'test-uuid-123',
}));

vi.mock('./PtyService', () => ({
  ptyService: {
    create: vi.fn(),
    write: vi.fn(),
    getSession: vi.fn(),
    close: vi.fn(),
  },
}));

vi.mock('./db/ExecutionRepository', () => ({
  ExecutionRepository: class {
    create = vi.fn();
    getById = vi.fn().mockReturnValue(null);
    getByTaskId = vi.fn().mockReturnValue([]);
    getAll = vi.fn().mockReturnValue([]);
    getByStatus = vi.fn().mockReturnValue([]);
    getRunning = vi.fn().mockReturnValue([]);
    updateStatus = vi.fn();
    updateError = vi.fn();
    updateCompletedAt = vi.fn();
    updateExitCode = vi.fn();
    delete = vi.fn();
  },
}));

vi.mock('./DesktopNotificationService', () => ({
  getDesktopNotificationService: () => ({
    showNotification: vi.fn(),
  }),
}));

let getExecutionEngine: any;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  const mod = await import('./ExecutionEngine');
  getExecutionEngine = mod.getExecutionEngine;
});

describe('ExecutionEngine', () => {
  it('getExecutionEngine returns singleton', () => {
    const engine1 = getExecutionEngine();
    const engine2 = getExecutionEngine();
    expect(engine1).toBe(engine2);
  });

  it('setMainWindow sets window', () => {
    const engine = getExecutionEngine();
    const mockWindow = {} as any;
    engine.setMainWindow(mockWindow);
  });

  it('startExecution creates execution and returns response', async () => {
    const engine = getExecutionEngine();
    const response = await engine.startExecution({
      taskId: 'task-1',
      command: 'echo test',
      workingDirectory: '/tmp',
    });
    expect(response.executionId).toBeDefined();
    expect(response.sessionId).toBeDefined();
  });

  it('startExecution throws on invalid working directory', async () => {
    const engine = getExecutionEngine();
    await expect(engine.startExecution({
      taskId: 'task-1',
      command: 'echo test',
      workingDirectory: '/tmp; rm -rf /',
    })).rejects.toThrow('shell metacharacters');
  });

  it('cancelExecution throws for non-existent execution', () => {
    const engine = getExecutionEngine();
    expect(() => engine.cancelExecution('exec-1')).toThrow('not found');
  });

  it('getExecution returns null for non-existent', () => {
    const engine = getExecutionEngine();
    const exec = engine.getExecution('non-existent');
    expect(exec).toBeNull();
  });

  it('getExecutionsByTask returns array', () => {
    const engine = getExecutionEngine();
    const execs = engine.getExecutionsByTask('task-1');
    expect(Array.isArray(execs)).toBe(true);
  });

  it('getAllExecutions returns array', () => {
    const engine = getExecutionEngine();
    const execs = engine.getAllExecutions();
    expect(Array.isArray(execs)).toBe(true);
  });

  it('getRunningExecutions returns array', () => {
    const engine = getExecutionEngine();
    const execs = engine.getRunningExecutions();
    expect(Array.isArray(execs)).toBe(true);
  });
});
