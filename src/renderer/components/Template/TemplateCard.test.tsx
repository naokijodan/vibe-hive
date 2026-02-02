// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateCard } from './TemplateCard';

const makeTemplate = (overrides = {}) => ({
  id: 't1',
  name: 'Test Template',
  description: 'A test template',
  category: 'Development',
  usageCount: 5,
  taskData: { title: 'Task', description: '', priority: 'medium', status: 'todo' },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('TemplateCard', () => {
  it('renders template name and description', () => {
    render(<TemplateCard template={makeTemplate() as any} onSelect={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Test Template')).toBeDefined();
    expect(screen.getByText('A test template')).toBeDefined();
  });

  it('renders category badge', () => {
    render(<TemplateCard template={makeTemplate() as any} onSelect={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Development')).toBeDefined();
  });

  it('renders usage count', () => {
    render(<TemplateCard template={makeTemplate() as any} onSelect={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('使用回数: 5')).toBeDefined();
  });

  it('calls onSelect when card is clicked', () => {
    const onSelect = vi.fn();
    const template = makeTemplate();
    render(<TemplateCard template={template as any} onSelect={onSelect} onEdit={vi.fn()} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByText('Test Template'));
    expect(onSelect).toHaveBeenCalledWith(template);
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    const template = makeTemplate();
    render(<TemplateCard template={template as any} onSelect={vi.fn()} onEdit={onEdit} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByText('編集'));
    expect(onEdit).toHaveBeenCalledWith(template);
  });

  it('calls onDelete with confirm when delete button is clicked', () => {
    const onDelete = vi.fn();
    window.confirm = vi.fn(() => true);
    render(<TemplateCard template={makeTemplate() as any} onSelect={vi.fn()} onEdit={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByText('削除'));
    expect(onDelete).toHaveBeenCalledWith('t1');
  });

  it('does not call onDelete when confirm is cancelled', () => {
    const onDelete = vi.fn();
    window.confirm = vi.fn(() => false);
    render(<TemplateCard template={makeTemplate() as any} onSelect={vi.fn()} onEdit={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByText('削除'));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('hides description when not provided', () => {
    render(<TemplateCard template={makeTemplate({ description: undefined }) as any} onSelect={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByText('A test template')).toBeNull();
  });
});
