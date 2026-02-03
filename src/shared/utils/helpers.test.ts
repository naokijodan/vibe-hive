import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateId, formatDate, parseDate, delay, isDefined } from './helpers';

describe('helpers', () => {
  describe('generateId', () => {
    it('generates a unique string', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('generates different ids on each call', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('includes timestamp and random component', () => {
      const id = generateId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('formatDate', () => {
    it('formats date to ISO string', () => {
      const date = new Date('2024-01-15T12:30:00Z');
      const result = formatDate(date);
      expect(result).toBe('2024-01-15T12:30:00.000Z');
    });

    it('handles current date', () => {
      const date = new Date();
      const result = formatDate(date);
      expect(result).toBe(date.toISOString());
    });
  });

  describe('parseDate', () => {
    it('parses ISO string to Date', () => {
      const dateString = '2024-01-15T12:30:00.000Z';
      const result = parseDate(dateString);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe(dateString);
    });

    it('parses partial date string', () => {
      const result = parseDate('2024-01-15');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
    });
  });

  describe('delay', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns a promise', () => {
      const result = delay(100);
      expect(result).toBeInstanceOf(Promise);
    });

    it('resolves after specified time', async () => {
      vi.useFakeTimers();
      const promise = delay(1000);
      vi.advanceTimersByTime(1000);
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('isDefined', () => {
    it('returns true for defined values', () => {
      expect(isDefined('string')).toBe(true);
      expect(isDefined(0)).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined([])).toBe(true);
      expect(isDefined({})).toBe(true);
    });

    it('returns false for null', () => {
      expect(isDefined(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isDefined(undefined)).toBe(false);
    });

    it('works as type guard', () => {
      const value: string | null = 'test';
      if (isDefined(value)) {
        expect(value.toUpperCase()).toBe('TEST');
      }
    });
  });
});
