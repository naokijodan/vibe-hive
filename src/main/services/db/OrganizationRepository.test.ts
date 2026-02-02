import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRun, mockGet, mockPrepare } = vi.hoisted(() => {
  const mockRun = vi.fn(() => ({ changes: 1 }));
  const mockGet = vi.fn();
  return {
    mockRun, mockGet,
    mockPrepare: vi.fn(() => ({ run: mockRun, get: mockGet })),
  };
});

vi.mock('./Database', () => ({
  getDatabase: () => ({ prepare: mockPrepare }),
}));

import { getBySessionId, getOrCreate, save } from './OrganizationRepository';

describe('OrganizationRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBySessionId', () => {
    it('returns org when found', () => {
      const org = { id: 'org-1', name: 'Test' };
      mockGet.mockReturnValue({ data: JSON.stringify(org) });

      const result = getBySessionId('sess-1');
      expect(result?.id).toBe('org-1');
    });

    it('returns null when not found', () => {
      mockGet.mockReturnValue(undefined);
      expect(getBySessionId('bad')).toBeNull();
    });
  });

  describe('getOrCreate', () => {
    it('returns existing org', () => {
      const org = { id: 'org-1', name: 'Existing' };
      mockGet.mockReturnValue({ data: JSON.stringify(org) });

      const result = getOrCreate('sess-1');
      expect(result.id).toBe('org-1');
    });

    it('creates default when not found', () => {
      mockGet.mockReturnValue(undefined);

      const result = getOrCreate('sess-1');
      expect(result.name).toBe('Default Organization');
      expect(mockRun).toHaveBeenCalled();
    });
  });

  describe('save', () => {
    it('upserts organization', () => {
      const org = { id: 'org-1', name: 'Test' } as any;
      save('sess-1', org);
      expect(mockRun).toHaveBeenCalled();
    });
  });
});
