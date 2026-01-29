import type {
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeType,
} from '../../shared/types/workflow';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  nodeCount: number;
  edgeCount: number;
  hasAdvancedFeatures: boolean;
  advancedFeatures: string[];
  compatibility: 'full' | 'partial' | 'none';
}

const SUPPORTED_NODE_TYPES: WorkflowNodeType[] = [
  'task',
  'trigger',
  'conditional',
  'notification',
  'delay',
  'merge',
  'loop',
  'subworkflow',
  'agent',
  'start',  // Legacy/custom node type
  'end',    // Legacy/custom node type
];

const SUPPORTED_FORMAT_VERSIONS = ['1.0', '2.0'];

export class WorkflowValidator {
  /**
   * Validate imported workflow data
   */
  validate(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const advancedFeatures: string[] = [];

    // Check format version
    const formatVersion = data.formatVersion || data.version || '1.0';
    if (!SUPPORTED_FORMAT_VERSIONS.includes(formatVersion)) {
      errors.push(`Unsupported format version: ${formatVersion}`);
      return {
        valid: false,
        errors,
        warnings,
        nodeCount: 0,
        edgeCount: 0,
        hasAdvancedFeatures: false,
        advancedFeatures: [],
        compatibility: 'none',
      };
    }

    if (formatVersion === '1.0') {
      warnings.push('Old format version (1.0) detected. Consider re-exporting with newer format.');
    }

    // Required fields
    if (!data.name || typeof data.name !== 'string') {
      errors.push('Missing or invalid required field: name');
    }

    if (!Array.isArray(data.nodes)) {
      errors.push('Missing or invalid required field: nodes (must be an array)');
      return {
        valid: false,
        errors,
        warnings,
        nodeCount: 0,
        edgeCount: 0,
        hasAdvancedFeatures: false,
        advancedFeatures: [],
        compatibility: 'none',
      };
    }

    if (!Array.isArray(data.edges)) {
      errors.push('Missing or invalid required field: edges (must be an array)');
      return {
        valid: false,
        errors,
        warnings,
        nodeCount: 0,
        edgeCount: 0,
        hasAdvancedFeatures: false,
        advancedFeatures: [],
        compatibility: 'none',
      };
    }

    // Validate nodes
    const nodeIds = new Set<string>();
    for (let i = 0; i < data.nodes.length; i++) {
      const node = data.nodes[i];
      const nodeErrors = this.validateNode(node, i);
      errors.push(...nodeErrors);

      if (node.id) {
        if (nodeIds.has(node.id)) {
          errors.push(`Duplicate node ID: ${node.id}`);
        }
        nodeIds.add(node.id);
      }

      // Detect advanced features
      if (node.type === 'loop') {
        if (!advancedFeatures.includes('loop')) {
          advancedFeatures.push('loop');
        }
      }
      if (node.type === 'subworkflow') {
        if (!advancedFeatures.includes('subworkflow')) {
          advancedFeatures.push('subworkflow');
        }
      }
      if (node.type === 'conditional' && node.data?.conditionGroup?.groups) {
        if (!advancedFeatures.includes('expert-condition')) {
          advancedFeatures.push('expert-condition');
        }
      }
    }

    // Validate edges
    for (let i = 0; i < data.edges.length; i++) {
      const edge = data.edges[i];
      const edgeErrors = this.validateEdge(edge, i, nodeIds);
      errors.push(...edgeErrors);
    }

    // Check for at least one start node (trigger or legacy 'start' type)
    const startNodes = data.nodes.filter((n: any) => n.type === 'start' || n.type === 'trigger');
    if (startNodes.length === 0) {
      warnings.push('No start/trigger node found. Workflow may not execute properly.');
    } else if (startNodes.length > 1) {
      warnings.push(`Multiple start/trigger nodes found (${startNodes.length}). Only the first will be used.`);
    }

    // Check for disconnected nodes
    const connectedNodes = new Set<string>();
    data.edges.forEach((edge: WorkflowEdge) => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    const disconnectedNodes = data.nodes
      .filter((n: any) => !connectedNodes.has(n.id) && n.type !== 'start' && n.type !== 'trigger')
      .map((n: any) => n.id);

    if (disconnectedNodes.length > 0) {
      warnings.push(`Found ${disconnectedNodes.length} disconnected node(s): ${disconnectedNodes.join(', ')}`);
    }

    // Determine compatibility
    let compatibility: 'full' | 'partial' | 'none' = 'full';
    if (errors.length > 0) {
      compatibility = 'none';
    } else if (warnings.length > 0) {
      compatibility = 'partial';
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      nodeCount: data.nodes.length,
      edgeCount: data.edges.length,
      hasAdvancedFeatures: advancedFeatures.length > 0,
      advancedFeatures,
      compatibility,
    };
  }

  /**
   * Validate a single node
   */
  private validateNode(node: any, index: number): string[] {
    const errors: string[] = [];
    const prefix = `Node ${index}`;

    if (!node.id || typeof node.id !== 'string') {
      errors.push(`${prefix}: Missing or invalid 'id' field`);
    }

    if (!node.type) {
      errors.push(`${prefix}: Missing 'type' field`);
    } else if (!SUPPORTED_NODE_TYPES.includes(node.type as WorkflowNodeType)) {
      errors.push(`${prefix}: Unsupported node type '${node.type}'`);
    }

    if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
      errors.push(`${prefix}: Missing or invalid 'position' field (must have x and y coordinates)`);
    }

    // Type-specific validation
    if (node.type === 'conditional') {
      if (!node.data?.condition && !node.data?.conditionGroup) {
        errors.push(`${prefix}: Conditional node must have either 'condition' or 'conditionGroup' in data`);
      }
    }

    if (node.type === 'loop') {
      if (!node.data?.loopType) {
        errors.push(`${prefix}: Loop node must have 'loopType' in data`);
      }
    }

    if (node.type === 'subworkflow') {
      if (!node.data?.workflowId) {
        errors.push(`${prefix}: Subworkflow node must have 'workflowId' in data`);
      }
    }

    if (node.type === 'task') {
      if (!node.data?.taskTemplateId) {
        errors.push(`${prefix}: Task node must have 'taskTemplateId' in data`);
      }
    }

    return errors;
  }

  /**
   * Validate a single edge
   */
  private validateEdge(edge: any, index: number, validNodeIds: Set<string>): string[] {
    const errors: string[] = [];
    const prefix = `Edge ${index}`;

    if (!edge.id || typeof edge.id !== 'string') {
      errors.push(`${prefix}: Missing or invalid 'id' field`);
    }

    if (!edge.source || typeof edge.source !== 'string') {
      errors.push(`${prefix}: Missing or invalid 'source' field`);
    } else if (!validNodeIds.has(edge.source)) {
      errors.push(`${prefix}: Source node '${edge.source}' does not exist`);
    }

    if (!edge.target || typeof edge.target !== 'string') {
      errors.push(`${prefix}: Missing or invalid 'target' field`);
    } else if (!validNodeIds.has(edge.target)) {
      errors.push(`${prefix}: Target node '${edge.target}' does not exist`);
    }

    return errors;
  }

  /**
   * Migrate old format to new format
   */
  migrateFormat(data: any): any {
    const version = data.formatVersion || data.version || '1.0';

    if (version === '1.0') {
      // Migrate v1.0 to v2.0
      return {
        formatVersion: '2.0',
        exportedAt: data.exportedAt || new Date().toISOString(),
        name: data.name,
        description: data.description,
        nodes: data.nodes,
        edges: data.edges,
        autoCreateTask: data.autoCreateTask || false,
        nodeCount: data.nodes?.length || 0,
        edgeCount: data.edges?.length || 0,
      };
    }

    return data;
  }
}
