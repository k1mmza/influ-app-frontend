"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState, type ComponentType } from "react";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Heart,
  Image as ImageIcon,
  LayoutGrid,
  Link2,
  Search,
  Share2,
  Table2,
  TrendingUp,
  Users,
  Video,
  X,
} from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import {
  apiGetTracking,
  apiGetTrackingDetail,
  type TrackingSummaryRow,
  type TrackingDetailRow,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { exportRowsToExcel } from "@/lib/excel";

// Travelogue theme: active/solid surfaces use the persimmon primary token
// (remapped by `.app-tv`); accents are `text-primary`.
const pageBtn = "bg-primary text-primary-foreground";
const pageAccent = "text-primary";
const CAMPAIGNS_PER_PAGE = 6;
type DetailViewMode = "card" | "table";

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function getInitials(name: string): string {
  return name
    .split(/[\s.]+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Decision: contentLabel has no source → derive from platform + contentType
 *  ("TikTok — video"), falling back gracefully. (Mirrors our prior helper.) */
function contentLabel(row: TrackingDetailRow): string {
  return [row.platform, row.contentType].filter(Boolean).join(" — ") || "Content";
}

function contentTypeIcon(type: string | null) {
  const t = (type ?? "").toLowerCase();
  if (t.includes("video")) return <Video className="h-4 w-4" />;
  if (t.includes("image") || t.includes("photo")) return <ImageIcon className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

/** coverImage has no source → travelogue slate→persimmon gradient placeholder
 *  (matches the campaign banner strips on the dashboard). */
function roleCoverGradient(_role: string | null | undefined): string {
  return "bg-gradient-to-br from-[#334155] via-[#3f4d5e] to-primary/60";
}

// Large editorial "paper-stack" stat card (Live Performance section). Sharp
// corners + offset double-shadow + slight tilt = the stacked-paper look from the
// Stitch design. `accent` swaps the number/overline/border tint per card.
type StatAccent = {
  text: string;
  border: string;
  iconBg: string;
};

function StatCard({
  overline,
  value,
  sub,
  note,
  icon: Icon,
  accent,
}: {
  overline: string;
  value: string;
  sub?: string;
  note?: string;
  icon: ComponentType<{ className?: string }>;
  accent: StatAccent;
}) {
  return (
    <div
      className={cn("relative rounded-sm border bg-card p-8 transition-transform hover:-translate-y-1", accent.border)}
      style={{ boxShadow: "2px 2px 0 rgba(0,0,0,0.05), 4px 4px 0 -1px hsl(var(--border))" }}
    >
      <div className="mb-6 flex items-start justify-between">
        <span className={cn("text-[11px] font-semibold uppercase tracking-[0.15em]", accent.text)}>{overline}</span>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", accent.iconBg)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="space-y-1">
        <span className={cn("block font-serif text-5xl font-bold leading-none tabular-nums lining-nums", accent.text)}>{value}</span>
        {sub ? (
          <div className="flex items-center gap-1 pt-2 text-xs font-semibold text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            {sub}
          </div>
        ) : null}
      </div>
      {note ? (
        <div className={cn("mt-8 border-t pt-4", accent.border)}>
          <p className="text-xs text-muted-foreground">{note}</p>
        </div>
      ) : null}
    </div>
  );
}

// Horizontal "journey" row (Active Journeys section) — tilted bordered thumbnail
// on the left, editorial title + a hero number on the right, then a row of
// border-left stat columns and the report button. Selecting a row opens the
// detail panel below.
function JourneyRow({
  campaign: c,
  role,
  isSelected,
  onSelect,
}: {
  campaign: TrackingSummaryRow;
  role: string | null | undefined;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const statusLower = (c.status ?? "").toLowerCase();
  return (
    <div className={cn("group relative flex flex-col border-b pb-8 md:flex-row", isSelected ? "border-primary" : "border-border")}>
      {/* Tilted, bordered cover — role-tinted gradient fallback. */}
      <div
        className={cn("relative mb-4 h-32 w-full shrink-0 overflow-hidden rounded-sm border border-border/40 md:mb-0 md:w-48", !c.coverImageUrl && roleCoverGradient(role))}
      >
        {c.coverImageUrl ? (
          <img
            src={c.coverImageUrl}
            alt={`${c.name} cover`}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : null}
        <span className="absolute right-2 top-2 bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight text-primary-foreground">
          {statusLower}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-center md:pl-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h4 className="mb-1 truncate font-serif text-xl font-semibold text-foreground">{c.name}</h4>
            <p className="mb-4 text-sm text-muted-foreground">
              {c.influencerCount} {c.influencerCount === 1 ? "creator" : "creators"} · Real-time tracking
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Total Views</span>
            <span className="font-serif text-xl font-semibold tabular-nums text-foreground">
              {c.totalViews > 0 ? formatCompact(c.totalViews) : "—"}
            </span>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="border-l border-border pl-4">
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Engagement</span>
            <p className="font-serif text-lg text-primary">{c.influencerCount ? `${c.avgEngagementRate.toFixed(1)}%` : "—"}</p>
          </div>
          <div className="border-l border-border pl-4">
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Creators</span>
            <p className="font-serif text-lg text-secondary">{c.influencerCount}</p>
          </div>
          <div className="border-l border-border pl-4">
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Status</span>
            <p className="font-serif text-lg capitalize text-foreground">{statusLower || "—"}</p>
          </div>
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onSelect}
              className={cn(
                "flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition-all active:scale-95",
                isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
              )}
            >
              <BarChart3 className="h-4 w-4" />
              {isSelected ? "Viewing" : "View Report"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricGauge({
  label,
  value,
  max,
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: number;
  max: number;
  icon: ComponentType<{ className?: string }>;
  colorClass?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const bar = colorClass ?? "bg-primary";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          <Icon className="h-3 w-3" />
          {label}
        </span>
        <span className="text-xs font-semibold tabular-nums text-foreground">
          {label === "ER" ? `${value}%` : formatCompact(value)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DetailViewToggle({
  mode,
  onChange,
  disabled,
}: {
  mode: DetailViewMode;
  onChange: (mode: DetailViewMode) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
      <button
        type="button"
        onClick={() => onChange("card")}
        disabled={disabled}
        title="Card view"
        aria-pressed={mode === "card"}
        className={cn(
          "rounded-md p-1.5 transition disabled:cursor-not-allowed disabled:opacity-40",
          mode === "card" ? cn(pageBtn, "shadow-sm") : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("table")}
        disabled={disabled}
        title="Table view"
        aria-pressed={mode === "table"}
        className={cn(
          "rounded-md p-1.5 transition disabled:cursor-not-allowed disabled:opacity-40",
          mode === "table" ? cn(pageBtn, "shadow-sm") : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Table2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function DetailInfluencerCard({
  row: r,
  maxViews,
  maxEr,
}: {
  row: TrackingDetailRow;
  maxViews: number;
  maxEr: number;
}) {
  return (
    <article className="rounded-xl border border-border bg-gradient-to-b from-card to-muted/40 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary text-xs font-bold text-white">
          {getInitials(r.influencerName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{r.influencerName}</p>
          <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
            {contentTypeIcon(r.contentType)}
            <span className="truncate">{contentLabel(r)}</span>
          </p>
        </div>
        <span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          <TrendingUp className="h-3 w-3" />
          +{r.growthRate}%
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        <MetricGauge label="Views" value={r.views} max={maxViews} icon={Eye} />
        <MetricGauge label="ER" value={r.engagementRate} max={maxEr} icon={Heart} colorClass="bg-rose-500" />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
          <Heart className="h-3 w-3 text-rose-400" />
          {formatCompact(r.likes)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
          <FileText className="h-3 w-3 text-muted-foreground" />
          {formatCompact(r.comments)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
          <Share2 className="h-3 w-3 text-sky-400" />
          {formatCompact(r.shares)}
        </span>
        {r.contentUrl ? (
          <a
            href={r.contentUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            View
          </a>
        ) : null}
      </div>
    </article>
  );
}

function DetailInfluencerTable({ rows }: { rows: TrackingDetailRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Influencer</th>
            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Content</th>
            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Type</th>
            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide tabular-nums">Views</th>
            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide tabular-nums">Likes</th>
            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide tabular-nums">Comments</th>
            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide tabular-nums">Shares</th>
            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">ER%</th>
            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Growth</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border hover:bg-muted/50">
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-container text-[10px] font-bold text-on-secondary-container">
                    {getInitials(r.influencerName)}
                  </div>
                  <span className="font-medium text-foreground">{r.influencerName}</span>
                </div>
              </td>
              <td className="max-w-[180px] truncate px-4 py-2.5 text-muted-foreground">
                {r.contentUrl ? (
                  <a href={r.contentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline" title={r.contentUrl}>
                    {contentLabel(r)} <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : (
                  contentLabel(r)
                )}
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">{contentTypeIcon(r.contentType)}</td>
              <td className="px-4 py-2.5 tabular-nums text-foreground">{formatCompact(r.views)}</td>
              <td className="px-4 py-2.5 tabular-nums text-foreground">{formatCompact(r.likes)}</td>
              <td className="px-4 py-2.5 tabular-nums text-foreground">{formatCompact(r.comments)}</td>
              <td className="px-4 py-2.5 tabular-nums text-foreground">{formatCompact(r.shares)}</td>
              <td className="px-4 py-2.5 tabular-nums font-medium text-foreground">{r.engagementRate}%</td>
              <td className="px-4 py-2.5 tabular-nums font-medium text-emerald-600 dark:text-emerald-400">+{r.growthRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
  const [campaignSearch, setCampaignSearch] = useState("");
  const [campaignPage, setCampaignPage] = useState(1);
  const [detailViewMode, setDetailViewMode] = useState<DetailViewMode>("card");

  const isBrandSide = role === "brand" || role === "agency";

  const selectedCampaign = useMemo(
    () => (selectedId ? campaigns.find((c) => c.id === selectedId) : null),
    [selectedId, campaigns]
  );

  // Two-call flow #1: summary list.
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

  // Preselect from ?campaign= once campaigns load.
  useEffect(() => {
    const fromQuery = searchParams.get("campaign");
    if (fromQuery && campaigns.some((c) => c.id === fromQuery)) setSelectedId(fromQuery);
  }, [searchParams, campaigns]);

  // Two-call flow #2: detail rows on demand for the selected campaign.
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

  // KPI strip from SUMMARY aggregates (precomputed; not recomputed from detail rows).
  const totals = useMemo(() => {
    const views = campaigns.reduce((s, c) => s + c.totalViews, 0);
    const creators = campaigns.reduce((s, c) => s + c.influencerCount, 0);
    const withEr = campaigns.filter((c) => c.influencerCount > 0);
    const avgEr = withEr.length ? withEr.reduce((s, c) => s + c.avgEngagementRate, 0) / withEr.length : 0;
    const active = campaigns.filter((c) => (c.status ?? "").toUpperCase() === "ACTIVE").length;
    return { views, creators, avgEr, active };
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    const q = campaignSearch.trim().toLowerCase();
    if (!q) return campaigns;
    return campaigns.filter((c) => [c.name, c.status].join(" ").toLowerCase().includes(q));
  }, [campaigns, campaignSearch]);

  const totalCampaignPages = Math.max(1, Math.ceil(filteredCampaigns.length / CAMPAIGNS_PER_PAGE));
  const paginatedCampaigns = useMemo(() => {
    const start = (campaignPage - 1) * CAMPAIGNS_PER_PAGE;
    return filteredCampaigns.slice(start, start + CAMPAIGNS_PER_PAGE);
  }, [filteredCampaigns, campaignPage]);

  useEffect(() => setCampaignPage(1), [campaignSearch]);
  useEffect(() => {
    if (campaignPage > totalCampaignPages) setCampaignPage(totalCampaignPages);
  }, [campaignPage, totalCampaignPages]);

  const maxDetailViews = useMemo(() => Math.max(...detailRows.map((r) => r.views), 1), [detailRows]);
  const maxDetailEr = useMemo(() => Math.max(...detailRows.map((r) => r.engagementRate), 1), [detailRows]);

  if (!isBrandSide) {
    return (
      <section className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground font-serif">Tracking</h1>
        <p className="text-muted-foreground">Live campaign metrics are available for brand accounts.</p>
        <Link href="/dashboard" className={cn("text-sm font-semibold hover:underline", pageAccent)}>
          ← Dashboard
        </Link>
      </section>
    );
  }

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
        r.growthRate,
      ]),
    });
    setShareMessage("Tracking result exported (opens in Excel & Numbers).");
  };

  // Detail panel for the selected campaign — rendered inline under its row.
  const renderDetailPanel = (c: TrackingSummaryRow) => (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <h2 className="truncate text-sm font-semibold text-foreground font-serif">{c.name}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {/* Entry point to the client-facing presentation report. */}
          <Link
            href={`/tracking/${c.id}`}
            title="Open client report"
            className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold hover:bg-primary/10", pageAccent)}
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Open report</span>
          </Link>
          <DetailViewToggle mode={detailViewMode} onChange={setDetailViewMode} disabled={detailRows.length === 0} />
          <button
            type="button"
            onClick={exportExcel}
            disabled={detailRows.length === 0}
            title="Export CSV"
            className={cn("rounded-lg p-2 hover:bg-primary/10 disabled:opacity-40", pageAccent)}
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            title="Close"
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {shareMessage ? (
        <div className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <Link2 className="h-3.5 w-3.5" />
          {shareMessage}
        </div>
      ) : null}

      {detailLoading ? (
        <p className="p-4 text-sm text-muted-foreground">Loading detail...</p>
      ) : detailRows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
          <BarChart3 className="h-10 w-10 opacity-40" />
          <p className="text-xs">No live rows for this campaign yet.</p>
        </div>
      ) : detailViewMode === "table" ? (
        <DetailInfluencerTable rows={detailRows} />
      ) : (
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {detailRows.map((r) => (
            <DetailInfluencerCard key={r.id} row={r} maxViews={maxDetailViews} maxEr={maxDetailEr} />
          ))}
        </div>
      )}
    </article>
  );

  return (
    <section className="space-y-8">
      {/* Travelogue banner — "Live Performance" in the page accent (bg-primary). */}
      <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-xl bg-primary p-8 text-primary-foreground shadow-sm sm:flex-row sm:items-end">
        <div className="relative z-10">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
            Campaign Tracking
          </span>
          <h1 className="mt-2 font-serif text-4xl font-bold italic sm:text-5xl">Live Performance</h1>
        </div>
        <span className="relative z-10 flex items-center gap-2 font-serif text-lg italic text-primary-foreground/90">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-foreground opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-foreground" />
          </span>
          Updated in real time
        </span>
        <TrendingUp className="pointer-events-none absolute -bottom-10 -right-8 h-56 w-56 opacity-10" />
      </div>

      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

      {/* Live Performance — three large paper-stack stat cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard
          overline="Total Reach"
          value={formatCompact(totals.views)}
          sub={`${totals.active} active ${totals.active === 1 ? "campaign" : "campaigns"}`}
          note="Aggregated impressions across all tracked campaigns."
          icon={Eye}
          accent={{
            text: "text-secondary",
            border: "border-secondary/20",
            iconBg: "bg-secondary-container text-on-secondary-container",
          }}
        />
        <StatCard
          overline="Engagement Rate"
          value={`${totals.avgEr.toFixed(1)}%`}
          sub={`Averaged across ${totals.creators} ${totals.creators === 1 ? "creator" : "creators"}`}
          note="Live engagement rate from tracked deliverables."
          icon={Heart}
          accent={{
            text: "text-primary",
            border: "border-primary/20",
            iconBg: "bg-primary/10 text-primary",
          }}
        />
        <StatCard
          overline="Creators Tracked"
          value={String(totals.creators)}
          sub={`${totals.active} live ${totals.active === 1 ? "campaign" : "campaigns"}`}
          note="Total creators with active deliverables under measurement."
          icon={Users}
          accent={{
            text: "text-amber-700 dark:text-amber-400",
            border: "border-amber-500/20",
            iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
          }}
        />
      </div>

      {/* Active Journeys — horizontal campaign rows */}
      <section>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="font-serif text-3xl font-bold text-foreground">Active Journeys</h3>
            <p className="mt-1 font-serif text-lg italic text-muted-foreground">
              Real-time collaboration across {totals.active} active {totals.active === 1 ? "campaign" : "campaigns"}.
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={campaignSearch}
              onChange={(e) => setCampaignSearch(e.target.value)}
              placeholder="Search campaigns..."
              className="w-full rounded-full border border-border bg-card py-2 pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading tracking data...</p>
        ) : paginatedCampaigns.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-muted-foreground">
            <Search className="h-8 w-8 opacity-40" />
            <p className="text-sm">{campaigns.length === 0 ? "No campaigns yet." : "No campaigns match your search."}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {paginatedCampaigns.map((c) => (
              <div key={c.id} className="space-y-6">
                <JourneyRow
                  campaign={c}
                  role={role}
                  isSelected={selectedId === c.id}
                  onSelect={() => setSelectedId(selectedId === c.id ? null : c.id)}
                />
                {selectedId === c.id && renderDetailPanel(c)}
              </div>
            ))}
          </div>
        )}

        {filteredCampaigns.length > CAMPAIGNS_PER_PAGE && (
          <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCampaignPage((p) => Math.max(1, p - 1))}
                disabled={campaignPage === 1}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalCampaignPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCampaignPage(p)}
                  aria-current={p === campaignPage ? "page" : undefined}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition",
                    p === campaignPage ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCampaignPage((p) => Math.min(totalCampaignPages, p + 1))}
                disabled={campaignPage === totalCampaignPages}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <p className="font-serif text-sm italic text-muted-foreground">
              Showing {(campaignPage - 1) * CAMPAIGNS_PER_PAGE + 1}–
              {Math.min(campaignPage * CAMPAIGNS_PER_PAGE, filteredCampaigns.length)} of {filteredCampaigns.length}
            </p>
          </div>
        )}
      </section>
    </section>
  );
}

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <section className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <BarChart3 className="h-5 w-5 animate-pulse" />
        </section>
      }
    >
      <TrackingPageContent />
    </Suspense>
  );
}
