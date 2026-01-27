import React, { useState } from 'react';

interface CommitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCommit: (message: string) => Promise<boolean>;
  stagedCount: number;
}

export function CommitDialog({
  isOpen,
  onClose,
  onCommit,
  stagedCount,
}: CommitDialogProps): React.ReactElement | null {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    setIsSubmitting(true);
    const success = await onCommit(message.trim());
    setIsSubmitting(false);

    if (success) {
      setMessage('');
      onClose();
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setMessage('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-hive-bg border border-hive-border rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hive-border">
          <h2 className="text-lg font-semibold text-white">
            Commit Changes
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-hive-muted hover:text-white transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <div className="text-sm text-hive-muted mb-2">
              {stagedCount} file{stagedCount !== 1 ? 's' : ''} staged
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Commit message (required)"
              rows={6}
              disabled={isSubmitting}
              autoFocus
              className="w-full px-4 py-3 bg-hive-surface border border-hive-border rounded-md text-white placeholder-hive-muted focus:outline-none focus:ring-2 focus:ring-hive-accent resize-none disabled:opacity-50"
            />
          </div>

          {/* Tips */}
          <div className="mb-6 p-3 bg-hive-surface/50 rounded text-xs text-hive-muted">
            <div className="font-medium mb-1">Commit message tips:</div>
            <ul className="list-disc list-inside space-y-1">
              <li>First line: Brief summary (50 chars or less)</li>
              <li>Blank line, then detailed description if needed</li>
              <li>Use imperative mood: "Add feature" not "Added feature"</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-hive-muted hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!message.trim() || isSubmitting}
              className="px-6 py-2 bg-hive-accent text-black font-medium rounded-md hover:bg-hive-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Committing...' : 'Commit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
