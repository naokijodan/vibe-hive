import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  BrowserWindow: class {},
}));
vi.mock('crypto', () => ({
  randomUUID: () => `uuid-${Date.now()}-${Math.random()}`,
}));

let getAgentCoordinationService: () => any;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.doMock('electron', () => ({ BrowserWindow: class {} }));
  vi.doMock('crypto', () => ({ randomUUID: () => `uuid-${Math.random()}` }));
  const mod = await import('./AgentCoordinationService');
  getAgentCoordinationService = mod.getAgentCoordinationService;
});

describe('AgentCoordinationService', () => {
  it('sendMessage adds message', () => {
    const svc = getAgentCoordinationService();
    const msg = svc.sendMessage('a1', 'a2', 'message', 'hello');

    expect(msg.fromAgentId).toBe('a1');
    expect(msg.content).toBe('hello');
    expect(svc.getMessages()).toHaveLength(1);
  });

  it('sendMessage broadcast (toAgentId null)', () => {
    const svc = getAgentCoordinationService();
    const msg = svc.sendMessage('a1', null, 'status_update', 'running');

    expect(msg.toAgentId).toBeNull();
  });

  it('delegateTask creates delegation and message', () => {
    const svc = getAgentCoordinationService();
    const delegation = svc.delegateTask('t1', 'a1', 'a2', 'busy');

    expect(delegation.status).toBe('pending');
    expect(delegation.taskId).toBe('t1');
    expect(svc.getDelegations()).toHaveLength(1);
    expect(svc.getMessages()).toHaveLength(1); // delegation message
  });

  it('respondToDelegation accepts', () => {
    const svc = getAgentCoordinationService();
    const delegation = svc.delegateTask('t1', 'a1', 'a2');
    const result = svc.respondToDelegation(delegation.id, true);

    expect(result?.status).toBe('accepted');
  });

  it('respondToDelegation rejects', () => {
    const svc = getAgentCoordinationService();
    const delegation = svc.delegateTask('t1', 'a1', 'a2');
    const result = svc.respondToDelegation(delegation.id, false);

    expect(result?.status).toBe('rejected');
  });

  it('respondToDelegation returns null for non-existent', () => {
    const svc = getAgentCoordinationService();
    expect(svc.respondToDelegation('bad', true)).toBeNull();
  });

  it('respondToDelegation returns null for already responded', () => {
    const svc = getAgentCoordinationService();
    const delegation = svc.delegateTask('t1', 'a1', 'a2');
    svc.respondToDelegation(delegation.id, true);
    expect(svc.respondToDelegation(delegation.id, false)).toBeNull();
  });

  it('getMessages with limit', () => {
    const svc = getAgentCoordinationService();
    svc.sendMessage('a1', 'a2', 'message', 'msg1');
    svc.sendMessage('a1', 'a2', 'message', 'msg2');
    svc.sendMessage('a1', 'a2', 'message', 'msg3');

    expect(svc.getMessages(2)).toHaveLength(2);
  });

  it('getMessagesByAgent filters correctly', () => {
    const svc = getAgentCoordinationService();
    svc.sendMessage('a1', 'a2', 'message', 'to a2');
    svc.sendMessage('a3', 'a4', 'message', 'to a4');
    svc.sendMessage('a2', null, 'message', 'broadcast');

    const msgs = svc.getMessagesByAgent('a2');
    expect(msgs).toHaveLength(2); // "to a2" + "broadcast"
  });

  it('clearMessages clears all', () => {
    const svc = getAgentCoordinationService();
    svc.sendMessage('a1', 'a2', 'message', 'hi');
    svc.delegateTask('t1', 'a1', 'a2');
    svc.clearMessages();

    expect(svc.getMessages()).toHaveLength(0);
    expect(svc.getDelegations()).toHaveLength(0);
  });

  it('setMainWindow sets window', () => {
    const svc = getAgentCoordinationService();
    const mockWindow = { isDestroyed: vi.fn(), webContents: { send: vi.fn() } };
    svc.setMainWindow(mockWindow as any);
    // No error should occur
  });

  it('sendMessage with metadata', () => {
    const svc = getAgentCoordinationService();
    const msg = svc.sendMessage('a1', 'a2', 'request', 'data', { key: 'value' });

    expect(msg.metadata).toEqual({ key: 'value' });
  });

  it('sendMessage notifies renderer when window set', () => {
    const svc = getAgentCoordinationService();
    const mockSend = vi.fn();
    const mockWindow = {
      isDestroyed: vi.fn().mockReturnValue(false),
      webContents: { send: mockSend },
    };
    svc.setMainWindow(mockWindow as any);
    svc.sendMessage('a1', 'a2', 'message', 'hi');

    expect(mockSend).toHaveBeenCalledWith('coordination:message', expect.any(Object));
  });

  it('does not notify renderer when window destroyed', () => {
    const svc = getAgentCoordinationService();
    const mockSend = vi.fn();
    const mockWindow = {
      isDestroyed: vi.fn().mockReturnValue(true),
      webContents: { send: mockSend },
    };
    svc.setMainWindow(mockWindow as any);
    svc.sendMessage('a1', 'a2', 'message', 'hi');

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('delegateTask without reason', () => {
    const svc = getAgentCoordinationService();
    const delegation = svc.delegateTask('t1', 'a1', 'a2');

    expect(delegation.reason).toBeUndefined();
  });

  it('getMessagesByAgent includes fromAgentId', () => {
    const svc = getAgentCoordinationService();
    svc.sendMessage('a1', 'a2', 'message', 'hello');

    const msgs = svc.getMessagesByAgent('a1');
    expect(msgs).toHaveLength(1);
  });
});
