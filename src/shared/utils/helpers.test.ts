import { describe, it, expect, vi } from 'vitest';
import { generateId, formatDate, parseDate, delay, isDefined } from './helpers';

describe('helpers', () => {
  describe('generateId', () => {
    it('returns a unique string', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(typeof id1).toBe('string');
      expect(id1).not.toBe(id2);
    });

    it('contains timestamp and random part', () => {
      const id = generateId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('formatDate', () => {
    it('returns ISO string', () => {
      const date = new Date('2025-01-15T10:30:00Z');
      expect(formatDate(date)).toBe('2025-01-15T10:30:00.000Z');
    });
  });

  describe('parseDate', () => {
    it('parses ISO string to Date', () => {
      const dateStr = '2025-01-15T10:30:00.000Z';
      const date = parseDate(dateStr);
      expect(date instanceof Date).toBe(true);
      expect(date.toISOString()).toBe(dateStr);
    });
  });

  describe('delay', () => {
    it('delays execution', async () => {
      vi.useFakeTimers();
      const promise = delay(100);
      vi.advanceTimersByTime(100);
      await promise;
      vi.useRealTimers();
    });
  });

  describe('isDefined', () => {
    it('returns true for defined values', () => {
      expect(isDefined(0)).toBe(true);
      expect(isDefined('')).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined({})).toBe(true);
    });

    it('returns false for null', () => {
      expect(isDefined(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isDefined(undefined)).toBe(false);
    });
  });
});
