"use client";

import { Message } from "@/lib/types";
import { seedMessages } from "@/mock/messages";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ChatState {
  messages: Message[];
  sendMessage: (message: Message) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: seedMessages,
      sendMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] }))
    }),
    { name: "influapp-messages" }
  )
);
