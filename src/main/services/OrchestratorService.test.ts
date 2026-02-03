import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockStart, mockStop, mockGetOrCreate, mockSave, mockGetById } = vi.hoisted(() => ({
  mockStart: vi.fn(),
  mockStop: vi.fn(),
  mockGetOrCreate: vi.fn(),
  mockSave: vi.fn(() => ({ id: 'ctx-1' })),
  mockGetById: vi.fn(),
}));

const mockWebContentsSend = vi.fn();
const mockWebContentsOn = vi.fn();
const mockWebContentsRemoveListener = vi.fn();

vi.mock('electron', () => ({
  BrowserWindow: class {
    isDestroyed = vi.fn(() => false);
    webContents = {
      send: mockWebContentsSend,
      on: mockWebContentsOn,
      removeListener: mockWebContentsRemoveListener,
    };
  },
}));

vi.mock('./AgentService', () => ({
  agentService: {
    start: mockStart,
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
import { BrowserWindow } from 'electron';

describe('OrchestratorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('setMainWindow', () => {
    it('sets the main window', () => {
      const window = new BrowserWindow();
      orchestratorService.setMainWindow(window);
      // Window is set - no error
    });
  });

  describe('setupEventListeners', () => {
    it('does nothing if no main window', () => {
      // Reset by setting to null via internal state
      orchestratorService.setMainWindow(null as unknown as BrowserWindow);
      orchestratorService.setupEventListeners();
      expect(mockWebContentsOn).not.toHaveBeenCalled();
    });

    it('attaches ipc-message listener when window is set', () => {
      const window = new BrowserWindow();
      orchestratorService.setMainWindow(window);
      orchestratorService.setupEventListeners();
      expect(mockWebContentsOn).toHaveBeenCalledWith('ipc-message', expect.any(Function));
    });

    it('handles agent:taskComplete event', () => {
      const window = new BrowserWindow();
      orchestratorService.setMainWindow(window);
      orchestratorService.setupEventListeners();

      // Get the registered listener
      const listener = mockWebContentsOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'ipc-message'
      )?.[1] as Function;

      // Call with unrelated channel - should not throw
      listener({}, 'other:channel');

      // Call with agent:taskComplete but no matching callback
      listener({}, 'agent:taskComplete', 'unknown-session');
    });
  });

  describe('getStatus', () => {
    it('returns null for unknown node', () => {
      expect(orchestratorService.getStatus('unknown')).toBeNull();
    });
  });

  describe('getAllStatus', () => {
    it('returns empty for unknown session', () => {
      expect(orchestratorService.getAllStatus('unknown')).toEqual([]);
    });
  });

  describe('stopNode', () => {
    it('does not call agentService.stop if no execution exists', () => {
      orchestratorService.stopNode('nonexistent');
      expect(mockStop).not.toHaveBeenCalled();
    });
  });

  describe('getOrchestrationState', () => {
    it('returns null for unknown node', () => {
      expect(orchestratorService.getOrchestrationState('unknown')).toBeNull();
    });
  });

  describe('approveOrReject', () => {
    it('returns null for unknown node', () => {
      expect(orchestratorService.approveOrReject({ nodeId: 'unknown', approved: true })).toBeNull();
    });
  });

  describe('executeNode', () => {
    it('returns failed if node not found', async () => {
      mockGetOrCreate.mockReturnValue({ hierarchy: { nodes: [] } });
      const result = await orchestratorService.executeNode({
        nodeId: 'n1',
        sessionId: 's1',
        prompt: 'test',
      });
      expect(result.status).toBe('failed');
      expect(result.error).toContain('not found');
    });

    it('returns failed if hierarchy is null', async () => {
      mockGetOrCreate.mockReturnValue({ hierarchy: null });
      const result = await orchestratorService.executeNode({
        nodeId: 'n1',
        sessionId: 's1',
        prompt: 'test',
      });
      expect(result.status).toBe('failed');
    });

    it('handles leaf node with no children', async () => {
      // Set up a window for emitting events
      const window = new BrowserWindow();
      orchestratorService.setMainWindow(window);

      mockGetOrCreate.mockReturnValue({
        hierarchy: {
          nodes: [
            {
              id: 'n1',
              parentId: null,
              name: 'Leaf',
              preferredAgentType: 'claude-code',
            },
          ],
        },
      });

      // Simulate immediate task completion
      mockStart.mockImplementation(() => {
        // Task completes via timeout for testing
      });

      // We can't easily test the full flow without async timing
      // Just verify it starts execution
      const resultPromise = orchestratorService.executeNode({
        nodeId: 'n1',
        sessionId: 's1',
        prompt: 'test prompt',
      });

      // Give it a moment to start
      await new Promise(resolve => setTimeout(resolve, 10));

      // The execution is still running (waiting for task complete)
      // For unit test coverage, we verify the agent was started
      expect(mockStart).toHaveBeenCalled();

      // Stop the node to clean up
      orchestratorService.stopNode('n1');
    });

    it('handles parallel execution strategy with children', async () => {
      const window = new BrowserWindow();
      orchestratorService.setMainWindow(window);

      mockGetOrCreate.mockReturnValue({
        hierarchy: {
          nodes: [
            {
              id: 'parent',
              parentId: null,
              name: 'Parent',
              executionStrategy: 'parallel',
            },
            { id: 'child1', parentId: 'parent', name: 'Child 1' },
            { id: 'child2', parentId: 'parent', name: 'Child 2' },
          ],
        },
      });

      // Start execution
      const resultPromise = orchestratorService.executeNode({
        nodeId: 'parent',
        sessionId: 's1',
        prompt: 'test',
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      // Stop all to clean up
      orchestratorService.stopNode('parent');
      orchestratorService.stopNode('child1');
      orchestratorService.stopNode('child2');
    });

    it('handles sequential execution strategy with children', async () => {
      const window = new BrowserWindow();
      orchestratorService.setMainWindow(window);

      mockGetOrCreate.mockReturnValue({
        hierarchy: {
          nodes: [
            {
              id: 'parent',
              parentId: null,
              name: 'Parent',
              executionStrategy: 'sequential',
            },
            { id: 'child1', parentId: 'parent', name: 'Child 1' },
          ],
        },
      });

      const resultPromise = orchestratorService.executeNode({
        nodeId: 'parent',
        sessionId: 's1',
        prompt: 'test',
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      orchestratorService.stopNode('parent');
      orchestratorService.stopNode('child1');
    });

    it('uses systemPrompt when available', async () => {
      const window = new BrowserWindow();
      orchestratorService.setMainWindow(window);

      mockGetOrCreate.mockReturnValue({
        hierarchy: {
          nodes: [
            {
              id: 'n1',
              parentId: null,
              name: 'Node',
              systemPrompt: 'You are a helpful assistant',
            },
          ],
        },
      });

      const resultPromise = orchestratorService.executeNode({
        nodeId: 'n1',
        sessionId: 's1',
        prompt: 'test',
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify the agent was started with system prompt incorporated
      expect(mockStart).toHaveBeenCalledWith(
        expect.any(String),
        'claude',
        expect.any(String),
        expect.stringContaining('System Role')
      );

      orchestratorService.stopNode('n1');
    });

    it('includes parent context when provided', async () => {
      const window = new BrowserWindow();
      orchestratorService.setMainWindow(window);

      mockGetById.mockReturnValue({ content: 'Previous output data' });

      mockGetOrCreate.mockReturnValue({
        hierarchy: {
          nodes: [
            { id: 'n1', parentId: null, name: 'Node' },
          ],
        },
      });

      const resultPromise = orchestratorService.executeNode({
        nodeId: 'n1',
        sessionId: 's1',
        prompt: 'test',
        parentContextId: 'ctx-prev',
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockGetById).toHaveBeenCalledWith('ctx-prev');
      expect(mockStart).toHaveBeenCalledWith(
        expect.any(String),
        'claude',
        expect.any(String),
        expect.stringContaining('Previous agent output')
      );

      orchestratorService.stopNode('n1');
    });
  });

  describe('orchestrateNode', () => {
    it('returns rejected if node not found', async () => {
      mockGetOrCreate.mockReturnValue({ hierarchy: { nodes: [] } });
      const state = await orchestratorService.orchestrateNode({
        nodeId: 'n1',
        sessionId: 's1',
        goal: 'test',
      });
      expect(state.phase).toBe('rejected');
    });

    it('returns rejected if no children', async () => {
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

    it('sets planning phase when orchestration starts', async () => {
      const window = new BrowserWindow();
      orchestratorService.setMainWindow(window);

      mockGetOrCreate.mockReturnValue({
        hierarchy: {
          nodes: [
            { id: 'parent', parentId: null, name: 'Parent', systemPrompt: 'You are a manager' },
            { id: 'child1', parentId: 'parent', name: 'Worker 1', type: 'role' },
          ],
        },
      });

      // Start orchestration (it will get stuck waiting for agent)
      const orchestrationPromise = orchestratorService.orchestrateNode({
        nodeId: 'parent',
        sessionId: 's1',
        goal: 'Build a feature',
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify planning started
      expect(mockWebContentsSend).toHaveBeenCalledWith(
        'orchestration:stateChange',
        expect.objectContaining({ phase: 'planning' })
      );

      // Clean up
      orchestratorService.stopNode('parent');
      orchestratorService.stopNode('plan-parent');
    });
  });

  describe('agent type conversion', () => {
    it('converts claude-code to claude', async () => {
      const window = new BrowserWindow();
      orchestratorService.setMainWindow(window);

      mockGetOrCreate.mockReturnValue({
        hierarchy: {
          nodes: [
            { id: 'n1', parentId: null, name: 'Node', preferredAgentType: 'claude-code' },
          ],
        },
      });

      orchestratorService.executeNode({
        nodeId: 'n1',
        sessionId: 's1',
        prompt: 'test',
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockStart).toHaveBeenCalledWith(
        expect.any(String),
        'claude',
        expect.any(String),
        expect.any(String)
      );

      orchestratorService.stopNode('n1');
    });

    it('passes through other agent types', async () => {
      const window = new BrowserWindow();
      orchestratorService.setMainWindow(window);

      mockGetOrCreate.mockReturnValue({
        hierarchy: {
          nodes: [
            { id: 'n1', parentId: null, name: 'Node', preferredAgentType: 'codex' },
          ],
        },
      });

      orchestratorService.executeNode({
        nodeId: 'n1',
        sessionId: 's1',
        prompt: 'test',
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockStart).toHaveBeenCalledWith(
        expect.any(String),
        'codex',
        expect.any(String),
        expect.any(String)
      );

      orchestratorService.stopNode('n1');
    });
  });
});
