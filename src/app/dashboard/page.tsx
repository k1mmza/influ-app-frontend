"use client";

import { BrandDashboard } from "@/components/brand-dashboard";
import { useUserStore } from "@/store/useUserStore";

function InfluencerDashboard() {
  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Influencer Dashboard</h1>
        <p className="mt-2 text-slate-600">Quick overview of campaigns, messages, and earnings.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Wallet Balance", "THB 12,500"],
          ["Active Campaigns", "4"],
          ["Pending Applications", "7"],
          ["Unread Messages", "3"]
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          </article>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">Find Campaigns</button>
        <button className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">View Messages</button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Recommended Campaigns</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["Summer Skincare Launch", "GlowLab", "THB 8,000", "TikTok", "30 May 2026"],
            ["Healthy Snack Challenge", "FitBites", "THB 6,500", "Instagram", "05 Jun 2026"]
          ].map(([name, brand, budget, platform, deadline]) => (
            <article key={name} className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
              <p className="mt-1 text-sm text-slate-600">{brand}</p>
              <div className="mt-3 grid gap-1 text-sm text-slate-600">
                <p>Budget: {budget}</p>
                <p>Platform: {platform}</p>
                <p>Deadline: {deadline}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white">Apply</button>
                <button className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">View Details</button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">My Campaigns</h3>
          <p className="mt-2 text-sm text-slate-600">Tabs: Active, Pending, Completed</p>
          <p className="mt-2 text-sm text-slate-600">Status: In Progress / Submitted / Approved</p>
          <div className="mt-4 flex gap-2">
            <button className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white">Submit Work</button>
            <button className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">View Brief</button>
          </div>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Messages</h3>
          <p className="mt-2 text-sm text-slate-600">Recent conversations with unread indicator.</p>
          <button className="mt-4 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white">Open Chat</button>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Earnings</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>Total earned: THB 58,200</li>
            <li>Pending payout: THB 12,500</li>
            <li>Last payment: 15 Apr 2026</li>
          </ul>
          <button className="mt-4 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">View Details</button>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Performance (MVP)</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>Engagement Rate: 4.8%</li>
            <li>Avg Views: 42,000</li>
            <li>Growth Rate: +9.2%</li>
          </ul>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Profile Strength</h3>
          <p className="mt-2 text-sm text-slate-600">Profile completeness: 78%</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
            <li>Add bio</li>
            <li>Connect platform</li>
            <li>Add portfolio</li>
          </ul>
          <button className="mt-4 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white">Edit Profile</button>
        </article>
      </div>

      <article className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          <li>New campaign invites</li>
          <li>Messages</li>
          <li>Payment updates</li>
        </ul>
      </article>
    </section>
  );
}

function AgencyDashboard() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Agency Dashboard</h1>
        <p className="mt-2 text-slate-600">High-level view of your portfolio and open work.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Active briefs", "8"],
          ["Creators assigned", "34"],
          ["Spend (MTD)", "THB 1.2M"],
          ["SLA on track", "96%"]
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:max-w-2xl">
        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Strategy assistant</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Recommend budget split by campaign objective</li>
            <li>Suggest platform mix per audience and KPI target</li>
            <li>Build week-by-week campaign structure plan</li>
          </ul>
        </article>
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const { role } = useUserStore();

  if (role === "brand") return <BrandDashboard />;
  if (role === "influencer") return <InfluencerDashboard />;
  return <AgencyDashboard />;
}
