"use client";

/**
 * Shared, presentation-only rendering of a campaign tracking report.
 *
 * Extracted from the authenticated report page so the SAME components render both
 * surfaces without markup duplication:
 *  - the authenticated /tracking/[campaignId] page (owner view, full report), and
 *  - the public /tracking/public/[token] page (client view, allowlisted report).
 *
 * The only behavioural difference is the `isPublic` flag, which:
 *  - hides the "Share Report" action (a public visitor has no login to share), and
 *  - hides internal-only actions ("View Analytics") and the workflow Status
 *    column/badge (the public DTO omits `status` entirely), and
 *  - relaxes the "published-only" filters (the public payload is already
 *    published-only, and its content items carry no `status`).
 *
 * External post links keep rel="noreferrer" so clicking through to a platform
 * never leaks the share token (in the public page URL) via the Referer header.
 *
 * Design: the monochrome presentation spec (white canvas, thin borders) — a
 * page-specific override of the app's default navy/glassmorphism system.
 */

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Flame,
  Image as ImageIcon,
  Link2,
  Search,
  Share2,
  Sparkles,
  TrendingUp,
  Video,
} from "lucide-react";
import type {
  TrackingReport,
  TrackingReportContent,
} from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// The report shape the view accepts. Deliberately looser than the authenticated
// TrackingReport so the public allowlist (no campaign.id; content without
// status/submittedAt) is also assignable — one component tree, two payloads.
export type ReportContent = Omit<
  TrackingReportContent,
  "status" | "submittedAt"
> & {
  status?: string;
  submittedAt?: string;
};

export type ReportViewData = {
  campaign: Omit<TrackingReport["campaign"], "id"> & { id?: string };
  progress: TrackingReport["progress"];
  summary: TrackingReport["summary"];
  lastUpdated: string | null;
  content: ReportContent[];
};

// ── Spec palette (light) + dark fallbacks, as reusable class combos ──────────
export const CARD =
  "rounded-[20px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900";
export const T_PRIMARY = "text-[#111827] dark:text-neutral-100";
export const T_SECOND = "text-[#6B7280] dark:text-neutral-400";
export const T_MUTED = "text-[#9CA3AF] dark:text-neutral-500";
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

/** Sort key for content chronology, resilient to the public payload (which drops
 *  submittedAt): prefer approval, then publish, then submission; 0 if none. */
function chronoKey(c: ReportContent): number {
  const iso = c.approvedAt ?? c.publishedAt ?? c.submittedAt ?? null;
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** Content has no dedicated title in the data model (Draft.title is not always
 *  bridged into SubmittedContent). Derive an honest label from platform + type. */
function contentLabel(
  c: Pick<ReportContent, "platform" | "contentType">
): string {
  const platform = c.platform
    ? c.platform.charAt(0).toUpperCase() + c.platform.slice(1)
    : null;
  const type = c.contentType
    ? c.contentType.charAt(0).toUpperCase() + c.contentType.slice(1)
    : null;
  return [platform, type].filter(Boolean).join(" ") || "Content";
}

/** Real content title when present; otherwise the derived "Platform Type" label. */
function contentName(c: ReportContent): string {
  return c.title?.trim() || contentLabel(c);
}

/** Prefer the true on-platform publish date ("Published"); fall back to the
 *  approval date ("Approved") when publish date isn't captured. Null when neither. */
function publishInfo(c: ReportContent): { label: string; date: string } | null {
  if (c.publishedAt) {
    const d = formatDate(c.publishedAt);
    if (d) return { label: "Published", date: d };
  }
  if (c.approvedAt) {
    const d = formatDate(c.approvedAt);
    if (d) return { label: "Approved", date: d };
  }
  return null;
}

function contentTypeIcon(type: string | null, className = "h-5 w-5") {
  const t = (type ?? "").toLowerCase();
  if (t.includes("video")) return <Video className={className} />;
  if (t.includes("image") || t.includes("photo"))
    return <ImageIcon className={className} />;
  if (t.includes("link")) return <Link2 className={className} />;
  return <FileText className={className} />;
}

// ── Status badge (derive from reviewStatus, don't invent) ─────────────────────
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

// Performance badge. Backend already suppresses all badges below 2 synced items.
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

/** Icon placeholder for the thumbnail slot — used when no real thumbnail exists. */
function ThumbnailPlaceholder({ contentType }: { contentType: string | null }) {
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-[#E5E7EB] bg-gradient-to-br from-[#F8F9FA] to-[#ECECEC] text-[#9CA3AF] dark:border-neutral-800 dark:from-neutral-800 dark:to-neutral-900 dark:text-neutral-500">
      <div className="flex flex-col items-center gap-2">
        {contentTypeIcon(contentType, "h-8 w-8")}
        <span className="text-xs font-medium capitalize">
          {contentType || "content"}
        </span>
      </div>
    </div>
  );
}

/** Render the real captured thumbnail when present, falling back to the icon
 *  placeholder if it's absent OR if the image fails to load. */
function ContentThumbnail({ content }: { content: ReportContent }) {
  const [failed, setFailed] = useState(false);
  if (!content.thumbnailUrl || failed) {
    return <ThumbnailPlaceholder contentType={content.contentType} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- external CDN thumbs (i.ytimg.com); next/image remote config not set up for this
    <img
      src={content.thumbnailUrl}
      alt={contentName(content)}
      onError={() => setFailed(true)}
      className="aspect-video w-full rounded-2xl border border-[#E5E7EB] object-cover dark:border-neutral-800"
    />
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

function CampaignHeader({
  report,
  isPublic,
  onShare,
}: {
  report: ReportViewData;
  isPublic: boolean;
  onShare?: () => void;
}) {
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
          {/* Share is owner-only: a public visitor has no login to share with. */}
          {!isPublic && onShare ? (
            <button
              type="button"
              onClick={onShare}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              <Share2 className="h-4 w-4" />
              Share Report
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function CampaignProgress({ report }: { report: ReportViewData }) {
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

function PerformanceSummary({ report }: { report: ReportViewData }) {
  const { summary, progress, content } = report;
  const syncedCount = content.filter((c) => c.synced).length;

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

function ContentTimeline({
  report,
  isPublic,
}: {
  report: ReportViewData;
  isPublic: boolean;
}) {
  const items = useMemo(
    () => [...report.content].sort((a, b) => chronoKey(a) - chronoKey(b)),
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
            const info = publishInfo(c);
            return (
              <li key={c.id} className="relative flex gap-5 pb-8 last:pb-0">
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
                      {info ? `${info.label} ${info.date}` : "Publish date not recorded"}
                    </p>
                    <p className={cn("mt-0.5 font-medium", T_PRIMARY)}>
                      {contentName(c)}
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
                    {/* Workflow status is owner-only (public DTO omits it). */}
                    {!isPublic && c.status ? (
                      <StatusBadge reviewStatus={c.status} />
                    ) : null}
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

function FeaturedShowcase({
  report,
  isPublic,
}: {
  report: ReportViewData;
  isPublic: boolean;
}) {
  // Published (approved) content, best performers first. The public payload is
  // already published-only and carries no status, so accept it as-is there.
  const featured = useMemo(
    () =>
      report.content
        .filter((c) => c.status == null || c.status === "APPROVED")
        .sort((a, b) => (b.views ?? -1) - (a.views ?? -1)),
    [report.content]
  );

  if (featured.length === 0) return null;

  return (
    <section className="space-y-6">
      <h2 className={cn("text-sm font-medium uppercase tracking-wide", T_SECOND)}>
        Featured Content
      </h2>
      <div className="gap-6 sm:columns-2 [&>*]:mb-6 [&>*]:break-inside-avoid">
        {featured.map((c) => {
          const info = publishInfo(c);
          const hasLink = !!c.contentUrl;
          return (
            <article key={c.id} className={cn(CARD, "overflow-hidden")}>
              <div className="p-5">
                <div className="relative">
                  <ContentThumbnail content={c} />
                  <Avatar className="absolute -bottom-3 left-3 h-9 w-9 border-2 border-white dark:border-neutral-900">
                    <AvatarFallback className="bg-[#F8F9FA] text-[11px] font-semibold text-[#6B7280] dark:bg-neutral-800 dark:text-neutral-400">
                      {getInitials(c.influencerName)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="mt-6 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={cn("font-medium", T_PRIMARY)}>{c.influencerName}</p>
                    <p className={cn("text-sm", T_SECOND)}>{contentName(c)}</p>
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
                    {info ? `· ${info.label} ${info.date}` : "· Publish date not recorded"}
                  </span>
                </div>

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
                  {/* Analytics is an internal owner tool — hidden on the public view. */}
                  {!isPublic ? (
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
                  ) : null}
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

function InfluencerTable({
  report,
  isPublic,
}: {
  report: ReportViewData;
  isPublic: boolean;
}) {
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
          contentName(c).toLowerCase().includes(q)
      );
    if (platform !== "all") list = list.filter((c) => c.platform === platform);
    if (type !== "all") list = list.filter((c) => c.contentType === type);
    list.sort((a, b) => {
      if (sort === "views") return (b.views ?? -1) - (a.views ?? -1);
      if (sort === "engagement")
        return (b.engagementRate ?? -1) - (a.engagementRate ?? -1);
      return chronoKey(b) - chronoKey(a);
    });
    return list;
  }, [report.content, search, platform, type, sort]);

  const copyLink = async (c: ReportContent) => {
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
  // Status column is owner-only (public DTO omits status). Keep the empty-state
  // colSpan in sync with the rendered column count.
  const colCount = isPublic ? 10 : 11;

  return (
    <section className="space-y-6">
      <h2 className={cn("text-sm font-medium uppercase tracking-wide", T_SECOND)}>
        Influencer Performance
      </h2>

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
                {!isPublic ? <th className={thCls}>Status</th> : null}
                <th className={thCls}>Published</th>
                <th className={thCls}>Last Synced</th>
                <th className={cn(thCls, "text-right")}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className={cn("px-4 py-10 text-center text-sm", T_MUTED)}>
                    No content matches these filters.
                  </td>
                </tr>
              ) : (
                rows.map((c) => {
                  const info = publishInfo(c);
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
                      <td className={tdCls}>{contentName(c)}</td>
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
                      {!isPublic ? (
                        <td className={tdCls}>
                          {c.status ? <StatusBadge reviewStatus={c.status} /> : null}
                        </td>
                      ) : null}
                      <td className={tdCls}>
                        {info ? (
                          <span
                            className={info.label === "Approved" ? T_MUTED : undefined}
                            title={
                              info.label === "Approved"
                                ? "Approval date (no publish date captured yet)"
                                : "Published"
                            }
                          >
                            {info.date}
                          </span>
                        ) : (
                          <span className={T_MUTED}>—</span>
                        )}
                      </td>
                      <td className={tdCls}>
                        {synced ?? <span className={T_MUTED}>Not yet synced</span>}
                      </td>
                      <td className={cn(tdCls, "text-right")}>
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
                          {/* Analytics is an internal owner tool — hidden publicly. */}
                          {!isPublic ? (
                            <span title="Coming soon">
                              <button
                                type="button"
                                disabled
                                className="cursor-not-allowed rounded-lg p-1.5 text-[#9CA3AF] opacity-60 dark:text-neutral-600"
                              >
                                <TrendingUp className="h-4 w-4" />
                              </button>
                            </span>
                          ) : null}
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

// ── Public entry point ───────────────────────────────────────────────────────

/**
 * The full report body (all six sections). Wrap it in a page-level canvas.
 * `isPublic` switches the owner-only affordances off; `onShare` wires the
 * header's "Share Report" button (owner view only).
 */
export function CampaignReportBody({
  report,
  isPublic = false,
  onShare,
}: {
  report: ReportViewData;
  isPublic?: boolean;
  onShare?: () => void;
}) {
  return (
    <div className="space-y-10">
      <CampaignHeader report={report} isPublic={isPublic} onShare={onShare} />
      <CampaignProgress report={report} />
      <PerformanceSummary report={report} />
      <ContentTimeline report={report} isPublic={isPublic} />
      <FeaturedShowcase report={report} isPublic={isPublic} />
      <InfluencerTable report={report} isPublic={isPublic} />
    </div>
  );
}
