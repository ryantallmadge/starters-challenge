import { create } from 'zustand';
import { addChat } from '../services/api';
import type { ChatMessage } from '../types';

interface ChatStoreState {
  messages: ChatMessage[];

  setMessages: (messages: ChatMessage[]) => void;
  sendMessage: (userId: string, message: ChatMessage, contestId?: string) => Promise<void>;
}

export const useChatStore = create<ChatStoreState>((set, getState) => ({
  messages: [],

  setMessages: (messages) => set({ messages }),

  sendMessage: async (userId, message, contestId?) => {
    const current = getState().messages;
    set({ messages: [message, ...current] });
    await addChat(userId, message.text, contestId);
  },
}));
