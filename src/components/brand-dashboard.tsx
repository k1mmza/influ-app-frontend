"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Rocket,
  Wallet,
  Users,
  TrendingUp,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Megaphone,
  Search,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { apiGetConversations, apiGetCampaigns } from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// One actionable row in the "Needs your attention" section. Keeping every item
// in this single shape means new item types slot in without touching render.
type AttentionItem = {
  key: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  href: string;
  cta: string;
};

export function BrandDashboard({
  data,
  variant = "brand",
}: {
  data: any;
  variant?: "brand" | "agency";
}) {
  const { token } = useUserStore();
  const [waitingConvos, setWaitingConvos] = useState<any[]>([]);
  const [pendingCampaigns, setPendingCampaigns] = useState<
    { id: string; name: string; pendingCount: number }[]
  >([]);
  // Full campaigns list (also feeds pendingCampaigns) — used to paginate the
  // Active Campaigns grid over EVERY active campaign, not just the ≤5 the
  // /dashboard payload returns.
  const [allCampaigns, setAllCampaigns] = useState<any[]>([]);
  const [activePage, setActivePage] = useState(1);
  const [loadingAttention, setLoadingAttention] = useState(true);

  // Attention-item data. Each source degrades independently (allSettled) so one
  // failing endpoint never blanks the whole section.
  //  • Waiting on you    = creator marked their phase ready, brand hasn't → brand's turn.
  //  • Applications      = PENDING applications the influencer submitted (origin APPLICATION),
  //                        read straight off the campaigns list (status/origin now selected).
  useEffect(() => {
    if (!token) {
      setLoadingAttention(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [convosRes, campaignsRes] = await Promise.allSettled([
        apiGetConversations(token),
        apiGetCampaigns(token),
      ]);
      if (cancelled) return;

      if (convosRes.status === "fulfilled") {
        const convos = Array.isArray(convosRes.value) ? convosRes.value : [];
        setWaitingConvos(
          convos.filter(
            (c: any) => c.influencerPhaseReady === true && c.brandPhaseReady === false,
          ),
        );
      }

      if (campaignsRes.status === "fulfilled") {
        const campaigns = Array.isArray(campaignsRes.value) ? campaignsRes.value : [];
        setAllCampaigns(campaigns);
        setPendingCampaigns(
          campaigns
            .map((c: any) => ({
              id: c.id,
              name: c.name,
              pendingCount: Array.isArray(c.applications)
                ? c.applications.filter(
                    (a: any) => a.status === "PENDING" && a.origin === "APPLICATION",
                  ).length
                : 0,
            }))
            .filter((c: { pendingCount: number }) => c.pendingCount > 0),
        );
      }

      setLoadingAttention(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const rawStats = data?.stats ?? {};
  const stats: Record<string, string | number> = {
    activeCampaigns: rawStats.activeCampaigns ?? 0,
    budgetSpent: rawStats.budgetSpent ?? 0,
    unreadMessages: rawStats.unreadMessages ?? 0,
    avgEngagement: rawStats.avgEngagement != null ? `${Number(rawStats.avgEngagement).toFixed(1)}%` : "—",
  };

  // Prefer the full campaigns fetch (ACTIVE + PUBLIC = "active", same as the
  // backend KPI) so the grid can paginate over every active campaign. Fall back
  // to the ≤5 the /dashboard payload embeds until that fetch resolves.
  const active: any[] = allCampaigns.length
    ? allCampaigns.filter((c: any) => c.status === "ACTIVE" || c.status === "PUBLIC")
    : (data?.activeCampaigns ?? []);
  const ACTIVE_PER_PAGE = 4;
  const activeTotalPages = Math.max(1, Math.ceil(active.length / ACTIVE_PER_PAGE));
  const pagedActive = active.slice((activePage - 1) * ACTIVE_PER_PAGE, activePage * ACTIVE_PER_PAGE);
  // Authoritative total from stats when the full list hasn't loaded; once it has,
  // active.length is the real count across every active campaign.
  const activeCampaignCount = allCampaigns.length ? active.length : Number(stats.activeCampaigns) || 0;
  useEffect(() => {
    if (activePage > activeTotalPages) setActivePage(activeTotalPages);
  }, [activePage, activeTotalPages]);
  const performance = { impressions: data?.performance?.impressions ?? 0, engagements: data?.performance?.engagements ?? 0 };
  const payments = {
    paidCount: data?.payments?.paidCount ?? 0,
    pendingCount: data?.payments?.pendingCount ?? 0,
    activeBudget: data?.payments?.activeBudget ?? 0,
    budgetSpent: data?.payments?.budgetSpent ?? 0,
    // Spend scoped to active campaigns only — shares activeBudget's scope, so the
    // two divide into a meaningful %. Do NOT use budgetSpent here: that's all-time
    // spend across every campaign status, a different set than activeBudget.
    activeBudgetSpent: data?.payments?.activeBudgetSpent ?? 0,
  };
  const recentActivity: any[] = data?.recentActivity ?? [];
  const spentPct = payments.activeBudget > 0 ? Math.min(100, Math.round((payments.activeBudgetSpent / payments.activeBudget) * 100)) : 0;

  // Build the attention list. Order = most-actionable first. New item types are
  // added by pushing more entries here — the render below is agnostic to them.
  const attentionItems: AttentionItem[] = [];

  // a) Conversations where the creator is waiting on the brand.
  for (const conv of waitingConvos) {
    const partner = conv.partnerName ?? "A creator";
    attentionItems.push({
      key: `conv-${conv.id}`,
      icon: MessageSquare,
      title: conv.campaignName ? `${partner} · ${conv.campaignName}` : partner,
      description: "Marked their phase ready — your turn to review",
      href: `/messages?convId=${conv.id}`,
      cta: "Open",
    });
  }

  // b) Applications awaiting the brand's review — one row per campaign with pending applicants.
  for (const c of pendingCampaigns) {
    attentionItems.push({
      key: `apps-${c.id}`,
      icon: Users,
      title: `${c.pendingCount} application${c.pendingCount === 1 ? "" : "s"} to review`,
      description: c.name,
      href: `/campaigns/${c.id}`,
      cta: "Review",
    });
  }

  // c) Payments awaiting the brand's confirmation (count is in the dashboard payload).
  if (payments.pendingCount > 0) {
    attentionItems.push({
      key: "payments-pending",
      icon: Wallet,
      title: `${payments.pendingCount} payment${payments.pendingCount === 1 ? "" : "s"} need attention`,
      description: "Awaiting your confirmation",
      href: "/messages",
      cta: "Review",
    });
  }

  // EXTENSION POINT — next attention item, blocked on a P'Nut backend aggregate:
  //   • "Drafts to approve" → Draft.status === "SUBMITTED" across the brand's campaigns
  //     (only exposed per-conversation today; needs an aggregate endpoint first).
  // Push it here once that endpoint exists. Do NOT N+1 fan-out per conversation.

  const workspaceLabel = variant === "agency" ? "Agency workspace" : "Brand workspace";

  // Stamp KPI tiles — mirror the InfluencerDashboard travelogue idiom (faint icon
  // watermark + serif value). `big` shrinks the money tile so it never overflows.
  const hasUnread = Number(stats.unreadMessages) > 0;
  const kpis: Array<{
    label: string;
    value: string;
    hint: string;
    icon: LucideIcon;
    big?: boolean;
    link?: { href: string; label: string };
  }> = [
    { label: "Active Campaigns", value: String(activeCampaignCount), hint: "In progress", icon: Rocket },
    {
      label: "Budget Spent",
      value: `THB ${Number(rawStats.budgetSpent ?? 0).toLocaleString()}`,
      hint: payments.activeBudget > 0 ? `${spentPct}% of active budget` : "All-time spend",
      icon: Wallet,
      big: true,
    },
    {
      label: "Unread Messages",
      value: String(stats.unreadMessages),
      hint: waitingConvos.length > 0 ? `${waitingConvos.length} waiting on you` : "In your inbox",
      icon: MessageSquare,
      ...(hasUnread ? { link: { href: "/messages", label: "View Messages" } } : {}),
    },
    { label: "Avg. Engagement", value: String(stats.avgEngagement), hint: "Across live posts", icon: TrendingUp },
  ];

  return (
    <div className="space-y-8">
      {/* Slate header band */}
      <header className="relative overflow-hidden rounded-2xl bg-[#334155] px-6 py-10 text-white shadow-sm sm:px-8">
        <div className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 select-none opacity-[0.07]">
          <Megaphone className="h-40 w-40" />
        </div>
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">{workspaceLabel}</p>
            <h1 className="mt-2 font-serif text-3xl font-bold">Welcome back</h1>
            <p className="mt-1 text-sm text-white/70">
              {variant === "agency"
                ? "Your portfolio's campaigns, applicants, and spend at a glance."
                : "Your campaigns, applicants, and spend at a glance."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white/20"
            >
              <Search className="h-4 w-4" /> Discover Creators
            </Link>
            <Link
              href="/campaigns/create"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#334155] shadow-lg shadow-black/20 transition hover:bg-white/90"
            >
              <Plus className="h-4 w-4" /> New Campaign
            </Link>
          </div>
        </div>
      </header>

      {/* KPI grid — stamp cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, hint, icon: Icon, big, link }) => (
          <div
            key={label}
            className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow duration-300 hover:shadow-md"
          >
            <Icon className="pointer-events-none absolute right-3 top-3 h-10 w-10 text-primary/[0.06]" />
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
              <Icon className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <div className="mt-2 flex min-h-[2.5rem] items-end">
              <p className={cn("font-serif font-bold leading-none text-primary", big ? "text-2xl" : "text-4xl")}>{value}</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
            {link && (
              <Link
                href={link.href}
                className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full bg-primary/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary transition hover:bg-primary/20"
              >
                <MessageSquare className="h-3.5 w-3.5" /> {link.label}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Bento: active campaigns (left) + needs-attention rail (right) */}
      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-8">
          <div className="mb-6 flex items-baseline justify-between">
            <h4 className="font-serif text-xl font-semibold text-foreground">Active Campaigns</h4>
            <Link href="/campaigns" className="border-b border-primary/30 text-xs font-semibold uppercase tracking-widest text-primary transition hover:border-primary">
              View All
            </Link>
          </div>
          {active.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
              <Rocket className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">No active campaigns yet. Publish a campaign to start collaborating.</p>
              <Link href="/campaigns/create" className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground transition hover:opacity-90">
                <Plus className="h-4 w-4" /> Create Campaign
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {pagedActive.map((c: any) => {
                const applicants =
                  c._count?.applications ?? (Array.isArray(c.applications) ? c.applications.length : 0);
                const budget = c.budget ?? 0;
                const spent = c.budgetSpent ?? 0;
                const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
                // PUBLIC = open for applications; ACTIVE = running with creators.
                const isOpen = c.status === "PUBLIC";
                return (
                  <div
                    key={c.id}
                    className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
                  >
                    {/* Editorial banner strip — uploaded cover when present, gradient fallback */}
                    <div className="relative flex h-28 items-end overflow-hidden bg-gradient-to-br from-[#334155] via-[#3f4d5e] to-primary/60 p-4">
                      {c.coverImageUrl && (
                        <>
                          <img
                            src={c.coverImageUrl}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                        </>
                      )}
                      <span
                        className={cn(
                          "absolute right-4 top-4 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                          isOpen ? "bg-secondary-container text-on-secondary-container" : "bg-white/85 text-[#334155]",
                        )}
                      >
                        {isOpen ? "Open" : "Active"}
                      </span>
                      <p className="line-clamp-2 font-serif text-lg font-semibold text-white">{c.name}</p>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex justify-between">
                        <div className="px-2 text-center">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Applicants</p>
                          <p className="font-serif text-lg font-semibold text-foreground">{applicants}</p>
                        </div>
                        <div className="border-l border-border px-2 text-center">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Spent</p>
                          <p className="font-serif text-lg font-semibold text-foreground">{budget > 0 ? `${formatCompact(spent)}` : "—"}</p>
                        </div>
                        <div className="border-l border-border px-2 text-center">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Budget</p>
                          <p className="font-serif text-lg font-semibold text-foreground">{budget > 0 ? `${formatCompact(budget)}` : "—"}</p>
                        </div>
                      </div>
                      {budget > 0 && (
                        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted-foreground/15">
                          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                      <Link
                        href={`/campaigns/${c.id}`}
                        className="mt-5 flex items-center justify-between border-b border-transparent pb-1 text-sm font-semibold text-primary transition-colors hover:border-primary/40"
                      >
                        Manage Campaign <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
              {active.length > ACTIVE_PER_PAGE && (
                <div className="flex items-center justify-between border-t border-border pt-4 sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                      disabled={activePage === 1}
                      aria-label="Previous page"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: activeTotalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setActivePage(p)}
                        aria-current={p === activePage ? "page" : undefined}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition cursor-pointer",
                          p === activePage
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setActivePage((p) => Math.min(activeTotalPages, p + 1))}
                      disabled={activePage === activeTotalPages}
                      aria-label="Next page"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="font-serif text-sm italic text-muted-foreground">
                    Showing {(activePage - 1) * ACTIVE_PER_PAGE + 1}–{Math.min(activePage * ACTIVE_PER_PAGE, active.length)} of {active.length}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Needs your attention rail */}
        <section className="col-span-12 lg:col-span-4">
          <div className="relative h-full overflow-hidden rounded-2xl border border-border bg-muted/40 p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <h4 className="font-serif text-xl font-semibold text-foreground">Needs your attention</h4>
              {attentionItems.length > 0 && (
                <Badge className="bg-primary text-primary-foreground">{attentionItems.length}</Badge>
              )}
            </div>
            <div className="space-y-3">
              {loadingAttention && attentionItems.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Checking for items…
                </div>
              ) : attentionItems.length === 0 ? (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-6">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-secondary" />
                  <div>
                    <p className="text-sm font-bold text-foreground">You&apos;re all caught up</p>
                    <p className="text-sm text-muted-foreground">Nothing needs your attention right now.</p>
                  </div>
                </div>
              ) : (
                attentionItems.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="group flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">{item.title}</p>
                        {item.description && (
                          <p className="truncate text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-primary">
                      {item.cta} <ChevronRight className="h-4 w-4" />
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Performance + Budget row — plain sections on porcelain (no card, no icon) */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h4 className="mb-6 font-serif text-xl font-semibold text-foreground">Campaign Performance</h4>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Impressions</p>
                <p className="font-serif text-2xl font-bold text-foreground">{formatCompact(performance.impressions)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Engagements</p>
                <p className="font-serif text-2xl font-bold text-foreground">{formatCompact(performance.engagements)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Avg. Eng.</p>
                <p className="font-serif text-2xl font-bold text-foreground">{stats.avgEngagement}</p>
              </div>
            </div>
            {performance.impressions === 0 && performance.engagements === 0 && (
              <p className="mt-6 text-sm text-muted-foreground">
                No tracking data yet — metrics appear once creators submit and we sync their posts.
              </p>
            )}
          </div>
        </section>

        <section>
          <h4 className="mb-6 font-serif text-xl font-semibold text-foreground">Budget &amp; Payments</h4>
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6 text-sm font-medium shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Budget (Active)</span>
              <span className="font-serif text-base font-bold text-primary">THB {payments.activeBudget.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Spent vs Remaining</span>
              <span className="font-bold">{spentPct}% / {100 - spentPct}%</span>
            </div>
            {payments.activeBudget > 0 && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted-foreground/15">
                <div className="h-full rounded-full bg-secondary transition-all duration-300" style={{ width: `${spentPct}%` }} />
              </div>
            )}
            <div className="flex justify-between items-center pt-1">
              <span className="text-muted-foreground">Status</span>
              <span className="font-bold text-foreground">
                {payments.paidCount} Paid / {payments.pendingCount} Pending
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Recent activity — plain heading + bordered container (no card fill, no icon) */}
      <section>
        <h4 className="mb-6 font-serif text-xl font-semibold text-foreground">Recent Activity</h4>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {recentActivity.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No recent activity yet.</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((act: any) => (
                <div key={act.id} className="flex items-start gap-3 text-sm font-medium">
                  <div className={cn("mt-1.5 h-1.5 w-1.5 rounded-full shrink-0", act.isRead ? "bg-muted-foreground/40" : "bg-primary")} />
                  <div className="min-w-0">
                    <span className="text-foreground">{act.title}</span>
                    {act.body ? <p className="text-sm text-muted-foreground line-clamp-1">{act.body}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
