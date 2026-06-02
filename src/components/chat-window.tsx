"use client";

import { FormEvent, useState } from "react";
import { useChatStore } from "@/store/useChatStore";

export function ChatWindow() {
  const { messages, sendMessage } = useChatStore();
  const [input, setInput] = useState("");

  const onSend = (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;
    sendMessage({
      id: crypto.randomUUID(),
      from: "You",
      to: "Campaign Thread",
      text: input,
      sentAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    });
    setInput("");
  };

  return (
    <section className="rounded-2xl bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground font-serif">Deal Chat</h2>
      <div className="mt-4 h-72 space-y-3 overflow-y-auto rounded-xl bg-muted p-3">
        {messages.map((message) => (
          <div key={message.id} className="rounded-lg bg-card p-3">
            <p className="text-xs text-muted-foreground">
              {message.from} • {message.sentAt}
            </p>
            <p className="text-sm text-foreground">{message.text}</p>
          </div>
        ))}
      </div>
      <form onSubmit={onSend} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-xl border border-border px-3 py-2"
        />
        <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
          Send
        </button>
      </form>
    </section>
  );
}
