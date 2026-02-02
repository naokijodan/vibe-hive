// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ViewLoadingFallback } from './ViewLoadingFallback';

describe('ViewLoadingFallback', () => {
  it('renders loading text', () => {
    render(<ViewLoadingFallback />);
    expect(screen.getByText('読み込み中...')).toBeDefined();
  });

  it('renders spinner element', () => {
    const { container } = render(<ViewLoadingFallback />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeDefined();
  });
});
