// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { ConnectionLine, VerticalLine, HorizontalLine } from './ConnectionLine';

const renderSvg = (children: React.ReactNode) =>
  render(<svg>{children}</svg>);

describe('ConnectionLine', () => {
  it('renders a path with default reports_to color', () => {
    const { container } = renderSvg(
      <ConnectionLine startX={0} startY={0} endX={100} endY={100} />
    );
    const path = container.querySelector('path');
    expect(path).not.toBeNull();
    expect(path?.getAttribute('stroke')).toBe('#6b7280');
  });

  it('uses delegates_to color', () => {
    const { container } = renderSvg(
      <ConnectionLine startX={0} startY={0} endX={100} endY={100} connectionType="delegates_to" />
    );
    expect(container.querySelector('path')?.getAttribute('stroke')).toBe('#f59e0b');
  });

  it('uses collaborates_with color', () => {
    const { container } = renderSvg(
      <ConnectionLine startX={0} startY={0} endX={100} endY={100} connectionType="collaborates_with" />
    );
    expect(container.querySelector('path')?.getAttribute('stroke')).toBe('#3b82f6');
  });
});

describe('VerticalLine', () => {
  it('renders a vertical line', () => {
    const { container } = renderSvg(<VerticalLine x={50} startY={0} endY={100} />);
    const line = container.querySelector('line');
    expect(line?.getAttribute('x1')).toBe('50');
    expect(line?.getAttribute('x2')).toBe('50');
    expect(line?.getAttribute('stroke')).toBe('#6b7280');
  });
});

describe('HorizontalLine', () => {
  it('renders a horizontal line', () => {
    const { container } = renderSvg(<HorizontalLine y={50} startX={0} endX={100} />);
    const line = container.querySelector('line');
    expect(line?.getAttribute('y1')).toBe('50');
    expect(line?.getAttribute('y2')).toBe('50');
  });
});
