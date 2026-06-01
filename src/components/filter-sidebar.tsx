"use client";

import { useInfluencerStore } from "@/store/useInfluencerStore";

export function FilterSidebar() {
  const { category, minFollowers, setCategory, setMinFollowers } = useInfluencerStore();

  return (
    <aside className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
      <label className="mt-4 block text-sm font-medium text-slate-600">Category</label>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
      >
        <option value="All">All</option>
        <option value="Beauty">Beauty</option>
        <option value="Fashion">Fashion</option>
        <option value="Fitness">Fitness</option>
      </select>
      <label className="mt-4 block text-sm font-medium text-slate-600">Minimum followers</label>
      <input
        type="number"
        value={minFollowers}
        onChange={(e) => setMinFollowers(Number(e.target.value))}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
      />
    </aside>
  );
}
