import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGit } = vi.hoisted(() => ({
  mockGit: {
    status: vi.fn(),
    add: vi.fn(),
    unstage: vi.fn(),
    commit: vi.fn(),
    push: vi.fn(),
    pull: vi.fn(),
    log: vi.fn(),
  },
}));

vi.mock('../bridge/ipcBridge', () => ({
  default: { git: mockGit },
}));

import { useGitStore } from './gitStore';

const makeMockStatus = () => ({
  branch: 'main',
  staged: [],
  modified: ['file.ts'],
  untracked: [],
  ahead: 0,
  behind: 0,
});

describe('gitStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGitStore.setState({
      status: null,
      isLoading: false,
      repoPath: '/tmp/repo',
      autoRefresh: false,
      error: null,
    });
  });

  describe('fetchStatus', () => {
    it('loads git status', async () => {
      const status = makeMockStatus();
      mockGit.status.mockResolvedValue(status);

      await useGitStore.getState().fetchStatus();

      expect(useGitStore.getState().status).toEqual(status);
      expect(mockGit.status).toHaveBeenCalledWith('/tmp/repo');
    });

    it('handles error', async () => {
      mockGit.status.mockRejectedValue(new Error('Not a git repo'));

      await useGitStore.getState().fetchStatus();

      expect(useGitStore.getState().error).toBe('Not a git repo');
    });
  });

  describe('stageFiles', () => {
    it('stages files and refreshes status', async () => {
      mockGit.add.mockResolvedValue(true);
      mockGit.status.mockResolvedValue(makeMockStatus());

      await useGitStore.getState().stageFiles(['file.ts']);

      expect(mockGit.add).toHaveBeenCalledWith('/tmp/repo', ['file.ts']);
      expect(mockGit.status).toHaveBeenCalled();
    });

    it('sets error when staging fails', async () => {
      mockGit.add.mockResolvedValue(false);

      await useGitStore.getState().stageFiles(['file.ts']);

      expect(useGitStore.getState().error).toBe('Failed to stage files');
    });
  });

  describe('unstageFiles', () => {
    it('unstages files and refreshes status', async () => {
      mockGit.unstage.mockResolvedValue(true);
      mockGit.status.mockResolvedValue(makeMockStatus());

      await useGitStore.getState().unstageFiles(['file.ts']);

      expect(mockGit.unstage).toHaveBeenCalledWith('/tmp/repo', ['file.ts']);
    });

    it('sets error when unstaging fails', async () => {
      mockGit.unstage.mockResolvedValue(false);

      await useGitStore.getState().unstageFiles(['file.ts']);

      expect(useGitStore.getState().error).toBe('Failed to unstage files');
    });
  });

  describe('commit', () => {
    it('commits and refreshes status', async () => {
      mockGit.commit.mockResolvedValue(true);
      mockGit.status.mockResolvedValue(makeMockStatus());

      const result = await useGitStore.getState().commit('fix: something');

      expect(result).toBe(true);
      expect(mockGit.commit).toHaveBeenCalledWith('/tmp/repo', 'fix: something');
    });

    it('returns false on failure', async () => {
      mockGit.commit.mockResolvedValue(false);

      const result = await useGitStore.getState().commit('msg');

      expect(result).toBe(false);
      expect(useGitStore.getState().error).toBe('Failed to commit');
    });

    it('returns false on error', async () => {
      mockGit.commit.mockRejectedValue(new Error('fail'));

      const result = await useGitStore.getState().commit('msg');

      expect(result).toBe(false);
    });
  });

  describe('push', () => {
    it('pushes and refreshes', async () => {
      mockGit.push.mockResolvedValue(true);
      mockGit.status.mockResolvedValue(makeMockStatus());

      expect(await useGitStore.getState().push()).toBe(true);
    });

    it('returns false on failure', async () => {
      mockGit.push.mockResolvedValue(false);

      expect(await useGitStore.getState().push()).toBe(false);
      expect(useGitStore.getState().error).toBe('Failed to push');
    });

    it('returns false on error', async () => {
      mockGit.push.mockRejectedValue(new Error('push fail'));

      expect(await useGitStore.getState().push()).toBe(false);
      expect(useGitStore.getState().error).toBe('push fail');
    });
  });

  describe('pull', () => {
    it('pulls and refreshes', async () => {
      mockGit.pull.mockResolvedValue(true);
      mockGit.status.mockResolvedValue(makeMockStatus());

      expect(await useGitStore.getState().pull()).toBe(true);
    });

    it('returns false on non-success', async () => {
      mockGit.pull.mockResolvedValue(false);

      expect(await useGitStore.getState().pull()).toBe(false);
      expect(useGitStore.getState().error).toBe('Failed to pull');
    });

    it('returns false on error', async () => {
      mockGit.pull.mockRejectedValue(new Error('conflict'));

      expect(await useGitStore.getState().pull()).toBe(false);
      expect(useGitStore.getState().error).toBe('conflict');
    });
  });

  describe('setAutoRefresh', () => {
    it('sets auto refresh flag', () => {
      useGitStore.getState().setAutoRefresh(true);
      expect(useGitStore.getState().autoRefresh).toBe(true);
    });
  });

  describe('clearError', () => {
    it('clears error', () => {
      useGitStore.setState({ error: 'some error' });
      useGitStore.getState().clearError();
      expect(useGitStore.getState().error).toBeNull();
    });
  });
});
