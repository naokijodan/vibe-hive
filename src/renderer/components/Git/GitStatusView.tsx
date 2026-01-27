import React from 'react';

interface GitStatusViewProps {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  untracked: string[];
  selectedFiles: Set<string>;
  onToggleFile: (file: string) => void;
  onStageSelected: () => void;
  onUnstageSelected: () => void;
}

export function GitStatusView({
  branch,
  ahead,
  behind,
  staged,
  modified,
  untracked,
  selectedFiles,
  onToggleFile,
  onStageSelected,
  onUnstageSelected,
}: GitStatusViewProps): React.ReactElement {
  const changedFiles = [...modified, ...untracked];
  const hasChanges = changedFiles.length > 0;
  const hasStaged = staged.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Branch info */}
      <div className="flex items-center gap-2 px-4 py-2 bg-hive-surface rounded-md">
        <span className="text-sm font-medium text-white">
          Branch: {branch}
        </span>
        {(ahead > 0 || behind > 0) && (
          <span className="text-xs text-hive-muted">
            {ahead > 0 && `↑${ahead}`}
            {ahead > 0 && behind > 0 && ' '}
            {behind > 0 && `↓${behind}`}
          </span>
        )}
      </div>

      {/* Staged files */}
      {hasStaged && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-white">
              📦 Staged ({staged.length})
            </h3>
            <button
              onClick={onUnstageSelected}
              disabled={selectedFiles.size === 0}
              className="text-xs text-hive-accent hover:text-hive-accent/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Unstage Selected
            </button>
          </div>
          <div className="space-y-1">
            {staged.map((file) => (
              <div
                key={file}
                className="flex items-center gap-2 px-3 py-2 bg-hive-surface/50 rounded hover:bg-hive-surface transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file)}
                  onChange={() => onToggleFile(file)}
                  className="w-4 h-4 rounded border-hive-border"
                />
                <span className="text-xs text-green-400 font-mono w-6">A</span>
                <span className="text-sm text-white flex-1 truncate" title={file}>
                  {file}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Changed files */}
      {hasChanges && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-white">
              📝 Changes ({changedFiles.length})
            </h3>
            <button
              onClick={onStageSelected}
              disabled={selectedFiles.size === 0}
              className="text-xs text-hive-accent hover:text-hive-accent/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Stage Selected
            </button>
          </div>
          <div className="space-y-1">
            {modified.map((file) => (
              <div
                key={file}
                className="flex items-center gap-2 px-3 py-2 bg-hive-surface/50 rounded hover:bg-hive-surface transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file)}
                  onChange={() => onToggleFile(file)}
                  className="w-4 h-4 rounded border-hive-border"
                />
                <span className="text-xs text-yellow-400 font-mono w-6">M</span>
                <span className="text-sm text-white flex-1 truncate" title={file}>
                  {file}
                </span>
              </div>
            ))}
            {untracked.map((file) => (
              <div
                key={file}
                className="flex items-center gap-2 px-3 py-2 bg-hive-surface/50 rounded hover:bg-hive-surface transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file)}
                  onChange={() => onToggleFile(file)}
                  className="w-4 h-4 rounded border-hive-border"
                />
                <span className="text-xs text-blue-400 font-mono w-6">??</span>
                <span className="text-sm text-white flex-1 truncate" title={file}>
                  {file}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No changes */}
      {!hasChanges && !hasStaged && (
        <div className="text-center py-8 text-hive-muted text-sm">
          Working directory clean
        </div>
      )}
    </div>
  );
}
