import { describe, it, expect } from 'vitest';
import { SESSION_STATUS, AGENT_STATUS, TASK_STATUS, TASK_PRIORITY, AGENT_ROLE } from './status';

describe('status constants', () => {
  it('SESSION_STATUS values', () => {
    expect(SESSION_STATUS.IDLE).toBe('idle');
    expect(SESSION_STATUS.RUNNING).toBe('running');
    expect(SESSION_STATUS.ERROR).toBe('error');
    expect(SESSION_STATUS.COMPLETED).toBe('completed');
    expect(SESSION_STATUS.WAITING).toBe('waiting');
  });

  it('AGENT_STATUS values', () => {
    expect(AGENT_STATUS.IDLE).toBe('idle');
    expect(AGENT_STATUS.THINKING).toBe('thinking');
    expect(AGENT_STATUS.EXECUTING).toBe('executing');
    expect(AGENT_STATUS.WAITING_INPUT).toBe('waiting_input');
    expect(AGENT_STATUS.ERROR).toBe('error');
  });

  it('TASK_STATUS values', () => {
    expect(TASK_STATUS.BACKLOG).toBe('backlog');
    expect(TASK_STATUS.TODO).toBe('todo');
    expect(TASK_STATUS.IN_PROGRESS).toBe('in_progress');
    expect(TASK_STATUS.REVIEW).toBe('review');
    expect(TASK_STATUS.DONE).toBe('done');
  });

  it('TASK_PRIORITY values', () => {
    expect(TASK_PRIORITY.LOW).toBe('low');
    expect(TASK_PRIORITY.MEDIUM).toBe('medium');
    expect(TASK_PRIORITY.HIGH).toBe('high');
    expect(TASK_PRIORITY.URGENT).toBe('urgent');
  });

  it('AGENT_ROLE values', () => {
    expect(AGENT_ROLE.ORCHESTRATOR).toBe('orchestrator');
    expect(AGENT_ROLE.DEVELOPER).toBe('developer');
    expect(AGENT_ROLE.REVIEWER).toBe('reviewer');
    expect(AGENT_ROLE.TESTER).toBe('tester');
    expect(AGENT_ROLE.CUSTOM).toBe('custom');
  });
});
