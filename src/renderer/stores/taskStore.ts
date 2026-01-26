import { create } from 'zustand';
import { Task, TaskCreateInput, TaskStatus } from '../../shared/types/task';

interface DependencyCheckResult {
  met: boolean;
  completed: number;
  total: number;
  blocking: Task[];
}

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

  // Subtask management
  createSubtasks: (parentId: string, titles: string[]) => Promise<Task[]>;
  getSubtasks: (parentId: string) => Promise<Task[]>;

  // Dependency management
  checkDependencies: (taskId: string) => Promise<DependencyCheckResult>;
  setDependencies: (taskId: string, dependsOn: string[]) => Promise<Task | null>;

  // Review feedback
  setReviewFeedback: (taskId: string, feedback: string) => Promise<Task | null>;
  clearReviewFeedback: (taskId: string) => Promise<Task | null>;
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
      // Ready check: if moving to in_progress, check dependencies first
      if (status === 'in_progress') {
        const depCheck = await window.electronAPI.dbTaskCheckDependencies(id);
        if (!depCheck.met) {
          const blockingTitles = depCheck.blocking.map((t: Task) => t.title).join(', ');
          set({ error: `依存タスクが未完了です: ${blockingTitles}` });
          console.warn(`Task ${id} blocked by dependencies: ${blockingTitles}`);
          return null;
        }
      }

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

      // Auto-start Claude Code agent when task moves to in_progress
      // No longer requires assignedAgentId - automatically starts an agent for any task
      if (status === 'in_progress') {
        try {
          const agentSessionId = `agent-${parsedTask.id}`;
          // Use task's working directory or default
          const cwd = '/Users/naokijodan/Desktop/vibe-hive';

          // Start the agent
          await window.electronAPI.agentStart(agentSessionId, 'claude', cwd);

          // Build task prompt with optional role/system prompt and review feedback
          let taskPrompt = '';

          // Role injection: prepend role/system prompt if present
          if (parsedTask.role) {
            taskPrompt += `# あなたの役割\n${parsedTask.role}\n\n---\n\n`;
          }

          // Review feedback injection: prepend feedback if present
          if (parsedTask.reviewFeedback) {
            taskPrompt += `# レビューフィードバック\n以下のフィードバックを踏まえて修正してください:\n\n${parsedTask.reviewFeedback}\n\n---\n\n`;

            // Clear the feedback after injection
            await window.electronAPI.dbTaskClearReviewFeedback(id);
          }

          taskPrompt += `# タスク: ${parsedTask.title}\n\n${parsedTask.description || ''}\n`;
          taskPrompt += '\n上記のタスクを実行してください。\n';

          await window.electronAPI.agentInput(agentSessionId, taskPrompt);

          console.log(`Auto-started agent for task: ${parsedTask.id}`);
        } catch (error) {
          console.error('Failed to auto-start agent:', error);
          // Don't fail the task update if agent start fails
        }
      }

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

  // Subtask management
  createSubtasks: async (parentId: string, titles: string[]) => {
    set({ error: null });
    try {
      const tasks = await window.electronAPI.dbTaskCreateSubtasks(parentId, titles) as Task[];
      const parsedTasks = tasks.map(task => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      }));
      // Add new subtasks and refresh parent task
      set(state => ({
        tasks: [...parsedTasks, ...state.tasks]
      }));
      // Reload to get updated parent task with subtask IDs
      get().loadTasks();
      return parsedTasks;
    } catch (error) {
      console.error('Failed to create subtasks:', error);
      set({ error: 'Failed to create subtasks' });
      return [];
    }
  },

  getSubtasks: async (parentId: string) => {
    try {
      const tasks = await window.electronAPI.dbTaskGetSubtasks(parentId) as Task[];
      return tasks.map(task => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      }));
    } catch (error) {
      console.error('Failed to get subtasks:', error);
      return [];
    }
  },

  // Dependency management
  checkDependencies: async (taskId: string) => {
    try {
      const result = await window.electronAPI.dbTaskCheckDependencies(taskId);
      // Parse blocking tasks dates
      const blocking = (result.blocking as Task[]).map(task => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      }));
      return { ...result, blocking };
    } catch (error) {
      console.error('Failed to check dependencies:', error);
      return { met: true, completed: 0, total: 0, blocking: [] };
    }
  },

  setDependencies: async (taskId: string, dependsOn: string[]) => {
    set({ error: null });
    try {
      const task = await window.electronAPI.dbTaskUpdate(taskId, { dependsOn }) as Task;
      const parsedTask = {
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      };
      set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? parsedTask : t)
      }));
      return parsedTask;
    } catch (error) {
      console.error('Failed to set dependencies:', error);
      set({ error: 'Failed to set dependencies' });
      return null;
    }
  },

  // Review feedback
  setReviewFeedback: async (taskId: string, feedback: string) => {
    set({ error: null });
    try {
      const task = await window.electronAPI.dbTaskUpdate(taskId, { reviewFeedback: feedback }) as Task;
      const parsedTask = {
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      };
      set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? parsedTask : t)
      }));
      return parsedTask;
    } catch (error) {
      console.error('Failed to set review feedback:', error);
      set({ error: 'Failed to set review feedback' });
      return null;
    }
  },

  clearReviewFeedback: async (taskId: string) => {
    try {
      const task = await window.electronAPI.dbTaskClearReviewFeedback(taskId) as Task;
      const parsedTask = {
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      };
      set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? parsedTask : t)
      }));
      return parsedTask;
    } catch (error) {
      console.error('Failed to clear review feedback:', error);
      return null;
    }
  },
}));
