import type { WorkflowNodeData, TriggerType } from '../../shared/types/workflow';

type NotificationType = 'discord' | 'slack' | 'email';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate email address format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate cron expression (basic format check)
 * Full validation happens on the main process
 */
export const validateCronExpression = (expression: string): boolean => {
  if (!expression || typeof expression !== 'string') {
    return false;
  }

  // Basic cron format: 5 fields separated by spaces
  // minute hour day month weekday
  const parts = expression.trim().split(/\s+/);

  if (parts.length !== 5) {
    return false;
  }

  // Each part should contain valid cron characters: numbers, *, /, -, ,
  const cronPartRegex = /^[\d\*\/\-,]+$/;
  return parts.every(part => cronPartRegex.test(part));
};

/**
 * Validate URL format
 */
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate Trigger Node settings
 */
export const validateTriggerNode = (data: WorkflowNodeData): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const triggerType = data.triggerType || 'manual';

  if (triggerType === 'schedule') {
    const cronExpression = data.config?.cronExpression;
    if (!cronExpression) {
      errors.push('Cron expression is required for schedule trigger');
    } else if (!validateCronExpression(cronExpression)) {
      errors.push('Invalid cron expression format');
    }
  }

  if (triggerType === 'webhook') {
    // Webhook URL is auto-generated, no validation needed
    warnings.push('Make sure webhook server is running on port 3100');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate Notification Node settings
 */
export const validateNotificationNode = (data: WorkflowNodeData): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const notificationType = data.config?.notificationType as NotificationType;

  if (!notificationType) {
    errors.push('Notification type is required');
    return { valid: false, errors, warnings };
  }

  const message = data.config?.message;
  if (!message || message.trim() === '') {
    errors.push('Message is required');
  }

  if (notificationType === 'discord' || notificationType === 'slack') {
    const webhookUrl = data.config?.webhookUrl;
    if (!webhookUrl || webhookUrl.trim() === '') {
      errors.push(`Webhook URL is required for ${notificationType} notifications`);
    } else if (!validateUrl(webhookUrl)) {
      errors.push('Invalid webhook URL format');
    }
  }

  if (notificationType === 'email') {
    const emailTo = data.config?.emailTo;
    if (!emailTo || emailTo.trim() === '') {
      errors.push('Recipient email address is required');
    } else if (!validateEmail(emailTo)) {
      errors.push('Invalid email address format');
    }

    // Check SMTP settings
    warnings.push('Make sure SMTP settings are configured in Settings panel');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate Task Node settings
 */
export const validateTaskNode = (data: WorkflowNodeData): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const taskId = data.config?.taskId;
  if (!taskId) {
    warnings.push('No task selected. This node will skip execution.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate Conditional Node settings
 */
export const validateConditionalNode = (data: WorkflowNodeData): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const condition = data.config?.condition;
  if (!condition || !condition.conditions || condition.conditions.length === 0) {
    errors.push('At least one condition is required');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate Loop Node settings
 */
export const validateLoopNode = (data: WorkflowNodeData): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const loopType = data.config?.loopType;
  if (!loopType) {
    errors.push('Loop type is required');
    return { valid: false, errors, warnings };
  }

  if (loopType === 'while') {
    const condition = data.config?.condition;
    if (!condition || !condition.conditions || condition.conditions.length === 0) {
      errors.push('Condition is required for while loop');
    }
  }

  if (loopType === 'forEach') {
    const array = data.config?.array;
    if (!array || array.trim() === '') {
      errors.push('Array expression is required for forEach loop');
    }
  }

  const maxIterations = data.config?.maxIterations;
  if (maxIterations && (maxIterations < 1 || maxIterations > 1000)) {
    warnings.push('Max iterations should be between 1 and 1000');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate Delay Node settings
 */
export const validateDelayNode = (data: WorkflowNodeData): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const delay = data.config?.delay;
  if (!delay || delay < 0) {
    errors.push('Delay duration must be a positive number');
  } else if (delay > 3600000) {
    warnings.push('Delay is longer than 1 hour. Consider using schedule trigger instead.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate Subworkflow Node settings
 */
export const validateSubworkflowNode = (data: WorkflowNodeData): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const workflowId = data.config?.workflowId;
  if (!workflowId) {
    errors.push('Subworkflow is required');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate any workflow node based on type
 */
export const validateWorkflowNode = (
  nodeType: string,
  data: WorkflowNodeData
): ValidationResult => {
  switch (nodeType) {
    case 'trigger':
      return validateTriggerNode(data);
    case 'notification':
      return validateNotificationNode(data);
    case 'task':
      return validateTaskNode(data);
    case 'conditional':
      return validateConditionalNode(data);
    case 'loop':
      return validateLoopNode(data);
    case 'delay':
      return validateDelayNode(data);
    case 'subworkflow':
      return validateSubworkflowNode(data);
    case 'agent':
    case 'merge':
      // No validation needed for these node types yet
      return { valid: true, errors: [], warnings: [] };
    default:
      return { valid: true, errors: [], warnings: [] };
  }
};
