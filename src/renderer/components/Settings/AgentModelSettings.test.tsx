// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AgentModelSettings } from './AgentModelSettings';

const defaultSettings = {
  defaultModel: 'claude',
  defaultAgent: 'claude-code',
  ollamaDefaultModel: 'llama3',
  providers: {
    'claude-code': { enabled: true, path: '/usr/local/bin/claude' },
    'codex': { enabled: false, path: '' },
    'gemini': { enabled: false, path: '' },
    'ollama': { enabled: false, path: '' },
  },
};

describe('AgentModelSettings', () => {
  it('renders provider list', () => {
    render(<AgentModelSettings settings={defaultSettings as any} onUpdate={vi.fn()} isLoading={false} />);
    expect(screen.getAllByText(/Claude Code/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Codex/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Gemini/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Ollama/i).length).toBeGreaterThan(0);
  });
});
