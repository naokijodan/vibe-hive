import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockExecAsync } = vi.hoisted(() => ({
  mockExecAsync: vi.fn(),
}));

vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

vi.mock('util', () => ({
  promisify: () => mockExecAsync,
}));

import { GitService } from './GitService';

describe('GitService', () => {
  let service: GitService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GitService();
  });

  describe('getStatus', () => {
    it('parses git status correctly', async () => {
      mockExecAsync
        .mockResolvedValueOnce({ stdout: 'main\n' }) // branch
        .mockResolvedValueOnce({ stdout: 'A  new.ts\n M mod.ts\n?? untr.ts\n' }) // status
        .mockResolvedValueOnce({ stdout: '2\t1' }); // ahead/behind

      const status = await service.getStatus('/repo');

      expect(status?.branch).toBe('main');
      expect(status?.staged).toContain('new.ts');
      expect(status?.modified).toContain('mod.ts');
      expect(status?.untracked).toContain('untr.ts');
      expect(status?.ahead).toBe(2);
      expect(status?.behind).toBe(1);
    });

    it('returns null on error', async () => {
      mockExecAsync.mockRejectedValue(new Error('not a git repo'));

      const status = await service.getStatus('/bad');

      expect(status).toBeNull();
    });

    it('handles no upstream branch', async () => {
      mockExecAsync
        .mockResolvedValueOnce({ stdout: 'main\n' })
        .mockResolvedValueOnce({ stdout: '' })
        .mockRejectedValueOnce(new Error('no upstream'));

      const status = await service.getStatus('/repo');

      expect(status?.ahead).toBe(0);
      expect(status?.behind).toBe(0);
    });
  });

  describe('add', () => {
    it('returns true on success', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '' });

      expect(await service.add('/repo', ['file.ts'])).toBe(true);
    });

    it('returns false on error', async () => {
      mockExecAsync.mockRejectedValue(new Error('fail'));

      expect(await service.add('/repo', ['file.ts'])).toBe(false);
    });
  });

  describe('unstage', () => {
    it('returns true on success', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '' });

      expect(await service.unstage('/repo', ['file.ts'])).toBe(true);
    });
  });

  describe('commit', () => {
    it('returns true on success', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '' });

      expect(await service.commit('/repo', 'fix: bug')).toBe(true);
    });

    it('escapes quotes in message', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '' });

      await service.commit('/repo', 'fix "quotes"');

      expect(mockExecAsync).toHaveBeenCalledWith(
        'git commit -m "fix \\"quotes\\""',
        { cwd: '/repo' }
      );
    });

    it('returns false on error', async () => {
      mockExecAsync.mockRejectedValue(new Error('nothing to commit'));

      expect(await service.commit('/repo', 'msg')).toBe(false);
    });
  });

  describe('push', () => {
    it('returns true on success', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '' });
      expect(await service.push('/repo')).toBe(true);
    });

    it('returns false on error', async () => {
      mockExecAsync.mockRejectedValue(new Error('fail'));
      expect(await service.push('/repo')).toBe(false);
    });
  });

  describe('pull', () => {
    it('returns true on success', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '' });
      expect(await service.pull('/repo')).toBe(true);
    });

    it('returns false on error', async () => {
      mockExecAsync.mockRejectedValue(new Error('conflict'));
      expect(await service.pull('/repo')).toBe(false);
    });
  });

  describe('log', () => {
    it('parses log output', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: 'abc123|Author|2026-01-01|Initial commit',
      });

      const log = await service.log('/repo', 1);

      expect(log).toHaveLength(1);
      expect(log?.[0].hash).toBe('abc123');
      expect(log?.[0].author).toBe('Author');
      expect(log?.[0].message).toBe('Initial commit');
    });

    it('returns null on error', async () => {
      mockExecAsync.mockRejectedValue(new Error('fail'));
      expect(await service.log('/repo')).toBeNull();
    });
  });
});
