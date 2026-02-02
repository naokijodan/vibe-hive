import { describe, it, expect } from 'vitest';
import { WorkflowValidator } from './WorkflowValidator';

const makeValidData = (overrides = {}) => ({
  formatVersion: '2.0',
  name: 'Test Workflow',
  nodes: [
    { id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: {} },
    { id: 'n2', type: 'task', position: { x: 100, y: 0 }, data: { taskTemplateId: 't1' } },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2' },
  ],
  ...overrides,
});

describe('WorkflowValidator', () => {
  const validator = new WorkflowValidator();

  describe('validate', () => {
    it('validates a correct workflow', () => {
      const result = validator.validate(makeValidData());
      expect(result.valid).toBe(true);
      expect(result.nodeCount).toBe(2);
      expect(result.edgeCount).toBe(1);
    });

    it('rejects unsupported format version', () => {
      const result = validator.validate(makeValidData({ formatVersion: '99.0' }));
      expect(result.valid).toBe(false);
      expect(result.compatibility).toBe('none');
    });

    it('warns on old format version', () => {
      const result = validator.validate(makeValidData({ formatVersion: '1.0' }));
      expect(result.warnings.some(w => w.includes('Old format'))).toBe(true);
    });

    it('errors on missing name', () => {
      const result = validator.validate(makeValidData({ name: undefined }));
      expect(result.valid).toBe(false);
    });

    it('errors on missing nodes array', () => {
      const result = validator.validate(makeValidData({ nodes: 'bad' }));
      expect(result.valid).toBe(false);
    });

    it('errors on missing edges array', () => {
      const result = validator.validate(makeValidData({ edges: null }));
      expect(result.valid).toBe(false);
    });

    it('errors on duplicate node IDs', () => {
      const result = validator.validate(makeValidData({
        nodes: [
          { id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: {} },
          { id: 'n1', type: 'task', position: { x: 100, y: 0 }, data: { taskTemplateId: 't1' } },
        ],
      }));
      expect(result.errors.some(e => e.includes('Duplicate'))).toBe(true);
    });

    it('detects loop advanced feature', () => {
      const result = validator.validate(makeValidData({
        nodes: [
          { id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: {} },
          { id: 'n2', type: 'loop', position: { x: 100, y: 0 }, data: { loopType: 'forEach' } },
        ],
      }));
      expect(result.hasAdvancedFeatures).toBe(true);
      expect(result.advancedFeatures).toContain('loop');
    });

    it('detects subworkflow advanced feature', () => {
      const result = validator.validate(makeValidData({
        nodes: [
          { id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: {} },
          { id: 'n2', type: 'subworkflow', position: { x: 100, y: 0 }, data: { workflowId: 1 } },
        ],
      }));
      expect(result.advancedFeatures).toContain('subworkflow');
    });

    it('warns on no start/trigger node', () => {
      const result = validator.validate(makeValidData({
        nodes: [
          { id: 'n1', type: 'task', position: { x: 0, y: 0 }, data: { taskTemplateId: 't1' } },
        ],
        edges: [],
      }));
      expect(result.warnings.some(w => w.includes('No start/trigger'))).toBe(true);
    });

    it('warns on disconnected nodes', () => {
      const result = validator.validate(makeValidData({
        nodes: [
          { id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: {} },
          { id: 'n2', type: 'task', position: { x: 100, y: 0 }, data: { taskTemplateId: 't1' } },
          { id: 'n3', type: 'task', position: { x: 200, y: 0 }, data: { taskTemplateId: 't2' } },
        ],
      }));
      expect(result.warnings.some(w => w.includes('disconnected'))).toBe(true);
    });

    it('errors on node without id', () => {
      const result = validator.validate(makeValidData({
        nodes: [{ type: 'trigger', position: { x: 0, y: 0 }, data: {} }],
        edges: [],
      }));
      expect(result.errors.some(e => e.includes("'id'"))).toBe(true);
    });

    it('errors on unsupported node type', () => {
      const result = validator.validate(makeValidData({
        nodes: [{ id: 'n1', type: 'unknown_type', position: { x: 0, y: 0 }, data: {} }],
        edges: [],
      }));
      expect(result.errors.some(e => e.includes('Unsupported node type'))).toBe(true);
    });

    it('errors on conditional node without condition', () => {
      const result = validator.validate(makeValidData({
        nodes: [
          { id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: {} },
          { id: 'n2', type: 'conditional', position: { x: 100, y: 0 }, data: {} },
        ],
      }));
      expect(result.errors.some(e => e.includes('Conditional node'))).toBe(true);
    });

    it('errors on edge referencing non-existent node', () => {
      const result = validator.validate(makeValidData({
        edges: [{ id: 'e1', source: 'n1', target: 'nonexistent' }],
      }));
      expect(result.errors.some(e => e.includes('does not exist'))).toBe(true);
    });
  });

  describe('migrateFormat', () => {
    it('migrates v1.0 to v2.0', () => {
      const data = { version: '1.0', name: 'Test', nodes: [], edges: [] };
      const result = validator.migrateFormat(data);
      expect(result.formatVersion).toBe('2.0');
    });

    it('returns v2.0 data as-is', () => {
      const data = makeValidData();
      const result = validator.migrateFormat(data);
      expect(result).toBe(data);
    });
  });
});
