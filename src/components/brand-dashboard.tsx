"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardHeaderAction, DashboardPageHeader } from "@/components/dashboard-page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Rocket,
  Wallet,
  TrendingUp,
  BarChart3,
  MessageSquare,
  Bell,
  ChevronRight,
  CheckCircle2,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { apiGetConversations } from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// Status band trimmed to the two numbers that back a brand decision.
// (Total Reach + Influencers Hired were vanity; Avg Engagement moved into the
// Campaign Performance card where it has context.)
const kpis_template = [
  { label: "Active Campaigns", key: "activeCampaigns", icon: Rocket, color: "text-blue-600" },
  { label: "Budget Spent", key: "budgetSpent", icon: Wallet, color: "text-emerald-600" },
];

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

export function BrandDashboard({ data }: { data: any }) {
  const { token } = useUserStore();
  const [waitingConvos, setWaitingConvos] = useState<any[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(true);

  // "Waiting on you" = creator marked their phase ready, brand hasn't → brand's turn.
  useEffect(() => {
    if (!token) {
      setLoadingConvos(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const convos = await apiGetConversations(token);
        if (!cancelled) {
          setWaitingConvos(
            (Array.isArray(convos) ? convos : []).filter(
              (c: any) => c.influencerPhaseReady === true && c.brandPhaseReady === false,
            ),
          );
        }
      } catch {
        // Degrade gracefully — the payments attention item still renders.
      } finally {
        if (!cancelled) setLoadingConvos(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const rawStats = data?.stats ?? {};
  const stats: Record<string, string | number> = {
    activeCampaigns: rawStats.activeCampaigns ?? 0,
    budgetSpent: rawStats.budgetSpent ?? 0,
    avgEngagement: rawStats.avgEngagement != null ? `${Number(rawStats.avgEngagement).toFixed(1)}%` : "—",
  };

  const active: any[] = data?.activeCampaigns ?? [];
  const performance = { impressions: data?.performance?.impressions ?? 0, engagements: data?.performance?.engagements ?? 0 };
  const payments = {
    paidCount: data?.payments?.paidCount ?? 0,
    pendingCount: data?.payments?.pendingCount ?? 0,
    activeBudget: data?.payments?.activeBudget ?? 0,
    budgetSpent: data?.payments?.budgetSpent ?? 0,
  };
  const recentActivity: any[] = data?.recentActivity ?? [];
  const spentPct = payments.activeBudget > 0 ? Math.min(100, Math.round((payments.budgetSpent / payments.activeBudget) * 100)) : 0;

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

  // b) Payments awaiting the brand's confirmation (count is in the dashboard payload).
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

  // EXTENSION POINT — future attention items, blocked on a P'Nut backend aggregate:
  //   • "Drafts to approve"      → Draft.status === "SUBMITTED" across the brand's campaigns
  //   • "Applications to review" → CampaignApplication PENDING across the brand's campaigns
  // Push them here once an aggregate endpoint exists. Do NOT N+1 fan-out per
  // conversation/campaign to synthesize them from the current per-scope endpoints.

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Brand Dashboard"
        subtitle="Monitor your campaign performance and collaborate with creators."
        badge={`${active.length} active campaign${active.length === 1 ? "" : "s"}`}
        action={
          <Link href="/campaigns/create">
            <DashboardHeaderAction>Create campaign</DashboardHeaderAction>
          </Link>
        }
      />

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500" />
            Needs your attention
            {attentionItems.length > 0 && (
              <Badge className="bg-primary text-primary-foreground">{attentionItems.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>Items waiting on a decision or action from you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingConvos && attentionItems.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking for items…
            </div>
          ) : attentionItems.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-6">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <p className="font-bold text-sm text-foreground">You&apos;re all caught up</p>
                <p className="text-xs text-muted-foreground">Nothing needs your attention right now.</p>
              </div>
            </div>
          ) : (
            attentionItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="group flex items-center justify-between rounded-xl border border-border bg-muted/50 px-4 py-3 transition-all hover:bg-muted"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{item.title}</p>
                    {item.description && (
                      <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-primary">
                  {item.cta} <ChevronRight className="h-4 w-4" />
                </span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {kpis_template.map((item) => (
          <Card key={item.label} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{item.label}</p>
                <item.icon className={cn("h-4 w-4", item.color)} />
              </div>
              <p className="mt-2 text-xl font-bold tracking-tight text-foreground">
                {item.key === "budgetSpent" && typeof (stats as any)[item.key] === "number"
                  ? `THB ${(stats as any)[item.key].toLocaleString()}`
                  : (stats as any)[item.key]}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Campaign Performance
            </CardTitle>
            <CardDescription>Aggregate metrics from live tracking snapshots</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Impressions</p>
                <p className="text-xl font-bold">{formatCompact(performance.impressions)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Engagements</p>
                <p className="text-xl font-bold">{formatCompact(performance.engagements)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-primary" /> Avg. Eng.
                </p>
                <p className="text-xl font-bold">{stats.avgEngagement}</p>
              </div>
            </div>
            {performance.impressions === 0 && performance.engagements === 0 && (
              <p className="mt-6 text-sm text-muted-foreground">
                No tracking data yet — metrics appear once creators submit and we sync their posts.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              Active Campaigns
            </CardTitle>
            <CardDescription>Manage your current collaborations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {active.length === 0 && (
              <p className="text-sm text-muted-foreground">No active campaigns yet. Publish a campaign to start collaborating.</p>
            )}
            {active.map((c: any) => (
              <div key={c.id} className="group flex items-center justify-between rounded-xl border border-border bg-muted/50 px-4 py-3 transition-all hover:bg-muted">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-sm text-foreground">{c.name}</span>
                </div>
                <Button variant="ghost" size="sm" asChild className="h-8 px-2 font-bold text-primary hover:text-primary/80">
                  <Link href={`/campaigns/${c.id}`}>
                    Manage <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-600" />
              Budget & Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm font-medium">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Budget (Active)</span>
              <span className="font-bold">THB {payments.activeBudget.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Spent vs Remaining</span>
              <span className="font-bold">{spentPct}% / {100 - spentPct}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/15 border-none font-bold">
                {payments.paidCount} Paid / {payments.pendingCount} Pending
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.length === 0 && (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            )}
            {recentActivity.map((act: any) => (
              <div key={act.id} className="flex items-start gap-3 text-sm font-medium">
                <div className={cn("mt-1.5 h-1.5 w-1.5 rounded-full shrink-0", act.isRead ? "bg-muted-foreground/40" : "bg-primary")} />
                <div className="min-w-0">
                  <span className="text-foreground">{act.title}</span>
                  {act.body ? <p className="text-xs text-muted-foreground line-clamp-1">{act.body}</p> : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
