"use client";

/**
 * Public, account-less "Share Campaign" page.
 *
 * What a visitor sees when they open a shared campaign link (no login). It fetches
 * the presentation-safe public DTO by share token and renders a safe subset of the
 * campaign brief — never budget, payment, applicant, or internal data.
 *
 * The app-shell renders this route bare (no sidebar/nav) since the visitor has no
 * account. A 404 (unknown / revoked / expired token) shows a friendly "link
 * unavailable" state rather than leaking whether the campaign exists.
 */

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Link2 } from "lucide-react";
import { apiGetPublicCampaign, fileUrl, type PublicCampaign, type CampaignRequirementInput } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Subtle semantic tint for the status pill. Neutral-minimal accent overall, but
// status is meaningful so it keeps a small color cue (light + dark idiom).
function statusClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "active" || s === "accepted" || s === "live")
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
  if (s === "draft" || s === "pending")
    return "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
  if (s === "completed" || s === "closed")
    return "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300";
  if (s === "rejected" || s === "cancelled" || s === "archived")
    return "bg-destructive/10 text-destructive";
  return "bg-muted text-muted-foreground";
}

// Proportional campaign timeline. Nodes sit along the track spaced by their real
// dates (not evenly), with a "today" marker and passed-vs-upcoming styling.
// Horizontal on >= sm, falls back to a vertical list on narrow screens.
function CampaignTimeline({ milestones }: { milestones: { label: string; iso: string | null }[] }) {
  const now = Date.now();
  const clamp = (n: number) => Math.max(0, Math.min(100, n));

  const nodes = milestones
    .map((m) => ({ label: m.label, time: m.iso ? new Date(m.iso).getTime() : NaN, dateLabel: formatDate(m.iso) }))
    .filter((m): m is { label: string; time: number; dateLabel: string } => !Number.isNaN(m.time) && !!m.dateLabel)
    .sort((a, b) => a.time - b.time);

  if (nodes.length === 0) return null;

  // Domain spans the milestones AND today, so when the whole campaign is still
  // upcoming (start > today) or already over, the Today marker sits in its own
  // space instead of gluing onto the first/last node.
  const min = Math.min(nodes[0].time, now);
  const max = Math.max(nodes[nodes.length - 1].time, now);
  const span = max - min;
  // ponytail: even fallback when span is 0 (single node / equal dates) avoids /0 and overlap
  const positioned = nodes.map((n, i) => ({
    ...n,
    pct: span > 0 ? clamp(((n.time - min) / span) * 100) : nodes.length > 1 ? (i / (nodes.length - 1)) * 100 : 50,
    passed: n.time <= now,
  }));
  const nowPct = span > 0 ? clamp(((now - min) / span) * 100) : now >= max ? 100 : 0;
  const leftFor = (p: number) => `calc(1.5rem + (100% - 3rem) * ${p / 100})`;

  // Vertical sequence: milestones with a "Today" marker spliced at its chronological spot.
  const passedCount = positioned.filter((n) => n.passed).length;
  const vItems = [
    ...positioned.slice(0, passedCount).map((n) => ({ type: "node" as const, elapsed: true, ...n })),
    { type: "today" as const, elapsed: true, label: "Today", dateLabel: formatDate(new Date(now).toISOString()) },
    ...positioned.slice(passedCount).map((n) => ({ type: "node" as const, elapsed: false, ...n })),
  ];

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Horizontal (>= sm) */}
        <div className="relative hidden h-24 sm:block">
          <div className="absolute inset-x-6 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-border" />
          <div
            className="absolute left-6 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-foreground/70"
            style={{ width: `calc((100% - 3rem) * ${nowPct / 100})` }}
          />
          {/* today marker */}
          <span
            className="absolute top-1/2 h-8 w-px -translate-x-1/2 -translate-y-1/2 bg-foreground/40"
            style={{ left: leftFor(nowPct) }}
          />
          <span
            className="absolute top-0 z-20 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wide text-foreground"
            style={{ left: leftFor(nowPct) }}
          >
            Today
          </span>
          {/* nodes */}
          {positioned.map((n, i) => (
            <div key={i}>
              <span
                className={cn(
                  "absolute top-1/2 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full",
                  n.passed
                    ? "bg-foreground ring-2 ring-background"
                    : "border-2 border-muted-foreground/40 bg-background"
                )}
                style={{ left: leftFor(n.pct) }}
              />
              <div
                className={cn(
                  "absolute w-20 -translate-x-1/2 text-center",
                  i % 2 === 0 ? "bottom-[calc(50%+0.85rem)]" : "top-[calc(50%+0.85rem)]"
                )}
                style={{ left: leftFor(n.pct) }}
              >
                <p className="text-[11px] font-medium leading-tight text-foreground">{n.label}</p>
                <p className="text-[11px] leading-tight tabular-nums text-muted-foreground">{n.dateLabel}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Vertical (< sm) */}
        <ol className="space-y-6 sm:hidden">
          {vItems.map((it, i) => (
            <li key={i} className="relative flex items-start gap-4">
              {i > 0 ? (
                <span
                  className={cn(
                    "absolute left-[5px] -top-6 h-6 w-0.5 -translate-x-1/2",
                    it.elapsed ? "bg-foreground/70" : "bg-border"
                  )}
                />
              ) : null}
              {it.type === "today" ? (
                <>
                  <span className="relative z-10 mt-0.5 h-2.5 w-2.5 shrink-0 -translate-x-px rounded-full bg-foreground ring-2 ring-background" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                    Today · {it.dateLabel}
                  </p>
                </>
              ) : (
                <>
                  <span
                    className={cn(
                      "relative z-10 mt-1 h-2.5 w-2.5 shrink-0 -translate-x-px rounded-full",
                      it.elapsed
                        ? "bg-foreground ring-2 ring-background"
                        : "border-2 border-muted-foreground/40 bg-background"
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{it.label}</p>
                    <p className="text-xs tabular-nums text-muted-foreground">{it.dateLabel}</p>
                  </div>
                </>
              )}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-relaxed text-muted-foreground">{children}</CardContent>
    </Card>
  );
}

function ProseSection({ title, body }: { title: string; body: string }) {
  return (
    <SectionCard title={title}>
      <p className="whitespace-pre-wrap">{body}</p>
    </SectionCard>
  );
}

// One requirement block → a clean label/value spec grid + chip groups for lists.
function RequirementBlock({ r }: { r: CampaignRequirementInput }) {
  const specs = [
    r.minFollowers ? { label: "Min followers", value: r.minFollowers.toLocaleString() } : null,
    r.minEngagementRate ? { label: "Min engagement", value: `${r.minEngagementRate}%` } : null,
    r.minAvgViews ? { label: "Min avg views", value: r.minAvgViews.toLocaleString() } : null,
    r.followerTier ? { label: "Follower tier", value: r.followerTier } : null,
    r.contentType ? { label: "Content type", value: r.contentType } : null,
  ].filter((x): x is { label: string; value: string } => x !== null);

  const chipGroups = [
    { label: "Platforms", items: r.platforms },
    { label: "Categories", items: r.categories },
    { label: "Locations", items: r.locations },
  ].filter((g) => g.items?.length);

  return (
    <div className="space-y-4">
      {specs.length ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          {specs.map((s) => (
            <div key={s.label}>
              <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {s.label}
              </dt>
              <dd className="mt-1 font-serif text-base font-semibold tabular-nums text-foreground">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {chipGroups.map((g) => (
        <div key={g.label}>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {g.label}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {g.items!.map((item) => (
              <Badge key={item} variant="secondary" className="rounded-full font-normal capitalize">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PublicCampaignPage() {
  const params = useParams<{ token: string }>();
  const shareToken = params?.token;

  const [campaign, setCampaign] = useState<PublicCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareToken) return;
    setLoading(true);
    apiGetPublicCampaign(shareToken)
      .then((c) => {
        setCampaign(c);
        setError(null);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "This campaign link is no longer available")
      )
      .finally(() => setLoading(false));
  }, [shareToken]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading campaign…
          </div>
        ) : error ? (
          <Card className="mx-auto max-w-md rounded-2xl p-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Link2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="font-serif text-lg font-semibold text-foreground">
              This campaign link is unavailable
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              The link may have expired or been revoked. Please request a new link from the campaign
              owner.
            </p>
          </Card>
        ) : campaign ? (
          <div className="space-y-6">
            {/* Hero header */}
            <Card className="overflow-hidden rounded-2xl">
              {campaign.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fileUrl(campaign.coverImageUrl) ?? ""}
                  alt=""
                  className="h-40 w-full object-cover sm:h-56"
                />
              ) : null}
              <div className="flex items-start gap-4 p-6">
                <Avatar className="h-14 w-14 rounded-xl">
                  {campaign.brandLogoUrl ? (
                    <AvatarImage
                      src={fileUrl(campaign.brandLogoUrl) ?? ""}
                      alt=""
                      className="rounded-xl object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="rounded-xl text-sm font-bold text-muted-foreground">
                    {initials(campaign.brandName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  {campaign.brandName ? (
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {campaign.brandName}
                    </p>
                  ) : null}
                  <h1 className="mt-0.5 break-words font-serif text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                    {campaign.name}
                  </h1>
                  <span
                    className={cn(
                      "mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                      statusClass(campaign.status)
                    )}
                  >
                    {campaign.status.toLowerCase()}
                  </span>
                </div>
              </div>
            </Card>

            {/* Timeline — the 5-second scan */}
            <CampaignTimeline
              milestones={[
                { label: "Started", iso: campaign.startedAt },
                { label: "Apply by", iso: campaign.applyDeadline },
                { label: "Content due", iso: campaign.submissionDate },
                { label: "Review", iso: campaign.reviewDate },
              ]}
            />

            {/* Brief details */}
            {campaign.objective ? <ProseSection title="Objective" body={campaign.objective} /> : null}
            {campaign.keyMessage ? (
              <ProseSection title="Key message" body={campaign.keyMessage} />
            ) : null}
            {campaign.deliverables ? (
              <ProseSection title="Deliverables" body={campaign.deliverables} />
            ) : null}
            {campaign.doAndDont ? (
              <ProseSection title="Do's & Don'ts" body={campaign.doAndDont} />
            ) : null}

            {campaign.requirements.length ? (
              <SectionCard title="Creator requirements">
                <div className="space-y-6">
                  {campaign.requirements.map((r, i) => (
                    <div key={i}>
                      {i > 0 ? <Separator className="mb-6" /> : null}
                      <RequirementBlock r={r} />
                    </div>
                  ))}
                </div>
              </SectionCard>
            ) : null}

            {/* Footer */}
            <div className="pt-2">
              <Separator className="mb-4" />
              <p className="text-center text-xs text-muted-foreground">Shared via InfluApp</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
