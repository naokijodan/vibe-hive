import { create } from 'zustand';
import { Task, TaskCreateInput, TaskStatus } from '../../shared/types/task';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTasks: () => Promise<void>;
  createTask: (input: TaskCreateInput) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'sessionId'>>) => Promise<Task | null>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  loadTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await window.electronAPI.dbTaskGetAll() as Task[];
      // Date strings from DB need to be converted to Date objects
      const parsedTasks = tasks.map(task => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      }));
      set({ tasks: parsedTasks, isLoading: false });
    } catch (error) {
      console.error('Failed to load tasks:', error);
      set({ error: 'Failed to load tasks', isLoading: false });
    }
  },

  createTask: async (input: TaskCreateInput) => {
    set({ error: null });
    try {
      const task = await window.electronAPI.dbTaskCreate(input) as Task;
      const parsedTask = {
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      };
      set(state => ({ tasks: [parsedTask, ...state.tasks] }));
      return parsedTask;
    } catch (error) {
      console.error('Failed to create task:', error);
      set({ error: 'Failed to create task' });
      return null;
    }
  },

  updateTask: async (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'sessionId'>>) => {
    set({ error: null });
    try {
      const task = await window.electronAPI.dbTaskUpdate(id, updates) as Task;
      const parsedTask = {
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      };
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? parsedTask : t)
      }));
      return parsedTask;
    } catch (error) {
      console.error('Failed to update task:', error);
      set({ error: 'Failed to update task' });
      return null;
    }
  },

  updateTaskStatus: async (id: string, status: TaskStatus) => {
    set({ error: null });
    try {
      const task = await window.electronAPI.dbTaskUpdateStatus(id, status) as Task;
      const parsedTask = {
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      };
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? parsedTask : t)
      }));
      return parsedTask;
    } catch (error) {
      console.error('Failed to update task status:', error);
      set({ error: 'Failed to update task status' });
      return null;
    }
  },

  deleteTask: async (id: string) => {
    set({ error: null });
    try {
      const success = await window.electronAPI.dbTaskDelete(id) as boolean;
      if (success) {
        set(state => ({
          tasks: state.tasks.filter(t => t.id !== id)
        }));
      }
      return success;
    } catch (error) {
      console.error('Failed to delete task:', error);
      set({ error: 'Failed to delete task' });
      return false;
    }
  },
}));
