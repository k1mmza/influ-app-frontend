"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useUserStore } from "@/store/useUserStore";
import { brandCampaigns, type BrandCampaignListItem } from "@/mock/brand-campaigns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Rocket, 
  Search, 
  Filter, 
  RotateCcw, 
  ChevronRight, 
  Plus, 
  LayoutGrid,
  Calendar,
  Users,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

type InfCampaignItem = {
  id: string;
  name: string;
  brand: string;
  budgetMin: number;
  budgetMax: number;
  platform: "TikTok" | "Instagram" | "YouTube";
  contentType: "Video" | "Post" | "Story";
  goal: "Awareness" | "Conversion" | "Engagement";
  deadline: string;
};

const infCampaigns: InfCampaignItem[] = [
  {
    id: "summer-skincare",
    name: "Summer Skincare Awareness Campaign",
    brand: "GlowLab",
    budgetMin: 8000,
    budgetMax: 10000,
    platform: "TikTok",
    contentType: "Video",
    goal: "Awareness",
    deadline: "2026-05-30"
  },
  {
    id: "fit-snack",
    name: "Healthy Snack Challenge",
    brand: "FitBites",
    budgetMin: 5000,
    budgetMax: 7000,
    platform: "Instagram",
    contentType: "Story",
    goal: "Engagement",
    deadline: "2026-06-10"
  },
  {
    id: "tech-drop",
    name: "Creator Tech Unbox",
    brand: "NeoGear",
    budgetMin: 9000,
    budgetMax: 12000,
    platform: "YouTube",
    contentType: "Video",
    goal: "Conversion",
    deadline: "2026-06-20"
  },
  {
    id: "travel-light",
    name: "Travel Light Essentials",
    brand: "Roamly",
    budgetMin: 6500,
    budgetMax: 9000,
    platform: "TikTok",
    contentType: "Post",
    goal: "Awareness",
    deadline: "2026-06-05"
  }
];

const infPlatforms = ["All", "TikTok", "Instagram", "YouTube"];
const contentTypes = ["All", "Video", "Post", "Story"];
const goals = ["All", "Awareness", "Conversion", "Engagement"];

const statusFilterOptions = ["All", "active", "pending", "completed"] as const;
const visibilityFilterOptions = ["All", "public", "private"] as const;

function BrandCampaignsView() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof statusFilterOptions)[number]>("All");
  const [visibility, setVisibility] = useState<(typeof visibilityFilterOptions)[number]>("All");

  const filtered = useMemo(
    () =>
      brandCampaigns.filter((c: BrandCampaignListItem) => {
        const passSearch =
          search.trim().length === 0 ||
          c.name.toLowerCase().includes(search.toLowerCase());
        const passStatus = status === "All" || c.status === status;
        const passVis = visibility === "All" || c.visibility === visibility;
        return passSearch && passStatus && passVis;
      }),
    [search, status, visibility]
  );

  const resetFilters = () => {
    setSearch("");
    setStatus("All");
    setVisibility("All");
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-gradient-to-r from-primary to-secondary text-white">
        <CardContent className="p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight font-serif">Campaigns</h1>
              <p className="text-primary-foreground/80 font-medium">Manage your active collaborations and marketplace listings.</p>
              <div className="pt-2">
                <Badge variant="outline" className="border-white/30 bg-white/10 text-white font-bold px-3 py-1 backdrop-blur-sm">
                  {filtered.length} total campaigns
                </Badge>
              </div>
            </div>
            <Button size="lg" asChild className="rounded-xl bg-white text-primary font-bold shadow-xl hover:bg-white/90">
              <Link href="/campaigns/create">
                <Plus className="mr-2 h-5 w-5" />
                Create Campaign
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Campaign Filters
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 px-2 text-xs font-bold text-primary">
              <RotateCcw className="mr-1.5 h-3 w-3" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Campaign name..."
                  className="pl-9 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as (typeof statusFilterOptions)[number])}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {statusFilterOptions.map((s) => (
                  <option key={s} value={s}>
                    {s === "All" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Visibility</Label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as (typeof visibilityFilterOptions)[number])}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {visibilityFilterOptions.map((v) => (
                  <option key={v} value={v}>
                    {v === "All" ? "All Visibilities" : v.charAt(0).toUpperCase() + v.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => (
          <Card key={c.id} className="group overflow-hidden border-none shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground leading-tight font-serif">{c.name}</h3>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Badge variant="secondary" className="text-[10px] bg-slate-100 border-none font-bold uppercase">{c.visibility}</Badge>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase">{c.platform}</Badge>
                  </div>
                </div>
                <Badge className={cn(
                  "font-bold text-[10px] uppercase border-none",
                  c.status === "active" ? "bg-emerald-50 text-emerald-700" :
                  c.status === "pending" ? "bg-amber-50 text-amber-700" :
                  "bg-slate-100 text-slate-600"
                )}>
                  {c.status}
                </Badge>
              </div>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Budget</p>
                    <p className="text-sm font-bold">THB {c.budget.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hired</p>
                    <p className="text-sm font-bold">{c.influencersJoined} Creators</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-slate-50 p-2.5 rounded-xl">
                  <Calendar className="h-3.5 w-3.5" />
                  Ends on {c.deadline}
                </div>
              </div>

              <Button variant="link" asChild className="mt-4 px-0 font-bold text-primary h-auto group-hover:translate-x-1 transition-transform">
                <Link href={`/campaigns/${c.id}`}>View Management <ChevronRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="border-2 border-dashed bg-slate-50/50 py-20 text-center">
          <CardContent>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <LayoutGrid className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-bold font-serif">No campaigns match</h3>
            <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters or create a new campaign.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfluencerDiscoverCampaignsView() {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("All");
  const [contentType, setContentType] = useState("All");
  const [goal, setGoal] = useState("All");
  const [minBudget, setMinBudget] = useState(0);
  const [maxBudget, setMaxBudget] = useState(0);

  const filtered = useMemo(
    () =>
      infCampaigns.filter((campaign) => {
        const passSearch =
          search.trim().length === 0 ||
          campaign.name.toLowerCase().includes(search.toLowerCase()) ||
          campaign.brand.toLowerCase().includes(search.toLowerCase());
        const passPlatform = platform === "All" || campaign.platform === platform;
        const passContentType = contentType === "All" || campaign.contentType === contentType;
        const passGoal = goal === "All" || campaign.goal === goal;
        const passMinBudget = minBudget <= 0 || campaign.budgetMax >= minBudget;
        const passMaxBudget = maxBudget <= 0 || campaign.budgetMin <= maxBudget;

        return passSearch && passPlatform && passContentType && passGoal && passMinBudget && passMaxBudget;
      }),
    [contentType, goal, maxBudget, minBudget, platform, search]
  );

  const resetFilters = () => {
    setSearch("");
    setPlatform("All");
    setContentType("All");
    setGoal("All");
    setMinBudget(0);
    setMaxBudget(0);
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-gradient-to-r from-primary to-secondary text-white">
        <CardContent className="p-8">
          <h1 className="text-3xl font-extrabold tracking-tight font-serif">Discover Campaigns</h1>
          <p className="mt-2 text-primary-foreground/80 font-medium">Find the best-fit collaborations with clear budget visibility.</p>
          <div className="pt-4">
            <Badge variant="outline" className="border-white/30 bg-white/10 text-white font-bold px-3 py-1 backdrop-blur-sm">
              {filtered.length} active opportunities
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Opportunities Filter
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 px-2 text-xs font-bold text-primary">
              <RotateCcw className="mr-1.5 h-3 w-3" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Campaign or brand..."
                  className="pl-9 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Platform</Label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              >
                {infPlatforms.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Goal</Label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              >
                {goals.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((campaign) => (
          <Card key={campaign.id} className="overflow-hidden border-none shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-foreground leading-tight font-serif">{campaign.name}</h3>
                  <p className="text-xs font-semibold text-primary mt-1">{campaign.brand}</p>
                </div>
                <Badge variant="secondary" className="bg-slate-100 border-none font-bold text-[10px] uppercase">
                  {campaign.platform}
                </Badge>
              </div>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 text-xs">
                    <p className="font-bold uppercase tracking-widest text-muted-foreground">Range</p>
                    <p className="font-bold text-foreground">THB {campaign.budgetMin.toLocaleString()} - {campaign.budgetMax.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1 text-right text-xs">
                    <p className="font-bold uppercase tracking-widest text-muted-foreground">Content</p>
                    <p className="font-bold text-foreground">{campaign.contentType}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5" />
                    {campaign.goal}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {campaign.deadline}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <Button className="flex-1 rounded-xl font-bold text-xs h-10 shadow-sm">Apply Now</Button>
                <Button variant="outline" asChild className="flex-1 rounded-xl font-bold text-xs h-10">
                  <Link href={`/campaigns/${campaign.id}`}>Details</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const { role } = useUserStore();
  if (role === "brand" || role === "agency") return <BrandCampaignsView />;
  return <InfluencerDiscoverCampaignsView />;
}
