"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useUserStore } from "@/store/useUserStore";
import { brandCampaigns, type BrandCampaignListItem } from "@/mock/brand-campaigns";

type InfCampaignItem = {
  id: string;
  name: string;
  brand: string;
  budgetMin: number;
  budgetMax: number;
  platform: "TikTok" | "Instagram" | "YouTube";
  contentType: "Video" | "Post" | "Story";
  goal: "Awareness" | "Conversion" | "Engagement";
  deadline: string;
};

const infCampaigns: InfCampaignItem[] = [
  {
    id: "summer-skincare",
    name: "Summer Skincare Awareness Campaign",
    brand: "GlowLab",
    budgetMin: 8000,
    budgetMax: 10000,
    platform: "TikTok",
    contentType: "Video",
    goal: "Awareness",
    deadline: "2026-05-30"
  },
  {
    id: "fit-snack",
    name: "Healthy Snack Challenge",
    brand: "FitBites",
    budgetMin: 5000,
    budgetMax: 7000,
    platform: "Instagram",
    contentType: "Story",
    goal: "Engagement",
    deadline: "2026-06-10"
  },
  {
    id: "tech-drop",
    name: "Creator Tech Unbox",
    brand: "NeoGear",
    budgetMin: 9000,
    budgetMax: 12000,
    platform: "YouTube",
    contentType: "Video",
    goal: "Conversion",
    deadline: "2026-06-20"
  },
  {
    id: "travel-light",
    name: "Travel Light Essentials",
    brand: "Roamly",
    budgetMin: 6500,
    budgetMax: 9000,
    platform: "TikTok",
    contentType: "Post",
    goal: "Awareness",
    deadline: "2026-06-05"
  }
];

const infPlatforms = ["All", "TikTok", "Instagram", "YouTube"];
const contentTypes = ["All", "Video", "Post", "Story"];
const goals = ["All", "Awareness", "Conversion", "Engagement"];

const statusFilterOptions = ["All", "active", "pending", "completed"] as const;
const visibilityFilterOptions = ["All", "public", "private"] as const;

function BrandCampaignsView() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof statusFilterOptions)[number]>("All");
  const [visibility, setVisibility] = useState<(typeof visibilityFilterOptions)[number]>("All");

  const filtered = useMemo(
    () =>
      brandCampaigns.filter((c: BrandCampaignListItem) => {
        const passSearch =
          search.trim().length === 0 ||
          c.name.toLowerCase().includes(search.toLowerCase());
        const passStatus = status === "All" || c.status === status;
        const passVis = visibility === "All" || c.visibility === visibility;
        return passSearch && passStatus && passVis;
      }),
    [search, status, visibility]
  );

  const resetFilters = () => {
    setSearch("");
    setStatus("All");
    setVisibility("All");
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Campaigns</h1>
            <p className="mt-1 text-sm text-indigo-100">
              Public campaigns appear on the influencer marketplace; private campaigns use Discover to invite creators.
            </p>
            <div className="mt-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              {filtered.length} campaigns
            </div>
          </div>
          <Link
            href="/campaigns/create"
            className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50"
          >
            Create campaign
          </Link>
        </div>
      </div>

      <article className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Filter your campaigns</h2>
          <button type="button" onClick={resetFilters} className="text-xs font-semibold text-indigo-600 hover:underline">
            Reset
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-600">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Campaign name"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as (typeof statusFilterOptions)[number])}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            >
              {statusFilterOptions.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as (typeof visibilityFilterOptions)[number])}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            >
              {visibilityFilterOptions.map((v) => (
                <option key={v} value={v}>
                  {v === "All" ? "All" : v.charAt(0).toUpperCase() + v.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </article>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {filtered.map((c) => (
          <Link
            key={c.id}
            href={`/campaigns/${c.id}`}
            className="block rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold text-slate-900">{c.name}</h3>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  c.status === "active"
                    ? "bg-emerald-100 text-emerald-800"
                    : c.status === "pending"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-600"
                }`}
              >
                {c.status}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {c.visibility === "public" ? "Public" : "Private"}
              </span>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-800">{c.platform}</span>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              <li>
                Budget: THB {c.budget.toLocaleString()} · Spent: THB {c.spent.toLocaleString()}
              </li>
              <li>Deadline: {c.deadline}</li>
              <li>Influencers: {c.influencersJoined}</li>
            </ul>
            <p className="mt-3 text-sm font-medium text-indigo-600">View details →</p>
          </Link>
        ))}
        {filtered.length === 0 && (
          <article className="rounded-2xl bg-white p-8 text-center text-sm text-slate-600 shadow-sm md:col-span-2 2xl:col-span-3">
            No campaigns match. Try another filter.
          </article>
        )}
      </div>
    </section>
  );
}

function InfluencerDiscoverCampaignsView() {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("All");
  const [contentType, setContentType] = useState("All");
  const [goal, setGoal] = useState("All");
  const [minBudget, setMinBudget] = useState(0);
  const [maxBudget, setMaxBudget] = useState(0);

  const filtered = useMemo(
    () =>
      infCampaigns.filter((campaign) => {
        const passSearch =
          search.trim().length === 0 ||
          campaign.name.toLowerCase().includes(search.toLowerCase()) ||
          campaign.brand.toLowerCase().includes(search.toLowerCase());
        const passPlatform = platform === "All" || campaign.platform === platform;
        const passContentType = contentType === "All" || campaign.contentType === contentType;
        const passGoal = goal === "All" || campaign.goal === goal;
        const passMinBudget = minBudget <= 0 || campaign.budgetMax >= minBudget;
        const passMaxBudget = maxBudget <= 0 || campaign.budgetMin <= maxBudget;

        return passSearch && passPlatform && passContentType && passGoal && passMinBudget && passMaxBudget;
      }),
    [contentType, goal, maxBudget, minBudget, platform, search]
  );

  const resetFilters = () => {
    setSearch("");
    setPlatform("All");
    setContentType("All");
    setGoal("All");
    setMinBudget(0);
    setMaxBudget(0);
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold">Discover Campaigns</h1>
        <p className="mt-1 text-sm text-indigo-100">
          Find the best-fit collaborations with fast filters and clear budget visibility.
        </p>
        <div className="mt-4 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
          {filtered.length} campaigns matched
        </div>
      </div>

      <article className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Campaign Filters</h2>
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            Reset all
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-600">Search</label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Campaign or brand"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600">Platform</label>
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            >
              {infPlatforms.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600">Content Type</label>
            <select
              value={contentType}
              onChange={(event) => setContentType(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            >
              {contentTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600">Campaign Goal</label>
            <select
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            >
              {goals.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600">Min Budget (THB)</label>
            <input
              type="number"
              min={0}
              value={minBudget}
              onChange={(event) => setMinBudget(Number(event.target.value) || 0)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600">Max Budget (THB)</label>
            <input
              type="number"
              min={0}
              value={maxBudget}
              onChange={(event) => setMaxBudget(Number(event.target.value) || 0)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </div>
        </div>
      </article>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[`Platform: ${platform}`, `Type: ${contentType}`, `Goal: ${goal}`].map((chip) => (
            <span key={chip} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
              {chip}
            </span>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((campaign) => (
            <article
              key={campaign.id}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{campaign.name}</h3>
                  <p className="text-sm text-slate-600">{campaign.brand}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {campaign.platform}
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                <li>
                  Budget: THB {campaign.budgetMin.toLocaleString()} - THB {campaign.budgetMax.toLocaleString()}
                </li>
                <li>Content: {campaign.contentType}</li>
                <li>Goal: {campaign.goal}</li>
                <li>Deadline: {campaign.deadline}</li>
              </ul>
              <div className="mt-4 flex gap-2">
                <button className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white">Apply</button>
                <Link
                  href={`/campaigns/${campaign.id}`}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700"
                >
                  View Details
                </Link>
              </div>
            </article>
          ))}
          {filtered.length === 0 && (
            <article className="rounded-2xl bg-white p-8 text-center text-sm text-slate-600 shadow-sm md:col-span-2 2xl:col-span-3">
              No campaigns match these filters. Try resetting filters.
            </article>
          )}
        </div>
      </div>
    </section>
  );
}

export default function CampaignsPage() {
  const { role } = useUserStore();
  if (role === "brand" || role === "agency") return <BrandCampaignsView />;
  return <InfluencerDiscoverCampaignsView />;
}
