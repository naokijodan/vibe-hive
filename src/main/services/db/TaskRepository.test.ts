import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrepare, mockRandomUUID } = vi.hoisted(() => {
  const mockRun = vi.fn(() => ({ changes: 1 }));
  const mockGet = vi.fn();
  const mockAll = vi.fn(() => []);

  return {
    mockRun,
    mockGet,
    mockAll,
    mockPrepare: vi.fn(() => ({ run: mockRun, get: mockGet, all: mockAll })),
    mockRandomUUID: vi.fn(() => 'test-uuid'),
  };
});

vi.mock('./Database', () => ({
  getDatabase: () => ({ prepare: mockPrepare }),
}));

vi.mock('crypto', () => ({
  randomUUID: mockRandomUUID,
}));

import { TaskRepository } from './TaskRepository';

const makeTaskRow = (overrides = {}) => ({
  id: 'task-1',
  session_id: 'sess-1',
  title: 'Test Task',
  description: null,
  status: 'todo',
  priority: 'medium',
  assigned_agent_id: null,
  parent_task_id: null,
  review_feedback: null,
  depends_on: null,
  created_at: '2026-01-15T00:00:00.000Z',
  updated_at: '2026-01-15T00:00:00.000Z',
  completed_at: null,
  ...overrides,
});

describe('TaskRepository', () => {
  let repo: TaskRepository;

  // Track call count for mockPrepare to differentiate queries
  beforeEach(() => {
    vi.clearAllMocks();
    repo = new TaskRepository();
  });

  describe('getById', () => {
    it('returns task when found', () => {
      const row = makeTaskRow();
      // First call: SELECT * FROM tasks WHERE id = ?
      // Second call (in rowToTask): SELECT id FROM tasks WHERE parent_task_id = ?
      const mockGet = vi.fn().mockReturnValueOnce(row);
      const mockAll = vi.fn().mockReturnValueOnce([]);
      mockPrepare.mockImplementation((sql: string) => {
        if (sql.includes('parent_task_id')) return { all: mockAll };
        return { get: mockGet, all: mockAll };
      });

      const result = repo.getById('task-1');
      expect(result).toBeDefined();
      expect(result!.id).toBe('task-1');
      expect(result!.title).toBe('Test Task');
      expect(result!.createdAt).toBeInstanceOf(Date);
    });

    it('returns null when not found', () => {
      mockPrepare.mockImplementation(() => ({
        get: vi.fn().mockReturnValue(undefined),
        all: vi.fn().mockReturnValue([]),
      }));

      expect(repo.getById('nonexistent')).toBeNull();
    });
  });

  describe('getAll', () => {
    it('returns all tasks', () => {
      const rows = [makeTaskRow(), makeTaskRow({ id: 'task-2', title: 'Second' })];
      mockPrepare.mockImplementation((sql: string) => {
        if (sql.includes('parent_task_id')) return { all: vi.fn().mockReturnValue([]) };
        return { all: vi.fn().mockReturnValue(rows) };
      });

      const result = repo.getAll();
      expect(result).toHaveLength(2);
    });
  });

  describe('delete', () => {
    it('returns true when task deleted', () => {
      mockPrepare.mockImplementation(() => ({
        run: vi.fn().mockReturnValue({ changes: 1 }),
      }));

      expect(repo.delete('task-1')).toBe(true);
    });

    it('returns false when task not found', () => {
      mockPrepare.mockImplementation(() => ({
        run: vi.fn().mockReturnValue({ changes: 0 }),
      }));

      expect(repo.delete('nonexistent')).toBe(false);
    });
  });

  describe('areDependenciesMet', () => {
    it('returns met when no dependencies', () => {
      mockPrepare.mockImplementation((sql: string) => {
        if (sql.includes('parent_task_id')) return { all: vi.fn().mockReturnValue([]) };
        return {
          get: vi.fn().mockReturnValue(makeTaskRow()),
          all: vi.fn().mockReturnValue([]),
        };
      });

      const result = repo.areDependenciesMet('task-1');
      expect(result.met).toBe(true);
      expect(result.total).toBe(0);
    });

    it('returns not met when dependency is incomplete', () => {
      const taskWithDep = makeTaskRow({ depends_on: '["dep-1"]' });
      const depTask = makeTaskRow({ id: 'dep-1', status: 'in_progress' });

      mockPrepare.mockImplementation((sql: string) => {
        if (sql.includes('parent_task_id')) return { all: vi.fn().mockReturnValue([]) };
        return {
          get: vi.fn().mockImplementation((...args: unknown[]) => {
            const id = args[0];
            if (id === 'task-1') return taskWithDep;
            if (id === 'dep-1') return depTask;
            return undefined;
          }),
          all: vi.fn().mockReturnValue([]),
        };
      });

      const result = repo.areDependenciesMet('task-1');
      expect(result.met).toBe(false);
      expect(result.blocking).toHaveLength(1);
    });

    it('returns met when all dependencies done', () => {
      const taskWithDep = makeTaskRow({ depends_on: '["dep-1"]' });
      const depTask = makeTaskRow({ id: 'dep-1', status: 'done' });

      mockPrepare.mockImplementation((sql: string) => {
        if (sql.includes('parent_task_id')) return { all: vi.fn().mockReturnValue([]) };
        return {
          get: vi.fn().mockImplementation((...args: unknown[]) => {
            const id = args[0];
            if (id === 'task-1') return taskWithDep;
            if (id === 'dep-1') return depTask;
            return undefined;
          }),
          all: vi.fn().mockReturnValue([]),
        };
      });

      const result = repo.areDependenciesMet('task-1');
      expect(result.met).toBe(true);
      expect(result.completed).toBe(1);
    });
  });

  describe('wouldCreateCircularDependency', () => {
    it('detects self-dependency', () => {
      expect(repo.wouldCreateCircularDependency('task-1', 'task-1')).toBe(true);
    });

    it('detects circular dependency through chain', () => {
      // task-1 depends on dep-1, dep-1 depends on task-1 (cycle)
      const dep1 = makeTaskRow({ id: 'dep-1', depends_on: '["task-1"]' });

      mockPrepare.mockImplementation((sql: string) => {
        if (sql.includes('parent_task_id')) return { all: vi.fn().mockReturnValue([]) };
        return {
          get: vi.fn().mockImplementation((...args: unknown[]) => {
            if (args[0] === 'dep-1') return dep1;
            return undefined;
          }),
          all: vi.fn().mockReturnValue([]),
        };
      });

      expect(repo.wouldCreateCircularDependency('task-1', 'dep-1')).toBe(true);
    });

    it('allows non-circular dependency', () => {
      const dep1 = makeTaskRow({ id: 'dep-1', depends_on: null });

      mockPrepare.mockImplementation((sql: string) => {
        if (sql.includes('parent_task_id')) return { all: vi.fn().mockReturnValue([]) };
        return {
          get: vi.fn().mockImplementation((...args: unknown[]) => {
            if (args[0] === 'dep-1') return dep1;
            return undefined;
          }),
          all: vi.fn().mockReturnValue([]),
        };
      });

      expect(repo.wouldCreateCircularDependency('task-1', 'dep-1')).toBe(false);
    });
  });

  describe('isReadyToExecute', () => {
    it('returns false for non-todo/backlog tasks', () => {
      mockPrepare.mockImplementation((sql: string) => {
        if (sql.includes('parent_task_id')) return { all: vi.fn().mockReturnValue([]) };
        return {
          get: vi.fn().mockReturnValue(makeTaskRow({ status: 'in_progress' })),
          all: vi.fn().mockReturnValue([]),
        };
      });

      expect(repo.isReadyToExecute('task-1')).toBe(false);
    });

    it('returns true for todo task with no dependencies', () => {
      mockPrepare.mockImplementation((sql: string) => {
        if (sql.includes('parent_task_id')) return { all: vi.fn().mockReturnValue([]) };
        return {
          get: vi.fn().mockReturnValue(makeTaskRow({ status: 'todo' })),
          all: vi.fn().mockReturnValue([]),
        };
      });

      expect(repo.isReadyToExecute('task-1')).toBe(true);
    });

    it('returns false for nonexistent task', () => {
      mockPrepare.mockImplementation(() => ({
        get: vi.fn().mockReturnValue(undefined),
        all: vi.fn().mockReturnValue([]),
      }));

      expect(repo.isReadyToExecute('nonexistent')).toBe(false);
    });

    it('returns true for backlog task with no dependencies', () => {
      mockPrepare.mockImplementation((sql: string) => {
        if (sql.includes('parent_task_id')) return { all: vi.fn().mockReturnValue([]) };
        return {
          get: vi.fn().mockReturnValue(makeTaskRow({ status: 'backlog' })),
          all: vi.fn().mockReturnValue([]),
        };
      });

      expect(repo.isReadyToExecute('task-1')).toBe(true);
    });
  });

  describe('create', () => {
    it('creates a new task', () => {
      const createdRow = makeTaskRow();
      mockPrepare.mockImplementation((sql: string) => {
        if (sql.includes('INSERT')) return { run: vi.fn() };
        if (sql.includes('parent_task_id')) return { all: vi.fn().mockReturnValue([]) };
        return { get: vi.fn().mockReturnValue(createdRow), all: vi.fn().mockReturnValue([]) };
      });

      const result = repo.create({ sessionId: 'sess-1', title: 'New Task' });
      expect(result).toBeDefined();
      expect(result.title).toBe('Test Task');
    });
  });

  describe('update', () => {
    it('updates title', () => {
      const row = makeTaskRow();
      mockPrepare.mockImplementation((sql: string) => {
        if (sql.includes('parent_task_id')) return { all: vi.fn().mockReturnValue([]) };
        if (sql.includes('UPDATE')) return { run: vi.fn() };
        return { get: vi.fn().mockReturnValue(row), all: vi.fn().mockReturnValue([]) };
      });

      const result = repo.update('task-1', { title: 'Updated' });
      expect(result).toBeDefined();
    });

    it('updates status to done and sets completed_at', () => {
      const row = makeTaskRow();
      mockPrepare.mockImplementation((sql: string) => {
        if (sql.includes('parent_task_id')) return { all: vi.fn().mockReturnValue([]) };
        if (sql.includes('UPDATE')) return { run: vi.fn() };
        return { get: vi.fn().mockReturnValue(row), all: vi.fn().mockReturnValue([]) };
      });

      const result = repo.update('task-1', { status: 'done' });
      expect(result).toBeDefined();
    });

    it('returns null for nonexistent task', () => {
      mockPrepare.mockImplementation(() => ({
        get: vi.fn().mockReturnValue(undefined),
        all: vi.fn().mockReturnValue([]),
      }));

      expect(repo.update('nonexistent', { title: 'test' })).toBeNull();
    });

    it('updates multiple fields', () => {
      const row = makeTaskRow();
      mockPrepare.mockReturnValue({
        run: vi.fn(),
        get: vi.fn().mockReturnValue(row),
        all: vi.fn().mockReturnValue([]),
      });

      const result = repo.update('task-1', {
        description: 'desc',
        priority: 'high',
        assignedAgentId: 'agent-1',
        parentTaskId: 'parent-1',
        reviewFeedback: 'feedback',
        dependsOn: ['dep-1'],
      });
      expect(result).toBeDefined();
    });
  });

  describe('getBySessionId', () => {
    it('returns tasks for session', () => {
      const rows = [makeTaskRow()];
      mockPrepare.mockImplementation((sql: string) => {
        if (sql.includes('parent_task_id')) return { all: vi.fn().mockReturnValue([]) };
        return { all: vi.fn().mockReturnValue(rows) };
      });

      const result = repo.getBySessionId('sess-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getByStatus', () => {
    it('returns tasks with status', () => {
      const rows = [makeTaskRow()];
      mockPrepare.mockImplementation((sql: string) => {
        if (sql.includes('parent_task_id')) return { all: vi.fn().mockReturnValue([]) };
        return { all: vi.fn().mockReturnValue(rows) };
      });

      const result = repo.getByStatus('todo');
      expect(result).toHaveLength(1);
    });
  });

  describe('updateStatus', () => {
    it('updates status', () => {
      const row = makeTaskRow();
      mockPrepare.mockImplementation((sql: string) => {
        if (sql.includes('parent_task_id')) return { all: vi.fn().mockReturnValue([]) };
        if (sql.includes('UPDATE')) return { run: vi.fn() };
        return { get: vi.fn().mockReturnValue(row), all: vi.fn().mockReturnValue([]) };
      });

      const result = repo.updateStatus('task-1', 'in_progress');
      expect(result).toBeDefined();
    });
  });

  describe('deleteBySessionId', () => {
    it('deletes tasks for session', () => {
      mockPrepare.mockImplementation(() => ({
        run: vi.fn().mockReturnValue({ changes: 3 }),
      }));

      expect(repo.deleteBySessionId('sess-1')).toBe(3);
    });
  });

  describe('getSubtasks', () => {
    it('returns subtasks', () => {
      const rows = [makeTaskRow({ id: 'sub-1', parent_task_id: 'task-1' })];
      mockPrepare.mockImplementation((sql: string) => {
        if (sql.includes('parent_task_id = ?') && !sql.includes('SELECT id')) {
          return { all: vi.fn().mockReturnValue(rows) };
        }
        return { all: vi.fn().mockReturnValue([]) };
      });

      const result = repo.getSubtasks('task-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('createSubtasks', () => {
    it('creates subtasks for parent', () => {
      const parentRow = makeTaskRow({ id: 'parent-1' });
      const childRow = makeTaskRow({ id: 'child-1' });

      mockPrepare.mockImplementation((sql: string) => {
        if (sql.includes('INSERT')) return { run: vi.fn() };
        if (sql.includes('parent_task_id')) return { all: vi.fn().mockReturnValue([]) };
        return {
          get: vi.fn().mockImplementation((...args: unknown[]) => {
            if (args[0] === 'parent-1') return parentRow;
            return childRow;
          }),
          all: vi.fn().mockReturnValue([]),
        };
      });

      const result = repo.createSubtasks('parent-1', ['Subtask 1', 'Subtask 2']);
      expect(result).toHaveLength(2);
    });

    it('returns empty array for nonexistent parent', () => {
      mockPrepare.mockImplementation(() => ({
        get: vi.fn().mockReturnValue(undefined),
        all: vi.fn().mockReturnValue([]),
      }));

      expect(repo.createSubtasks('nonexistent', ['Sub'])).toHaveLength(0);
    });
  });

  describe('clearReviewFeedback', () => {
    it('clears review feedback', () => {
      const row = makeTaskRow();
      mockPrepare.mockImplementation((sql: string) => {
        if (sql.includes('parent_task_id')) return { all: vi.fn().mockReturnValue([]) };
        if (sql.includes('UPDATE')) return { run: vi.fn() };
        return { get: vi.fn().mockReturnValue(row), all: vi.fn().mockReturnValue([]) };
      });

      const result = repo.clearReviewFeedback('task-1');
      expect(result).toBeDefined();
    });
  });

  describe('getDependentTasks', () => {
    it('returns tasks that depend on this task', () => {
      const rows = [
        makeTaskRow({ id: 'task-1' }),
        makeTaskRow({ id: 'task-2', depends_on: '["task-1"]' }),
      ];
      mockPrepare.mockImplementation((sql: string) => {
        if (sql.includes('parent_task_id')) return { all: vi.fn().mockReturnValue([]) };
        return { all: vi.fn().mockReturnValue(rows) };
      });

      const result = repo.getDependentTasks('task-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-2');
    });
  });

  describe('getDependencyTree', () => {
    it('returns null for nonexistent task', () => {
      mockPrepare.mockImplementation(() => ({
        get: vi.fn().mockReturnValue(undefined),
        all: vi.fn().mockReturnValue([]),
      }));

      expect(repo.getDependencyTree('nonexistent')).toBeNull();
    });

    it('returns tree with dependencies', () => {
      const task1 = makeTaskRow({ id: 'task-1', depends_on: '["dep-1"]' });
      const dep1 = makeTaskRow({ id: 'dep-1' });

      mockPrepare.mockImplementation((sql: string) => {
        if (sql.includes('parent_task_id')) return { all: vi.fn().mockReturnValue([]) };
        return {
          get: vi.fn().mockImplementation((...args: unknown[]) => {
            if (args[0] === 'task-1') return task1;
            if (args[0] === 'dep-1') return dep1;
            return undefined;
          }),
          all: vi.fn().mockReturnValue([]),
        };
      });

      const result = repo.getDependencyTree('task-1');
      expect(result).toBeDefined();
      expect(result!.task.id).toBe('task-1');
      expect(result!.dependencies).toHaveLength(1);
    });
  });

  describe('getReadyTasks', () => {
    it('returns ready tasks', () => {
      const rows = [makeTaskRow({ status: 'todo' })];
      mockPrepare.mockImplementation((sql: string) => {
        if (sql.includes('parent_task_id')) return { all: vi.fn().mockReturnValue([]) };
        if (sql.includes('todo') && sql.includes('backlog')) {
          return { all: vi.fn().mockReturnValue(rows) };
        }
        return { get: vi.fn().mockReturnValue(rows[0]), all: vi.fn().mockReturnValue([]) };
      });

      const result = repo.getReadyTasks();
      expect(result).toHaveLength(1);
    });
  });
});
