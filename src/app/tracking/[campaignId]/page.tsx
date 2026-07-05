"use client";

/**
 * Campaign Tracking Presentation Page (client-facing report).
 *
 * Premium, editorial "campaign report" a logged-in agency/brand presents to a
 * client — NOT an internal dashboard. Follows the monochrome presentation spec
 * (white canvas, thin borders, generous whitespace, minimal bold). This spec is
 * the page-specific design override, so it intentionally departs from the app's
 * default navy/glassmorphism system for this route only. It still uses semantic
 * theme tokens where possible so it degrades gracefully in dark mode.
 *
 * DATA HONESTY (see the tracking data audit + DATA ADJUSTMENTS):
 *  - Growth % is omitted EVERYWHERE — no real growth computation exists. Not
 *    zeroed, not "—": absent, pending a Phase 2 follower-history feature.
 *  - "Publish Date" is relabeled "Approved" and backed by reviewedAt — no true
 *    on-platform publish date is captured yet (Phase 2).
 *  - Thumbnails are content-type icons, never a broken <img> (thumbnailUrl is
 *    never populated today — Phase 2).
 *  - Unsynced content shows "Not yet synced", never a fabricated 0/stale date.
 *  - Share Report + per-content View Analytics are disabled ("Coming soon") —
 *    real destinations are separate tickets; no dead buttons.
 *  - Export PDF uses window.print() as a functional MVP (a server-rendered PDF
 *    is a reasonable future upgrade).
 */

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Flame,
  Heart,
  Image as ImageIcon,
  Link2,
  Loader2,
  MessageCircle,
  Search,
  Share2,
  Sparkles,
  TrendingUp,
  Video,
} from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import {
  apiGetTrackingReport,
  type TrackingReport,
  type TrackingReportContent,
} from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// ── Spec palette (light) + dark fallbacks, as reusable class combos ──────────
const CARD =
  "rounded-[20px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900";
const T_PRIMARY = "text-[#111827] dark:text-neutral-100";
const T_SECOND = "text-[#6B7280] dark:text-neutral-400";
const T_MUTED = "text-[#9CA3AF] dark:text-neutral-500";
const HAIRLINE = "border-[#ECECEC] dark:border-neutral-800";

// ── Formatters ───────────────────────────────────────────────────────────────
function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  return (
    name
      .split(/[\s.]+/)
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

/** Content has no dedicated title in the data model (Draft.title is not bridged
 *  into SubmittedContent — a Phase 2 item). Derive an honest label from what we
 *  do have: platform + content type. */
function contentLabel(c: Pick<TrackingReportContent, "platform" | "contentType">): string {
  const platform = c.platform
    ? c.platform.charAt(0).toUpperCase() + c.platform.slice(1)
    : null;
  const type = c.contentType
    ? c.contentType.charAt(0).toUpperCase() + c.contentType.slice(1)
    : null;
  return [platform, type].filter(Boolean).join(" ") || "Content";
}

function contentTypeIcon(type: string | null, className = "h-5 w-5") {
  const t = (type ?? "").toLowerCase();
  if (t.includes("video")) return <Video className={className} />;
  if (t.includes("image") || t.includes("photo"))
    return <ImageIcon className={className} />;
  if (t.includes("link")) return <Link2 className={className} />;
  return <FileText className={className} />;
}

// ── Status badge (Adjustment #9: derive from reviewStatus, don't invent) ─────
// APPROVED→Published, PENDING→Reviewing, REVISION_REQUESTED→Draft. There is no
// "Scheduled" — no such state exists in this codebase, so it is never shown.
function statusDisplay(reviewStatus: string): { label: string; className: string } {
  switch (reviewStatus) {
    case "APPROVED":
      return {
        label: "Published",
        className:
          "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400",
      };
    case "PENDING":
      return {
        label: "Reviewing",
        className:
          "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400",
      };
    case "REVISION_REQUESTED":
      return {
        label: "Draft",
        className:
          "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
      };
    default:
      return {
        label: reviewStatus,
        className:
          "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
      };
  }
}

function StatusBadge({ reviewStatus }: { reviewStatus: string }) {
  const { label, className } = statusDisplay(reviewStatus);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
    >
      {label}
    </span>
  );
}

// Performance badge (Adjustment #6). "Fast Growth" dropped (needs Growth %).
// Backend already suppresses all badges below 2 synced items.
const PERF_BADGE: Record<string, { label: string; icon: typeof Flame }> = {
  above_average: { label: "Above Average", icon: BadgeCheck },
  trending: { label: "Trending", icon: Flame },
  high_engagement: { label: "High Engagement", icon: Sparkles },
};

function PerfBadge({ badge }: { badge: string }) {
  const meta = PERF_BADGE[badge];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-white px-2.5 py-0.5 text-xs font-medium text-[#374151] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

function PlatformPill({ platform }: { platform: string | null }) {
  if (!platform) return <span className={cn("text-xs", T_MUTED)}>—</span>;
  return (
    <span className="inline-flex items-center rounded-full border border-[#E5E7EB] px-2.5 py-0.5 text-xs font-medium capitalize text-[#374151] dark:border-neutral-700 dark:text-neutral-300">
      {platform}
    </span>
  );
}

/** Thumbnail slot (Adjustment #3): a premium content-type icon placeholder —
 *  NOT an <img> that would 404 (thumbnailUrl is never populated today). */
function ThumbnailPlaceholder({ contentType }: { contentType: string | null }) {
  return (
    <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-[#E5E7EB] bg-gradient-to-br from-[#F8F9FA] to-[#ECECEC] text-[#9CA3AF] dark:border-neutral-800 dark:from-neutral-800 dark:to-neutral-900 dark:text-neutral-500">
      <div className="flex flex-col items-center gap-2">
        {contentTypeIcon(contentType, "h-8 w-8")}
        <span className="text-xs font-medium capitalize">
          {contentType || "content"}
        </span>
      </div>
    </div>
  );
}

// A synced metric, or the honest "Not yet synced" state when null.
function Metric({
  label,
  value,
  synced,
}: {
  label: string;
  value: string;
  synced: boolean;
}) {
  return (
    <div>
      <p className={cn("text-[11px] font-medium uppercase tracking-wide", T_MUTED)}>
        {label}
      </p>
      {synced ? (
        <p className={cn("mt-0.5 text-lg font-semibold tabular-nums", T_PRIMARY)}>
          {value}
        </p>
      ) : (
        <p className={cn("mt-0.5 text-sm", T_MUTED)}>Not yet synced</p>
      )}
    </div>
  );
}

// ── Sections ─────────────────────────────────────────────────────────────────

function CampaignHeader({ report }: { report: TrackingReport }) {
  const { campaign, lastUpdated } = report;
  const started = formatDate(campaign.startedAt);
  const ends = formatDate(campaign.submissionDate);
  const duration = started
    ? ends
      ? `${started} – ${ends}`
      : `Started ${started} · ongoing`
    : null;
  const lastUpdatedLabel = formatDate(lastUpdated);

  return (
    <header className={cn(CARD, "p-8 sm:p-10")}>
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {/* Brand identity */}
          <div className="mb-5 flex items-center gap-3">
            <Avatar className="h-10 w-10 rounded-xl border border-[#E5E7EB] dark:border-neutral-800">
              {campaign.brandLogoUrl ? (
                <AvatarImage src={campaign.brandLogoUrl} alt={campaign.brandName ?? ""} />
              ) : null}
              <AvatarFallback className="rounded-xl bg-[#F8F9FA] text-xs font-semibold text-[#6B7280] dark:bg-neutral-800 dark:text-neutral-400">
                {getInitials(campaign.brandName ?? "Brand")}
              </AvatarFallback>
            </Avatar>
            <span className={cn("text-sm font-medium", T_SECOND)}>
              {campaign.brandName ?? "Brand"}
            </span>
          </div>

          <h1
            className={cn(
              "text-3xl font-semibold tracking-tight sm:text-4xl",
              T_PRIMARY
            )}
          >
            {campaign.name}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium capitalize text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
              {campaign.status.toLowerCase()}
            </span>
            {duration ? (
              <span className={cn("text-sm", T_SECOND)}>{duration}</span>
            ) : null}
            <span className={cn("text-sm", T_MUTED)}>
              {lastUpdatedLabel
                ? `Last updated ${lastUpdatedLabel}`
                : "Not yet synced"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="no-print flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#111827] transition-colors hover:bg-[#F8F9FA] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>
          {/* Share Report: disabled until the public share-link epic ships. */}
          <span title="Coming soon">
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
            >
              <Share2 className="h-4 w-4" />
              Share Report
            </button>
          </span>
        </div>
      </div>
    </header>
  );
}

function CampaignProgress({ report }: { report: TrackingReport }) {
  const { progress } = report;
  const stats = [
    { label: "Total Deliverables", value: progress.totalDeliverables },
    { label: "Published", value: progress.published },
    { label: "Remaining", value: progress.remaining },
  ];
  return (
    <section className={cn(CARD, "p-8")}>
      <div className="flex items-end justify-between">
        <h2 className={cn("text-sm font-medium uppercase tracking-wide", T_SECOND)}>
          Campaign Progress
        </h2>
        <span className={cn("text-3xl font-semibold tabular-nums", T_PRIMARY)}>
          {progress.pctComplete}%
        </span>
      </div>
      {/* Charcoal fill on a light track — the one subtle accent the spec allows. */}
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[#ECECEC] dark:bg-neutral-800">
        <div
          className="h-full rounded-full bg-neutral-900 transition-all duration-500 dark:bg-neutral-100"
          style={{ width: `${progress.pctComplete}%` }}
        />
      </div>
      <div className={cn("mt-8 grid grid-cols-3 gap-4 border-t pt-6", HAIRLINE)}>
        {stats.map((s) => (
          <div key={s.label}>
            <p className={cn("text-2xl font-semibold tabular-nums", T_PRIMARY)}>
              {s.value}
            </p>
            <p className={cn("mt-1 text-sm", T_SECOND)}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PerformanceSummary({ report }: { report: TrackingReport }) {
  const { summary, progress, content } = report;
  const syncedCount = content.filter((c) => c.synced).length;

  // 3 cards — "Average Growth" removed (Adjustment #1): no real growth exists.
  const cards = [
    {
      label: "Total Views",
      value: formatCompact(summary.totalViews),
      hint: `${syncedCount} synced ${syncedCount === 1 ? "post" : "posts"}`,
    },
    {
      label: "Avg Engagement Rate",
      value: `${summary.avgEngagementRate}%`,
      hint: syncedCount ? "across synced content" : "awaiting sync",
    },
    {
      label: "Published Posts",
      value: String(summary.publishedPosts),
      hint: `of ${progress.totalDeliverables} deliverable${
        progress.totalDeliverables === 1 ? "" : "s"
      }`,
    },
  ];

  // Honest, data-derived executive summary — no fabricated "exceeded
  // projections" copy.
  const execSummary =
    syncedCount === 0
      ? "Performance data will appear here once the published content has been synced from its platforms."
      : `Across ${summary.publishedPosts} published ${
          summary.publishedPosts === 1 ? "post" : "posts"
        }, the campaign has generated ${summary.totalViews.toLocaleString()} total views at an average engagement rate of ${
          summary.avgEngagementRate
        }%.${
          progress.remaining > 0
            ? ` ${progress.remaining} deliverable${
                progress.remaining === 1 ? "" : "s"
              } still in progress.`
            : " All deliverables are complete."
        }`;

  return (
    <section className="space-y-6">
      <h2 className={cn("text-sm font-medium uppercase tracking-wide", T_SECOND)}>
        Performance Summary
      </h2>
      <div className="grid gap-5 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className={cn(CARD, "p-6")}>
            <p className={cn("text-sm", T_SECOND)}>{c.label}</p>
            <p
              className={cn(
                "mt-2 text-3xl font-semibold tabular-nums",
                T_PRIMARY
              )}
            >
              {c.value}
            </p>
            {/* NOTE: the spec's per-card "trend indicator" is intentionally
                omitted — a trend implies a historical baseline we do not track
                (same root cause as the removed Growth metric). A fake arrow
                would misrepresent the data, so we show honest context instead. */}
            <p className={cn("mt-1 text-xs", T_MUTED)}>{c.hint}</p>
          </div>
        ))}
      </div>
      <div className={cn(CARD, "p-6")}>
        <p className={cn("text-base leading-relaxed", T_SECOND)}>{execSummary}</p>
      </div>
    </section>
  );
}

function ContentTimeline({ report }: { report: TrackingReport }) {
  // Chronological by approval date (fallback to submission). A campaign story.
  const items = useMemo(
    () =>
      [...report.content].sort((a, b) => {
        const da = new Date(a.approvedAt ?? a.submittedAt).getTime();
        const db = new Date(b.approvedAt ?? b.submittedAt).getTime();
        return da - db;
      }),
    [report.content]
  );

  if (items.length === 0) return null;

  return (
    <section className="space-y-6">
      <h2 className={cn("text-sm font-medium uppercase tracking-wide", T_SECOND)}>
        Content Timeline
      </h2>
      <div className={cn(CARD, "p-8")}>
        <ol className="relative">
          {items.map((c, i) => {
            const approved = formatDate(c.approvedAt);
            return (
              <li key={c.id} className="relative flex gap-5 pb-8 last:pb-0">
                {/* Rail */}
                {i < items.length - 1 ? (
                  <span
                    className="absolute left-[19px] top-10 -bottom-0 w-px bg-[#ECECEC] dark:bg-neutral-800"
                    aria-hidden
                  />
                ) : null}
                <Avatar className="z-10 h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-[#F8F9FA] text-xs font-semibold text-[#6B7280] dark:bg-neutral-800 dark:text-neutral-400">
                    {getInitials(c.influencerName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className={cn("text-xs", T_MUTED)}>
                      {/* Relabeled "Approved" — not "Published" (Adjustment #2). */}
                      {approved ? `Approved ${approved}` : "Approval date not recorded"}
                    </p>
                    <p className={cn("mt-0.5 font-medium", T_PRIMARY)}>
                      {contentLabel(c)}
                    </p>
                    <p className={cn("text-sm", T_SECOND)}>
                      {c.influencerName}
                      {c.platform ? ` · ${c.platform}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className={cn("text-sm tabular-nums", T_SECOND)}>
                      {c.synced && c.views != null
                        ? `${formatCompact(c.views)} views`
                        : "Not yet synced"}
                    </span>
                    <StatusBadge reviewStatus={c.status} />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function FeaturedShowcase({ report }: { report: TrackingReport }) {
  // Published (approved) content, best performers first, unsynced last.
  const featured = useMemo(
    () =>
      report.content
        .filter((c) => c.status === "APPROVED")
        .sort((a, b) => (b.views ?? -1) - (a.views ?? -1)),
    [report.content]
  );

  if (featured.length === 0) return null;

  return (
    <section className="space-y-6">
      <h2 className={cn("text-sm font-medium uppercase tracking-wide", T_SECOND)}>
        Featured Content
      </h2>
      {/* Two-column masonry-ish grid (columns keep card heights independent). */}
      <div className="gap-6 sm:columns-2 [&>*]:mb-6 [&>*]:break-inside-avoid">
        {featured.map((c) => {
          const approved = formatDate(c.approvedAt);
          const hasLink = !!c.contentUrl;
          return (
            <article key={c.id} className={cn(CARD, "overflow-hidden")}>
              <div className="p-5">
                <div className="relative">
                  <ThumbnailPlaceholder contentType={c.contentType} />
                  <Avatar className="absolute -bottom-3 left-3 h-9 w-9 border-2 border-white dark:border-neutral-900">
                    <AvatarFallback className="bg-[#F8F9FA] text-[11px] font-semibold text-[#6B7280] dark:bg-neutral-800 dark:text-neutral-400">
                      {getInitials(c.influencerName)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="mt-6 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={cn("font-medium", T_PRIMARY)}>{c.influencerName}</p>
                    <p className={cn("text-sm", T_SECOND)}>{contentLabel(c)}</p>
                  </div>
                  {c.badges[0] ? <PerfBadge badge={c.badges[0]} /> : null}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <PlatformPill platform={c.platform} />
                  {c.contentType ? (
                    <span className={cn("text-xs capitalize", T_MUTED)}>
                      {c.contentType}
                    </span>
                  ) : null}
                  <span className={cn("text-xs", T_MUTED)}>
                    {approved ? `· Approved ${approved}` : "· Approval date not recorded"}
                  </span>
                </div>

                {/* Metrics — Views + Engagement only (Growth removed, #1). */}
                <div className={cn("mt-5 grid grid-cols-2 gap-4 border-t pt-5", HAIRLINE)}>
                  <Metric
                    label="Views"
                    synced={c.synced && c.views != null}
                    value={c.views != null ? formatCompact(c.views) : ""}
                  />
                  <Metric
                    label="Engagement Rate"
                    synced={c.synced && c.engagementRate != null}
                    value={c.engagementRate != null ? `${c.engagementRate}%` : ""}
                  />
                </div>

                <div className="mt-6 flex items-center gap-3">
                  {hasLink ? (
                    <a
                      href={c.contentUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Post
                    </a>
                  ) : (
                    <span
                      className="inline-flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] px-4 py-2 text-sm font-medium opacity-50 dark:border-neutral-700"
                      title="No post link"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Post
                    </span>
                  )}
                  {/* View Analytics: no per-content analytics page yet — disabled
                      rather than a dead link. */}
                  <span title="Coming soon">
                    <button
                      type="button"
                      disabled
                      className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-[#E5E7EB] px-4 py-2 text-sm font-medium opacity-50 dark:border-neutral-700"
                    >
                      <TrendingUp className="h-4 w-4" />
                      Analytics
                    </button>
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

type SortKey = "views" | "engagement" | "approved";

function InfluencerTable({ report }: { report: TrackingReport }) {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("all");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState<SortKey>("views");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const platforms = useMemo(
    () =>
      Array.from(
        new Set(report.content.map((c) => c.platform).filter(Boolean) as string[])
      ),
    [report.content]
  );
  const types = useMemo(
    () =>
      Array.from(
        new Set(report.content.map((c) => c.contentType).filter(Boolean) as string[])
      ),
    [report.content]
  );

  const rows = useMemo(() => {
    let list = [...report.content];
    const q = search.trim().toLowerCase();
    if (q)
      list = list.filter(
        (c) =>
          c.influencerName.toLowerCase().includes(q) ||
          contentLabel(c).toLowerCase().includes(q)
      );
    if (platform !== "all") list = list.filter((c) => c.platform === platform);
    if (type !== "all") list = list.filter((c) => c.contentType === type);
    list.sort((a, b) => {
      if (sort === "views") return (b.views ?? -1) - (a.views ?? -1);
      if (sort === "engagement")
        return (b.engagementRate ?? -1) - (a.engagementRate ?? -1);
      return (
        new Date(b.approvedAt ?? b.submittedAt).getTime() -
        new Date(a.approvedAt ?? a.submittedAt).getTime()
      );
    });
    return list;
  }, [report.content, search, platform, type, sort]);

  const copyLink = async (c: TrackingReportContent) => {
    if (!c.contentUrl) return;
    try {
      await navigator.clipboard.writeText(c.contentUrl);
      setCopiedId(c.id);
      setTimeout(() => setCopiedId((v) => (v === c.id ? null : v)), 1500);
    } catch {
      /* clipboard blocked — no-op, link is still visible via View Post */
    }
  };

  const selectCls =
    "cursor-pointer rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";
  const thCls = cn(
    "whitespace-nowrap px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide",
    T_MUTED
  );
  const tdCls = cn("whitespace-nowrap px-4 py-3 text-sm", T_SECOND);

  return (
    <section className="space-y-6">
      <h2 className={cn("text-sm font-medium uppercase tracking-wide", T_SECOND)}>
        Influencer Performance
      </h2>

      {/* Toolbar. Date Range is intentionally not rendered: a real date-range
          filter is a Phase 2 refinement — better omitted than shipped as a dead
          control. Search / Platform / Type / Sort are all functional. */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className={cn("absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", T_MUTED)} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search influencer or content…"
            className={cn(selectCls, "w-full pl-9")}
          />
        </div>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={cn(selectCls, "capitalize")}>
          <option value="all">All platforms</option>
          {platforms.map((p) => (
            <option key={p} value={p} className="capitalize">
              {p}
            </option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className={cn(selectCls, "capitalize")}>
          <option value="all">All types</option>
          {types.map((t) => (
            <option key={t} value={t} className="capitalize">
              {t}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectCls}>
          <option value="views">Sort: Views</option>
          <option value="engagement">Sort: Engagement</option>
          <option value="approved">Sort: Approved date</option>
        </select>
      </div>

      <div className={cn(CARD, "overflow-hidden")}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className={cn("border-b bg-[#F8F9FA] dark:bg-neutral-900/60", HAIRLINE)}>
                <th className={cn(thCls, "sticky left-0 bg-[#F8F9FA] dark:bg-neutral-900")}>
                  Influencer
                </th>
                <th className={thCls}>Content</th>
                <th className={thCls}>Post</th>
                <th className={thCls}>Platform</th>
                <th className={thCls}>Type</th>
                <th className={cn(thCls, "text-right")}>Views</th>
                <th className={cn(thCls, "text-right")}>ER</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Approved</th>
                <th className={thCls}>Last Synced</th>
                <th className={cn(thCls, "text-right")}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className={cn("px-4 py-10 text-center text-sm", T_MUTED)}>
                    No content matches these filters.
                  </td>
                </tr>
              ) : (
                rows.map((c) => {
                  const approved = formatDate(c.approvedAt);
                  const synced = formatDate(c.recordedAt);
                  return (
                    <tr
                      key={c.id}
                      className={cn(
                        "group border-b transition-colors hover:bg-[#F8F9FA] dark:hover:bg-neutral-800/40",
                        HAIRLINE
                      )}
                    >
                      <td className={cn(tdCls, "sticky left-0 bg-white group-hover:bg-[#F8F9FA] dark:bg-neutral-900 dark:group-hover:bg-neutral-800/40")}>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-[#F8F9FA] text-[10px] font-semibold text-[#6B7280] dark:bg-neutral-800 dark:text-neutral-400">
                              {getInitials(c.influencerName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className={cn("font-medium", T_PRIMARY)}>
                            {c.influencerName}
                          </span>
                        </div>
                      </td>
                      <td className={tdCls}>{contentLabel(c)}</td>
                      <td className={tdCls}>
                        {c.contentUrl ? (
                          <a
                            href={c.contentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex cursor-pointer items-center gap-1 text-neutral-900 underline-offset-2 hover:underline dark:text-neutral-100"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Link
                          </a>
                        ) : (
                          <span className={T_MUTED}>—</span>
                        )}
                      </td>
                      <td className={tdCls}>
                        <PlatformPill platform={c.platform} />
                      </td>
                      <td className={cn(tdCls, "capitalize")}>{c.contentType ?? "—"}</td>
                      <td className={cn(tdCls, "text-right tabular-nums", T_PRIMARY)}>
                        {c.synced && c.views != null ? formatCompact(c.views) : (
                          <span className={T_MUTED}>—</span>
                        )}
                      </td>
                      <td className={cn(tdCls, "text-right tabular-nums")}>
                        {c.synced && c.engagementRate != null ? (
                          `${c.engagementRate}%`
                        ) : (
                          <span className={T_MUTED}>—</span>
                        )}
                      </td>
                      <td className={tdCls}>
                        <StatusBadge reviewStatus={c.status} />
                      </td>
                      <td className={tdCls}>{approved ?? <span className={T_MUTED}>—</span>}</td>
                      <td className={tdCls}>
                        {synced ?? <span className={T_MUTED}>Not yet synced</span>}
                      </td>
                      <td className={cn(tdCls, "text-right")}>
                        {/* Row quick actions reveal on hover (visible on mobile). */}
                        <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                          {c.contentUrl ? (
                            <>
                              <a
                                href={c.contentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View post"
                                className="cursor-pointer rounded-lg p-1.5 text-[#6B7280] hover:bg-neutral-100 hover:text-[#111827] dark:text-neutral-400 dark:hover:bg-neutral-800"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                              <button
                                type="button"
                                onClick={() => copyLink(c)}
                                title="Copy link"
                                className="cursor-pointer rounded-lg p-1.5 text-[#6B7280] hover:bg-neutral-100 hover:text-[#111827] dark:text-neutral-400 dark:hover:bg-neutral-800"
                              >
                                {copiedId === c.id ? (
                                  <BadgeCheck className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </>
                          ) : null}
                          <span title="Coming soon">
                            <button
                              type="button"
                              disabled
                              className="cursor-not-allowed rounded-lg p-1.5 text-[#9CA3AF] opacity-60 dark:text-neutral-600"
                            >
                              <TrendingUp className="h-4 w-4" />
                            </button>
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CampaignReportPage() {
  const params = useParams<{ campaignId: string }>();
  const campaignId = params?.campaignId;
  const { role, token } = useUserStore();
  const isBrandSide = role === "brand" || role === "agency";

  const [report, setReport] = useState<TrackingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !campaignId) return;
    setLoading(true);
    apiGetTrackingReport(token, campaignId)
      .then((r) => {
        setReport(r);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load report"))
      .finally(() => setLoading(false));
  }, [token, campaignId]);

  if (!token) {
    return (
      <div className={cn("mx-auto max-w-md py-24 text-center", T_SECOND)}>
        Please log in to view this report.
      </div>
    );
  }
  if (!isBrandSide) {
    return (
      <div className={cn("mx-auto max-w-md py-24 text-center", T_SECOND)}>
        This report is available to agencies and brands.
      </div>
    );
  }

  return (
    // Full-bleed neutral canvas — overrides the shell's per-route tint so the
    // report reads as a clean white document per the presentation spec.
    <div className="report-canvas -mx-4 -mt-4 -mb-6 min-h-screen bg-[#F8F9FA] px-4 py-8 dark:bg-neutral-950 lg:-mx-6 lg:-mt-5 lg:px-10 lg:py-10">
      {/* Print rules: hide app chrome + non-print actions, flatten background. */}
      <style>{`
        @media print {
          aside { display: none !important; }
          .no-print { display: none !important; }
          body, main { background: #fff !important; }
          .report-canvas { margin: 0 !important; padding: 0 !important; background: #fff !important; }
        }
      `}</style>

      <div className="mx-auto max-w-5xl">
        <Link
          href="/tracking"
          className={cn(
            "no-print mb-6 inline-flex cursor-pointer items-center gap-1.5 text-sm hover:underline",
            T_SECOND
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tracking
        </Link>

        {loading ? (
          <div className={cn("flex items-center justify-center gap-2 py-24", T_MUTED)}>
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading report…
          </div>
        ) : error ? (
          <div className={cn(CARD, "p-10 text-center")}>
            <p className={cn("font-medium", T_PRIMARY)}>Unable to load this report</p>
            <p className={cn("mt-1 text-sm", T_SECOND)}>{error}</p>
          </div>
        ) : report ? (
          <div className="space-y-10">
            <CampaignHeader report={report} />
            <CampaignProgress report={report} />
            <PerformanceSummary report={report} />
            <ContentTimeline report={report} />
            <FeaturedShowcase report={report} />
            <InfluencerTable report={report} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
