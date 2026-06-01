"use client";

import { ProcessOfWorkPanel, WorkStatusDot, WorkStatusIndicator, type WorkPhase } from "@/components/messages/process-of-work-panel";
import { useUserStore } from "@/store/useUserStore";

const influencerConversations: {
  brand: string;
  campaign: string;
  preview: string;
  time: string;
  unread: boolean;
  phase: WorkPhase;
}[] = [
  { brand: "GlowLab", campaign: "Summer Skincare", preview: "Need your draft by Friday", time: "2m", unread: true, phase: "draft" },
  { brand: "FitBites", campaign: "Snack Challenge", preview: "Looks good, please revise CTA", time: "1h", unread: true, phase: "work" },
  { brand: "Roamly", campaign: "Travel Light", preview: "Payment completed", time: "Yesterday", unread: false, phase: "payment" },
];

const brandConversations: {
  name: string;
  campaign: string;
  preview: string;
  time: string;
  unread: boolean;
  phase: WorkPhase;
}[] = [
  { name: "Lina Park", campaign: "Summer Skincare", preview: "Uploading draft tomorrow AM", time: "5m", unread: true, phase: "draft" },
  { name: "Pat K.", campaign: "Healthy Snack", preview: "CTA line updated in caption", time: "32m", unread: true, phase: "brief" },
  { name: "Nina V.", campaign: "Travel Light", preview: "Thanks—closing this thread", time: "2d", unread: false, phase: "payment" },
];

function InfluencerMessagesView() {
  const openPhase: WorkPhase = "draft";

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="mt-1 text-sm text-indigo-100">Manage active conversations, files, and campaign workflow in one place.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Conversations</h2>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">3 unread</span>
          </div>
          <input
            placeholder="Search brand or campaign"
            className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <div className="mt-3 flex gap-2 text-xs">
            <span className="rounded-full bg-slate-900 px-2 py-1 font-semibold text-white">All</span>
            <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">Unread</span>
            <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">Active</span>
          </div>

          <div className="mt-4 space-y-2">
            {influencerConversations.map(({ brand, campaign, preview, time, unread, phase }) => (
              <div key={`${brand}-${campaign}`} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-indigo-950">{brand}</p>
                    <p className="text-xs text-slate-500">{campaign}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{time}</span>
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-slate-600">{preview}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <WorkStatusDot phase={phase} />
                  {unread ? <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">New</span> : null}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <article className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">GlowLab</p>
                  <p className="text-xs text-slate-500">Summer Skincare Campaign</p>
                </div>
                <WorkStatusIndicator phase={openPhase} className="hidden sm:inline-flex" />
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <WorkStatusIndicator phase={openPhase} className="sm:hidden" />
                <span className="text-xs text-emerald-600">Online</span>
              </div>
            </div>
            <div className="mt-4">
              <ProcessOfWorkPanel variant="influencer" currentPhase={openPhase} />
            </div>
          </div>

          <div className="space-y-3 py-4">
            <p className="text-center text-xs text-slate-400">Today</p>

            <div className="w-fit max-w-[80%] rounded-2xl rounded-tl-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
              Hi Lina, can you submit the first draft by Friday 5 PM?
              <p className="mt-1 text-[11px] text-slate-400">10:04</p>
            </div>

            <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-tr-md bg-indigo-600 px-3 py-2 text-sm text-white">
              Sure! I&apos;ll send the TikTok draft tomorrow for early review.
              <p className="mt-1 text-[11px] text-indigo-200">10:07 • Seen</p>
            </div>

            <div className="w-fit max-w-[80%] rounded-2xl rounded-tl-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
              Great. I&apos;ve attached the updated brief and do/don&apos;t list.
              <p className="mt-1 text-[11px] text-slate-400">10:08</p>
            </div>

            <div className="w-fit max-w-[70%] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              📎 Updated_Brief_v2.pdf
              <p className="text-[11px] text-slate-500">PDF • 1.2 MB</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
            <input placeholder="Type your message..." className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Send</button>
          </div>
        </article>
      </div>
    </section>
  );
}

function BrandMessagesView() {
  const openPhase: WorkPhase = "draft";

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="mt-1 text-sm text-indigo-100">Chat with influencers, filter by campaign, and keep briefs in context.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Conversations</h2>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">2 unread</span>
          </div>
          <input
            placeholder="Search influencer or campaign"
            className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <div className="mt-3 flex gap-2 text-xs">
            <span className="rounded-full bg-slate-900 px-2 py-1 font-semibold text-white">All</span>
            <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">Unread</span>
            <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">Active</span>
          </div>

          <div className="mt-4 space-y-2">
            {brandConversations.map(({ name, campaign, preview, time, unread, phase }) => (
              <div key={`${name}-${campaign}`} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-indigo-950">{name}</p>
                    <p className="text-xs text-slate-500">{campaign}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{time}</span>
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-slate-600">{preview}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <WorkStatusDot phase={phase} />
                  {unread ? <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">New</span> : null}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <article className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">Lina Park</p>
                  <p className="text-xs text-slate-500">Summer Skincare Campaign</p>
                </div>
                <WorkStatusIndicator phase={openPhase} className="hidden sm:inline-flex" />
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <WorkStatusIndicator phase={openPhase} className="sm:hidden" />
                <span className="text-xs text-emerald-600">Active</span>
              </div>
            </div>
            <div className="mt-4">
              <ProcessOfWorkPanel variant="brand" currentPhase={openPhase} />
            </div>
          </div>

          <div className="space-y-3 py-4">
            <p className="text-center text-xs text-slate-400">Today</p>

            <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-tr-md bg-indigo-600 px-3 py-2 text-sm text-white">
              Hi Lina, can you submit the first draft by Friday 5 PM?
              <p className="mt-1 text-[11px] text-indigo-200">10:04</p>
            </div>

            <div className="w-fit max-w-[80%] rounded-2xl rounded-tl-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
              Yes—sending the TikTok draft tomorrow morning for your review.
              <p className="mt-1 text-[11px] text-slate-400">10:07</p>
            </div>

            <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-tr-md bg-indigo-600 px-3 py-2 text-sm text-white">
              Attached: updated brief + do/don&apos;t list. Ping me if anything is unclear.
              <p className="mt-1 text-[11px] text-indigo-200">10:10</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
            <input placeholder="Type a message to influencer…" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Send</button>
          </div>
        </article>
      </div>
    </section>
  );
}

export default function MessagesPage() {
  const { role } = useUserStore();
  if (role === "brand" || role === "agency") return <BrandMessagesView />;
  return <InfluencerMessagesView />;
}
