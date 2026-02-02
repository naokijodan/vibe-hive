// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TerminalTabs } from './TerminalTabs';

const makeTabs = () => [
  { id: 't1', name: 'Agent 1', isActive: true, status: 'running' as const },
  { id: 't2', name: 'Agent 2', isActive: false, status: 'idle' as const },
];

describe('TerminalTabs', () => {
  it('renders tab names', () => {
    render(<TerminalTabs tabs={makeTabs()} activeTabId="t1" onTabSelect={vi.fn()} />);
    expect(screen.getByText('Agent 1')).toBeDefined();
    expect(screen.getByText('Agent 2')).toBeDefined();
  });

  it('calls onTabSelect on click', () => {
    const onSelect = vi.fn();
    render(<TerminalTabs tabs={makeTabs()} activeTabId="t1" onTabSelect={onSelect} />);
    fireEvent.click(screen.getByText('Agent 2'));
    expect(onSelect).toHaveBeenCalledWith('t2');
  });

  it('renders status indicators', () => {
    const { container } = render(<TerminalTabs tabs={makeTabs()} activeTabId="t1" onTabSelect={vi.fn()} />);
    expect(container.querySelector('.bg-green-500')).not.toBeNull();
    expect(container.querySelector('.bg-gray-500')).not.toBeNull();
  });
});
