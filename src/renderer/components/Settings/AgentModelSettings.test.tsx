// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  it('renders save and reset buttons', () => {
    render(<AgentModelSettings settings={defaultSettings as any} onUpdate={vi.fn()} isLoading={false} />);
    expect(screen.getByText('Save')).toBeDefined();
    expect(screen.getByText('Reset')).toBeDefined();
  });

  it('renders header', () => {
    render(<AgentModelSettings settings={defaultSettings as any} onUpdate={vi.fn()} isLoading={false} />);
    expect(screen.getAllByText(/AI.*Model/i).length).toBeGreaterThan(0);
  });

  it('calls onUpdate on save', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(<AgentModelSettings settings={defaultSettings as any} onUpdate={onUpdate} isLoading={false} />);

    // Toggle a provider enable checkbox to trigger hasChanges
    const checkboxes = screen.getAllByRole('checkbox');
    if (checkboxes.length > 0) {
      fireEvent.click(checkboxes[0]);
    }

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled();
    });
  });
});
