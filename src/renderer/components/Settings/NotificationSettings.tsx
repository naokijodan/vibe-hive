import React, { useState } from 'react';
import { ipcBridge } from '../../bridge/ipcBridge';

type NotificationType = 'discord' | 'slack' | 'email';

export const NotificationSettings: React.FC = () => {
  const [discordUrl, setDiscordUrl] = useState('');
  const [slackUrl, setSlackUrl] = useState('');
  const [isTestingDiscord, setIsTestingDiscord] = useState(false);
  const [isTestingSlack, setIsTestingSlack] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveDiscord = async () => {
    if (!discordUrl.trim()) {
      setMessage({ type: 'error', text: 'Discord webhook URL is required' });
      return;
    }

    try {
      await ipcBridge.notification.setWebhookUrl('discord', discordUrl);
      setMessage({ type: 'success', text: 'Discord webhook URL saved successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save Discord URL' });
    }
  };

  const handleSaveSlack = async () => {
    if (!slackUrl.trim()) {
      setMessage({ type: 'error', text: 'Slack webhook URL is required' });
      return;
    }

    try {
      await ipcBridge.notification.setWebhookUrl('slack', slackUrl);
      setMessage({ type: 'success', text: 'Slack webhook URL saved successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save Slack URL' });
    }
  };

  const handleTest = async (type: NotificationType) => {
    const setLoading = type === 'discord' ? setIsTestingDiscord : type === 'slack' ? setIsTestingSlack : setIsTestingEmail;
    setLoading(true);
    setMessage(null);

    try {
      await ipcBridge.notification.test(type);
      setMessage({ type: 'success', text: `Test notification sent to ${type}` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : `Failed to send test notification to ${type}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">Notification Settings</h2>

      <div className="space-y-6">
        {/* Discord */}
        <div className="p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-2xl">💬</span>
            <h3 className="text-lg font-semibold text-white">Discord</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Webhook URL</label>
              <input
                type="text"
                value={discordUrl}
                onChange={(e) => setDiscordUrl(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-sm font-mono"
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleSaveDiscord}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => handleTest('discord')}
                disabled={isTestingDiscord}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isTestingDiscord
                    ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                  }
                `}
              >
                {isTestingDiscord ? 'Testing...' : 'Test'}
              </button>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            Create a webhook in Discord: Server Settings → Integrations → Webhooks
          </div>
        </div>

        {/* Slack */}
        <div className="p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-2xl">💼</span>
            <h3 className="text-lg font-semibold text-white">Slack</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Webhook URL</label>
              <input
                type="text"
                value={slackUrl}
                onChange={(e) => setSlackUrl(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-sm font-mono"
                placeholder="https://hooks.slack.com/services/..."
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleSaveSlack}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => handleTest('slack')}
                disabled={isTestingSlack}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isTestingSlack
                    ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                  }
                `}
              >
                {isTestingSlack ? 'Testing...' : 'Test'}
              </button>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            Create a webhook in Slack: Workspace Settings → Apps → Incoming Webhooks
          </div>
        </div>

        {/* Email */}
        <div className="p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-2xl">📧</span>
            <h3 className="text-lg font-semibold text-white">Email</h3>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-gray-800 rounded-lg border border-gray-600">
              <div className="text-sm text-gray-400 mb-2">Email notifications are not yet configured.</div>
              <div className="text-xs text-gray-500">
                Future implementation will support SMTP configuration.
              </div>
            </div>

            <button
              onClick={() => handleTest('email')}
              disabled={isTestingEmail}
              className={`
                w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${isTestingEmail
                  ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                  : 'bg-green-600 hover:bg-green-700 text-white'
                }
              `}
            >
              {isTestingEmail ? 'Testing...' : 'Test Email (Mock)'}
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`
              p-3 rounded-lg text-sm
              ${message.type === 'success'
                ? 'bg-green-900/50 text-green-200 border border-green-700'
                : 'bg-red-900/50 text-red-200 border border-red-700'
              }
            `}
          >
            {message.text}
          </div>
        )}

        {/* Usage Info */}
        <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
          <div className="text-sm font-medium text-white mb-2">Usage in Workflows</div>
          <div className="text-xs text-gray-400 space-y-2">
            <div>1. Configure webhook URLs above</div>
            <div>2. Add a Notification Node to your workflow</div>
            <div>3. Select notification type (Discord/Slack/Email)</div>
            <div>4. Customize title and message with template variables like {'{{input}}'}</div>
            <div>5. Execute the workflow to receive notifications</div>
          </div>
        </div>

        {/* Template Variables */}
        <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
          <div className="text-sm font-medium text-white mb-2">Available Template Variables</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-gray-800 rounded">
              <div className="font-mono text-green-400">{'{{input}}'}</div>
              <div className="text-gray-500">Input data from previous node</div>
            </div>
            <div className="p-2 bg-gray-800 rounded">
              <div className="font-mono text-green-400">{'{{workflow.name}}'}</div>
              <div className="text-gray-500">Workflow name</div>
            </div>
            <div className="p-2 bg-gray-800 rounded">
              <div className="font-mono text-green-400">{'{{execution.id}}'}</div>
              <div className="text-gray-500">Execution ID</div>
            </div>
            <div className="p-2 bg-gray-800 rounded">
              <div className="font-mono text-green-400">{'{{timestamp}}'}</div>
              <div className="text-gray-500">Current timestamp</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
