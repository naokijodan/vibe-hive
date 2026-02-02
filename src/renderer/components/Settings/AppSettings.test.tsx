// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppSettings } from './AppSettings';

const defaultSettings = {
  language: 'ja' as const,
  theme: 'dark' as const,
  autoSaveInterval: 30,
  terminalFontSize: 14,
  maxLogEntries: 5000,
};

describe('AppSettings', () => {
  it('renders form fields', () => {
    render(<AppSettings settings={defaultSettings} onUpdate={vi.fn()} isLoading={false} />);
    expect(screen.getByText('App Settings')).toBeDefined();
    expect(screen.getByText('Theme')).toBeDefined();
    expect(screen.getByText(/Auto Save Interval/)).toBeDefined();
    expect(screen.getByText(/Terminal Font Size/)).toBeDefined();
    expect(screen.getByText(/Max Log Entries/)).toBeDefined();
  });

  it('renders save and reset buttons', () => {
    render(<AppSettings settings={defaultSettings} onUpdate={vi.fn()} isLoading={false} />);
    expect(screen.getByText('Save')).toBeDefined();
    expect(screen.getByText('Reset')).toBeDefined();
  });
});
