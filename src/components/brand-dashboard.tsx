"use client";

import Link from "next/link";
import { brandCampaigns } from "@/mock/brand-campaigns";
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
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

const kpis_template = [
  { label: "Active Campaigns", key: "activeCampaigns", icon: Rocket, color: "text-blue-600" },
  { label: "Influencers Hired", key: "influencersHired", icon: Users, color: "text-primary" },
  { label: "Budget Spent", key: "budgetSpent", icon: Wallet, color: "text-emerald-600" },
  { label: "Avg. Engagement", key: "avgEngagement", icon: TrendingUp, color: "text-primary" },
  { label: "Total Reach", key: "totalReach", icon: Target, color: "text-amber-600" }
];

export function BrandDashboard({ data }: { data: any }) {
  const stats = {
    activeCampaigns: data?.stats?.activeCampaigns ?? 0,
    influencersHired: data?.stats?.influencersHired ?? 0,
    budgetSpent: data?.stats?.budgetSpent ?? 0,
    avgEngagement: data?.stats?.avgEngagement ?? "0%",
    totalReach: data?.stats?.totalReach ?? "0",
  };

  const active = data?.activeCampaigns || brandCampaigns.filter((c) => c.status === "active");

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-serif">Brand Dashboard</h1>
        <p className="text-muted-foreground">Monitor your campaign performance and collaborate with creators.</p>
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
                {item.key === "budgetSpent" && typeof stats[item.key] === "number" 
                  ? `THB ${stats[item.key].toLocaleString()}` 
                  : stats[item.key]}
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
            <CardDescription>Aggregate metrics across all active channels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Impressions</p>
                <p className="text-xl font-bold">4.2M</p>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px]">
                  +12% vs last week
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Engagements</p>
                <p className="text-xl font-bold">62K</p>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px]">
                  +8% vs last week
                </Badge>
              </div>
            </div>
            <div className="mt-8 h-2 w-full rounded-full bg-muted overflow-hidden flex">
              <div className="h-full bg-primary w-[65%]" />
              <div className="h-full bg-secondary w-[25%]" />
              <div className="h-full bg-slate-300 w-[10%]" />
            </div>
            <div className="mt-4 flex gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-primary" /> TikTok</span>
              <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-secondary" /> Instagram</span>
              <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-slate-300" /> Others</span>
            </div>
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
              <span className="font-bold">THB {stats.budgetSpent?.toLocaleString() || "0"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Spent vs Remaining</span>
              <span className="font-bold">62% / 38%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none font-bold">9 Paid / 1 Pending</Badge>
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
            {[
              "New application for Summer Skincare",
              "Content approved for Healthy Snack campaign",
              "Unread messages from 2 creators"
            ].map((act, i) => (
              <div key={i} className="flex items-center gap-3 text-sm font-medium">
                <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-foreground">{act}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
