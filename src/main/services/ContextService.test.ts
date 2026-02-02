import { describe, it, expect } from 'vitest';
import { parseAgentOutput } from './ContextService';

describe('parseAgentOutput', () => {
  it('extracts JSON from fenced code block', () => {
    const raw = 'Some text\n```json\n{"key": "value"}\n```\nMore text';
    const result = parseAgentOutput(raw);
    expect(result.format).toBe('json');
    expect(result.content).toBe('{"key": "value"}');
  });

  it('extracts JSON array from fenced code block', () => {
    const raw = '```json\n[1, 2, 3]\n```';
    const result = parseAgentOutput(raw);
    expect(result.format).toBe('json');
    expect(result.content).toBe('[1, 2, 3]');
  });

  it('detects raw JSON object', () => {
    const raw = '{"name": "test", "value": 42}';
    const result = parseAgentOutput(raw);
    expect(result.format).toBe('json');
    expect(JSON.parse(result.content)).toEqual({ name: 'test', value: 42 });
  });

  it('detects raw JSON array', () => {
    const raw = '[{"id": 1}, {"id": 2}]';
    const result = parseAgentOutput(raw);
    expect(result.format).toBe('json');
  });

  it('rejects invalid JSON in fenced block', () => {
    const raw = '```json\n{not valid json}\n```';
    const result = parseAgentOutput(raw);
    expect(result.format).not.toBe('json');
  });

  it('detects markdown with heading', () => {
    const raw = '# Title\nSome content';
    const result = parseAgentOutput(raw);
    expect(result.format).toBe('markdown');
  });

  it('detects markdown with subheading in body', () => {
    const raw = 'Introduction\n## Section\nContent';
    const result = parseAgentOutput(raw);
    expect(result.format).toBe('markdown');
  });

  it('detects markdown with list items', () => {
    const raw = 'Items:\n- item 1\n- item 2';
    const result = parseAgentOutput(raw);
    expect(result.format).toBe('markdown');
  });

  it('returns text for plain content', () => {
    const raw = 'Just some plain text output';
    const result = parseAgentOutput(raw);
    expect(result.format).toBe('text');
    expect(result.content).toBe('Just some plain text output');
  });

  it('trims whitespace', () => {
    const raw = '  \n  plain text  \n  ';
    const result = parseAgentOutput(raw);
    expect(result.content).toBe('plain text');
  });
});
