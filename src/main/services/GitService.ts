import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export interface GitStatus {
  branch: string;
  staged: string[];
  modified: string[];
  untracked: string[];
  ahead: number;
  behind: number;
}

export class GitService {
  /**
   * Get the status of a git repository
   */
  async getStatus(repoPath: string): Promise<GitStatus | null> {
    try {
      // Get current branch
      const { stdout: branchOutput } = await execAsync('git branch --show-current', {
        cwd: repoPath,
      });
      const branch = branchOutput.trim();

      // Get status
      const { stdout: statusOutput } = await execAsync('git status --porcelain', {
        cwd: repoPath,
      });

      const staged: string[] = [];
      const modified: string[] = [];
      const untracked: string[] = [];

      statusOutput.split('\n').forEach(line => {
        if (!line.trim()) return;
        
        const status = line.substring(0, 2);
        const file = line.substring(3);

        if (status[0] === 'A' || status[0] === 'M' || status[0] === 'D') {
          staged.push(file);
        }
        if (status[1] === 'M' || status[1] === 'D') {
          modified.push(file);
        }
        if (status === '??') {
          untracked.push(file);
        }
      });

      // Get ahead/behind count
      let ahead = 0;
      let behind = 0;
      try {
        const { stdout: aheadBehind } = await execAsync(
          'git rev-list --left-right --count HEAD...@{u}',
          { cwd: repoPath }
        );
        const [aheadStr, behindStr] = aheadBehind.trim().split('\t');
        ahead = parseInt(aheadStr) || 0;
        behind = parseInt(behindStr) || 0;
      } catch (e) {
        // No upstream branch configured
      }

      return {
        branch,
        staged,
        modified,
        untracked,
        ahead,
        behind,
      };
    } catch (error) {
      console.error('Failed to get git status:', error);
      return null;
    }
  }

  /**
   * Stage files for commit
   */
  async add(repoPath: string, files: string[]): Promise<boolean> {
    try {
      const filesArg = files.map(f => `"${f}"`).join(' ');
      await execAsync(`git add ${filesArg}`, { cwd: repoPath });
      return true;
    } catch (error) {
      console.error('Failed to add files:', error);
      return false;
    }
  }

  /**
   * Unstage files (remove from staging area)
   */
  async unstage(repoPath: string, files: string[]): Promise<boolean> {
    try {
      const filesArg = files.map(f => `"${f}"`).join(' ');
      await execAsync(`git reset HEAD ${filesArg}`, { cwd: repoPath });
      return true;
    } catch (error) {
      console.error('Failed to unstage files:', error);
      return false;
    }
  }

  /**
   * Commit staged changes
   */
  async commit(repoPath: string, message: string): Promise<boolean> {
    try {
      // Escape quotes in commit message
      const escapedMessage = message.replace(/"/g, '\\"');
      await execAsync(`git commit -m "${escapedMessage}"`, { cwd: repoPath });
      return true;
    } catch (error) {
      console.error('Failed to commit:', error);
      return false;
    }
  }

  /**
   * Push commits to remote
   */
  async push(repoPath: string): Promise<boolean> {
    try {
      await execAsync('git push', { cwd: repoPath });
      return true;
    } catch (error) {
      console.error('Failed to push:', error);
      return false;
    }
  }

  /**
   * Pull from remote
   */
  async pull(repoPath: string): Promise<boolean> {
    try {
      await execAsync('git pull', { cwd: repoPath });
      return true;
    } catch (error) {
      console.error('Failed to pull:', error);
      return false;
    }
  }

  /**
   * Get commit log
   */
  async log(repoPath: string, limit = 10): Promise<Array<{
    hash: string;
    author: string;
    date: string;
    message: string;
  }> | null> {
    try {
      const { stdout } = await execAsync(
        `git log --pretty=format:"%H|%an|%ad|%s" --date=iso -n ${limit}`,
        { cwd: repoPath }
      );

      const commits = stdout.split('\n').map(line => {
        const [hash, author, date, message] = line.split('|');
        return { hash, author, date, message };
      });

      return commits;
    } catch (error) {
      console.error('Failed to get log:', error);
      return null;
    }
  }
}

// Singleton instance
let instance: GitService | null = null;

export function getGitService(): GitService {
  if (!instance) {
    instance = new GitService();
  }
  return instance;
}
