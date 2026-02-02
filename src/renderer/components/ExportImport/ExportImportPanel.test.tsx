// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportImportPanel } from './ExportImportPanel';

const mockExport = vi.fn();
const mockImport = vi.fn();

vi.mock('../../bridge/ipcBridge', () => ({
  ipcBridge: {
    exportImport: {
      export: (...args: any[]) => mockExport(...args),
      import: (...args: any[]) => mockImport(...args),
    },
  },
}));

describe('ExportImportPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders export and import sections', () => {
    render(<ExportImportPanel />);
    expect(screen.getByText('エクスポート')).toBeDefined();
    expect(screen.getByText('インポート')).toBeDefined();
  });

  it('renders export target checkboxes', () => {
    render(<ExportImportPanel />);
    expect(screen.getByText('タスク')).toBeDefined();
    expect(screen.getByText('タスクテンプレート')).toBeDefined();
    expect(screen.getByText('ワークフロー')).toBeDefined();
  });

  it('shows error when no export targets selected', async () => {
    render(<ExportImportPanel />);
    // Uncheck all targets
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(cb => {
      if ((cb as HTMLInputElement).checked) fireEvent.click(cb);
    });
    fireEvent.click(screen.getByText('JSONファイルにエクスポート'));
    expect(screen.getByText('エクスポート対象を1つ以上選択してください')).toBeDefined();
  });

  it('calls export with selected targets', async () => {
    mockExport.mockResolvedValue({ success: true, stats: { tasks: 5 } });
    render(<ExportImportPanel />);
    fireEvent.click(screen.getByText('JSONファイルにエクスポート'));
    await waitFor(() => {
      expect(mockExport).toHaveBeenCalled();
    });
  });

  it('shows import mode selector', () => {
    render(<ExportImportPanel />);
    expect(screen.getByText('マージ')).toBeDefined();
    expect(screen.getByText('上書き')).toBeDefined();
  });
});
