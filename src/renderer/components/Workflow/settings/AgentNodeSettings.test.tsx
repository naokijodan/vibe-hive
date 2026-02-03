// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentNodeSettings } from './AgentNodeSettings';

describe('AgentNodeSettings', () => {
  const defaultOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders agent type selector', () => {
      render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Agent Type')).toBeDefined();
    });

    it('renders timeout options', () => {
      render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getAllByText(/Timeout/i).length).toBeGreaterThan(0);
    });

    it('renders all agent type options', () => {
      render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getAllByText(/Claude Code/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Codex/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Gemini/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Ollama/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Custom/i).length).toBeGreaterThan(0);
    });

    it('renders prompt textarea', () => {
      render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Prompt')).toBeDefined();
      expect(screen.getByPlaceholderText('Enter the prompt for the AI agent...')).toBeDefined();
    });

    it('renders template variables checkbox', () => {
      render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Enable Template Variables')).toBeDefined();
    });

    it('renders agent summary section', () => {
      render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Agent Summary')).toBeDefined();
    });

    it('renders usage info section', () => {
      render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('AI Agent Execution')).toBeDefined();
    });
  });

  describe('agent type selection', () => {
    it('calls onChange when agent type changed', () => {
      const onChange = vi.fn();
      render(<AgentNodeSettings data={{} as any} onChange={onChange} />);
      const select = screen.getByDisplayValue('Claude Code');
      fireEvent.change(select, { target: { value: 'codex' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        agentConfig: expect.objectContaining({ agentType: 'codex' }),
      }));
    });

    it('selects claude-code by default', () => {
      render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByDisplayValue('Claude Code')).toBeDefined();
    });

    it('shows claude-code description when selected', () => {
      render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Use Claude Code CLI for task execution')).toBeDefined();
    });

    it('shows codex description when selected', () => {
      const data = { agentConfig: { agentType: 'codex', prompt: '', templateVariables: true, timeout: 300000 } };
      render(<AgentNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Use OpenAI Codex CLI for code generation')).toBeDefined();
    });

    it('shows gemini description when selected', () => {
      const data = { agentConfig: { agentType: 'gemini', prompt: '', templateVariables: true, timeout: 300000 } };
      render(<AgentNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Use Google Gemini CLI for task execution')).toBeDefined();
    });

    it('shows ollama description when selected', () => {
      const data = { agentConfig: { agentType: 'ollama', prompt: '', templateVariables: true, timeout: 300000 } };
      render(<AgentNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Use local LLM via Ollama')).toBeDefined();
    });

    it('shows custom description when selected', () => {
      const data = { agentConfig: { agentType: 'custom', prompt: '', templateVariables: true, timeout: 300000 } };
      render(<AgentNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Custom agent implementation')).toBeDefined();
    });
  });

  describe('ollama model', () => {
    it('shows ollama model input when ollama selected', () => {
      const data = { agentConfig: { agentType: 'ollama', prompt: '', templateVariables: true, timeout: 300000 } };
      render(<AgentNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Ollama Model')).toBeDefined();
      expect(screen.getByPlaceholderText('llama3 (uses default from settings if empty)')).toBeDefined();
    });

    it('does not show ollama model input for other agent types', () => {
      render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.queryByText('Ollama Model')).toBeNull();
    });

    it('calls onChange when ollama model changed', () => {
      const data = { agentConfig: { agentType: 'ollama', prompt: '', templateVariables: true, timeout: 300000 } };
      const onChange = vi.fn();
      render(<AgentNodeSettings data={data as any} onChange={onChange} />);
      const input = screen.getByPlaceholderText('llama3 (uses default from settings if empty)');
      fireEvent.change(input, { target: { value: 'llama2' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        agentConfig: expect.objectContaining({ ollamaModel: 'llama2' }),
      }));
    });

    it('clears ollama model when input is empty', () => {
      const data = { agentConfig: { agentType: 'ollama', prompt: '', templateVariables: true, timeout: 300000, ollamaModel: 'llama2' } };
      const onChange = vi.fn();
      render(<AgentNodeSettings data={data as any} onChange={onChange} />);
      const input = screen.getByPlaceholderText('llama3 (uses default from settings if empty)');
      fireEvent.change(input, { target: { value: '' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        agentConfig: expect.objectContaining({ ollamaModel: undefined }),
      }));
    });

    it('shows ollama model in summary when set', () => {
      const data = { agentConfig: { agentType: 'ollama', prompt: '', templateVariables: true, timeout: 300000, ollamaModel: 'llama3.1' } };
      render(<AgentNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Ollama (llama3.1)')).toBeDefined();
    });

    it('shows default in summary when ollama model not set', () => {
      const data = { agentConfig: { agentType: 'ollama', prompt: '', templateVariables: true, timeout: 300000 } };
      render(<AgentNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Ollama (default)')).toBeDefined();
    });
  });

  describe('prompt', () => {
    it('calls onChange when prompt changed', () => {
      const onChange = vi.fn();
      render(<AgentNodeSettings data={{} as any} onChange={onChange} />);
      const textarea = screen.getByPlaceholderText('Enter the prompt for the AI agent...');
      fireEvent.change(textarea, { target: { value: 'Build a feature' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        agentConfig: expect.objectContaining({ prompt: 'Build a feature' }),
      }));
    });

    it('shows prompt length in summary', () => {
      const data = { agentConfig: { agentType: 'claude-code', prompt: '12345', templateVariables: true, timeout: 300000 } };
      render(<AgentNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('5 characters')).toBeDefined();
    });

    it('renders with existing prompt', () => {
      const data = { agentConfig: { agentType: 'claude-code', prompt: 'Test prompt', templateVariables: true, timeout: 300000 } };
      render(<AgentNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByDisplayValue('Test prompt')).toBeDefined();
    });
  });

  describe('template variables', () => {
    it('shows template variables help when enabled', () => {
      render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Available Variables')).toBeDefined();
    });

    it('shows all available template variables', () => {
      render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getAllByText(/\{\{input\}\}/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/\{\{workflow\.name\}\}/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/\{\{workflow\.id\}\}/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/\{\{execution\.id\}\}/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/\{\{timestamp\}\}/).length).toBeGreaterThan(0);
    });

    it('hides template variables help when disabled', () => {
      const data = { agentConfig: { agentType: 'claude-code', prompt: '', templateVariables: false, timeout: 300000 } };
      render(<AgentNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.queryByText('Available Variables')).toBeNull();
    });

    it('calls onChange when template variables toggled', () => {
      const onChange = vi.fn();
      render(<AgentNodeSettings data={{} as any} onChange={onChange} />);
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        agentConfig: expect.objectContaining({ templateVariables: false }),
      }));
    });

    it('shows Enabled in summary when template variables enabled', () => {
      render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Enabled')).toBeDefined();
    });

    it('shows Disabled in summary when template variables disabled', () => {
      const data = { agentConfig: { agentType: 'claude-code', prompt: '', templateVariables: false, timeout: 300000 } };
      render(<AgentNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Disabled')).toBeDefined();
    });
  });

  describe('timeout', () => {
    it('calls onChange when timeout changed', () => {
      const onChange = vi.fn();
      render(<AgentNodeSettings data={{} as any} onChange={onChange} />);
      const selects = screen.getAllByRole('combobox');
      const timeoutSelect = selects[selects.length - 1];
      fireEvent.change(timeoutSelect, { target: { value: '60000' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        agentConfig: expect.objectContaining({ timeout: 60000 }),
      }));
    });

    it('shows all timeout options', () => {
      render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('1 minute')).toBeDefined();
      expect(screen.getByText('3 minutes')).toBeDefined();
      expect(screen.getByText('5 minutes')).toBeDefined();
      expect(screen.getByText('10 minutes')).toBeDefined();
      expect(screen.getByText('30 minutes')).toBeDefined();
    });

    it('defaults to 5 minutes', () => {
      render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByDisplayValue('5 minutes')).toBeDefined();
    });

    it('shows timeout in seconds in summary', () => {
      render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('300s')).toBeDefined();
    });
  });

  describe('existing config', () => {
    it('renders with existing agent config', () => {
      const data = {
        agentConfig: {
          agentType: 'codex',
          prompt: 'Test prompt',
          templateVariables: false,
          timeout: 60000,
        },
      };
      render(<AgentNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByDisplayValue('Codex CLI')).toBeDefined();
      expect(screen.getByDisplayValue('Test prompt')).toBeDefined();
    });

    it('uses default values when agentConfig is undefined', () => {
      render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByDisplayValue('Claude Code')).toBeDefined();
      expect(screen.getByDisplayValue('5 minutes')).toBeDefined();
    });
  });

  describe('agent summary', () => {
    it('shows Type label', () => {
      render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Type:')).toBeDefined();
    });

    it('shows Prompt Length label', () => {
      render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Prompt Length:')).toBeDefined();
    });

    it('shows Template Variables label', () => {
      render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Template Variables:')).toBeDefined();
    });

    it('shows Timeout label', () => {
      const { container } = render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      // There are multiple Timeout texts, just verify the summary has timeout info
      expect(container.innerHTML).toContain('Timeout:');
    });
  });

  describe('usage info', () => {
    it('shows usage info bullets', () => {
      render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText(/The agent will receive the prompt/)).toBeDefined();
      expect(screen.getByText(/Agent output will be available/)).toBeDefined();
      expect(screen.getByText(/Long-running agents may timeout/)).toBeDefined();
      expect(screen.getByText(/Template variables are replaced/)).toBeDefined();
    });
  });

  describe('styling', () => {
    it('has space-y-4 layout', () => {
      const { container } = render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(container.innerHTML).toContain('space-y-4');
    });

    it('has proper background colors', () => {
      const { container } = render(<AgentNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(container.innerHTML).toContain('bg-gray-700');
    });
  });
});
