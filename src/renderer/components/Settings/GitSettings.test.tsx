// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GitSettings } from './GitSettings';

const defaultSettings = {
  autoCommit: false,
  commitPrefix: '',
  userName: 'Test User',
  userEmail: 'test@example.com',
  defaultRepo: '/path/to/repo',
};

describe('GitSettings', () => {
  it('renders form fields', () => {
    render(<GitSettings settings={defaultSettings} onUpdate={vi.fn()} isLoading={false} />);
    expect(screen.getByText('Git Settings')).toBeDefined();
    expect(screen.getByDisplayValue('Test User')).toBeDefined();
    expect(screen.getByDisplayValue('test@example.com')).toBeDefined();
    expect(screen.getByDisplayValue('/path/to/repo')).toBeDefined();
  });

  it('renders save and reset buttons', () => {
    render(<GitSettings settings={defaultSettings} onUpdate={vi.fn()} isLoading={false} />);
    expect(screen.getByText('Save')).toBeDefined();
    expect(screen.getByText('Reset')).toBeDefined();
  });

  it('shows Saving... when loading', () => {
    render(<GitSettings settings={defaultSettings} onUpdate={vi.fn()} isLoading={true} />);
    expect(screen.getByText('Saving...')).toBeDefined();
  });

  it('calls onUpdate when save clicked after change', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(<GitSettings settings={defaultSettings} onUpdate={onUpdate} isLoading={false} />);

    const nameInput = screen.getByDisplayValue('Test User');
    fireEvent.change(nameInput, { target: { value: 'New User' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ userName: 'New User' }));
    });
  });

  it('resets values when reset clicked', () => {
    render(<GitSettings settings={defaultSettings} onUpdate={vi.fn()} isLoading={false} />);

    const nameInput = screen.getByDisplayValue('Test User');
    fireEvent.change(nameInput, { target: { value: 'Changed' } });
    fireEvent.click(screen.getByText('Reset'));

    expect((nameInput as HTMLInputElement).value).toBe('Test User');
  });

  it('renders email field', () => {
    render(<GitSettings settings={defaultSettings} onUpdate={vi.fn()} isLoading={false} />);
    expect(screen.getByDisplayValue('test@example.com')).toBeDefined();
  });
});
