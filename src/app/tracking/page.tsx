"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useEffect } from "react";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import {
  apiGetTracking,
  apiGetTrackingDetail,
  type TrackingSummaryRow,
  type TrackingDetailRow,
} from "@/lib/api";
import { exportRowsToExcel } from "@/lib/excel";

// "TikTok — video" style label; falls back gracefully when platform/type unknown.
function contentLabel(row: TrackingDetailRow): string {
  return [row.platform, row.contentType].filter(Boolean).join(" — ") || "Content";
}

function TrackingPageContent() {
  const { role, token } = useUserStore();
  const searchParams = useSearchParams();
  const [campaigns, setCampaigns] = useState<TrackingSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailRows, setDetailRows] = useState<TrackingDetailRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  const selectedCampaign = useMemo(
    () => (selectedId ? campaigns.find((c) => c.id === selectedId) : null),
    [selectedId, campaigns]
  );

  const isBrandSide = role === "brand" || role === "agency";

  useEffect(() => {
    if (!token || !isBrandSide) return;
    setLoading(true);
    apiGetTracking(token)
      .then((rows) => {
        setCampaigns(rows);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, isBrandSide]);

  // Preselect from ?campaign= once campaigns are loaded.
  useEffect(() => {
    const campaignFromQuery = searchParams.get("campaign");
    if (campaignFromQuery && campaigns.some((c) => c.id === campaignFromQuery)) {
      setSelectedId(campaignFromQuery);
    }
  }, [searchParams, campaigns]);

  // Load detail rows whenever the selected campaign changes.
  useEffect(() => {
    if (!selectedId || !token) {
      setDetailRows([]);
      return;
    }
    setDetailLoading(true);
    setShareMessage("");
    apiGetTrackingDetail(token, selectedId)
      .then(setDetailRows)
      .catch((e) => setError(e.message))
      .finally(() => setDetailLoading(false));
  }, [selectedId, token]);

  if (!isBrandSide) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground font-serif">Tracking</h1>
        <p className="text-muted-foreground">Live campaign metrics are available for brand accounts.</p>
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
        contentLabel(r),
        r.contentType ?? "",
        r.views,
        r.likes,
        r.comments,
        r.shares,
        r.engagementRate,
        r.growthRate
      ])
    });
    setShareMessage("Tracking result exported as CSV (opens in Excel & Numbers).");
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-[#166534] to-[#052e16] p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold font-serif">Tracking</h1>
        <p className="mt-1 text-sm text-white/70">Realtime-style results for published work.</p>
      </div>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <article className="overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold text-foreground font-serif">All campaigns</h2>
          <p className="text-xs text-muted-foreground">Click &quot;View detail&quot; to see influencer-level breakdown.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Campaign</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Views (sum)</th>
                <th className="px-4 py-2 font-medium">ER avg</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-3 text-muted-foreground" colSpan={5}>Loading tracking data...</td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td className="px-4 py-3 text-muted-foreground" colSpan={5}>No campaigns yet.</td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-4 py-2 font-medium text-foreground">{c.name}</td>
                    <td className="px-4 py-2 text-muted-foreground capitalize">{c.status.toLowerCase()}</td>
                    <td className="px-4 py-2 text-muted-foreground">{c.totalViews > 0 ? c.totalViews.toLocaleString() : "—"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{c.influencerCount ? `${c.avgEngagementRate.toFixed(1)}%` : "—"}</td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>

      {selectedCampaign && (
        <article className="overflow-hidden rounded-2xl bg-card shadow-sm">
          <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground font-serif">Detail: {selectedCampaign.name}</h2>
              <p className="text-xs text-muted-foreground">Per influencer: posts, metrics, and growth.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={shareTrackingLink}
                disabled={detailRows.length === 0}
                className="rounded-lg bg-muted px-3 py-1.5 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                Share link
              </button>
              <button
                type="button"
                onClick={exportExcel}
                disabled={detailRows.length === 0}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded-lg bg-muted px-3 py-1.5 text-sm font-semibold text-foreground"
              >
                Clear
              </button>
            </div>
          </div>
          {shareMessage ? <p className="px-4 pt-3 text-xs font-medium text-emerald-700">{shareMessage}</p> : null}
          {detailLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading detail...</p>
          ) : detailRows.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No live rows for this campaign yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-muted text-muted-foreground">
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
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-4 py-2 font-medium text-foreground">{r.influencerName}</td>
                      <td className="px-4 py-2">
                        {r.contentUrl ? (
                          <a
                            href={r.contentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                            title={r.contentUrl}
                          >
                            {contentLabel(r)}
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">{contentLabel(r)}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground capitalize">{r.contentType ?? "—"}</td>
                      <td className="px-4 py-2 text-muted-foreground">{r.views.toLocaleString()}</td>
                      <td className="px-4 py-2 text-muted-foreground">{r.engagementRate}%</td>
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
    <Suspense fallback={<section className="space-y-4 text-muted-foreground">Loading tracking data...</section>}>
      <TrackingPageContent />
    </Suspense>
  );
}
