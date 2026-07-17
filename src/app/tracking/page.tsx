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
import {
  getPageAccentTextClassForRoute,
  getPageButtonClassForRoute,
  getPageSolidClassForRoute,
} from "@/lib/nav-theme";
import { cn } from "@/lib/utils";
import { exportRowsToExcel } from "@/lib/excel";

const pageBtn = getPageButtonClassForRoute("/tracking");
const pageSolid = getPageSolidClassForRoute("/tracking");
const pageAccent = getPageAccentTextClassForRoute("/tracking");
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

/** coverImage has no source → role-tinted gradient placeholder. */
function roleCoverGradient(role: string | null | undefined): string {
  if (role === "brand") return "bg-gradient-to-br from-role-navy to-role-navy/70";
  if (role === "influencer") return "bg-gradient-to-br from-role-coral to-role-coral/70";
  return "bg-gradient-to-br from-nav-forest-800 to-nav-forest-900"; // agency / default
}

function KpiCard({
  icon: Icon,
  value,
  label,
  tint,
}: {
  icon: ComponentType<{ className?: string }>;
  value: string;
  label: string;
  tint: string;
}) {
  return (
    <article className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm">
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tint)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold tabular-nums text-foreground">{value}</p>
        <p className="truncate text-[11px] font-medium text-muted-foreground">{label}</p>
      </div>
    </article>
  );
}

function CampaignCard({
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
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border text-left transition hover:shadow-md",
        isSelected ? "border-nav-forest-800 ring-2 ring-nav-forest-200" : "border-border"
      )}
    >
      {/* Campaign cover — same image as the campaign page; role-tinted gradient
          fallback when the campaign has no uploaded cover. */}
      <div className={cn("relative h-24 w-full", !c.coverImageUrl && roleCoverGradient(role))}>
        {c.coverImageUrl ? (
          <img
            src={c.coverImageUrl}
            alt={`${c.name} cover`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-semibold capitalize text-foreground shadow-sm backdrop-blur-sm">
          <Activity className="h-3 w-3 text-emerald-500" />
          {statusLower}
        </span>
        <p className="absolute inset-x-2 bottom-2 line-clamp-2 text-sm font-semibold leading-snug text-white drop-shadow">
          {c.name}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-2 bg-card p-3">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-muted px-2 py-1 text-[10px] text-muted-foreground">
          <Users className="h-3 w-3 shrink-0" aria-hidden />
          {c.influencerCount} {c.influencerCount === 1 ? "creator" : "creators"}
        </span>
        <div className="flex flex-wrap gap-1.5 border-t border-border pt-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
            <Eye className="h-3 w-3" />
            {c.totalViews > 0 ? formatCompact(c.totalViews) : "—"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            <TrendingUp className="h-3 w-3" />
            {c.influencerCount ? `${c.avgEngagementRate.toFixed(1)}%` : "—"}
          </span>
        </div>
      </div>
    </button>
  );
}

function MetricGauge({
  label,
  value,
  max,
  icon: Icon,
  colorClass = "bg-nav-forest-900",
}: {
  label: string;
  value: number;
  max: number;
  icon: ComponentType<{ className?: string }>;
  colorClass?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
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
        <div className={cn("h-full rounded-full transition-all", colorClass)} style={{ width: `${pct}%` }} />
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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-nav-forest-200 to-nav-forest-800 text-xs font-bold text-white">
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
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nav-forest-100 text-[10px] font-bold text-nav-forest-800 dark:bg-nav-forest-900/40 dark:text-nav-forest-100">
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

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className={cn("flex items-center justify-between gap-4 rounded-2xl px-5 py-4 text-white shadow-sm", pageSolid)}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif">Tracking</h1>
            <span className="flex items-center gap-1.5 text-xs text-white/70">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Live
            </span>
          </div>
        </div>
        <div className="hidden items-end gap-1 sm:flex" aria-hidden>
          {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
            <div key={i} className="w-1.5 rounded-full bg-white/30" style={{ height: `${h * 0.28}px` }} />
          ))}
        </div>
      </div>

      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

      {/* KPI strip (summary aggregates) */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Eye} value={formatCompact(totals.views)} label="Total views" tint="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300" />
        <KpiCard icon={Users} value={String(totals.creators)} label="Creators tracked" tint="bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300" />
        <KpiCard icon={TrendingUp} value={`${totals.avgEr.toFixed(1)}%`} label="Avg ER" tint="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300" />
        <KpiCard icon={Activity} value={String(totals.active)} label="Active campaigns" tint="bg-nav-forest-100 text-nav-forest-800 dark:bg-nav-forest-900/40 dark:text-nav-forest-100" />
      </div>

      {/* Campaign list */}
      <article className="overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Eye className={cn("h-4 w-4", pageAccent)} />
            <h2 className="text-sm font-semibold text-foreground font-serif">Campaigns</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {filteredCampaigns.length}
            </span>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={campaignSearch}
              onChange={(e) => setCampaignSearch(e.target.value)}
              placeholder="Search campaigns..."
              className="w-full rounded-xl border border-input bg-muted/50 py-2 pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/20"
            />
          </div>
        </div>

        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading tracking data...</p>
        ) : paginatedCampaigns.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <Search className="h-8 w-8 opacity-40" />
            <p className="text-xs">{campaigns.length === 0 ? "No campaigns yet." : "No campaigns match your search."}</p>
          </div>
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedCampaigns.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                role={role}
                isSelected={selectedId === c.id}
                onSelect={() => setSelectedId(c.id)}
              />
            ))}
          </div>
        )}

        {filteredCampaigns.length > CAMPAIGNS_PER_PAGE && (
          <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {(campaignPage - 1) * CAMPAIGNS_PER_PAGE + 1}–
              {Math.min(campaignPage * CAMPAIGNS_PER_PAGE, filteredCampaigns.length)} of {filteredCampaigns.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCampaignPage((p) => Math.max(1, p - 1))}
                disabled={campaignPage === 1}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalCampaignPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCampaignPage(p)}
                  className={cn(
                    "min-w-8 rounded-lg px-2 py-1 text-xs font-semibold transition",
                    p === campaignPage ? cn(pageBtn, "shadow-sm") : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCampaignPage((p) => Math.min(totalCampaignPages, p + 1))}
                disabled={campaignPage === totalCampaignPages}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </article>

      {/* Detail panel */}
      {selectedCampaign && (
        <article className="overflow-hidden rounded-2xl bg-card shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-nav-forest-100 dark:bg-nav-forest-900/40">
                <Activity className="h-4 w-4 text-nav-forest-800 dark:text-nav-forest-100" />
              </div>
              <h2 className="truncate text-sm font-semibold text-foreground font-serif">{selectedCampaign.name}</h2>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {/* Entry point to the client-facing presentation report. */}
              <Link
                href={`/tracking/${selectedCampaign.id}`}
                title="Open client report"
                className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold hover:bg-nav-forest-100 dark:hover:bg-nav-forest-900/30", pageAccent)}
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
                className={cn("rounded-lg p-2 hover:bg-nav-forest-100 dark:hover:bg-nav-forest-900/30 disabled:opacity-40", pageAccent)}
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
      )}
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
