import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockCreate, mockGetById, mockGetAll, mockDelete,
  mockSetActive, mockGetActive, mockUpdateStatus, mockUpdate,
} = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockGetById: vi.fn(),
  mockGetAll: vi.fn(),
  mockDelete: vi.fn(),
  mockSetActive: vi.fn(),
  mockGetActive: vi.fn(() => null),
  mockUpdateStatus: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock('./db/SessionRepository', () => ({
  SessionRepository: class {
    create = mockCreate;
    getById = mockGetById;
    getAll = mockGetAll;
    delete = mockDelete;
    setActive = mockSetActive;
    getActive = mockGetActive;
    updateStatus = mockUpdateStatus;
    update = mockUpdate;
  },
}));

import { SessionService } from './SessionService';

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetActive.mockReturnValue(null);
    service = new SessionService();
  });

  describe('createSession', () => {
    it('delegates to repository', () => {
      const config = { name: 'Test Session', workingDirectory: '/tmp' };
      const created = { id: 'sess-1', ...config, status: 'active' };
      mockCreate.mockReturnValue(created);

      const result = service.createSession(config as any);
      expect(result).toBe(created);
      expect(mockCreate).toHaveBeenCalledWith(config);
    });
  });

  describe('getSession', () => {
    it('returns session by ID', () => {
      const session = { id: 'sess-1', name: 'Test' };
      mockGetById.mockReturnValue(session);
      expect(service.getSession('sess-1')).toBe(session);
    });

    it('returns null for nonexistent', () => {
      mockGetById.mockReturnValue(null);
      expect(service.getSession('nope')).toBeNull();
    });
  });

  describe('listSessions', () => {
    it('returns all sessions', () => {
      const sessions = [{ id: '1' }, { id: '2' }];
      mockGetAll.mockReturnValue(sessions);
      expect(service.listSessions()).toBe(sessions);
    });
  });

  describe('deleteSession', () => {
    it('deletes session from repository', () => {
      service.deleteSession('sess-1');
      expect(mockDelete).toHaveBeenCalledWith('sess-1');
    });

    it('clears activeSessionId if deleted session was active', () => {
      // Set up active session
      mockGetActive.mockReturnValue({ id: 'sess-active' });
      const svc = new SessionService();

      mockGetById.mockReturnValue(null);
      svc.deleteSession('sess-active');

      // getActiveSession should return null since activeSessionId cleared
      mockGetActive.mockReturnValue(null);
      expect(svc.getActiveSession()).toBeNull();
    });
  });

  describe('switchSession', () => {
    it('sets session as active', () => {
      const session = { id: 'sess-2', name: 'New Active' };
      mockGetById.mockReturnValue(session);

      const result = service.switchSession('sess-2');
      expect(result).toBe(session);
      expect(mockSetActive).toHaveBeenCalledWith('sess-2');
    });

    it('throws for nonexistent session', () => {
      mockGetById.mockReturnValue(null);
      expect(() => service.switchSession('nope')).toThrow('Session not found: nope');
    });
  });

  describe('getActiveSession', () => {
    it('returns active from repository when no activeSessionId', () => {
      const active = { id: 'sess-repo-active' };
      mockGetActive.mockReturnValue(active);

      const svc = new SessionService();
      // activeSessionId is set from constructor
      expect(svc.getActiveSession()).toBeDefined();
    });

    it('returns session by activeSessionId after switch', () => {
      const session = { id: 'sess-switched' };
      mockGetById.mockReturnValue(session);

      service.switchSession('sess-switched');
      expect(service.getActiveSession()).toBe(session);
    });
  });

  describe('updateStatus', () => {
    it('delegates to repository', () => {
      const updated = { id: 'sess-1', status: 'paused' };
      mockUpdateStatus.mockReturnValue(updated);

      expect(service.updateStatus('sess-1', 'paused' as any)).toBe(updated);
    });
  });

  describe('updateSession', () => {
    it('delegates to repository', () => {
      const updated = { id: 'sess-1', name: 'Updated' };
      mockUpdate.mockReturnValue(updated);

      expect(service.updateSession('sess-1', { name: 'Updated' } as any)).toBe(updated);
    });
  });
});
