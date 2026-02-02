import { describe, it, expect, vi } from 'vitest';
import { generateId, formatDate, parseDate, delay, isDefined } from './helpers';

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('contains a timestamp and random part separated by hyphen', () => {
    const id = generateId();
    const parts = id.split('-');
    expect(parts.length).toBe(2);
    expect(Number(parts[0])).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('formatDate', () => {
  it('returns ISO string', () => {
    const date = new Date('2026-01-15T10:30:00.000Z');
    expect(formatDate(date)).toBe('2026-01-15T10:30:00.000Z');
  });
});

describe('parseDate', () => {
  it('parses ISO string to Date', () => {
    const result = parseDate('2026-01-15T10:30:00.000Z');
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2026);
  });

  it('roundtrips with formatDate', () => {
    const original = new Date('2026-06-01T00:00:00.000Z');
    const result = parseDate(formatDate(original));
    expect(result.getTime()).toBe(original.getTime());
  });
});

describe('delay', () => {
  it('resolves after specified time', async () => {
    vi.useFakeTimers();
    const promise = delay(1000);
    vi.advanceTimersByTime(1000);
    await expect(promise).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});

describe('isDefined', () => {
  it('returns false for null', () => {
    expect(isDefined(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isDefined(undefined)).toBe(false);
  });

  it('returns true for 0', () => {
    expect(isDefined(0)).toBe(true);
  });

  it('returns true for empty string', () => {
    expect(isDefined('')).toBe(true);
  });

  it('returns true for false', () => {
    expect(isDefined(false)).toBe(true);
  });

  it('returns true for objects', () => {
    expect(isDefined({ key: 'value' })).toBe(true);
  });
});
