"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandDashboard } from "@/components/brand-dashboard";
import { useUserStore } from "@/store/useUserStore";
import { apiGetDashboard } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Rocket, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  UserCircle,
  Bell,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

function InfluencerDashboard({ data }: { data: any }) {
  const stats = {
    walletBalance: data?.stats?.walletBalance ?? 0,
    activeCampaigns: data?.stats?.activeCampaigns ?? 0,
    pendingApplications: data?.stats?.pendingApplications ?? 0,
    unreadMessages: data?.stats?.unreadMessages ?? 0,
  };

  const recommended = data?.recommendedCampaigns || [
    { name: "Summer Skincare Launch", brand: "GlowLab", budget: "THB 8,000", platform: "TikTok", deadline: "30 May 2026", icon: "✨" },
    { name: "Healthy Snack Challenge", brand: "FitBites", budget: "THB 6,500", platform: "Instagram", deadline: "05 Jun 2026", icon: "🍎" }
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-[#dc2626] to-[#7f1d1d] p-7 text-white shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">Influencer</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight font-serif">Influencer Dashboard</h1>
        <p className="mt-1 text-white/70 font-medium">Quick overview of your active campaigns, messages, and earnings.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Wallet Balance", value: `THB ${stats.walletBalance.toLocaleString()}`, icon: Wallet, color: "text-emerald-600" },
          { label: "Active Campaigns", value: stats.activeCampaigns.toString(), icon: Rocket, color: "text-blue-600" },
          { label: "Pending Apps", value: stats.pendingApplications.toString(), icon: FileText, color: "text-amber-600" },
          { label: "Unread Messages", value: stats.unreadMessages.toString(), icon: MessageSquare, color: "text-primary" }
        ].map((item) => (
          <Card key={item.label} className="border-none shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                <item.icon className={cn("h-4 w-4", item.color)} />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-serif">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button className="rounded-xl shadow-lg shadow-primary/20">Find Campaigns</Button>
        <Button variant="outline" className="rounded-xl bg-background">View Messages</Button>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-foreground font-serif">Recommended Campaigns</h2>
          <Button variant="link" className="text-primary font-bold">View all</Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {recommended.map((c: any) => (
            <Card key={c.name} className="border-none shadow-sm transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-2xl font-serif">
                      {c.icon || "📢"}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground font-serif">{c.name}</h3>
                      <p className="text-sm text-muted-foreground">{c.brand || c.clientBrand?.brandName || "Unknown Brand"}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-muted font-bold">{c.platform || "Any"}</Badge>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Budget</p>
                    <p className="text-sm font-semibold text-foreground">THB {c.budget?.toLocaleString() || "0"}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Deadline</p>
                    <p className="text-sm font-semibold text-foreground">{c.deadline || (c.applyDeadline ? new Date(c.applyDeadline).toLocaleDateString() : "TBD")}</p>
                  </div>
                </div>
                <div className="mt-6 flex gap-2">
                  <Button className="flex-1 rounded-xl shadow-sm">Apply Now</Button>
                  <Button variant="secondary" className="rounded-xl bg-muted">Details</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">My Campaigns</CardTitle>
            <CardDescription>Active, Pending, Completed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-muted p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">In Progress</span>
                <span className="font-bold text-primary">{stats.activeCampaigns}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 rounded-lg">Submit Work</Button>
              <Button size="sm" variant="outline" className="flex-1 rounded-lg">Brief</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Performance</CardTitle>
            <CardDescription>Engagement & Growth</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">Growth Rate</span>
              </div>
              <span className="text-sm font-bold text-emerald-600">+9.2%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Engagement</span>
              </div>
              <span className="text-sm font-bold text-foreground">4.8%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Earnings</CardTitle>
            <CardDescription>Portfolio performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Total Earned</p>
              <p className="text-xl font-bold text-foreground">THB 58,200</p>
            </div>
            <Button variant="ghost" className="w-full justify-start px-0 text-primary font-bold">
              View payouts <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AgencyDashboard({ data }: { data: any }) {
  const stats = {
    activeBriefs: data?.stats?.activeBriefs ?? 0,
    creatorsAssigned: data?.stats?.creatorsAssigned ?? 0,
    spendMTD: data?.stats?.spendMTD ?? "THB 0",
    slaOnTrack: data?.stats?.slaOnTrack ?? "N/A",
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-[#059669] to-[#064e3b] p-7 text-white shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">Agency</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight font-serif">Agency Dashboard</h1>
        <p className="mt-1 text-white/70 font-medium">High-level view of your portfolio and active campaign metrics.</p>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Active briefs", stats.activeBriefs.toString(), Rocket],
          ["Creators assigned", stats.creatorsAssigned.toString(), UserCircle],
          ["Spend (MTD)", stats.spendMTD.toString(), Wallet],
          ["SLA on track", stats.slaOnTrack, CheckCircle2]
        ].map(([label, value, Icon]: any) => (
          <Card key={label} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-serif">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm bg-gradient-to-br from-[#059669] to-[#064e3b]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-white/80" />
            Strategy Assistant
          </CardTitle>
          <CardDescription className="text-white/60">AI-driven insights for your next campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {[
              "Recommend budget split by campaign objective",
              "Suggest platform mix per audience and KPI target",
              "Build week-by-week campaign structure plan"
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
    </div>
  );
}

export default function DashboardPage() {
  const { role, token } = useUserStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      if (!token) return;
      try {
        setLoading(true);
        const dashboardData = await apiGetDashboard(token);
        setData(dashboardData);
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role === "brand") return <BrandDashboard data={data} />;
  if (role === "influencer") return <InfluencerDashboard data={data} />;
  return <AgencyDashboard data={data} />;
}
