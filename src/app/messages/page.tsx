"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ProcessOfWorkPanel, WorkStatusDot, WorkStatusIndicator, type WorkPhase } from "@/components/messages/process-of-work-panel";
import { useUserStore } from "@/store/useUserStore";
import {
  apiGetConversations,
  apiGetMessages,
  apiSendMessage,
  apiUpdateConversationPhase,
  apiMarkConversationRead,
} from "@/lib/api";
import { Loader2, Send } from "lucide-react";

function MessagesView({ role }: { role: string }) {
  const { token, name: currentUserName } = useUserStore();
  const searchParams = useSearchParams();
  const convIdFromUrl = searchParams.get("convId");

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchConversations() {
      if (!token) return;
      try {
        setLoadingConv(true);
        const data = await apiGetConversations(token);
        setConversations(data);
        // Pre-select from URL param, else first conversation
        const initialId = convIdFromUrl ?? (data.length > 0 ? data[0].id : null);
        setActiveConvId(initialId);
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
      } finally {
        setLoadingConv(false);
      }
    }
    fetchConversations();
  }, [token, convIdFromUrl]);

  const selectConversation = useCallback(
    async (id: string) => {
      setActiveConvId(id);
      // Mark as read when opening
      if (token) apiMarkConversationRead(token, id).catch(() => {});
      // Clear unread badge optimistically
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
      );
    },
    [token]
  );

  useEffect(() => {
    async function fetchMessages() {
      if (!token || !activeConvId) return;
      try {
        setLoadingMessages(true);
        const data = await apiGetMessages(token, activeConvId);
        setMessages(data);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    }
    fetchMessages();
  }, [token, activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !activeConvId || !newMessage.trim()) return;

    try {
      const sent = await apiSendMessage(token, activeConvId, newMessage);
      setMessages((prev) => [
        ...prev,
        { ...sent, sender: { name: currentUserName } },
      ]);
      setNewMessage("");
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? { ...c, lastMessage: newMessage, lastMessageAt: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handlePhaseChange = async (phase: WorkPhase) => {
    if (!token || !activeConvId) return;
    try {
      await apiUpdateConversationPhase(token, activeConvId, phase);
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? { ...c, workPhase: phase } : c))
      );
    } catch (err) {
      console.error("Failed to update phase:", err);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.partnerName?.toLowerCase().includes(q) ||
      c.campaignName?.toLowerCase().includes(q) ||
      c.lastMessage?.toLowerCase().includes(q)
    );
  });

  if (loadingConv) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-primary to-secondary p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold font-serif">Messages</h1>
        <p className="mt-1 text-sm text-white/70">Manage active conversations, files, and campaign workflow in one place.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
        {/* Conversation list */}
        <aside className="rounded-2xl bg-card p-4 shadow-sm h-[600px] flex flex-col">
          <h2 className="text-lg font-semibold text-foreground font-serif">Conversations</h2>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${role === "influencer" ? "brand" : "influencer"}`}
            className="mt-3 w-full rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />

          <div className="mt-4 space-y-2 overflow-y-auto flex-1">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`rounded-xl border p-3 shadow-sm cursor-pointer transition-all ${
                  activeConvId === conv.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{conv.partnerName}</p>
                    <p className="text-xs text-muted-foreground truncate">{conv.campaignName}</p>
                  </div>
                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{conv.lastMessage}</p>
                <div className="mt-2">
                  <WorkStatusDot phase={conv.workPhase as WorkPhase} />
                </div>
              </div>
            ))}
            {filteredConversations.length === 0 && (
              <p className="text-center text-sm text-muted-foreground mt-10">
                {conversations.length === 0 ? "No conversations yet." : "No matches found."}
              </p>
            )}
          </div>
        </aside>

        {/* Chat window */}
        <article className="rounded-2xl bg-card p-4 shadow-sm h-[600px] flex flex-col">
          {activeConv ? (
            <>
              <div className="border-b border-border pb-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{activeConv.partnerName}</p>
                      <p className="text-xs text-muted-foreground">{activeConv.campaignName}</p>
                    </div>
                    <WorkStatusIndicator
                      phase={activeConv.workPhase as WorkPhase}
                      className="hidden sm:inline-flex"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <ProcessOfWorkPanel
                    variant={role === "influencer" ? "influencer" : "brand"}
                    currentPhase={activeConv.workPhase as WorkPhase}
                    onPhaseChange={handlePhaseChange}
                    linkedCampaign={
                      activeConv.campaignId
                        ? { id: activeConv.campaignId, name: activeConv.campaignName ?? "" }
                        : null
                    }
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4 px-2">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <p className="text-center text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                      Conversation started
                    </p>
                    {messages.map((msg) => {
                      const isMe = msg.sender?.name === currentUserName;
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          <div
                            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                              isMe
                                ? "rounded-tr-md bg-primary text-white"
                                : "rounded-tl-md bg-muted text-foreground"
                            }`}
                          >
                            {msg.content}
                            <p className={`mt-1 text-[10px] ${isMe ? "text-white/60" : "text-muted-foreground"}`}>
                              {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <form
                onSubmit={handleSendMessage}
                className="mt-3 flex items-center gap-2 border-t border-border pt-3 shrink-0"
              >
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  disabled={!newMessage.trim()}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select a conversation to start messaging
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

export default function MessagesPage() {
  const { role } = useUserStore();
  if (!role) return null;
  return (
    <Suspense>
      <MessagesView role={role} />
    </Suspense>
  );
}
