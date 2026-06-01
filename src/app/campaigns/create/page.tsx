"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUserStore } from "@/store/useUserStore";

export default function CreateCampaignPage() {
  const router = useRouter();
  const { role } = useUserStore();
  const [name, setName] = useState("");
  const [objective, setObjective] = useState<"Awareness" | "Engagement" | "Conversion">("Awareness");
  const [budget, setBudget] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  if (role !== "brand") {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Create campaign</h1>
        <p className="text-slate-600">Only brand accounts can create campaigns.</p>
        <Link href="/campaigns" className="text-indigo-600 hover:underline">
          Back to campaigns
        </Link>
      </section>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/campaigns");
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/campaigns" className="text-sm font-medium text-indigo-600 hover:underline">
          ← Campaigns
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Create campaign</h1>
        <p className="mt-1 text-sm text-slate-600">Public campaigns appear in the influencer marketplace. Private ones stay invite-only via Discover.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            placeholder="e.g. Spring collection launch"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Objective</label>
          <select
            value={objective}
            onChange={(e) => setObjective(e.target.value as typeof objective)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          >
            <option value="Awareness">Awareness</option>
            <option value="Engagement">Engagement</option>
            <option value="Conversion">Conversion</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Budget (THB)</label>
          <input
            type="number"
            min={0}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Start</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">End / deadline</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Deliverables</label>
          <textarea
            value={deliverables}
            onChange={(e) => setDeliverables(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            placeholder="Posts, format, key messages, do/don't"
          />
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-slate-700">Visibility</legend>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-700">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="vis"
                checked={visibility === "public"}
                onChange={() => setVisibility("public")}
              />
              Public (listed for influencers)
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="vis"
                checked={visibility === "private"}
                onChange={() => setVisibility("private")}
              />
              Private (Discover invites only)
            </label>
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-2 pt-2">
          <button type="submit" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">
            Save campaign (demo)
          </button>
          <Link href="/campaigns" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
