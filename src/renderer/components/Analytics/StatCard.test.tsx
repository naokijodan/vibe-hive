// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Total" value={42} icon="📊" color="blue" />);
    expect(screen.getByText('Total')).toBeDefined();
    expect(screen.getByText('42')).toBeDefined();
  });

  it('renders subValue when provided', () => {
    render(<StatCard label="Tasks" value={10} subValue="5 completed" icon="✅" color="green" />);
    expect(screen.getByText('5 completed')).toBeDefined();
  });

  it('does not render subValue when not provided', () => {
    render(<StatCard label="Tasks" value={10} icon="✅" color="green" />);
    expect(screen.queryByText('5 completed')).toBeNull();
  });

  it('renders with different colors', () => {
    const { container } = render(<StatCard label="Errors" value={3} icon="❌" color="red" />);
    expect(container.querySelector('.bg-red-900\\/30')).toBeDefined();
  });
});
