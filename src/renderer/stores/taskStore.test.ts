import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTaskStore } from './taskStore';

// Mock window.electronAPI
const mockElectronAPI = {
  dbTaskGetAll: vi.fn(),
  dbTaskCreate: vi.fn(),
  dbTaskUpdate: vi.fn(),
  dbTaskUpdateStatus: vi.fn(),
  dbTaskDelete: vi.fn(),
  dbTaskCreateSubtasks: vi.fn(),
  dbTaskGetSubtasks: vi.fn(),
  dbTaskCheckDependencies: vi.fn(),
  dbTaskClearReviewFeedback: vi.fn(),
  listSessions: vi.fn(),
  getActiveSession: vi.fn(),
  agentStart: vi.fn(),
};

vi.stubGlobal('window', { electronAPI: mockElectronAPI });

const makeMockTask = (overrides = {}) => ({
  id: 'task-1',
  title: 'Test Task',
  description: 'Description',
  status: 'todo',
  sessionId: 'sess-1',
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
  completedAt: null,
  ...overrides,
});

describe('taskStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useTaskStore.setState({ tasks: [], isLoading: false, error: null });
  });

  describe('loadTasks', () => {
    it('loads tasks and parses dates', async () => {
      mockElectronAPI.dbTaskGetAll.mockResolvedValue([makeMockTask()]);

      await useTaskStore.getState().loadTasks();

      const state = useTaskStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].createdAt).toBeInstanceOf(Date);
    });

    it('sets loading state', async () => {
      let resolvePromise: (value: unknown) => void;
      mockElectronAPI.dbTaskGetAll.mockReturnValue(
        new Promise(resolve => { resolvePromise = resolve; })
      );

      const loadPromise = useTaskStore.getState().loadTasks();
      expect(useTaskStore.getState().isLoading).toBe(true);

      resolvePromise!([]);
      await loadPromise;
      expect(useTaskStore.getState().isLoading).toBe(false);
    });

    it('handles error', async () => {
      mockElectronAPI.dbTaskGetAll.mockRejectedValue(new Error('DB error'));

      await useTaskStore.getState().loadTasks();

      const state = useTaskStore.getState();
      expect(state.error).toBe('Failed to load tasks');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('createTask', () => {
    it('creates task and adds to state', async () => {
      const newTask = makeMockTask({ id: 'task-new' });
      mockElectronAPI.dbTaskCreate.mockResolvedValue(newTask);

      const result = await useTaskStore.getState().createTask({
        title: 'Test Task',
        sessionId: 'sess-1',
      } as any);

      expect(result).toBeDefined();
      expect(result!.id).toBe('task-new');
      expect(useTaskStore.getState().tasks).toHaveLength(1);
    });

    it('returns null on error', async () => {
      mockElectronAPI.dbTaskCreate.mockRejectedValue(new Error('fail'));

      const result = await useTaskStore.getState().createTask({
        title: 'Test',
        sessionId: 'sess-1',
      } as any);

      expect(result).toBeNull();
      expect(useTaskStore.getState().error).toBe('Failed to create task');
    });
  });

  describe('updateTask', () => {
    it('updates task in state', async () => {
      const task = makeMockTask();
      useTaskStore.setState({ tasks: [{ ...task, createdAt: new Date(), updatedAt: new Date() }] as any });

      const updated = makeMockTask({ title: 'Updated' });
      mockElectronAPI.dbTaskUpdate.mockResolvedValue(updated);

      const result = await useTaskStore.getState().updateTask('task-1', { title: 'Updated' });
      expect(result!.title).toBe('Updated');
    });
  });

  describe('updateTaskStatus', () => {
    it('skips if same status', async () => {
      const task = makeMockTask({ status: 'in_progress' });
      useTaskStore.setState({
        tasks: [{ ...task, createdAt: new Date(), updatedAt: new Date() }] as any,
      });

      const result = await useTaskStore.getState().updateTaskStatus('task-1', 'in_progress' as any);
      expect(mockElectronAPI.dbTaskUpdateStatus).not.toHaveBeenCalled();
      expect(result!.status).toBe('in_progress');
    });

    it('checks dependencies before starting', async () => {
      const task = makeMockTask({ status: 'todo' });
      useTaskStore.setState({
        tasks: [{ ...task, createdAt: new Date(), updatedAt: new Date() }] as any,
      });

      mockElectronAPI.dbTaskCheckDependencies.mockResolvedValue({
        met: false,
        completed: 0,
        total: 1,
        blocking: [{ title: 'Blocker', createdAt: '2026-01-01', updatedAt: '2026-01-01' }],
      });

      const result = await useTaskStore.getState().updateTaskStatus('task-1', 'in_progress' as any);
      expect(result).toBeNull();
      expect(useTaskStore.getState().error).toContain('依存タスクが未完了');
    });

    it('updates status and starts agent on in_progress', async () => {
      const task = makeMockTask({ status: 'todo' });
      useTaskStore.setState({
        tasks: [{ ...task, createdAt: new Date(), updatedAt: new Date() }] as any,
      });

      mockElectronAPI.dbTaskCheckDependencies.mockResolvedValue({ met: true, blocking: [] });
      mockElectronAPI.dbTaskUpdateStatus.mockResolvedValue(
        makeMockTask({ status: 'in_progress' })
      );
      mockElectronAPI.listSessions.mockResolvedValue([]);
      mockElectronAPI.getActiveSession.mockResolvedValue(null);
      mockElectronAPI.agentStart.mockResolvedValue(undefined);

      await useTaskStore.getState().updateTaskStatus('task-1', 'in_progress' as any);

      expect(mockElectronAPI.agentStart).toHaveBeenCalled();
    });
  });

  describe('deleteTask', () => {
    it('removes task from state', async () => {
      useTaskStore.setState({
        tasks: [{ ...makeMockTask(), createdAt: new Date(), updatedAt: new Date() }] as any,
      });

      mockElectronAPI.dbTaskDelete.mockResolvedValue(true);

      const result = await useTaskStore.getState().deleteTask('task-1');
      expect(result).toBe(true);
      expect(useTaskStore.getState().tasks).toHaveLength(0);
    });

    it('returns false on error', async () => {
      mockElectronAPI.dbTaskDelete.mockRejectedValue(new Error('fail'));

      const result = await useTaskStore.getState().deleteTask('task-1');
      expect(result).toBe(false);
    });
  });
});
