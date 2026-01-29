import type { WorkflowNode, WorkflowEdge } from './workflow';

export type TemplateCategory = 'automation' | 'notification' | 'data-processing' | 'custom';

export interface WorkflowTemplate {
  id: number;
  name: string;
  description: string;
  category: TemplateCategory;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  thumbnail?: string; // Base64 encoded image
  isBuiltIn: boolean; // Whether this is a built-in template
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateCreateInput {
  name: string;
  description: string;
  category: TemplateCategory;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  thumbnail?: string;
}

export interface TemplateUpdateInput {
  name?: string;
  description?: string;
  category?: TemplateCategory;
  thumbnail?: string;
}
