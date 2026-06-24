"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { apiApplyToCampaign, apiGetCampaigns, apiGetPublicCampaigns } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ChevronLeft,
  Plus,
  LayoutGrid,
  Calendar,
  Target,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusFilterOptions = ["All", "ACTIVE", "DRAFT", "COMPLETED"] as const;
const visibilityFilterOptions = ["All", "PUBLIC", "PRIVATE"] as const;
const goalOptions = ["All", "Awareness", "Engagement", "Conversion"];
const PAGE_SIZE = 12;

function PaginationRow({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  return (
    <div className="flex items-center justify-center gap-1 pt-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="rounded-lg"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {start > 1 && <span className="px-2 text-sm text-muted-foreground">…</span>}
      {pages.map((p) => (
        <Button
          key={p}
          variant={p === page ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(p)}
          className="rounded-lg w-9"
        >
          {p}
        </Button>
      ))}
      {end < totalPages && <span className="px-2 text-sm text-muted-foreground">…</span>}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="rounded-lg"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function BrandCampaignsView() {
  const { token } = useUserStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof statusFilterOptions)[number]>("All");
  const [visibility, setVisibility] = useState<(typeof visibilityFilterOptions)[number]>("All");

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (!token) return;
    apiGetCampaigns(token)
      .then(setCampaigns)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = useMemo(
    () =>
      campaigns.filter((c) => {
        const passSearch =
          search.trim().length === 0 ||
          c.name?.toLowerCase().includes(search.toLowerCase());
        const passStatus = status === "All" || c.status === status;
        const passVis = visibility === "All" || c.visibility === visibility;
        return passSearch && passStatus && passVis;
      }),
    [campaigns, search, status, visibility]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setSearch("");
    setStatus("All");
    setVisibility("All");
    setPage(1);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-gradient-to-r from-[#b45309] to-[#78350f] text-white">
        <CardContent className="p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight font-serif">Campaigns</h1>
              <p className="text-white/80 font-medium">
                Manage your active collaborations and marketplace listings.
              </p>
              <div className="pt-2">
                <Badge variant="outline" className="border-white/30 bg-card/10 text-white font-bold px-3 py-1 backdrop-blur-sm">
                  {filtered.length} total campaigns
                </Badge>
              </div>
            </div>
            <Button size="lg" asChild className="rounded-xl bg-card text-primary font-bold shadow-xl hover:bg-card/90">
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
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Campaign name..."
                  className="pl-9 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</Label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {statusFilterOptions.map((s) => (
                  <option key={s} value={s}>{s === "All" ? "All Statuses" : s.charAt(0) + s.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Visibility</Label>
              <select
                value={visibility}
                onChange={(e) => { setVisibility(e.target.value as typeof visibility); setPage(1); }}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {visibilityFilterOptions.map((v) => (
                  <option key={v} value={v}>{v === "All" ? "All Visibilities" : v.charAt(0) + v.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {pageItems.map((c) => {
          const statusLower = c.status?.toLowerCase() ?? "draft";
          const deadline = c.applyDeadline
            ? new Date(c.applyDeadline).toLocaleDateString()
            : "TBD";
          return (
            <Card key={c.id} className="group overflow-hidden border-none shadow-sm transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-foreground leading-tight font-serif">{c.name}</h3>
                    <div className="flex gap-2 pt-1">
                      {c.visibility && (
                        <Badge variant="secondary" className="text-[10px] bg-muted border-none font-bold uppercase">{c.visibility.toLowerCase()}</Badge>
                      )}
                      {c.clientBrand?.brandName && (
                        <Badge variant="outline" className="text-[10px] font-bold">{c.clientBrand.brandName}</Badge>
                      )}
                    </div>
                  </div>
                  <Badge className={cn(
                    "font-bold text-[10px] uppercase border-none",
                    statusLower === "active" ? "bg-emerald-50 text-emerald-700" :
                    statusLower === "draft" ? "bg-amber-50 text-amber-700" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {statusLower}
                  </Badge>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Budget</p>
                      <p className="text-sm font-bold">
                        {c.budget ? `THB ${Number(c.budget).toLocaleString()}` : "TBD"}
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Applications</p>
                      <p className="text-sm font-bold">{c.applications?.length ?? 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted p-2.5 rounded-xl">
                    <Calendar className="h-3.5 w-3.5" />
                    Deadline: {deadline}
                  </div>
                </div>

                <Button variant="link" asChild className="mt-4 px-0 font-bold text-primary h-auto group-hover:translate-x-1 transition-transform">
                  <Link href={`/campaigns/${c.id}`}>View Management <ChevronRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!loading && filtered.length === 0 && (
        <Card className="border-2 border-dashed bg-muted/50 py-20 text-center">
          <CardContent>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <LayoutGrid className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-bold font-serif">No campaigns yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {campaigns.length === 0
                ? "Create your first campaign to get started."
                : "No campaigns match the current filters."}
            </p>
            {campaigns.length === 0 && (
              <Button asChild className="mt-6 rounded-xl">
                <Link href="/campaigns/create"><Plus className="mr-2 h-4 w-4" /> Create Campaign</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <PaginationRow page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

function InfluencerDiscoverCampaignsView() {
  const { token } = useUserStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [goal, setGoal] = useState("All");

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    apiGetPublicCampaigns(token, page, PAGE_SIZE)
      .then((res) => {
        setCampaigns(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        if (page > res.totalPages && res.totalPages > 0) setPage(1);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, page]);

  const filtered = useMemo(
    () =>
      campaigns.filter((c) => {
        const passSearch =
          search.trim().length === 0 ||
          c.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.clientBrand?.brandName?.toLowerCase().includes(search.toLowerCase());
        const passGoal = goal === "All" || c.objective?.toLowerCase().includes(goal.toLowerCase());
        return passSearch && passGoal;
      }),
    [campaigns, search, goal]
  );

  const resetFilters = () => {
    setSearch("");
    setGoal("All");
  };

  const applyToCampaign = async (campaignId: string) => {
    if (!token) {
      setError("Please log in again before applying.");
      return;
    }
    setApplyingId(campaignId);
    setError(null);
    setNotice(null);
    try {
      await apiApplyToCampaign(token, campaignId);
      setNotice("Application submitted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply to campaign");
    } finally {
      setApplyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-gradient-to-r from-[#b45309] to-[#78350f] text-white">
        <CardContent className="p-8">
          <h1 className="text-3xl font-extrabold tracking-tight font-serif">Discover Campaigns</h1>
          <p className="mt-2 text-white/80 font-medium">
            Find the best-fit collaborations with clear budget visibility.
          </p>
          <div className="pt-4">
            <Badge variant="outline" className="border-white/30 bg-card/10 text-white font-bold px-3 py-1 backdrop-blur-sm">
              {total} active opportunities
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
          <div className="grid gap-4 md:grid-cols-3">
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
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Goal</Label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              >
                {goalOptions.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {notice && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4 text-sm font-medium text-emerald-700">{notice}</CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => {
          const deadline = c.applyDeadline
            ? new Date(c.applyDeadline).toLocaleDateString()
            : "TBD";
          return (
            <Card key={c.id} className="overflow-hidden border-none shadow-sm transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-foreground leading-tight font-serif">{c.name}</h3>
                    <p className="text-xs font-semibold text-primary mt-1">
                      {c.clientBrand?.brandName ?? "Brand"}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-muted border-none font-bold text-[10px] uppercase">
                    {c.status?.toLowerCase()}
                  </Badge>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 text-xs">
                      <p className="font-bold uppercase tracking-widest text-muted-foreground">Budget</p>
                      <p className="font-bold text-foreground">
                        {c.budget ? `THB ${Number(c.budget).toLocaleString()}` : "TBD"}
                      </p>
                    </div>
                    <div className="space-y-1 text-right text-xs">
                      <p className="font-bold uppercase tracking-widest text-muted-foreground">Objective</p>
                      <p className="font-bold text-foreground">{c.objective ?? "—"}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5" />
                      {c.objective ?? "Open"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {deadline}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <Button
                    className="flex-1 rounded-xl font-bold text-xs h-10 shadow-sm"
                    disabled={applyingId != null}
                    onClick={() => applyToCampaign(c.id)}
                  >
                    {applyingId === c.id ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                    Apply Now
                  </Button>
                  <Button variant="outline" asChild className="flex-1 rounded-xl font-bold text-xs h-10">
                    <Link href={`/campaigns/${c.id}`}>Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!loading && filtered.length === 0 && (
        <Card className="border-2 border-dashed bg-muted/50 py-20 text-center">
          <CardContent>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Rocket className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-bold font-serif">No open campaigns</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Check back soon — new opportunities are added regularly.
            </p>
          </CardContent>
        </Card>
      )}

      <PaginationRow page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

function CampaignsPageInner() {
  const { role } = useUserStore();
  if (role === "brand" || role === "agency") return <BrandCampaignsView />;
  return <InfluencerDiscoverCampaignsView />;
}

export default function CampaignsPage() {
  return (
    <Suspense>
      <CampaignsPageInner />
    </Suspense>
  );
}
