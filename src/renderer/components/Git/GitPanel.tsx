import React, { useState, useEffect } from 'react';
import { useGitStore } from '../../stores/gitStore';
import { GitStatusView } from './GitStatusView';
import { CommitDialog } from './CommitDialog';

interface GitPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GitPanel({ isOpen, onClose }: GitPanelProps): React.ReactElement | null {
  const {
    status,
    isLoading,
    error,
    fetchStatus,
    stageFiles,
    commit,
    push,
    pull,
    clearError,
  } = useGitStore();

  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isCommitDialogOpen, setIsCommitDialogOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setSelectedFiles(new Set());
    }
  }, [isOpen, fetchStatus]);

  // Auto-refresh every 5 seconds when panel is open
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      fetchStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, fetchStatus]);

  if (!isOpen) return null;

  const handleToggleFile = (file: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(file)) {
        next.delete(file);
      } else {
        next.add(file);
      }
      return next;
    });
  };

  const handleStageSelected = async () => {
    if (selectedFiles.size === 0) return;
    await stageFiles(Array.from(selectedFiles));
    setSelectedFiles(new Set());
  };

  const handleUnstageSelected = async () => {
    if (selectedFiles.size === 0) return;
    // Get unstageFiles from store
    const { unstageFiles } = useGitStore.getState();
    await unstageFiles(Array.from(selectedFiles));
    setSelectedFiles(new Set());
  };

  const handleCommit = async (message: string) => {
    const success = await commit(message);
    if (success) {
      setSelectedFiles(new Set());
    }
    return success;
  };

  const handlePush = async () => {
    await push();
  };

  const handlePull = async () => {
    await pull();
  };

  const handleRefresh = () => {
    fetchStatus();
    setSelectedFiles(new Set());
  };

  const canCommit = status && status.staged.length > 0;
  const canPush = status && status.ahead > 0;
  const canPull = status && status.behind > 0;

  return (
    <>
      <div className="fixed inset-y-0 right-0 w-96 bg-hive-bg border-l border-hive-border shadow-xl z-40 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-hive-border">
          <h2 className="text-lg font-semibold text-white">Git</h2>
          <button
            onClick={onClose}
            className="text-hive-muted hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/20">
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm text-red-400 flex-1">{error}</div>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && !status ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-hive-muted">Loading...</div>
            </div>
          ) : status ? (
            <GitStatusView
              branch={status.branch}
              ahead={status.ahead}
              behind={status.behind}
              staged={status.staged}
              modified={status.modified}
              untracked={status.untracked}
              selectedFiles={selectedFiles}
              onToggleFile={handleToggleFile}
              onStageSelected={handleStageSelected}
              onUnstageSelected={handleUnstageSelected}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-hive-muted text-sm">
              Not a git repository
            </div>
          )}
        </div>

        {/* Actions */}
        {status && (
          <div className="border-t border-hive-border p-4">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={() => setIsCommitDialogOpen(true)}
                disabled={!canCommit || isLoading}
                className="px-4 py-2 bg-hive-accent text-black font-medium rounded-md hover:bg-hive-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Commit
              </button>
              <button
                onClick={handlePush}
                disabled={!canPush || isLoading}
                className="px-4 py-2 bg-hive-surface text-white font-medium rounded-md hover:bg-hive-surface/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Push {status.ahead > 0 && `(${status.ahead})`}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handlePull}
                disabled={!canPull || isLoading}
                className="px-4 py-2 bg-hive-surface text-white font-medium rounded-md hover:bg-hive-surface/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Pull {status.behind > 0 && `(${status.behind})`}
              </button>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-4 py-2 bg-hive-surface text-white font-medium rounded-md hover:bg-hive-surface/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Commit Dialog */}
      <CommitDialog
        isOpen={isCommitDialogOpen}
        onClose={() => setIsCommitDialogOpen(false)}
        onCommit={handleCommit}
        stagedCount={status?.staged.length || 0}
      />
    </>
  );
}
