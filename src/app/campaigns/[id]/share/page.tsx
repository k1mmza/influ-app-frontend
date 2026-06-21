"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getMainFollowerPlatform } from "@/lib/influencer-platforms";
import { brandCampaigns } from "@/mock/brand-campaigns";
import { useUserStore } from "@/store/useUserStore";
import { apiGetShortlist } from "@/lib/api";
import { Influencer } from "@/lib/types";

// TODO: The Shortlist schema has no campaignId field, so this page shows the user's FULL
// shortlist rather than a campaign-scoped list. If per-campaign shortlisting is needed,
// the Shortlist model should gain an optional campaignId column and this page should filter
// by the current campaign's id via GET /shortlist?campaignId=xxx.

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
    text: "Hi David — here is the shortlist for this campaign. Each row is ranked by fit to GlowLab's audience and your awareness goal. Let me know who you want to move forward with.",
    sentAtLabel: "Today · 9:12"
  },
  {
    id: "m2",
    side: "client",
    name: "David Kim",
    title: "Marketing Manager · D2C Brand (Beauty/Fashion)",
    text: "Thanks, Sarah. Let me know who you think is the strongest fit for our awareness goal.",
    sentAtLabel: "Today · 9:40"
  },
  {
    id: "m3",
    side: "agency",
    name: "Sarah Chen",
    title: "Senior Campaign Manager · Digital Marketing Agency",
    text: "Happy to walk you through each one. Let me know any questions on the picks below.",
    sentAtLabel: "Today · 9:55"
  }
];

export default function CampaignSharePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const campaign = brandCampaigns.find((c) => c.id === id);
  const { token } = useUserStore();
  const [messages, setMessages] = useState<ThreadMessage[]>(initialThread);
  const [clientDraft, setClientDraft] = useState("");
  const [agencyDraft, setAgencyDraft] = useState("");
  const [shortlistInfluencers, setShortlistInfluencers] = useState<Influencer[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    setMessages(initialThread);
    setClientDraft("");
    setAgencyDraft("");
  }, [id]);

  useEffect(() => {
    if (!token) { setLoadingList(false); return; }
    apiGetShortlist(token)
      .then((data) => setShortlistInfluencers(data))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, [token]);

  const rows = useMemo(
    () =>
      shortlistInfluencers.map((influencer, index) => {
        const platforms = influencer.platforms ?? [];
        const mainPlatform = platforms[0] ?? "Unknown";
        const mainFollowers = influencer.followersByPlatform?.[mainPlatform] ?? influencer.followers ?? 0;
        const handle = influencer.handleByPlatform?.[mainPlatform] ?? influencer.handle ?? influencer.name.toLowerCase().replace(/\s+/g, "");
        const host =
          mainPlatform === "youtube"
            ? "youtube.com"
            : mainPlatform === "tiktok"
              ? "tiktok.com"
              : mainPlatform === "instagram"
                ? "instagram.com"
                : `${mainPlatform}.com`;
        return {
          marker: index + 1,
          name: influencer.name,
          link: `https://www.${host}/@${handle.replace(/^@/, "")}`,
          mainPlatform: mainPlatform.charAt(0).toUpperCase() + mainPlatform.slice(1),
          mainFollowers,
          totalFollowers: influencer.followers,
          category: influencer.category,
          engagementRate: influencer.engagementRate,
          rate: influencer.ratePerPost,
        };
      }),
    [shortlistInfluencers],
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
        <h1 className="text-2xl font-bold text-foreground font-serif">Shared list unavailable</h1>
        <p className="text-muted-foreground">This link does not match a demo campaign.</p>
        <Link href="/campaigns" className="font-semibold text-primary hover:underline">
          Back to campaigns
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 p-4 pb-16 sm:p-6">
      <header className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Client-facing preview</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground font-serif">{campaign.name}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          This page simulates what a brand client sees when an agency shares a creator shortlist. The table shows your
          current saved shortlist. Heart creators on the{" "}
          <Link href="/discover" className="font-medium text-primary hover:underline">Discover page</Link>{" "}
          to populate this list.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-card px-2.5 py-1 font-medium text-foreground shadow-sm">Objective: {campaign.objective}</span>
          <span className="rounded-full bg-card px-2.5 py-1 font-medium text-foreground shadow-sm">Platform focus: {campaign.platform}</span>
          <span className="rounded-full bg-card px-2.5 py-1 font-medium text-foreground shadow-sm">
            Budget: THB {campaign.budget.toLocaleString()}
          </span>
        </div>
      </header>

      <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3 sm:px-6">
          <h2 className="text-lg font-semibold text-foreground font-serif">Influencer shortlist</h2>
          <p className="text-sm text-muted-foreground">
            {loadingList
              ? "Loading your shortlist…"
              : rows.length === 0
                ? "No influencers saved yet — heart creators on Discover to add them here."
                : "Primary platform = where the creator has the most followers."}
          </p>
        </div>
        {!loadingList && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
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
                  <tr key={row.name} className="border-t border-border">
                    <td className="px-4 py-2.5 text-muted-foreground sm:px-6">{row.marker}</td>
                    <td className="px-4 py-2.5 font-medium text-foreground sm:px-6">{row.name}</td>
                    <td className="px-4 py-2.5 text-primary sm:px-6">
                      <a href={row.link} className="hover:underline" target="_blank" rel="noreferrer">
                        {row.link}
                      </a>
                    </td>
                    <td className="px-4 py-2.5 text-foreground sm:px-6">{row.mainPlatform}</td>
                    <td className="px-4 py-2.5 text-foreground sm:px-6">{row.mainFollowers.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-foreground sm:px-6">{row.totalFollowers.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-foreground sm:px-6">{row.category}</td>
                    <td className="px-4 py-2.5 text-foreground sm:px-6">{row.engagementRate}%</td>
                    <td className="px-4 py-2.5 text-foreground sm:px-6">THB {row.rate.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {loadingList && (
          <div className="px-6 py-8 text-sm text-muted-foreground animate-pulse">Loading shortlist…</div>
        )}
        {!loadingList && rows.length === 0 && (
          <div className="px-6 py-8 text-center">
            <Link href="/discover" className="text-sm font-semibold text-primary hover:underline">
              Go to Discover →
            </Link>
          </div>
        )}
      </article>

      <article className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-foreground font-serif">Comments on this list</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Mock two-way thread: the client (David) can question or approve picks; the agency (Sarah) can respond — all
          stored in the browser for this demo only.
        </p>

        <ul className="mt-5 space-y-4">
          {messages.map((msg) => (
            <li
              key={msg.id}
              className={`rounded-xl border p-4 ${
                msg.side === "agency" ? "border-primary/10 bg-primary/5" : "border-emerald-100 bg-emerald-50/50"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">{msg.name}</p>
                  <p className="text-xs text-muted-foreground">{msg.title}</p>
                </div>
                <span className="text-xs text-muted-foreground">{msg.sentAtLabel}</span>
              </div>
              <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">{msg.text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 grid gap-6 border-t border-border pt-6 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-emerald-900">David Kim (client)</label>
            <p className="text-xs text-muted-foreground">Share concerns, budget notes, or who you want to book.</p>
            <textarea
              value={clientDraft}
              onChange={(e) => setClientDraft(e.target.value)}
              rows={4}
              placeholder="e.g. Can we prioritize creators with stronger TikTok saves?"
              className="mt-2 w-full rounded-xl border border-border px-3 py-2 text-sm"
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
            <label className="text-sm font-semibold text-primary-foreground">Sarah Chen (agency)</label>
            <p className="text-xs text-muted-foreground">Clarify strategy, swap names, or confirm next steps.</p>
            <textarea
              value={agencyDraft}
              onChange={(e) => setAgencyDraft(e.target.value)}
              rows={4}
              placeholder="e.g. Swapping Ethan for Aria — same budget band, stronger lifestyle fit."
              className="mt-2 w-full rounded-xl border border-border px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => pushMessage("agency", agencyDraft, () => setAgencyDraft(""))}
              className="mt-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
            >
              Post as agency
            </button>
          </div>
        </div>
      </article>

      <p className="text-center text-xs text-muted-foreground">
        Comments are stored in-browser only. In production, comments would be saved per share link.
      </p>
    </section>
  );
}
