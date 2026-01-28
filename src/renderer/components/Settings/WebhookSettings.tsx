import React, { useState, useEffect } from 'react';
import { ipcBridge } from '../../bridge/ipcBridge';

export const WebhookSettings: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [port, setPort] = useState<number>(3100);
  const [customPort, setCustomPort] = useState<string>('3100');
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const status = await ipcBridge.webhook.status();
      setIsRunning(status.running);
      if (status.port) {
        setPort(status.port);
        setCustomPort(status.port.toString());
      }
      if (status.url) {
        setWebhookUrl(status.url);
      }
    } catch (error) {
      console.error('Failed to load webhook status:', error);
    }
  };

  const handleStart = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const portNumber = parseInt(customPort, 10);
      if (isNaN(portNumber) || portNumber < 1024 || portNumber > 65535) {
        throw new Error('Port must be between 1024 and 65535');
      }

      const result = await ipcBridge.webhook.start(portNumber);
      await loadStatus();
      setMessage({ type: 'success', text: `Webhook server started on port ${portNumber}` });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to start webhook server' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      await ipcBridge.webhook.stop();
      await loadStatus();
      setMessage({ type: 'success', text: 'Webhook server stopped' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to stop webhook server' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyUrl = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      setMessage({ type: 'success', text: 'Webhook URL copied to clipboard' });
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleCopyWorkflowUrl = (workflowId: string) => {
    const url = `${webhookUrl}/${workflowId}`;
    navigator.clipboard.writeText(url);
    setMessage({ type: 'success', text: `Workflow webhook URL copied: ${url}` });
    setTimeout(() => setMessage(null), 2000);
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">Webhook Settings</h2>

      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
          <div>
            <div className="text-sm text-gray-400">Status</div>
            <div className="flex items-center space-x-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span className="text-white font-medium">{isRunning ? 'Running' : 'Stopped'}</span>
            </div>
          </div>
          {isRunning && (
            <div className="text-right">
              <div className="text-sm text-gray-400">Port</div>
              <div className="text-white font-mono">{port}</div>
            </div>
          )}
        </div>

        {/* Port Configuration */}
        {!isRunning && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">Port Number</label>
            <input
              type="number"
              value={customPort}
              onChange={(e) => setCustomPort(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder="3100"
              min="1024"
              max="65535"
            />
            <div className="text-xs text-gray-500 mt-1">Valid range: 1024-65535</div>
          </div>
        )}

        {/* Webhook URL */}
        {isRunning && webhookUrl && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">Base Webhook URL</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={webhookUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 font-mono text-sm"
              />
              <button
                onClick={handleCopyUrl}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Use <span className="font-mono text-gray-400">{webhookUrl}/{'<workflowId>'}</span> to trigger specific workflows
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex space-x-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              disabled={isLoading}
              className={`
                flex-1 px-4 py-2 rounded-lg font-medium transition-colors
                ${isLoading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
                }
              `}
            >
              {isLoading ? 'Starting...' : 'Start Webhook Server'}
            </button>
          ) : (
            <button
              onClick={handleStop}
              disabled={isLoading}
              className={`
                flex-1 px-4 py-2 rounded-lg font-medium transition-colors
                ${isLoading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white'
                }
              `}
            >
              {isLoading ? 'Stopping...' : 'Stop Webhook Server'}
            </button>
          )}
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

        {/* Usage Instructions */}
        <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
          <div className="text-sm font-medium text-white mb-2">How to Use</div>
          <div className="text-xs text-gray-400 space-y-2">
            <div>1. Start the webhook server with your desired port</div>
            <div>2. Copy the base webhook URL</div>
            <div>3. Append your workflow ID to trigger: <span className="font-mono text-gray-300">POST /webhook/{'<workflowId>'}</span></div>
            <div>4. Send JSON payload in the request body to pass data to the workflow</div>
          </div>
        </div>

        {/* Example */}
        {isRunning && (
          <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
            <div className="text-sm font-medium text-white mb-2">Example cURL Command</div>
            <div className="bg-black p-3 rounded font-mono text-xs text-green-400 overflow-x-auto">
              curl -X POST {webhookUrl}/1 \<br />
              &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
              &nbsp;&nbsp;-d '{"{'}"key": "value"{'}'}'
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
