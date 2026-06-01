"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getMainFollowerPlatform } from "@/lib/influencer-platforms";
import { brandCampaigns } from "@/mock/brand-campaigns";
import { influencers } from "@/mock/influencers";

type ThreadSide = "agency" | "client";

type ThreadMessage = {
  id: string;
  side: ThreadSide;
  name: string;
  title: string;
  text: string;
  sentAtLabel: string;
};

const initialThread: ThreadMessage[] = [
  {
    id: "m1",
    side: "agency",
    name: "Sarah Chen",
    title: "Senior Campaign Manager · Digital Marketing Agency",
    text: "Hi David — here is the shortlist for this campaign. Each row is ranked by fit to GlowLab’s audience and your awareness goal. Let me know who you want to move forward with.",
    sentAtLabel: "Today · 9:12"
  },
  {
    id: "m2",
    side: "client",
    name: "David Kim",
    title: "Marketing Manager · D2C Brand (Beauty/Fashion)",
    text: "Thanks, Sarah. Mia Lopez and Nora Diaz feel closest to our brand tone. I’m unsure about Ethan Brooks — strong reach but engagement looks lower; is he still worth a test?",
    sentAtLabel: "Today · 9:40"
  },
  {
    id: "m3",
    side: "agency",
    name: "Sarah Chen",
    title: "Senior Campaign Manager · Digital Marketing Agency",
    text: "Good eye. Ethan’s audience skews tech-heavy; I’d keep him optional unless we widen to gadget-curious beauty shoppers. I can swap in Aria Chen if you want more lifestyle overlap.",
    sentAtLabel: "Today · 9:55"
  }
];

export default function CampaignSharePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const campaign = brandCampaigns.find((c) => c.id === id);
  const [messages, setMessages] = useState<ThreadMessage[]>(initialThread);
  const [clientDraft, setClientDraft] = useState("");
  const [agencyDraft, setAgencyDraft] = useState("");

  useEffect(() => {
    setMessages(initialThread);
    setClientDraft("");
    setAgencyDraft("");
  }, [id]);

  const rows = useMemo(
    () =>
      influencers.map((influencer, index) => {
        const main = getMainFollowerPlatform(influencer);
        const handle = influencer.name.toLowerCase().replace(/\s+/g, "");
        const host =
          main.platform === "YouTube"
            ? "youtube.com"
            : main.platform === "TikTok"
              ? "tiktok.com"
              : main.platform === "Instagram"
                ? "instagram.com"
                : `${main.platform.toLowerCase()}.com`;
        return {
          marker: index + 1,
          name: influencer.name,
          link: `https://www.${host}/@${handle}`,
          mainPlatform: main.platform,
          mainFollowers: main.followers,
          totalFollowers: influencer.followers,
          category: influencer.category,
          engagementRate: influencer.engagementRate,
          rate: influencer.ratePerPost
        };
      }),
    []
  );

  const pushMessage = (side: ThreadSide, text: string, clear: () => void) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const next: ThreadMessage = {
      id: `local-${Date.now()}`,
      side,
      name: side === "agency" ? "Sarah Chen" : "David Kim",
      title:
        side === "agency"
          ? "Senior Campaign Manager · Digital Marketing Agency"
          : "Marketing Manager · D2C Brand (Beauty/Fashion)",
      text: trimmed,
      sentAtLabel: "Just now"
    };
    setMessages((prev) => [...prev, next]);
    clear();
  };

  if (!campaign) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="text-2xl font-bold text-slate-900">Shared list unavailable</h1>
        <p className="text-slate-600">This link does not match a demo campaign.</p>
        <Link href="/campaigns" className="font-semibold text-indigo-600 hover:underline">
          Back to campaigns
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 p-4 pb-16 sm:p-6">
      <header className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Client-facing preview (mock)</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{campaign.name}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          This page simulates what a brand client sees when an agency shares a creator shortlist — inspired by the agency
          and brand personas in{" "}
          <span className="font-medium text-slate-800">resources/personas.md</span> (Sarah Chen presenting to David
          Kim). The table is read-only; use the thread below for two-way feedback on the list.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-700 shadow-sm">Objective: {campaign.objective}</span>
          <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-700 shadow-sm">Platform focus: {campaign.platform}</span>
          <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-700 shadow-sm">
            Budget: THB {campaign.budget.toLocaleString()}
          </span>
        </div>
      </header>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900">Influencer shortlist</h2>
          <p className="text-sm text-slate-500">Primary platform = where the creator has the most followers.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 font-medium sm:px-6">#</th>
                <th className="px-4 py-2 font-medium sm:px-6">Creator</th>
                <th className="px-4 py-2 font-medium sm:px-6">Profile</th>
                <th className="px-4 py-2 font-medium sm:px-6">Main platform</th>
                <th className="px-4 py-2 font-medium sm:px-6">Main followers</th>
                <th className="px-4 py-2 font-medium sm:px-6">Total reach</th>
                <th className="px-4 py-2 font-medium sm:px-6">Niche</th>
                <th className="px-4 py-2 font-medium sm:px-6">ER</th>
                <th className="px-4 py-2 font-medium sm:px-6">Est. rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 text-slate-600 sm:px-6">{row.marker}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900 sm:px-6">{row.name}</td>
                  <td className="px-4 py-2.5 text-indigo-600 sm:px-6">
                    <a href={row.link} className="hover:underline" target="_blank" rel="noreferrer">
                      {row.link}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 text-slate-700 sm:px-6">{row.mainPlatform}</td>
                  <td className="px-4 py-2.5 text-slate-700 sm:px-6">{row.mainFollowers.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-slate-700 sm:px-6">{row.totalFollowers.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-slate-700 sm:px-6">{row.category}</td>
                  <td className="px-4 py-2.5 text-slate-700 sm:px-6">{row.engagementRate}%</td>
                  <td className="px-4 py-2.5 text-slate-700 sm:px-6">THB {row.rate.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Comments on this list</h2>
        <p className="mt-1 text-sm text-slate-600">
          Mock two-way thread: the client (David) can question or approve picks; the agency (Sarah) can respond — all
          stored in the browser for this demo only.
        </p>

        <ul className="mt-5 space-y-4">
          {messages.map((msg) => (
            <li
              key={msg.id}
              className={`rounded-xl border p-4 ${
                msg.side === "agency" ? "border-indigo-100 bg-indigo-50/60" : "border-emerald-100 bg-emerald-50/50"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{msg.name}</p>
                  <p className="text-xs text-slate-600">{msg.title}</p>
                </div>
                <span className="text-xs text-slate-500">{msg.sentAtLabel}</span>
              </div>
              <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">{msg.text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 grid gap-6 border-t border-slate-100 pt-6 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-emerald-900">David Kim (client)</label>
            <p className="text-xs text-slate-500">Share concerns, budget notes, or who you want to book.</p>
            <textarea
              value={clientDraft}
              onChange={(e) => setClientDraft(e.target.value)}
              rows={4}
              placeholder="e.g. Can we prioritize creators with stronger TikTok saves?"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => pushMessage("client", clientDraft, () => setClientDraft(""))}
              className="mt-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Post as client
            </button>
          </div>
          <div>
            <label className="text-sm font-semibold text-indigo-900">Sarah Chen (agency)</label>
            <p className="text-xs text-slate-500">Clarify strategy, swap names, or confirm next steps.</p>
            <textarea
              value={agencyDraft}
              onChange={(e) => setAgencyDraft(e.target.value)}
              rows={4}
              placeholder="e.g. Swapping Ethan for Aria — same budget band, stronger lifestyle fit."
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => pushMessage("agency", agencyDraft, () => setAgencyDraft(""))}
              className="mt-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Post as agency
            </button>
          </div>
        </div>
      </article>

      <p className="text-center text-xs text-slate-500">
        This is a static UI mock. In production, comments would be saved per share link and visible to both sides.
      </p>
    </section>
  );
}
