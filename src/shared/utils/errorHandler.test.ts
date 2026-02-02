import { describe, it, expect } from 'vitest';
import { toErrorMessage } from './errorHandler';

describe('toErrorMessage', () => {
  it('extracts message from Error instance', () => {
    expect(toErrorMessage(new Error('test error'))).toBe('test error');
  });

  it('extracts message from TypeError', () => {
    expect(toErrorMessage(new TypeError('type error'))).toBe('type error');
  });

  it('returns string as-is', () => {
    expect(toErrorMessage('plain string error')).toBe('plain string error');
  });

  it('extracts message from object with message property', () => {
    expect(toErrorMessage({ message: 'obj error' })).toBe('obj error');
  });

  it('returns fallback for null', () => {
    expect(toErrorMessage(null)).toBe('Unknown error');
  });

  it('returns fallback for undefined', () => {
    expect(toErrorMessage(undefined)).toBe('Unknown error');
  });

  it('returns fallback for number', () => {
    expect(toErrorMessage(42)).toBe('Unknown error');
  });

  it('returns custom fallback', () => {
    expect(toErrorMessage(null, 'カスタムエラー')).toBe('カスタムエラー');
  });

  it('handles empty string', () => {
    expect(toErrorMessage('')).toBe('');
  });
});
