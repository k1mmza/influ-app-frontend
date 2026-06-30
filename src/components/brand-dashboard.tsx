"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Rocket,
  Users,
  Wallet,
  TrendingUp,
  BarChart3,
  Search,
  MessageSquare,
  BarChart2,
  Bell,
  ChevronRight,
  Target,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const kpis_template = [
  { label: "Active Campaigns", key: "activeCampaigns", icon: Rocket, color: "text-blue-600" },
  { label: "Influencers Hired", key: "influencersHired", icon: Users, color: "text-primary" },
  { label: "Budget Spent", key: "budgetSpent", icon: Wallet, color: "text-emerald-600" },
  { label: "Avg. Engagement", key: "avgEngagement", icon: TrendingUp, color: "text-primary" },
  { label: "Total Reach", key: "totalReach", icon: Target, color: "text-amber-600" }
];

export function BrandDashboard({ data }: { data: any }) {
  const rawStats = data?.stats ?? {};
  const stats: Record<string, string | number> = {
    activeCampaigns: rawStats.activeCampaigns ?? 0,
    influencersHired: rawStats.influencersHired ?? 0,
    budgetSpent: rawStats.budgetSpent ?? 0,
    avgEngagement: rawStats.avgEngagement != null ? `${Number(rawStats.avgEngagement).toFixed(1)}%` : "—",
    totalReach: formatCompact(rawStats.totalReach ?? 0),
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

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-[#1e3a8a] to-[#1e1b4b] p-7 text-white shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">Brand</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight font-serif">Brand Dashboard</h1>
        <p className="mt-1 text-white/70 font-medium">Monitor your campaign performance and collaborate with creators.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Impressions</p>
                <p className="text-xl font-bold">{formatCompact(performance.impressions)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Engagements</p>
                <p className="text-xl font-bold">{formatCompact(performance.engagements)}</p>
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

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { title: "Discover", desc: "Find new creators for your next campaign.", link: "/discover", icon: Search, color: "bg-blue-100 text-blue-600" },
          { title: "Messages", desc: "Collaborate and share briefs in real-time.", link: "/messages", icon: MessageSquare, color: "bg-primary/10 text-primary" },
          { title: "Tracking", desc: "Live post-level metrics and exportable reports.", link: "/tracking", icon: BarChart2, color: "bg-purple-100 text-purple-600" }
        ].map((tool) => (
          <Card key={tool.title} className="border-none shadow-sm transition-all hover:shadow-md group">
            <CardContent className="p-6">
              <div className={cn("mb-4 flex h-10 w-10 items-center justify-center rounded-xl transition-all group-hover:scale-110", tool.color)}>
                <tool.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-foreground font-serif">{tool.title}</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
              <Button variant="link" asChild className="mt-4 px-0 h-auto font-bold text-primary">
                <Link href={tool.link}>Open {tool.title} <ChevronRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm bg-gradient-to-br from-primary to-secondary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-white/80" />
            Strategy Assistant
          </CardTitle>
          <CardDescription className="text-white/60">AI-driven campaign brief and planning</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {[
              "Generate strategy, concept, and creative brief with AI",
              "Turn campaign requirements into a ready-to-send creator brief",
              "Refine plans in real-time with the AI prompt interface",
            ].map((text) => (
              <li key={text} className="flex items-start gap-3 text-sm text-white/80 font-medium">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-white/60 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
          <Button asChild className="mt-8 w-full rounded-xl bg-white/15 text-white border border-white/20 hover:bg-white/25">
            <Link href="/smart-plan">Generate New Strategy</Link>
          </Button>
        </CardContent>
      </Card>

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
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none font-bold">
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
