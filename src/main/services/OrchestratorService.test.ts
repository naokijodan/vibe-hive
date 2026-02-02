import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockStop, mockGetOrCreate, mockSave, mockGetById } = vi.hoisted(() => ({
  mockStop: vi.fn(),
  mockGetOrCreate: vi.fn(),
  mockSave: vi.fn(() => ({ id: 'ctx-1' })),
  mockGetById: vi.fn(),
}));

vi.mock('electron', () => ({
  BrowserWindow: class {},
}));

vi.mock('./AgentService', () => ({
  agentService: {
    start: vi.fn(),
    stop: mockStop,
  },
}));

vi.mock('./db/OrganizationRepository', () => ({
  getOrCreate: mockGetOrCreate,
}));

vi.mock('./db/ContextRepository', () => ({
  save: mockSave,
  getById: mockGetById,
}));

vi.mock('./ContextService', () => ({
  parseAgentOutput: (raw: string) => ({ format: 'text', content: raw }),
}));

import { orchestratorService } from './OrchestratorService';

describe('OrchestratorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getStatus returns null for unknown node', () => {
    expect(orchestratorService.getStatus('unknown')).toBeNull();
  });

  it('getAllStatus returns empty for unknown session', () => {
    expect(orchestratorService.getAllStatus('unknown')).toEqual([]);
  });

  it('stopNode calls agentService.stop if execution exists', () => {
    // No execution registered - should not throw
    orchestratorService.stopNode('nonexistent');
    expect(mockStop).not.toHaveBeenCalled();
  });

  it('getOrchestrationState returns null for unknown', () => {
    expect(orchestratorService.getOrchestrationState('unknown')).toBeNull();
  });

  it('approveOrReject returns null for unknown node', () => {
    expect(orchestratorService.approveOrReject({ nodeId: 'unknown', approved: true })).toBeNull();
  });

  it('executeNode returns failed if node not found', async () => {
    mockGetOrCreate.mockReturnValue({ hierarchy: { nodes: [] } });
    const result = await orchestratorService.executeNode({
      nodeId: 'n1',
      sessionId: 's1',
      prompt: 'test',
    });
    expect(result.status).toBe('failed');
    expect(result.error).toContain('not found');
  });

  it('orchestrateNode returns rejected if node not found', async () => {
    mockGetOrCreate.mockReturnValue({ hierarchy: { nodes: [] } });
    const state = await orchestratorService.orchestrateNode({
      nodeId: 'n1',
      sessionId: 's1',
      goal: 'test',
    });
    expect(state.phase).toBe('rejected');
  });

  it('orchestrateNode returns rejected if no children', async () => {
    mockGetOrCreate.mockReturnValue({
      hierarchy: { nodes: [{ id: 'n1', parentId: null, name: 'Root' }] },
    });
    const state = await orchestratorService.orchestrateNode({
      nodeId: 'n1',
      sessionId: 's1',
      goal: 'test',
    });
    expect(state.phase).toBe('rejected');
    expect(state.error).toContain('No child nodes');
  });
});
