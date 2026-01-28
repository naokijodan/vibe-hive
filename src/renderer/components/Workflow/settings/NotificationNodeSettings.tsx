import React from 'react';
import type { WorkflowNodeData } from '../../../../shared/types/workflow';

interface NotificationNodeSettingsProps {
  data: WorkflowNodeData;
  onChange: (data: Partial<WorkflowNodeData>) => void;
}

const notificationTypes: {
  value: 'discord' | 'slack' | 'email';
  label: string;
  description: string;
  icon: string;
}[] = [
  { value: 'discord', label: 'Discord', description: 'Send to Discord webhook', icon: '💬' },
  { value: 'slack', label: 'Slack', description: 'Send to Slack channel', icon: '💼' },
  { value: 'email', label: 'Email', description: 'Send email notification', icon: '📧' },
];

export const NotificationNodeSettings: React.FC<NotificationNodeSettingsProps> = ({
  data,
  onChange,
}) => {
  const notificationType = data.notificationType || 'discord';
  const title = data.config?.title || '';
  const message = data.config?.message || '';
  const webhookUrl = data.config?.webhookUrl || '';
  const emailTo = data.config?.emailTo || '';

  const handleTypeChange = (type: 'discord' | 'slack' | 'email') => {
    onChange({ notificationType: type });
  };

  const handleTitleChange = (newTitle: string) => {
    onChange({
      config: {
        ...data.config,
        title: newTitle,
      },
    });
  };

  const handleMessageChange = (newMessage: string) => {
    onChange({
      config: {
        ...data.config,
        message: newMessage,
      },
    });
  };

  const handleWebhookUrlChange = (url: string) => {
    onChange({
      config: {
        ...data.config,
        webhookUrl: url,
      },
    });
  };

  const handleEmailToChange = (email: string) => {
    onChange({
      config: {
        ...data.config,
        emailTo: email,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Notification Type
        </label>
        <div className="space-y-2">
          {notificationTypes.map(type => (
            <button
              key={type.value}
              onClick={() => handleTypeChange(type.value)}
              className={`
                w-full px-4 py-3 rounded-lg text-left transition-colors
                ${
                  notificationType === type.value
                    ? 'bg-purple-600 border-2 border-purple-500'
                    : 'bg-gray-700 border-2 border-gray-600 hover:border-gray-500'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{type.label}</div>
                    <div className="text-xs text-gray-400 mt-1">{type.description}</div>
                  </div>
                </div>
                {notificationType === type.value && (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Title (Optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Notification title"
          className="
            w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
            text-white placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-purple-500
          "
        />
        <p className="text-xs text-gray-500 mt-1">
          Optional title for the notification
        </p>
      </div>

      {(notificationType === 'discord' || notificationType === 'slack') && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Webhook URL *
          </label>
          <input
            type="text"
            value={webhookUrl}
            onChange={(e) => handleWebhookUrlChange(e.target.value)}
            placeholder={`Enter ${notificationType} webhook URL...`}
            className="
              w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
              text-white placeholder-gray-500 font-mono text-sm
              focus:outline-none focus:ring-2 focus:ring-purple-500
            "
          />
          <p className="text-xs text-gray-500 mt-1">
            {notificationType === 'discord'
              ? 'Discord webhook URL from Server Settings → Integrations → Webhooks'
              : 'Slack webhook URL from Incoming Webhooks app'}
          </p>
        </div>
      )}

      {notificationType === 'email' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Recipient Email *
          </label>
          <input
            type="email"
            value={emailTo}
            onChange={(e) => handleEmailToChange(e.target.value)}
            placeholder="recipient@example.com"
            className="
              w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
              text-white placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-purple-500
            "
          />
          <p className="text-xs text-gray-500 mt-1">
            Email address to send the notification to
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Message *
        </label>
        <textarea
          value={message}
          onChange={(e) => handleMessageChange(e.target.value)}
          placeholder="Enter notification message..."
          rows={4}
          className="
            w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
            text-white placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-purple-500
            resize-none
          "
        />
        <p className="text-xs text-gray-500 mt-1">
          You can use template variables from workflow input data
        </p>
      </div>

      {notificationType === 'email' && (
        <div className="p-3 bg-yellow-900/30 rounded-lg border border-yellow-700">
          <h4 className="text-xs font-semibold text-yellow-400 mb-1 uppercase">
            Email Configuration Required
          </h4>
          <p className="text-xs text-gray-300">
            Email notifications require SMTP settings to be configured in app settings.
          </p>
        </div>
      )}
    </div>
  );
};
