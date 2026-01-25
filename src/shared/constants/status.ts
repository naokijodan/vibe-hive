// Session statuses
export const SESSION_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  WAITING: 'waiting',
  ERROR: 'error',
  COMPLETED: 'completed',
} as const;

// Agent statuses
export const AGENT_STATUS = {
  IDLE: 'idle',
  THINKING: 'thinking',
  EXECUTING: 'executing',
  WAITING_INPUT: 'waiting_input',
  ERROR: 'error',
} as const;

// Task statuses
export const TASK_STATUS = {
  BACKLOG: 'backlog',
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done',
} as const;

// Task priorities
export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

// Agent roles
export const AGENT_ROLE = {
  ORCHESTRATOR: 'orchestrator',
  DEVELOPER: 'developer',
  REVIEWER: 'reviewer',
  TESTER: 'tester',
  CUSTOM: 'custom',
} as const;
