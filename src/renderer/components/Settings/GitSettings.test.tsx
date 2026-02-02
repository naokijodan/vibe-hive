// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
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
});
