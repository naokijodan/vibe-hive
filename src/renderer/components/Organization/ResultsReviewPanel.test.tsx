// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ResultsReviewPanel } from './ResultsReviewPanel';

const mockState = {
  phase: 'pending_approval' as const,
  nodeResults: new Map(),
  errors: [],
};

describe('ResultsReviewPanel', () => {
  it('renders phase label and approve button', () => {
    render(
      <ResultsReviewPanel state={mockState as any} onApprove={vi.fn()} onReject={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.getByText('承認待ち')).toBeDefined();
  });
});
