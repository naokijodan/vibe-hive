import React, { useState, useEffect } from 'react';
import { GitSettings as GitSettingsType } from '../../stores/settingsStore';

interface GitSettingsProps {
  settings: GitSettingsType;
  onUpdate: (settings: Partial<GitSettingsType>) => Promise<void>;
  isLoading: boolean;
}

export function GitSettings({ settings, onUpdate, isLoading }: GitSettingsProps): React.ReactElement {
  const [userName, setUserName] = useState(settings.userName);
  const [userEmail, setUserEmail] = useState(settings.userEmail);
  const [defaultRepo, setDefaultRepo] = useState(settings.defaultRepo);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setUserName(settings.userName);
    setUserEmail(settings.userEmail);
    setDefaultRepo(settings.defaultRepo);
  }, [settings]);

  useEffect(() => {
    const changed =
      userName !== settings.userName ||
      userEmail !== settings.userEmail ||
      defaultRepo !== settings.defaultRepo;
    setHasChanges(changed);
  }, [userName, userEmail, defaultRepo, settings]);

  const handleSave = async () => {
    await onUpdate({
      userName,
      userEmail,
      defaultRepo,
    });
    setHasChanges(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    setUserName(settings.userName);
    setUserEmail(settings.userEmail);
    setDefaultRepo(settings.defaultRepo);
    setHasChanges(false);
  };

  const isEmailValid = (email: string): boolean => {
    if (!email) return true; // Allow empty
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const canSave = hasChanges && userName.trim() !== '' && isEmailValid(userEmail);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Git Settings</h3>
        <p className="text-sm text-hive-muted mb-6">
          Configure Git user information for commits
        </p>
      </div>

      <div className="space-y-4">
        {/* User Name */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            User Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            disabled={isLoading}
            placeholder="e.g., John Doe"
            className="w-full px-4 py-2 bg-hive-surface border border-hive-border rounded-md text-white placeholder-hive-muted focus:outline-none focus:ring-2 focus:ring-hive-accent disabled:opacity-50"
          />
          {userName.trim() === '' && (
            <p className="text-xs text-red-400 mt-1">User name is required</p>
          )}
        </div>

        {/* User Email */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            User Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            disabled={isLoading}
            placeholder="e.g., john@example.com"
            className="w-full px-4 py-2 bg-hive-surface border border-hive-border rounded-md text-white placeholder-hive-muted focus:outline-none focus:ring-2 focus:ring-hive-accent disabled:opacity-50"
          />
          {userEmail && !isEmailValid(userEmail) && (
            <p className="text-xs text-red-400 mt-1">Invalid email format</p>
          )}
        </div>

        {/* Default Repository */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Default Repository Path
          </label>
          <input
            type="text"
            value={defaultRepo}
            onChange={(e) => setDefaultRepo(e.target.value)}
            disabled={isLoading}
            placeholder="e.g., /Users/name/projects/my-app"
            className="w-full px-4 py-2 bg-hive-surface border border-hive-border rounded-md text-white placeholder-hive-muted focus:outline-none focus:ring-2 focus:ring-hive-accent disabled:opacity-50"
          />
          <p className="text-xs text-hive-muted mt-1">
            Default path for Git operations. Leave empty to use current working directory.
          </p>
        </div>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-md">
          <p className="text-sm text-green-400">✓ Settings saved successfully</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-hive-border">
        <button
          onClick={handleReset}
          disabled={!hasChanges || isLoading}
          className="px-4 py-2 text-sm text-hive-muted hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave || isLoading}
          className="px-6 py-2 bg-hive-accent text-black font-medium rounded-md hover:bg-hive-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
