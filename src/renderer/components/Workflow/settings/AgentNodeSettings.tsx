import React, { useState } from 'react';
import type { WorkflowNodeData, AgentType, AgentConfig } from '../../../../shared/types/workflow';

interface AgentNodeSettingsProps {
  data: WorkflowNodeData;
  onChange: (data: Partial<WorkflowNodeData>) => void;
}

export const AgentNodeSettings: React.FC<AgentNodeSettingsProps> = ({ data, onChange }) => {
  const agentConfig = data.agentConfig || {
    agentType: 'claude-code',
    prompt: '',
    templateVariables: true,
    timeout: 300000, // 5 minutes
  };

  const [config, setConfig] = useState<AgentConfig>(agentConfig);

  const handleChange = (updates: Partial<AgentConfig>) => {
    const updated = { ...config, ...updates };
    setConfig(updated);
    onChange({ agentConfig: updated });
  };

  const timeoutOptions = [
    { value: 60000, label: '1 minute' },
    { value: 180000, label: '3 minutes' },
    { value: 300000, label: '5 minutes' },
    { value: 600000, label: '10 minutes' },
    { value: 1800000, label: '30 minutes' },
  ];

  return (
    <div className="space-y-4">
      {/* Agent Type */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Agent Type</label>
        <select
          value={config.agentType}
          onChange={(e) => handleChange({ agentType: e.target.value as AgentType })}
          className="
            w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
            text-white focus:outline-none focus:ring-2 focus:ring-pink-500
          "
        >
          <option value="claude-code">Claude Code</option>
          <option value="codex">Codex CLI</option>
          <option value="custom">Custom Agent</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {config.agentType === 'claude-code' && 'Use Claude Code CLI for task execution'}
          {config.agentType === 'codex' && 'Use OpenAI Codex CLI for code generation'}
          {config.agentType === 'custom' && 'Custom agent implementation'}
        </p>
      </div>

      {/* Prompt */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
        <textarea
          value={config.prompt}
          onChange={(e) => handleChange({ prompt: e.target.value })}
          placeholder="Enter the prompt for the AI agent..."
          rows={6}
          className="
            w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
            text-white placeholder-gray-500 resize-none
            focus:outline-none focus:ring-2 focus:ring-pink-500
          "
        />
        <p className="text-xs text-gray-500 mt-1">
          The prompt to send to the AI agent
        </p>
      </div>

      {/* Template Variables */}
      <div>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.templateVariables}
            onChange={(e) => handleChange({ templateVariables: e.target.checked })}
            className="
              w-4 h-4 bg-gray-700 border-gray-600 rounded
              focus:ring-2 focus:ring-pink-500
              text-pink-600
            "
          />
          <span className="text-sm text-gray-300">Enable Template Variables</span>
        </label>
        <p className="text-xs text-gray-500 mt-1 ml-6">
          Replace variables like {'{{input}}'}, {'{{workflow.name}}'} in the prompt
        </p>
      </div>

      {/* Timeout */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Timeout</label>
        <select
          value={config.timeout}
          onChange={(e) => handleChange({ timeout: parseInt(e.target.value, 10) })}
          className="
            w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
            text-white focus:outline-none focus:ring-2 focus:ring-pink-500
          "
        >
          {timeoutOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Maximum execution time for the agent
        </p>
      </div>

      {/* Template Variables Help */}
      {config.templateVariables && (
        <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
          <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Available Variables</h4>
          <div className="text-xs text-gray-300 space-y-1 font-mono">
            <div><span className="text-green-400">{'{{input}}'}</span> - Input from previous node</div>
            <div><span className="text-green-400">{'{{workflow.name}}'}</span> - Workflow name</div>
            <div><span className="text-green-400">{'{{workflow.id}}'}</span> - Workflow ID</div>
            <div><span className="text-green-400">{'{{execution.id}}'}</span> - Execution ID</div>
            <div><span className="text-green-400">{'{{timestamp}}'}</span> - Current timestamp</div>
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
        <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Agent Summary</h4>
        <div className="text-xs text-gray-300 space-y-1">
          <div>
            <span className="text-gray-500">Type:</span>{' '}
            <span className="font-semibold">
              {config.agentType === 'claude-code' && 'Claude Code'}
              {config.agentType === 'codex' && 'Codex'}
              {config.agentType === 'custom' && 'Custom'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Prompt Length:</span>{' '}
            <span>{config.prompt.length} characters</span>
          </div>
          <div>
            <span className="text-gray-500">Template Variables:</span>{' '}
            <span>{config.templateVariables ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div>
            <span className="text-gray-500">Timeout:</span>{' '}
            <span>{config.timeout / 1000}s</span>
          </div>
        </div>
      </div>

      {/* Usage Info */}
      <div className="p-3 bg-pink-900/20 rounded-lg border border-pink-700/50">
        <div className="text-xs font-semibold text-pink-300 mb-1">AI Agent Execution</div>
        <div className="text-xs text-pink-200/80 space-y-1">
          <div>• The agent will receive the prompt and execute tasks</div>
          <div>• Agent output will be available for subsequent nodes</div>
          <div>• Long-running agents may timeout - adjust the limit as needed</div>
          <div>• Template variables are replaced before sending to the agent</div>
        </div>
      </div>
    </div>
  );
};
