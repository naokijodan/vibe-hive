// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentNodeSettings } from './AgentNodeSettings';

describe('AgentNodeSettings', () => {
  it('renders agent type selector', () => {
    render(<AgentNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('Agent Type')).toBeDefined();
  });

  it('renders timeout options', () => {
    render(<AgentNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getAllByText(/Timeout/i).length).toBeGreaterThan(0);
  });

  it('renders all agent type options', () => {
    render(<AgentNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getAllByText(/Claude Code/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Codex/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Gemini/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Ollama/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Custom/i).length).toBeGreaterThan(0);
  });

  it('renders prompt textarea', () => {
    render(<AgentNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('Prompt')).toBeDefined();
    expect(screen.getByPlaceholderText('Enter the prompt for the AI agent...')).toBeDefined();
  });

  it('renders template variables checkbox', () => {
    render(<AgentNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('Enable Template Variables')).toBeDefined();
  });

  it('calls onChange when agent type changed', () => {
    const onChange = vi.fn();
    render(<AgentNodeSettings data={{} as any} onChange={onChange} />);
    const select = screen.getByDisplayValue('Claude Code');
    fireEvent.change(select, { target: { value: 'codex' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      agentConfig: expect.objectContaining({ agentType: 'codex' }),
    }));
  });

  it('calls onChange when prompt changed', () => {
    const onChange = vi.fn();
    render(<AgentNodeSettings data={{} as any} onChange={onChange} />);
    const textarea = screen.getByPlaceholderText('Enter the prompt for the AI agent...');
    fireEvent.change(textarea, { target: { value: 'Build a feature' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      agentConfig: expect.objectContaining({ prompt: 'Build a feature' }),
    }));
  });

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

  it('renders with existing agent config', () => {
    const data = {
      agentConfig: {
        agentType: 'codex',
        prompt: 'Test prompt',
        templateVariables: false,
        timeout: 60000,
      },
    };
    render(<AgentNodeSettings data={data as any} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('Codex CLI')).toBeDefined();
    expect(screen.getByDisplayValue('Test prompt')).toBeDefined();
  });

  it('shows ollama model input when ollama selected', () => {
    const data = {
      agentConfig: {
        agentType: 'ollama',
        prompt: '',
        templateVariables: true,
        timeout: 300000,
      },
    };
    render(<AgentNodeSettings data={data as any} onChange={vi.fn()} />);
    expect(screen.getByText('Ollama Model')).toBeDefined();
    expect(screen.getByPlaceholderText('llama3 (uses default from settings if empty)')).toBeDefined();
  });

  it('shows template variables help when enabled', () => {
    render(<AgentNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('Available Variables')).toBeDefined();
  });
});
