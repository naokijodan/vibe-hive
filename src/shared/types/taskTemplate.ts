import type { TaskStatus, TaskPriority } from './task';

/**
 * Task template data - the core task information
 */
export interface TaskTemplateData {
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  role?: string;
  command?: string;
}

/**
 * Subtask template data
 */
export interface SubtaskTemplateData {
  title: string;
  description?: string;
}

/**
 * Task template - reusable task pattern
 */
export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;

  taskData: TaskTemplateData;
  subtasks?: SubtaskTemplateData[];

  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

/**
 * Input for creating a new task template
 */
export interface TaskTemplateCreateInput {
  name: string;
  description?: string;
  category?: string;
  taskData: TaskTemplateData;
  subtasks?: SubtaskTemplateData[];
}

/**
 * Input for updating an existing task template
 */
export interface TaskTemplateUpdateInput {
  name?: string;
  description?: string;
  category?: string;
  taskData?: Partial<TaskTemplateData>;
  subtasks?: SubtaskTemplateData[];
}
