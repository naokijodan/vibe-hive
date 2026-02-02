import { describe, it, expect, vi, beforeEach } from 'vitest';
import toast from 'react-hot-toast';
import { useToast } from './useToast';

vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(() => 'toast-id-123'),
    dismiss: vi.fn(),
  }),
}));

describe('useToast', () => {
  const { success, error, loading, info, warning, dismiss } = useToast();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('success calls toast.success with dark style and green border', () => {
    success('Done');
    expect(toast.success).toHaveBeenCalledWith('Done', expect.objectContaining({
      duration: 3000,
      style: expect.objectContaining({ border: '1px solid #10b981' }),
    }));
  });

  it('success accepts custom duration', () => {
    success('Done', { duration: 1000 });
    expect(toast.success).toHaveBeenCalledWith('Done', expect.objectContaining({
      duration: 1000,
    }));
  });

  it('error calls toast.error with 5s duration and red border', () => {
    error('Failed');
    expect(toast.error).toHaveBeenCalledWith('Failed', expect.objectContaining({
      duration: 5000,
      style: expect.objectContaining({ border: '1px solid #ef4444' }),
    }));
  });

  it('loading returns toast ID', () => {
    const id = loading('Loading...');
    expect(id).toBe('toast-id-123');
    expect(toast.loading).toHaveBeenCalledWith('Loading...', expect.any(Object));
  });

  it('info calls toast with info icon', () => {
    info('Info message');
    expect(toast).toHaveBeenCalledWith('Info message', expect.objectContaining({
      icon: 'ℹ️',
      style: expect.objectContaining({ border: '1px solid #3b82f6' }),
    }));
  });

  it('warning calls toast with warning icon and 4s duration', () => {
    warning('Watch out');
    expect(toast).toHaveBeenCalledWith('Watch out', expect.objectContaining({
      duration: 4000,
      icon: '⚠️',
      style: expect.objectContaining({ border: '1px solid #f59e0b' }),
    }));
  });

  it('dismiss calls toast.dismiss', () => {
    dismiss('some-id');
    expect(toast.dismiss).toHaveBeenCalledWith('some-id');
  });

  it('dismiss without ID dismisses all', () => {
    dismiss();
    expect(toast.dismiss).toHaveBeenCalledWith(undefined);
  });
});
