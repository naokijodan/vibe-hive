import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validateCronExpression,
  validateUrl,
  validateTriggerNode,
  validateNotificationNode,
  validateTaskNode,
  validateConditionalNode,
  validateLoopNode,
  validateDelayNode,
  validateSubworkflowNode,
  validateWorkflowNode,
} from './validation';

describe('validateEmail', () => {
  it('accepts valid emails', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('a@b.co')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('not-an-email')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('user @example.com')).toBe(false);
  });
});

describe('validateCronExpression', () => {
  it('accepts valid cron expressions', () => {
    expect(validateCronExpression('0 * * * *')).toBe(true);
    expect(validateCronExpression('*/5 * * * *')).toBe(true);
    expect(validateCronExpression('0 9 1-15 * 1,3,5')).toBe(true);
  });

  it('rejects invalid cron expressions', () => {
    expect(validateCronExpression('')).toBe(false);
    expect(validateCronExpression('not cron')).toBe(false);
    expect(validateCronExpression('0 * * *')).toBe(false); // 4 fields
    expect(validateCronExpression('0 * * * * *')).toBe(false); // 6 fields
  });

  it('rejects null/undefined', () => {
    expect(validateCronExpression(null as any)).toBe(false);
    expect(validateCronExpression(undefined as any)).toBe(false);
  });
});

describe('validateUrl', () => {
  it('accepts valid URLs', () => {
    expect(validateUrl('https://example.com')).toBe(true);
    expect(validateUrl('http://localhost:3000')).toBe(true);
  });

  it('rejects invalid URLs', () => {
    expect(validateUrl('')).toBe(false);
    expect(validateUrl('not-a-url')).toBe(false);
  });
});

describe('validateTriggerNode', () => {
  it('validates manual trigger (no config needed)', () => {
    const result = validateTriggerNode({ triggerType: 'manual' } as any);
    expect(result.valid).toBe(true);
  });

  it('requires cron expression for schedule trigger', () => {
    const result = validateTriggerNode({ triggerType: 'schedule', config: {} } as any);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Cron expression is required for schedule trigger');
  });

  it('validates cron format for schedule trigger', () => {
    const result = validateTriggerNode({
      triggerType: 'schedule',
      config: { cronExpression: 'bad' },
    } as any);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid cron expression format');
  });

  it('accepts valid schedule trigger', () => {
    const result = validateTriggerNode({
      triggerType: 'schedule',
      config: { cronExpression: '0 * * * *' },
    } as any);
    expect(result.valid).toBe(true);
  });

  it('warns for webhook trigger', () => {
    const result = validateTriggerNode({ triggerType: 'webhook' } as any);
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('validateNotificationNode', () => {
  it('requires notification type', () => {
    const result = validateNotificationNode({ config: {} } as any);
    expect(result.valid).toBe(false);
  });

  it('requires message', () => {
    const result = validateNotificationNode({
      config: { notificationType: 'discord' },
    } as any);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Message is required');
  });

  it('requires webhook URL for discord', () => {
    const result = validateNotificationNode({
      config: { notificationType: 'discord', message: 'test' },
    } as any);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Webhook URL is required');
  });

  it('validates webhook URL format', () => {
    const result = validateNotificationNode({
      config: { notificationType: 'slack', message: 'test', webhookUrl: 'bad' },
    } as any);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid webhook URL format');
  });

  it('accepts valid discord notification', () => {
    const result = validateNotificationNode({
      config: {
        notificationType: 'discord',
        message: 'hello',
        webhookUrl: 'https://discord.com/api/webhooks/123',
      },
    } as any);
    expect(result.valid).toBe(true);
  });

  it('requires email address for email type', () => {
    const result = validateNotificationNode({
      config: { notificationType: 'email', message: 'test' },
    } as any);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Recipient email');
  });

  it('validates email format', () => {
    const result = validateNotificationNode({
      config: { notificationType: 'email', message: 'test', emailTo: 'bad' },
    } as any);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid email address format');
  });

  it('accepts valid email notification', () => {
    const result = validateNotificationNode({
      config: { notificationType: 'email', message: 'test', emailTo: 'user@example.com' },
    } as any);
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0); // SMTP warning
  });
});

describe('validateTaskNode', () => {
  it('warns when no task selected', () => {
    const result = validateTaskNode({ config: {} } as any);
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('valid when task selected', () => {
    const result = validateTaskNode({ config: { taskId: 'task-1' } } as any);
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });
});

describe('validateConditionalNode', () => {
  it('requires conditions', () => {
    const result = validateConditionalNode({ config: {} } as any);
    expect(result.valid).toBe(false);
  });

  it('requires non-empty conditions array', () => {
    const result = validateConditionalNode({
      config: { condition: { conditions: [] } },
    } as any);
    expect(result.valid).toBe(false);
  });

  it('accepts valid conditions', () => {
    const result = validateConditionalNode({
      config: { condition: { conditions: [{ field: 'x', op: '==', value: '1' }] } },
    } as any);
    expect(result.valid).toBe(true);
  });
});

describe('validateLoopNode', () => {
  it('requires loop type', () => {
    const result = validateLoopNode({ config: {} } as any);
    expect(result.valid).toBe(false);
  });

  it('requires condition for while loop', () => {
    const result = validateLoopNode({ config: { loopType: 'while' } } as any);
    expect(result.valid).toBe(false);
  });

  it('requires array for forEach loop', () => {
    const result = validateLoopNode({ config: { loopType: 'forEach' } } as any);
    expect(result.valid).toBe(false);
  });

  it('warns on excessive maxIterations', () => {
    const result = validateLoopNode({
      config: { loopType: 'while', condition: { conditions: [{}] }, maxIterations: 1500 },
    } as any);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('accepts valid forEach loop', () => {
    const result = validateLoopNode({
      config: { loopType: 'forEach', array: 'items' },
    } as any);
    expect(result.valid).toBe(true);
  });
});

describe('validateDelayNode', () => {
  it('requires positive delay', () => {
    const result = validateDelayNode({ config: {} } as any);
    expect(result.valid).toBe(false);
  });

  it('rejects negative delay', () => {
    const result = validateDelayNode({ config: { delay: -1 } } as any);
    expect(result.valid).toBe(false);
  });

  it('warns on very long delay', () => {
    const result = validateDelayNode({ config: { delay: 7200000 } } as any);
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('accepts valid delay', () => {
    const result = validateDelayNode({ config: { delay: 5000 } } as any);
    expect(result.valid).toBe(true);
  });
});

describe('validateSubworkflowNode', () => {
  it('requires workflowId', () => {
    const result = validateSubworkflowNode({ config: {} } as any);
    expect(result.valid).toBe(false);
  });

  it('accepts valid subworkflow', () => {
    const result = validateSubworkflowNode({ config: { workflowId: 42 } } as any);
    expect(result.valid).toBe(true);
  });
});

describe('validateWorkflowNode', () => {
  it('dispatches to correct validator', () => {
    expect(validateWorkflowNode('trigger', { triggerType: 'manual' } as any).valid).toBe(true);
    expect(validateWorkflowNode('task', { config: { taskId: '1' } } as any).valid).toBe(true);
    expect(validateWorkflowNode('delay', { config: { delay: 1000 } } as any).valid).toBe(true);
  });

  it('returns valid for agent and merge nodes', () => {
    expect(validateWorkflowNode('agent', {} as any).valid).toBe(true);
    expect(validateWorkflowNode('merge', {} as any).valid).toBe(true);
  });

  it('returns valid for unknown node types', () => {
    expect(validateWorkflowNode('unknown', {} as any).valid).toBe(true);
  });
});
