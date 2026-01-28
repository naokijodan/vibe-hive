import cron from 'node-cron';
import { getWorkflowEngine } from './WorkflowEngine';
import { WorkflowRepository } from './db/WorkflowRepository';

interface ScheduledJob {
  workflowId: number;
  cronExpression: string;
  task: cron.ScheduledTask;
}

export class WorkflowScheduler {
  private repository: WorkflowRepository;
  private scheduledJobs: Map<number, ScheduledJob> = new Map();

  constructor() {
    this.repository = new WorkflowRepository();
  }

  /**
   * Initialize scheduler and load all active scheduled workflows
   */
  async initialize(): Promise<void> {
    console.log('Initializing workflow scheduler...');

    const workflows = this.repository.findAll();
    const activeWorkflows = workflows.filter(w => w.status === 'active');

    for (const workflow of activeWorkflows) {
      // Find trigger node with schedule type
      const triggerNode = workflow.nodes.find(n => n.type === 'trigger');
      if (!triggerNode || triggerNode.data.triggerType !== 'schedule') {
        continue;
      }

      const cronExpression = triggerNode.data.config?.cronExpression;
      if (cronExpression && cron.validate(cronExpression)) {
        this.scheduleWorkflow(workflow.id, cronExpression);
      } else {
        console.warn(`Invalid cron expression for workflow ${workflow.id}: ${cronExpression}`);
      }
    }

    console.log(`Scheduled ${this.scheduledJobs.size} workflows`);
  }

  /**
   * Schedule a workflow to run on a cron schedule
   */
  scheduleWorkflow(workflowId: number, cronExpression: string): void {
    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    // Remove existing schedule if any
    this.unscheduleWorkflow(workflowId);

    const task = cron.schedule(
      cronExpression,
      async () => {
        console.log(`Executing scheduled workflow ${workflowId}`);
        try {
          const engine = getWorkflowEngine();
          await engine.execute({ workflowId });
        } catch (error) {
          console.error(`Scheduled workflow ${workflowId} execution failed:`, error);
        }
      },
      {
        scheduled: true,
        timezone: 'UTC', // TODO: Make this configurable
      }
    );

    this.scheduledJobs.set(workflowId, {
      workflowId,
      cronExpression,
      task,
    });

    console.log(`Scheduled workflow ${workflowId} with cron: ${cronExpression}`);
  }

  /**
   * Remove a scheduled workflow
   */
  unscheduleWorkflow(workflowId: number): void {
    const job = this.scheduledJobs.get(workflowId);
    if (job) {
      job.task.stop();
      this.scheduledJobs.delete(workflowId);
      console.log(`Unscheduled workflow ${workflowId}`);
    }
  }

  /**
   * Update a workflow's schedule
   */
  updateSchedule(workflowId: number, cronExpression: string): void {
    this.scheduleWorkflow(workflowId, cronExpression);
  }

  /**
   * Get all scheduled workflows
   */
  getScheduledWorkflows(): ScheduledJob[] {
    return Array.from(this.scheduledJobs.values()).map(job => ({
      workflowId: job.workflowId,
      cronExpression: job.cronExpression,
      task: job.task,
    }));
  }

  /**
   * Stop all scheduled jobs
   */
  stopAll(): void {
    console.log(`Stopping ${this.scheduledJobs.size} scheduled workflows`);
    this.scheduledJobs.forEach(job => job.task.stop());
    this.scheduledJobs.clear();
  }

  /**
   * Check if a workflow is scheduled
   */
  isScheduled(workflowId: number): boolean {
    return this.scheduledJobs.has(workflowId);
  }
}

// Singleton instance
let instance: WorkflowScheduler | null = null;

export function getWorkflowScheduler(): WorkflowScheduler {
  if (!instance) {
    instance = new WorkflowScheduler();
  }
  return instance;
}
