export interface Task {
  id: string;
  sessionId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedAgentId?: string;
  parentTaskId?: string;
  subtasks?: string[];
  // Review feedback injection
  reviewFeedback?: string;
  // Task dependencies for Ready check
  dependsOn?: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskCreateInput {
  sessionId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignedAgentId?: string;
  parentTaskId?: string;
}
