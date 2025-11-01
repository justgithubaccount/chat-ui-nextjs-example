import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Chat, Message } from "@/types/chat";

interface ChatStore {
  chats: Chat[];
  currentChatId: string | null;
  isLoading: boolean;
  isSidebarOpen: boolean;

  // Voice mode toggle (UI state only)
  voiceMode: boolean;

  // Actions
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  deleteChat: (chatId: string) => void;
  setCurrentChat: (chatId: string | null) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, content: string) => void;
  setLoading: (isLoading: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;

  // Voice UI toggle only
  setVoiceMode: (enabled: boolean) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      chats: [],
      currentChatId: null,
      isLoading: false,
      isSidebarOpen: true,
      voiceMode: false,

      setChats: (chats) => set({ chats }),

      addChat: (chat) =>
        set((state) => ({
          chats: [chat, ...state.chats],
          currentChatId: chat.id,
        })),

      updateChat: (chatId, updates) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId ? { ...chat, ...updates, updatedAt: new Date() } : chat
          ),
        })),

      deleteChat: (chatId) =>
        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== chatId),
          currentChatId: state.currentChatId === chatId ? null : state.currentChatId,
        })),

      setCurrentChat: (chatId) => set({ currentChatId: chatId }),

      addMessage: (chatId, message) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: [...(chat.messages || []), message],
                  updatedAt: new Date(),
                }
              : chat
          ),
        })),

      updateMessage: (chatId, messageId, content) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: (chat.messages || []).map((msg) =>
                    msg.id === messageId ? { ...msg, content } : msg
                  ),
                }
              : chat
          ),
        })),

      setLoading: (isLoading) => set({ isLoading }),

      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

      // Voice UI toggle
      setVoiceMode: (enabled) => set({ voiceMode: enabled }),
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({
        chats: state.chats,
        currentChatId: state.currentChatId,
        isSidebarOpen: state.isSidebarOpen,
        voiceMode: state.voiceMode,
      }),
    }
  )
);
