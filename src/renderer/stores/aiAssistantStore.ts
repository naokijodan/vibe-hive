import { create } from 'zustand';
import { ipcBridge } from '../bridge/ipcBridge';

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolResults?: Array<{ toolName: string; result: unknown }>;
  timestamp: number;
}

interface AIAssistantState {
  messages: AIChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
  hasApiKey: boolean | null;
  error: string | null;

  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  checkApiKey: () => Promise<void>;
}

export const useAIAssistantStore = create<AIAssistantState>((set, get) => ({
  messages: [],
  isLoading: false,
  isOpen: false,
  hasApiKey: null,
  error: null,

  togglePanel: () => set(state => ({ isOpen: !state.isOpen })),
  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),

  sendMessage: async (content: string) => {
    const userMsg: AIChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    set(state => ({
      messages: [...state.messages, userMsg],
      isLoading: true,
      error: null,
    }));

    try {
      const response = await ipcBridge.aiAssistant.chat(content);

      const assistantMsg: AIChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: response.reply,
        toolResults: response.toolResults.length > 0 ? response.toolResults : undefined,
        timestamp: Date.now(),
      };

      set(state => ({
        messages: [...state.messages, assistantMsg],
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'AI応答の取得に失敗しました',
      });
    }
  },

  clearHistory: async () => {
    await ipcBridge.aiAssistant.clear();
    set({ messages: [], error: null });
  },

  checkApiKey: async () => {
    try {
      const hasKey = await ipcBridge.aiAssistant.hasKey();
      set({ hasApiKey: hasKey });
    } catch {
      set({ hasApiKey: false });
    }
  },
}));
