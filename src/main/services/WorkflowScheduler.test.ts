import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockStop, mockSchedule, mockValidate } = vi.hoisted(() => {
  const mockStop = vi.fn();
  return {
    mockStop,
    mockSchedule: vi.fn(() => ({ stop: mockStop })),
    mockValidate: vi.fn(() => true),
  };
});

vi.mock('node-cron', () => ({
  default: {
    schedule: mockSchedule,
    validate: mockValidate,
  },
}));

vi.mock('./WorkflowEngine', () => ({
  getWorkflowEngine: () => ({ execute: vi.fn() }),
}));

vi.mock('./db/WorkflowRepository', () => ({
  WorkflowRepository: class {
    findAll = vi.fn(() => []);
  },
}));

import { WorkflowScheduler } from './WorkflowScheduler';

describe('WorkflowScheduler', () => {
  let scheduler: WorkflowScheduler;

  beforeEach(() => {
    vi.clearAllMocks();
    scheduler = new WorkflowScheduler();
  });

  describe('scheduleWorkflow', () => {
    it('schedules a workflow', () => {
      scheduler.scheduleWorkflow(1, '* * * * *');

      expect(mockSchedule).toHaveBeenCalledWith('* * * * *', expect.any(Function), expect.any(Object));
      expect(scheduler.isScheduled(1)).toBe(true);
    });

    it('throws on invalid cron', () => {
      mockValidate.mockReturnValueOnce(false);

      expect(() => scheduler.scheduleWorkflow(1, 'invalid')).toThrow('Invalid cron');
    });

    it('replaces existing schedule', () => {
      scheduler.scheduleWorkflow(1, '* * * * *');
      scheduler.scheduleWorkflow(1, '0 * * * *');

      expect(mockStop).toHaveBeenCalledOnce();
      expect(scheduler.getScheduledWorkflows()).toHaveLength(1);
    });
  });

  describe('unscheduleWorkflow', () => {
    it('stops and removes', () => {
      scheduler.scheduleWorkflow(1, '* * * * *');
      scheduler.unscheduleWorkflow(1);

      expect(mockStop).toHaveBeenCalled();
      expect(scheduler.isScheduled(1)).toBe(false);
    });

    it('does nothing for non-scheduled', () => {
      scheduler.unscheduleWorkflow(999);
    });
  });

  describe('getScheduledWorkflows', () => {
    it('returns all', () => {
      scheduler.scheduleWorkflow(1, '* * * * *');
      scheduler.scheduleWorkflow(2, '0 * * * *');
      expect(scheduler.getScheduledWorkflows()).toHaveLength(2);
    });
  });

  describe('stopAll', () => {
    it('stops all and clears', () => {
      scheduler.scheduleWorkflow(1, '* * * * *');
      scheduler.scheduleWorkflow(2, '0 * * * *');
      scheduler.stopAll();
      expect(mockStop).toHaveBeenCalledTimes(2);
      expect(scheduler.getScheduledWorkflows()).toHaveLength(0);
    });
  });

  describe('isScheduled', () => {
    it('returns false for non-scheduled', () => {
      expect(scheduler.isScheduled(99)).toBe(false);
    });
  });
});
