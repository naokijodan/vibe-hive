import { describe, it, expect, vi } from 'vitest';
import { generateId, formatDate, parseDate, delay, isDefined } from './helpers';

describe('generateId', () => {
  it('returns a string with timestamp and random part', () => {
    const id = generateId();
    expect(id).toMatch(/^\d+-[a-z0-9]+$/);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('formatDate', () => {
  it('returns ISO string', () => {
    const date = new Date('2026-01-01T00:00:00.000Z');
    expect(formatDate(date)).toBe('2026-01-01T00:00:00.000Z');
  });
});

describe('parseDate', () => {
  it('parses ISO string to Date', () => {
    const date = parseDate('2026-01-01T00:00:00.000Z');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0);
  });

  it('roundtrips with formatDate', () => {
    const original = new Date('2026-06-15T12:30:00.000Z');
    const roundtripped = parseDate(formatDate(original));
    expect(roundtripped.getTime()).toBe(original.getTime());
  });
});

describe('delay', () => {
  it('resolves after specified ms', async () => {
    vi.useFakeTimers();
    const p = delay(1000);
    vi.advanceTimersByTime(1000);
    await expect(p).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});

describe('isDefined', () => {
  it('returns true for defined values', () => {
    expect(isDefined(0)).toBe(true);
    expect(isDefined('')).toBe(true);
    expect(isDefined(false)).toBe(true);
  });

  it('returns false for null and undefined', () => {
    expect(isDefined(null)).toBe(false);
    expect(isDefined(undefined)).toBe(false);
  });

  it('works as array filter', () => {
    const arr = [1, null, 2, undefined, 3];
    const filtered = arr.filter(isDefined);
    expect(filtered).toEqual([1, 2, 3]);
  });
});
