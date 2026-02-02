import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockCreate, mockUpdateStatus, mockUpdateError, mockUpdateCompletion,
  mockGetById, mockGetByTaskId, mockGetAll, mockGetRunning,
  mockPtyCreate, mockPtyWrite, mockPtyClose, mockPtyGetSession,
} = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockUpdateStatus: vi.fn(),
  mockUpdateError: vi.fn(),
  mockUpdateCompletion: vi.fn(),
  mockGetById: vi.fn(),
  mockGetByTaskId: vi.fn(),
  mockGetAll: vi.fn(),
  mockGetRunning: vi.fn(),
  mockPtyCreate: vi.fn(),
  mockPtyWrite: vi.fn(),
  mockPtyClose: vi.fn(),
  mockPtyGetSession: vi.fn(),
}));

vi.mock('./db/ExecutionRepository', () => ({
  ExecutionRepository: class {
    create = mockCreate;
    updateStatus = mockUpdateStatus;
    updateError = mockUpdateError;
    updateCompletion = mockUpdateCompletion;
    getById = mockGetById;
    getByTaskId = mockGetByTaskId;
    getAll = mockGetAll;
    getRunning = mockGetRunning;
  },
}));

vi.mock('./PtyService', () => ({
  ptyService: {
    create: mockPtyCreate,
    write: mockPtyWrite,
    close: mockPtyClose,
    getSession: mockPtyGetSession,
  },
}));

vi.mock('electron', () => ({
  BrowserWindow: vi.fn(),
}));

vi.mock('./DesktopNotificationService', () => ({
  getDesktopNotificationService: vi.fn(() => ({
    notifyExecutionComplete: vi.fn(),
    notifyExecutionFailed: vi.fn(),
  })),
}));

vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => 'test-uuid-1234'),
}));

import { ExecutionEngine } from './ExecutionEngine';

describe('ExecutionEngine', () => {
  let engine: ExecutionEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new ExecutionEngine();
  });

  describe('startExecution', () => {
    it('creates execution record and PTY session', async () => {
      const result = await engine.startExecution({
        taskId: 'task-1',
        command: 'echo hello',
        workingDirectory: '/tmp',
      });

      expect(result.executionId).toBe('test-uuid-1234');
      expect(result.sessionId).toBe('exec-test-uuid-1234');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-uuid-1234',
          taskId: 'task-1',
          status: 'running',
        })
      );
      expect(mockPtyCreate).toHaveBeenCalledWith('exec-test-uuid-1234', 80, 24);
      expect(mockPtyWrite).toHaveBeenCalled();
    });

    it('rejects working directory with shell metacharacters', async () => {
      await expect(
        engine.startExecution({
          taskId: 'task-1',
          command: 'echo hello',
          workingDirectory: '/tmp; rm -rf /',
        })
      ).rejects.toThrow('Invalid working directory: contains shell metacharacters');

      expect(mockUpdateStatus).toHaveBeenCalledWith('test-uuid-1234', 'failed');
    });

    it('rejects empty command', async () => {
      await expect(
        engine.startExecution({
          taskId: 'task-1',
          command: '',
          workingDirectory: '/tmp',
        })
      ).rejects.toThrow('Invalid command');
    });

    it('rejects command injection via workingDirectory with pipe', async () => {
      await expect(
        engine.startExecution({
          taskId: 'task-1',
          command: 'ls',
          workingDirectory: '/tmp | cat /etc/passwd',
        })
      ).rejects.toThrow('Invalid working directory');
    });

    it('rejects backtick injection in workingDirectory', async () => {
      await expect(
        engine.startExecution({
          taskId: 'task-1',
          command: 'ls',
          workingDirectory: '/tmp`whoami`',
        })
      ).rejects.toThrow('Invalid working directory');
    });
  });

  describe('cancelExecution', () => {
    it('cancels a running execution', async () => {
      await engine.startExecution({
        taskId: 'task-1',
        command: 'sleep 100',
        workingDirectory: '/tmp',
      });

      engine.cancelExecution('test-uuid-1234');

      expect(mockPtyClose).toHaveBeenCalledWith('exec-test-uuid-1234');
      expect(mockUpdateStatus).toHaveBeenCalledWith('test-uuid-1234', 'cancelled');
    });

    it('throws when execution not found', () => {
      expect(() => engine.cancelExecution('nonexistent')).toThrow(
        'Execution nonexistent not found or not running'
      );
    });
  });

  describe('getExecution', () => {
    it('delegates to repository', () => {
      const mockRecord = { id: 'exec-1', status: 'running' };
      mockGetById.mockReturnValue(mockRecord);

      const result = engine.getExecution('exec-1');
      expect(result).toBe(mockRecord);
      expect(mockGetById).toHaveBeenCalledWith('exec-1');
    });

    it('returns null for nonexistent execution', () => {
      mockGetById.mockReturnValue(null);
      expect(engine.getExecution('nope')).toBeNull();
    });
  });

  describe('getExecutionsByTask', () => {
    it('delegates to repository', () => {
      const records = [{ id: 'exec-1' }, { id: 'exec-2' }];
      mockGetByTaskId.mockReturnValue(records);

      expect(engine.getExecutionsByTask('task-1')).toBe(records);
    });
  });

  describe('getAllExecutions', () => {
    it('delegates to repository', () => {
      mockGetAll.mockReturnValue([]);
      expect(engine.getAllExecutions()).toEqual([]);
    });
  });

  describe('getRunningExecutions', () => {
    it('delegates to repository', () => {
      mockGetRunning.mockReturnValue([]);
      expect(engine.getRunningExecutions()).toEqual([]);
    });
  });

  describe('cleanup', () => {
    it('cancels all active executions', async () => {
      await engine.startExecution({
        taskId: 'task-1',
        command: 'sleep 100',
        workingDirectory: '/tmp',
      });

      engine.cleanup();

      expect(mockPtyClose).toHaveBeenCalledWith('exec-test-uuid-1234');
      expect(mockUpdateStatus).toHaveBeenCalledWith('test-uuid-1234', 'cancelled');
    });

    it('handles cleanup errors gracefully', async () => {
      await engine.startExecution({
        taskId: 'task-1',
        command: 'sleep 100',
        workingDirectory: '/tmp',
      });

      mockPtyClose.mockImplementation(() => {
        throw new Error('PTY already closed');
      });

      // Should not throw
      expect(() => engine.cleanup()).not.toThrow();
    });
  });

  describe('notifyRenderer', () => {
    it('sends event to mainWindow when set', async () => {
      const mockSend = vi.fn();
      const mockWindow = {
        isDestroyed: () => false,
        webContents: { send: mockSend },
      } as any;

      engine.setMainWindow(mockWindow);
      await engine.startExecution({
        taskId: 'task-1',
        command: 'echo test',
        workingDirectory: '/tmp',
      });

      expect(mockSend).toHaveBeenCalledWith('execution:started', {
        executionId: 'test-uuid-1234',
        taskId: 'task-1',
      });
    });

    it('does not throw when mainWindow is not set', async () => {
      await expect(
        engine.startExecution({
          taskId: 'task-1',
          command: 'echo test',
          workingDirectory: '/tmp',
        })
      ).resolves.toBeDefined();
    });
  });
});
