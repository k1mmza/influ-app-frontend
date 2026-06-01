"use client";

import Link from "next/link";
import { brandCampaigns } from "@/mock/brand-campaigns";

const kpis = [
  { label: "Active Campaigns", value: "2" },
  { label: "Influencers Hired", value: "12" },
  { label: "Budget Spent (THB)", value: "1.18M" },
  { label: "Avg. Engagement", value: "4.6%" },
  { label: "Total Reach", value: "2.1M" }
];

export function BrandDashboard() {
  const active = brandCampaigns.filter((c) => c.status === "active");

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Brand Dashboard</h1>
        <p className="mt-2 text-slate-600">Quick overview of performance, spend, and active collaborations.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpis.map((item) => (
          <article key={item.label} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{item.label}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{item.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Campaign performance (MVP)</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Impressions (7d): 4.2M</li>
            <li>Views (7d): 890K</li>
            <li>Engagement (likes, comments, shares): 62K</li>
            <li>Conversions (tracked): 1,240</li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">Charts: line (trend) and bar (compare) — wireframe in production build.</p>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Active campaigns</h2>
          <ul className="mt-3 space-y-2">
            {active.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-sm">
                <span className="font-medium text-slate-900">{c.name}</span>
                <Link href={`/campaigns/${c.id}`} className="text-indigo-600 hover:underline">
                  Details
                </Link>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Discover</h2>
          <p className="mt-2 text-sm text-slate-600">Find creators for private campaigns.</p>
          <Link
            href="/discover"
            className="mt-3 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Open Discover
          </Link>
        </article>
        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Messages</h2>
          <p className="mt-2 text-sm text-slate-600">Chat with influencers and share briefs.</p>
          <Link
            href="/messages"
            className="mt-3 inline-flex rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Open Inbox
          </Link>
        </article>
        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Tracking</h2>
          <p className="mt-2 text-sm text-slate-600">Live post-level metrics and export.</p>
          <Link
            href="/tracking"
            className="mt-3 inline-flex rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            View Tracking
          </Link>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Budget &amp; payments</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>Total budget (active): THB 420,000</li>
            <li>Spent vs remaining: 62% / 38%</li>
            <li>Status: 9 invoices paid, 1 pending</li>
          </ul>
        </article>
        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
            <li>New application: Summer Skincare</li>
            <li>Content approved: Healthy Snack — Pat K.</li>
            <li>Unread messages: 2</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
