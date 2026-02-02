import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAiAssistant } = vi.hoisted(() => ({
  mockAiAssistant: {
    chat: vi.fn(),
    clear: vi.fn(),
    hasKey: vi.fn(),
  },
}));

vi.mock('../bridge/ipcBridge', () => ({
  ipcBridge: { aiAssistant: mockAiAssistant },
}));

import { useAIAssistantStore } from './aiAssistantStore';

describe('aiAssistantStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAIAssistantStore.setState({
      messages: [],
      isLoading: false,
      isOpen: false,
      hasApiKey: null,
      error: null,
    });
  });

  describe('panel toggle', () => {
    it('togglePanel toggles isOpen', () => {
      useAIAssistantStore.getState().togglePanel();
      expect(useAIAssistantStore.getState().isOpen).toBe(true);
      useAIAssistantStore.getState().togglePanel();
      expect(useAIAssistantStore.getState().isOpen).toBe(false);
    });

    it('openPanel/closePanel', () => {
      useAIAssistantStore.getState().openPanel();
      expect(useAIAssistantStore.getState().isOpen).toBe(true);
      useAIAssistantStore.getState().closePanel();
      expect(useAIAssistantStore.getState().isOpen).toBe(false);
    });
  });

  describe('sendMessage', () => {
    it('adds user and assistant messages', async () => {
      mockAiAssistant.chat.mockResolvedValue({
        reply: 'Hello!',
        toolResults: [],
      });

      await useAIAssistantStore.getState().sendMessage('Hi');

      const msgs = useAIAssistantStore.getState().messages;
      expect(msgs).toHaveLength(2);
      expect(msgs[0].role).toBe('user');
      expect(msgs[1].role).toBe('assistant');
      expect(msgs[1].content).toBe('Hello!');
    });

    it('includes toolResults when present', async () => {
      mockAiAssistant.chat.mockResolvedValue({
        reply: 'Done',
        toolResults: [{ toolName: 'search', result: 'found' }],
      });

      await useAIAssistantStore.getState().sendMessage('search');

      const msgs = useAIAssistantStore.getState().messages;
      expect(msgs[1].toolResults).toHaveLength(1);
    });

    it('handles error', async () => {
      mockAiAssistant.chat.mockRejectedValue(new Error('API error'));

      await useAIAssistantStore.getState().sendMessage('Hi');

      expect(useAIAssistantStore.getState().error).toBeTruthy();
      expect(useAIAssistantStore.getState().isLoading).toBe(false);
    });
  });

  describe('clearHistory', () => {
    it('clears messages', async () => {
      mockAiAssistant.clear.mockResolvedValue(undefined);
      useAIAssistantStore.setState({ messages: [{ id: '1', role: 'user', content: 'x', timestamp: 0 }] });

      await useAIAssistantStore.getState().clearHistory();

      expect(useAIAssistantStore.getState().messages).toHaveLength(0);
    });
  });

  describe('checkApiKey', () => {
    it('sets hasApiKey true', async () => {
      mockAiAssistant.hasKey.mockResolvedValue(true);

      await useAIAssistantStore.getState().checkApiKey();

      expect(useAIAssistantStore.getState().hasApiKey).toBe(true);
    });

    it('sets hasApiKey false on error', async () => {
      mockAiAssistant.hasKey.mockRejectedValue(new Error('fail'));

      await useAIAssistantStore.getState().checkApiKey();

      expect(useAIAssistantStore.getState().hasApiKey).toBe(false);
    });
  });
});
