// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TemplateCard } from './TemplateCard';

vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 days ago'),
}));

const mockTemplate = {
  id: 1,
  name: 'Test Workflow',
  description: 'A workflow template',
  category: 'automation',
  nodes: [],
  edges: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe('TemplateCard (Workflow)', () => {
  it('renders template name', () => {
    render(<TemplateCard template={mockTemplate as any} />);
    expect(screen.getByText('Test Workflow')).toBeDefined();
  });

  it('renders category badge', () => {
    render(<TemplateCard template={mockTemplate as any} />);
    expect(screen.getByText('Automation')).toBeDefined();
  });

  it('renders description', () => {
    render(<TemplateCard template={mockTemplate as any} />);
    expect(screen.getByText('A workflow template')).toBeDefined();
  });
});
