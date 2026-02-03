import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockFindById,
  mockFindAll,
  mockFindBySessionId,
  mockCreateExecution,
  mockUpdateExecution,
  mockFindExecutionById,
  mockFindExecutionsByWorkflowId,
  mockTaskCreate,
  mockWebContentsSend,
  mockStartExecution,
  mockGetExecution,
  mockCancelExecution,
  mockNotificationSend,
  mockSetWebhookUrl,
} = vi.hoisted(() => ({
  mockFindById: vi.fn(),
  mockFindAll: vi.fn(() => []),
  mockFindBySessionId: vi.fn(() => []),
  mockCreateExecution: vi.fn(() => ({ id: 1, workflowId: 1, status: 'running', startedAt: Date.now() })),
  mockUpdateExecution: vi.fn(),
  mockFindExecutionById: vi.fn(),
  mockFindExecutionsByWorkflowId: vi.fn(() => []),
  mockTaskCreate: vi.fn(),
  mockWebContentsSend: vi.fn(),
  mockStartExecution: vi.fn(),
  mockGetExecution: vi.fn(),
  mockCancelExecution: vi.fn(),
  mockNotificationSend: vi.fn(),
  mockSetWebhookUrl: vi.fn(),
}));

vi.mock('electron', () => ({
  BrowserWindow: class {
    isDestroyed = vi.fn(() => false);
    webContents = {
      send: mockWebContentsSend,
    };
  },
}));

vi.mock('./db/WorkflowRepository', () => ({
  WorkflowRepository: class {
    findById = mockFindById;
    findAll = mockFindAll;
    findBySessionId = mockFindBySessionId;
    createExecution = mockCreateExecution;
    updateExecution = mockUpdateExecution;
    findExecutionById = mockFindExecutionById;
    findExecutionsByWorkflowId = mockFindExecutionsByWorkflowId;
  },
}));

vi.mock('./db/TaskRepository', () => ({
  TaskRepository: class {
    create = mockTaskCreate;
  },
}));

vi.mock('./ExecutionEngine', () => ({
  getExecutionEngine: () => ({
    startExecution: mockStartExecution,
    getExecution: mockGetExecution,
    cancelExecution: mockCancelExecution,
  }),
}));

vi.mock('./NotificationService', () => ({
  notificationService: {
    send: mockNotificationSend,
    setWebhookUrl: mockSetWebhookUrl,
  },
}));

vi.mock('./SettingsService', () => ({
  getSettingsService: () => ({
    getSettings: () => ({
      agent: {
        providers: {
          'claude-code': { enabled: true, cliPath: 'claude' },
          codex: { enabled: true, cliPath: 'codex' },
          gemini: { enabled: true, cliPath: 'gemini' },
          ollama: { enabled: true, cliPath: 'ollama' },
        },
        ollamaDefaultModel: 'llama3',
      },
    }),
  }),
}));

import { WorkflowEngine, getWorkflowEngine } from './WorkflowEngine';
import { BrowserWindow } from 'electron';

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new WorkflowEngine();
  });

  describe('setMainWindow', () => {
    it('sets the main window', () => {
      const window = new BrowserWindow();
      engine.setMainWindow(window);
      // No error
    });
  });

  describe('getWorkflow', () => {
    it('delegates to repository', () => {
      mockFindById.mockReturnValue({ id: 1, name: 'WF' });
      expect(engine.getWorkflow(1)?.name).toBe('WF');
    });

    it('returns null when not found', () => {
      mockFindById.mockReturnValue(null);
      expect(engine.getWorkflow(999)).toBeNull();
    });
  });

  describe('getAllWorkflows', () => {
    it('returns list', () => {
      mockFindAll.mockReturnValue([{ id: 1 }]);
      expect(engine.getAllWorkflows()).toHaveLength(1);
    });
  });

  describe('getWorkflowsBySession', () => {
    it('delegates to repository', () => {
      mockFindBySessionId.mockReturnValue([]);
      expect(engine.getWorkflowsBySession(1)).toEqual([]);
    });
  });

  describe('getExecution', () => {
    it('delegates to repository', () => {
      mockFindExecutionById.mockReturnValue({ id: 1 });
      expect(engine.getExecution(1)?.id).toBe(1);
    });
  });

  describe('getExecutionsByWorkflow', () => {
    it('delegates to repository', () => {
      mockFindExecutionsByWorkflowId.mockReturnValue([]);
      expect(engine.getExecutionsByWorkflow(1)).toEqual([]);
    });
  });

  describe('execute', () => {
    it('throws when workflow not found', async () => {
      mockFindById.mockReturnValue(null);
      await expect(engine.execute({ workflowId: 999 })).rejects.toThrow('not found');
    });

    it('returns failed on workflow error', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          { id: 'n2', type: 'unknown_bad', data: {} },
        ],
        edges: [{ source: 'n1', target: 'n2' }],
      });

      const result = await engine.execute({ workflowId: 1 });
      expect(result.status).toBe('failed');
    });

    it('succeeds with trigger-only workflow', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'Simple',
        nodes: [{ id: 'n1', type: 'trigger', data: {} }],
        edges: [],
      });

      const result = await engine.execute({ workflowId: 1, triggerData: { test: true } });
      expect(result.status).toBe('success');
    });

    it('notifies renderer on execution start and completion', async () => {
      const window = new BrowserWindow();
      engine.setMainWindow(window);

      mockFindById.mockReturnValue({
        id: 1,
        name: 'WF',
        nodes: [{ id: 'n1', type: 'trigger', data: {} }],
        edges: [],
      });

      await engine.execute({ workflowId: 1 });

      expect(mockWebContentsSend).toHaveBeenCalledWith('workflow:execution:started', expect.any(Object));
      expect(mockWebContentsSend).toHaveBeenCalledWith('workflow:execution:completed', expect.any(Object));
    });

    it('creates task when autoCreateTask is enabled', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'AutoTask WF',
        sessionId: 1,
        autoCreateTask: true,
        nodes: [{ id: 'n1', type: 'trigger', data: {} }],
        edges: [],
      });

      await engine.execute({ workflowId: 1 });

      expect(mockTaskCreate).toHaveBeenCalledWith(expect.objectContaining({
        title: expect.stringContaining('AutoTask WF'),
      }));
    });
  });

  describe('cancel', () => {
    it('throws for non-existent execution', () => {
      expect(() => engine.cancel(999)).toThrow('not found');
    });
  });

  describe('onTaskCompleted', () => {
    it('does nothing with no active workflows', async () => {
      mockFindAll.mockReturnValue([]);
      await engine.onTaskCompleted('t1', 'Task 1', 's1');
      // No error
    });

    it('triggers event-based workflows', async () => {
      const window = new BrowserWindow();
      engine.setMainWindow(window);

      mockFindAll.mockReturnValue([
        {
          id: 1,
          status: 'active',
          nodes: [
            {
              id: 'trigger',
              type: 'trigger',
              data: {
                triggerType: 'event',
                config: { eventType: 'task_completed' },
              },
            },
          ],
          edges: [],
        },
      ]);
      mockFindById.mockReturnValue({
        id: 1,
        status: 'active',
        nodes: [{ id: 'trigger', type: 'trigger', data: {} }],
        edges: [],
      });

      await engine.onTaskCompleted('t1', 'Task 1', 's1');
      // Workflow execution should be triggered
    });

    it('filters by sessionId', async () => {
      mockFindAll.mockReturnValue([
        {
          id: 1,
          status: 'active',
          nodes: [
            {
              id: 'trigger',
              type: 'trigger',
              data: {
                triggerType: 'event',
                config: { eventType: 'task_completed', sessionId: '2' },
              },
            },
          ],
          edges: [],
        },
      ]);

      await engine.onTaskCompleted('t1', 'Task 1', '1');
      // No workflow triggered because sessionId doesn't match
    });

    it('filters by titlePattern', async () => {
      mockFindAll.mockReturnValue([
        {
          id: 1,
          status: 'active',
          nodes: [
            {
              id: 'trigger',
              type: 'trigger',
              data: {
                triggerType: 'event',
                config: { eventType: 'task_completed', titlePattern: 'Deploy' },
              },
            },
          ],
          edges: [],
        },
      ]);

      await engine.onTaskCompleted('t1', 'Build Task', 's1');
      // No workflow triggered because title doesn't match pattern
    });

    it('skips non-event triggers', async () => {
      mockFindAll.mockReturnValue([
        {
          id: 1,
          status: 'active',
          nodes: [
            {
              id: 'trigger',
              type: 'trigger',
              data: { triggerType: 'manual' },
            },
          ],
          edges: [],
        },
      ]);

      await engine.onTaskCompleted('t1', 'Task', 's1');
      // No workflow triggered
    });

    it('skips inactive workflows', async () => {
      mockFindAll.mockReturnValue([
        {
          id: 1,
          status: 'draft',
          nodes: [
            {
              id: 'trigger',
              type: 'trigger',
              data: {
                triggerType: 'event',
                config: { eventType: 'task_completed' },
              },
            },
          ],
          edges: [],
        },
      ]);

      await engine.onTaskCompleted('t1', 'Task', 's1');
      // No workflow triggered
    });
  });

  describe('node execution', () => {
    it('executes delay node', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'Delay WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          { id: 'n2', type: 'delay', data: { delayMs: 10 } },
        ],
        edges: [{ source: 'n1', target: 'n2' }],
      });

      const result = await engine.execute({ workflowId: 1 });
      expect(result.status).toBe('success');
    });

    it('executes merge node', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'Merge WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          { id: 'n2', type: 'merge', data: {} },
        ],
        edges: [{ source: 'n1', target: 'n2' }],
      });

      const result = await engine.execute({ workflowId: 1 });
      expect(result.status).toBe('success');
    });

    it('executes conditional node with simple condition - true branch', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'Conditional WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          {
            id: 'n2',
            type: 'conditional',
            data: {
              condition: { field: 'value', operator: 'equals', value: 'test' },
            },
          },
        ],
        edges: [{ source: 'n1', target: 'n2' }],
      });

      const result = await engine.execute({
        workflowId: 1,
        triggerData: { value: 'test' },
      });
      expect(result.status).toBe('success');
      expect(result.nodeResults?.n2).toEqual({ branch: 'true', conditionMet: true });
    });

    it('executes conditional node with simple condition - false branch', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'Conditional WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          {
            id: 'n2',
            type: 'conditional',
            data: {
              condition: { field: 'value', operator: 'equals', value: 'test' },
            },
          },
        ],
        edges: [{ source: 'n1', target: 'n2' }],
      });

      const result = await engine.execute({
        workflowId: 1,
        triggerData: { value: 'other' },
      });
      expect(result.status).toBe('success');
      expect(result.nodeResults?.n2).toEqual({ branch: 'false', conditionMet: false });
    });

    it('executes conditional node with condition group - AND', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'Conditional Group WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          {
            id: 'n2',
            type: 'conditional',
            data: {
              conditionGroup: {
                operator: 'AND',
                conditions: [
                  { field: 'a', operator: 'equals', value: 1 },
                  { field: 'b', operator: 'equals', value: 2 },
                ],
                groups: [],
              },
            },
          },
        ],
        edges: [{ source: 'n1', target: 'n2' }],
      });

      const result = await engine.execute({
        workflowId: 1,
        triggerData: { a: 1, b: 2 },
      });
      expect(result.nodeResults?.n2?.conditionMet).toBe(true);
    });

    it('executes conditional node with condition group - OR', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'Conditional OR WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          {
            id: 'n2',
            type: 'conditional',
            data: {
              conditionGroup: {
                operator: 'OR',
                conditions: [
                  { field: 'a', operator: 'equals', value: 1 },
                  { field: 'b', operator: 'equals', value: 999 },
                ],
                groups: [],
              },
            },
          },
        ],
        edges: [{ source: 'n1', target: 'n2' }],
      });

      const result = await engine.execute({
        workflowId: 1,
        triggerData: { a: 1, b: 2 },
      });
      expect(result.nodeResults?.n2?.conditionMet).toBe(true);
    });

    it('fails conditional node without condition', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'Bad Conditional WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          { id: 'n2', type: 'conditional', data: {} },
        ],
        edges: [{ source: 'n1', target: 'n2' }],
      });

      const result = await engine.execute({ workflowId: 1 });
      expect(result.status).toBe('failed');
      expect(result.error).toContain('No condition specified');
    });

    it('executes notification node', async () => {
      mockNotificationSend.mockResolvedValue(undefined);

      mockFindById.mockReturnValue({
        id: 1,
        name: 'Notification WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          {
            id: 'n2',
            type: 'notification',
            data: {
              notificationType: 'desktop',
              config: { title: 'Test', message: 'Hello' },
            },
          },
        ],
        edges: [{ source: 'n1', target: 'n2' }],
      });

      const result = await engine.execute({ workflowId: 1 });
      expect(result.status).toBe('success');
      expect(mockNotificationSend).toHaveBeenCalled();
    });

    it('sets webhook URL for slack notification', async () => {
      mockNotificationSend.mockResolvedValue(undefined);

      mockFindById.mockReturnValue({
        id: 1,
        name: 'Slack WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          {
            id: 'n2',
            type: 'notification',
            data: {
              notificationType: 'slack',
              config: { webhookUrl: 'https://hooks.slack.com/xxx', message: 'Hi' },
            },
          },
        ],
        edges: [{ source: 'n1', target: 'n2' }],
      });

      const result = await engine.execute({ workflowId: 1 });
      expect(result.status).toBe('success');
      expect(mockSetWebhookUrl).toHaveBeenCalledWith('slack', 'https://hooks.slack.com/xxx');
    });

    it('fails notification node without type', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'Bad Notification WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          { id: 'n2', type: 'notification', data: {} },
        ],
        edges: [{ source: 'n1', target: 'n2' }],
      });

      const result = await engine.execute({ workflowId: 1 });
      expect(result.status).toBe('failed');
      expect(result.error).toContain('Notification type not specified');
    });

    it('executes loop node with count type', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'Loop WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          {
            id: 'n2',
            type: 'loop',
            data: {
              loopConfig: { type: 'count', count: 3, maxIterations: 10 },
            },
          },
        ],
        edges: [{ source: 'n1', target: 'n2' }],
      });

      const result = await engine.execute({ workflowId: 1 });
      expect(result.status).toBe('success');
      expect(result.nodeResults?.n2?.iterations).toBe(0); // No child nodes
    });

    it('executes loop node with forEach type', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'ForEach WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          {
            id: 'n2',
            type: 'loop',
            data: {
              loopConfig: { type: 'forEach', arrayPath: 'items', maxIterations: 10 },
            },
          },
        ],
        edges: [{ source: 'n1', target: 'n2' }],
      });

      const result = await engine.execute({
        workflowId: 1,
        triggerData: { items: [1, 2, 3] },
      });
      expect(result.status).toBe('success');
    });

    it('fails loop node without config', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'Bad Loop WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          { id: 'n2', type: 'loop', data: {} },
        ],
        edges: [{ source: 'n1', target: 'n2' }],
      });

      const result = await engine.execute({ workflowId: 1 });
      expect(result.status).toBe('failed');
      expect(result.error).toContain('Loop configuration not specified');
    });

    it('fails forEach loop when field is not an array', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'Bad ForEach WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          {
            id: 'n2',
            type: 'loop',
            data: {
              loopConfig: { type: 'forEach', arrayPath: 'items', maxIterations: 10 },
            },
          },
          { id: 'n3', type: 'merge', data: {} },
        ],
        edges: [
          { source: 'n1', target: 'n2' },
          { source: 'n2', target: 'n3' },
        ],
      });

      const result = await engine.execute({
        workflowId: 1,
        triggerData: { items: 'not an array' },
      });
      expect(result.status).toBe('failed');
      expect(result.error).toContain('not an array');
    });

    it('fails subworkflow node without config', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'Bad Subworkflow WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          { id: 'n2', type: 'subworkflow', data: {} },
        ],
        edges: [{ source: 'n1', target: 'n2' }],
      });

      const result = await engine.execute({ workflowId: 1 });
      expect(result.status).toBe('failed');
      expect(result.error).toContain('Subworkflow not selected');
    });

    it('detects recursive subworkflow', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'Recursive WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          {
            id: 'n2',
            type: 'subworkflow',
            data: {
              subworkflowConfig: {
                workflowId: 1, // Same workflow - recursion!
                inputMapping: {},
                outputMapping: {},
              },
            },
          },
        ],
        edges: [{ source: 'n1', target: 'n2' }],
      });

      const result = await engine.execute({ workflowId: 1 });
      expect(result.status).toBe('failed');
      expect(result.error).toContain('Recursive subworkflow');
    });

    it('fails subworkflow when target not found', async () => {
      mockFindById
        .mockReturnValueOnce({
          id: 1,
          name: 'Parent WF',
          nodes: [
            { id: 'n1', type: 'trigger', data: {} },
            {
              id: 'n2',
              type: 'subworkflow',
              data: {
                subworkflowConfig: {
                  workflowId: 999,
                  inputMapping: {},
                  outputMapping: {},
                },
              },
            },
          ],
          edges: [{ source: 'n1', target: 'n2' }],
        })
        .mockReturnValueOnce(null);

      const result = await engine.execute({ workflowId: 1 });
      expect(result.status).toBe('failed');
      expect(result.error).toContain('not found');
    });

    it('fails task node without taskId', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'Bad Task WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          { id: 'n2', type: 'task', data: {} },
        ],
        edges: [{ source: 'n1', target: 'n2' }],
      });

      const result = await engine.execute({ workflowId: 1 });
      expect(result.status).toBe('failed');
      expect(result.error).toContain('Task ID not specified');
    });

    it('fails agent node without config', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'Bad Agent WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          { id: 'n2', type: 'agent', data: {} },
        ],
        edges: [{ source: 'n1', target: 'n2' }],
      });

      const result = await engine.execute({ workflowId: 1 });
      expect(result.status).toBe('failed');
      expect(result.error).toContain('Agent configuration not specified');
    });
  });

  describe('conditional operators', () => {
    const testCondition = async (operator: string, fieldValue: unknown, conditionValue: unknown, expected: boolean) => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'Condition Test',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          {
            id: 'n2',
            type: 'conditional',
            data: {
              condition: { field: 'val', operator, value: conditionValue },
            },
          },
        ],
        edges: [{ source: 'n1', target: 'n2' }],
      });

      const result = await engine.execute({
        workflowId: 1,
        triggerData: { val: fieldValue },
      });
      expect(result.nodeResults?.n2?.conditionMet).toBe(expected);
    };

    it('not_equals operator', async () => {
      await testCondition('not_equals', 'a', 'b', true);
      await testCondition('not_equals', 'a', 'a', false);
    });

    it('greater_than operator', async () => {
      await testCondition('greater_than', 10, 5, true);
      await testCondition('greater_than', 5, 10, false);
    });

    it('less_than operator', async () => {
      await testCondition('less_than', 5, 10, true);
      await testCondition('less_than', 10, 5, false);
    });

    it('contains operator', async () => {
      await testCondition('contains', 'hello world', 'world', true);
      await testCondition('contains', 'hello', 'world', false);
    });

    it('not_contains operator', async () => {
      await testCondition('not_contains', 'hello', 'world', true);
      await testCondition('not_contains', 'hello world', 'world', false);
    });

    it('unknown operator returns false', async () => {
      await testCondition('unknown_op', 'a', 'a', false);
    });
  });

  describe('retry and error handling', () => {
    it('continues on error when configured', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'Continue Error WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          {
            id: 'n2',
            type: 'unknown_type',
            data: {
              errorHandlingConfig: { continueOnError: true, errorOutput: 'fallback' },
            },
          },
        ],
        edges: [{ source: 'n1', target: 'n2' }],
      });

      const result = await engine.execute({ workflowId: 1 });
      expect(result.status).toBe('success');
    });

    it('respects timeout config', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'Timeout WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          {
            id: 'n2',
            type: 'delay',
            data: {
              delayMs: 10,
              timeoutConfig: { enabled: true, timeoutMs: 5000 },
            },
          },
        ],
        edges: [{ source: 'n1', target: 'n2' }],
      });

      const result = await engine.execute({ workflowId: 1 });
      expect(result.status).toBe('success');
    });
  });

  describe('parallel execution', () => {
    it('executes nodes in parallel within same level', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'Parallel WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          { id: 'n2', type: 'delay', data: { delayMs: 10 } },
          { id: 'n3', type: 'delay', data: { delayMs: 10 } },
          { id: 'n4', type: 'merge', data: {} },
        ],
        edges: [
          { source: 'n1', target: 'n2' },
          { source: 'n1', target: 'n3' },
          { source: 'n2', target: 'n4' },
          { source: 'n3', target: 'n4' },
        ],
      });

      const result = await engine.execute({ workflowId: 1 });
      expect(result.status).toBe('success');
    });

    it('handles multiple inputs to merge node', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'Multi Merge WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          { id: 'n2', type: 'merge', data: {} },
          { id: 'n3', type: 'merge', data: {} },
          { id: 'n4', type: 'merge', data: {} },
        ],
        edges: [
          { source: 'n1', target: 'n2' },
          { source: 'n1', target: 'n3' },
          { source: 'n2', target: 'n4' },
          { source: 'n3', target: 'n4' },
        ],
      });

      const result = await engine.execute({ workflowId: 1 });
      expect(result.status).toBe('success');
    });
  });

  describe('cycle detection', () => {
    it('throws error on workflow with cycles', async () => {
      mockFindById.mockReturnValue({
        id: 1,
        name: 'Cyclic WF',
        nodes: [
          { id: 'n1', type: 'trigger', data: {} },
          { id: 'n2', type: 'merge', data: {} },
          { id: 'n3', type: 'merge', data: {} },
        ],
        edges: [
          { source: 'n1', target: 'n2' },
          { source: 'n2', target: 'n3' },
          { source: 'n3', target: 'n2' }, // Creates cycle
        ],
      });

      const result = await engine.execute({ workflowId: 1 });
      expect(result.status).toBe('failed');
      expect(result.error).toContain('cycles');
    });
  });

  describe('getWorkflowEngine', () => {
    it('returns singleton', () => {
      const a = getWorkflowEngine();
      const b = getWorkflowEngine();
      expect(a).toBe(b);
    });
  });
});
