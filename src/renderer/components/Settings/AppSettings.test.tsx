// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  it('calls onUpdate when save clicked after change', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(<AppSettings settings={defaultSettings} onUpdate={onUpdate} isLoading={false} />);

    // Change theme
    const select = screen.getByDisplayValue('Dark');
    fireEvent.change(select, { target: { value: 'light' } });

    // Click save
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ theme: 'light' }));
    });
  });

  it('resets values when reset clicked', () => {
    render(<AppSettings settings={defaultSettings} onUpdate={vi.fn()} isLoading={false} />);

    const select = screen.getByDisplayValue('Dark');
    fireEvent.change(select, { target: { value: 'light' } });

    fireEvent.click(screen.getByText('Reset'));

    expect((select as HTMLSelectElement).value).toBe('dark');
  });

  it('disables select when loading', () => {
    render(<AppSettings settings={defaultSettings} onUpdate={vi.fn()} isLoading={true} />);
    const select = screen.getByDisplayValue('Dark');
    expect((select as HTMLSelectElement).disabled).toBe(true);
  });
});
