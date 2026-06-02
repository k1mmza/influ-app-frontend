"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useEffect } from "react";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { brandCampaigns, trackingByCampaign } from "@/mock/brand-campaigns";
import { exportRowsToExcel } from "@/lib/excel";

function TrackingPageContent() {
  const { role } = useUserStore();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState("");

  const selectedCampaign = useMemo(
    () => (selectedId ? brandCampaigns.find((c) => c.id === selectedId) : null),
    [selectedId]
  );
  const detailRows = selectedId ? trackingByCampaign[selectedId] ?? [] : [];

  useEffect(() => {
    const campaignFromQuery = searchParams.get("campaign");
    if (!campaignFromQuery) return;
    const exists = brandCampaigns.some((campaign) => campaign.id === campaignFromQuery);
    if (exists) {
      setSelectedId(campaignFromQuery);
    }
  }, [searchParams]);

  if (role !== "brand" && role !== "agency") {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Tracking</h1>
        <p className="text-slate-600">Live campaign metrics are available for brand accounts.</p>
        <Link href="/dashboard" className="text-primary hover:underline">
          Back to dashboard
        </Link>
      </section>
    );
  }

  const shareTrackingLink = async () => {
    if (!selectedId || typeof window === "undefined") return;
    const detailUrl = `${window.location.origin}/tracking?campaign=${selectedId}`;
    try {
      await navigator.clipboard.writeText(detailUrl);
      setShareMessage("Tracking detail link copied.");
    } catch {
      setShareMessage("Unable to copy automatically. Please copy from browser URL.");
    }
  };

  const exportExcel = () => {
    if (!selectedId || detailRows.length === 0) return;
    exportRowsToExcel({
      filename: `tracking-${selectedId}.xls`,
      sheetName: "Tracking Detail",
      headers: ["Campaign", "Influencer", "Content", "Type", "Views", "Likes", "Comments", "Shares", "ER%", "Growth%"],
      rows: detailRows.map((r) => [
        selectedCampaign?.name ?? "",
        r.influencerName,
        r.contentLabel,
        r.contentType,
        r.views,
        r.likes,
        r.comments,
        r.shares,
        r.engagementRate,
        r.growthRate
      ])
    });
    setShareMessage("Tracking result exported to Excel.");
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-primary to-secondary p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold">Tracking</h1>
        <p className="mt-1 text-sm text-primary/10">Realtime-style results for published work (demo data).</p>
      </div>

      <article className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-900">All campaigns</h2>
          <p className="text-xs text-slate-500">Click &quot;View detail&quot; to see influencer-level breakdown.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 font-medium">Campaign</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Views (sum)</th>
                <th className="px-4 py-2 font-medium">ER avg</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {brandCampaigns.map((c) => {
                const rows = trackingByCampaign[c.id] ?? [];
                const views = rows.reduce((s, r) => s + r.views, 0);
                const er =
                  rows.length > 0 ? rows.reduce((s, r) => s + r.engagementRate, 0) / rows.length : 0;
                return (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-medium text-slate-900">{c.name}</td>
                    <td className="px-4 py-2 text-slate-600">{c.status}</td>
                    <td className="px-4 py-2 text-slate-600">{views > 0 ? views.toLocaleString() : "—"}</td>
                    <td className="px-4 py-2 text-slate-600">{rows.length ? `${er.toFixed(1)}%` : "—"}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedId(c.id)}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        View detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>

      {selectedCampaign && (
        <article className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Detail: {selectedCampaign.name}</h2>
              <p className="text-xs text-slate-500">Per influencer: posts, metrics, and growth (demo).</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={shareTrackingLink}
                disabled={detailRows.length === 0}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Share link
              </button>
              <button
                type="button"
                onClick={exportExcel}
                disabled={detailRows.length === 0}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Export Excel
              </button>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700"
              >
                Clear
              </button>
            </div>
          </div>
          {shareMessage ? <p className="px-4 pt-3 text-xs font-medium text-emerald-700">{shareMessage}</p> : null}
          {detailRows.length === 0 ? (
            <p className="p-4 text-sm text-slate-600">No live rows for this campaign yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-2 font-medium">Influencer</th>
                    <th className="px-4 py-2 font-medium">Work</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium">Views</th>
                    <th className="px-4 py-2 font-medium">ER%</th>
                    <th className="px-4 py-2 font-medium">Growth%</th>
                  </tr>
                </thead>
                <tbody>
                  {detailRows.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="px-4 py-2 font-medium text-slate-900">{r.influencerName}</td>
                      <td className="px-4 py-2 text-slate-600">{r.contentLabel}</td>
                      <td className="px-4 py-2 text-slate-600 capitalize">{r.contentType}</td>
                      <td className="px-4 py-2 text-slate-600">{r.views.toLocaleString()}</td>
                      <td className="px-4 py-2 text-slate-600">{r.engagementRate}%</td>
                      <td className="px-4 py-2 text-emerald-600">+{r.growthRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      )}
    </section>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<section className="space-y-4 text-slate-600">Loading tracking data...</section>}>
      <TrackingPageContent />
    </Suspense>
  );
}
