"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import {
  apiApplyToCampaign,
  apiGetAllCampaignsAdmin,
  apiGetCampaigns,
  apiGetPublicCampaigns,
  type PaginatedResponse,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

// ─── Read-only view-model adapters (our CampaignResponse → design row shape) ───
// Mirrors the apiCampaignToLocal precedent in smart-plan/page.tsx. No API change.

type BrandCampaignStatus = "active" | "draft" | "completed";

/** Our uppercase status → the design's lowercase set. CANCELLED is intentionally
 *  mapped to "draft" only as a fallback; cancelled rows are excluded at the
 *  RENDER layer (never from counts/totals). */
function mapBrandStatus(raw?: string): BrandCampaignStatus {
  const s = (raw ?? "").toUpperCase();
  if (s === "ACTIVE") return "active";
  if (s === "COMPLETED") return "completed";
  return "draft"; // DRAFT (and CANCELLED, which is filtered out before render)
}

/** Budget: we hold a single value, design wants a range → render max-only. */
function budgetLabel(budget: number): string {
  return budget > 0 ? `up to THB ${budget.toLocaleString()}` : "TBD";
}

/** coverImage has no source in our API → role-tinted gradient placeholder. */
function roleCoverGradient(role: string | null | undefined): string {
  if (role === "brand") return "bg-gradient-to-br from-role-navy to-role-navy/70";
  if (role === "influencer") return "bg-gradient-to-br from-role-coral to-role-coral/70";
  return "bg-gradient-to-br from-emerald-600 to-emerald-500"; // agency
}

interface BrandCampaignVM {
  id: string;
  name: string;
  visibility: string | null;
  status: BrandCampaignStatus;
  budget: number;
  spent: number;
  deadline: string;
  influencersJoined: number;
  platform: string;
  objective: string;
  brandName: string | null;
  coverImageUrl: string | null;
}

function toBrandCampaignVM(c: any): BrandCampaignVM {
  return {
    id: c.id,
    name: c.name,
    visibility: c.visibility ? String(c.visibility).toLowerCase() : null,
    status: mapBrandStatus(c.status),
    coverImageUrl: c.coverImageUrl ?? null,
    budget: c.budget ?? 0,
    spent: c.budgetSpent ?? 0, // name diff: budgetSpent → spent
    deadline: c.applyDeadline ? new Date(c.applyDeadline).toLocaleDateString() : "TBD",
    influencersJoined: Array.isArray(c.applications)
      ? c.applications.filter((a: any) => a.status === "ACCEPTED").length
      : 0,
    platform: c.requirements?.[0]?.platforms?.[0] ?? "—",
    objective: c.objective ?? "—", // free-text, not the design enum
    brandName: c.clientBrand?.brandName ?? null,
  };
}

interface InfCampaignVM {
  id: string;
  name: string;
  brand: string;
  budget: number;
  platform: string;
  contentType: string;
  objective: string;
  deadline: string;
}

function toInfCampaignVM(c: any): InfCampaignVM {
  return {
    id: c.id,
    name: c.name,
    brand: c.clientBrand?.brandName ?? "Brand", // nested → flat
    budget: c.budget ?? 0,
    platform: c.requirements?.[0]?.platforms?.[0] ?? "—",
    contentType: c.requirements?.[0]?.contentType ?? c.deliverables ?? "—",
    objective: c.objective ?? "—",
    deadline: c.applyDeadline ? new Date(c.applyDeadline).toLocaleDateString() : "TBD",
  };
}

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

/** One brand-side campaign card. Shared by the brand list and the agency
 *  brand→campaign view. */
function BrandCampaignCard({ raw, role }: { raw: any; role: string | null }) {
  const c = toBrandCampaignVM(raw);
  return (
    <Link
      href={`/campaigns/${c.id}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Campaign cover — same image as the campaign page; role-tinted gradient
          fallback when the campaign has no uploaded cover. */}
      <div className={cn("relative h-24 w-full", !c.coverImageUrl && roleCoverGradient(role))}>
        {c.coverImageUrl ? (
          <img
            src={c.coverImageUrl}
            alt={`${c.name} cover`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span
          className={cn(
            "absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
            c.status === "active"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
              : c.status === "draft"
                ? "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
                : "bg-card/90 text-muted-foreground"
          )}
        >
          {c.status}
        </span>
        <h3 className="absolute inset-x-3 bottom-2 truncate text-base font-bold text-white font-serif drop-shadow">
          {c.name}
        </h3>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          {c.visibility && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
              {c.visibility}
            </span>
          )}
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {c.platform}
          </span>
          {c.brandName && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {c.brandName}
            </span>
          )}
        </div>
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          <li>Budget: {budgetLabel(c.budget)} · Spent: THB {c.spent.toLocaleString()}</li>
          <li className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Deadline: {c.deadline}
          </li>
          <li>Influencers: {c.influencersJoined}</li>
        </ul>
        <p className="mt-3 inline-flex items-center text-sm font-bold text-primary transition-transform group-hover:translate-x-1">
          View management <ChevronRight className="ml-1 h-4 w-4" />
        </p>
      </div>
    </Link>
  );
}

function CampaignCardsSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm">
        <CardContent className="p-8 space-y-3">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BrandCampaignsView() {
  const { token, role } = useUserStore();
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

  // Decision: hide CANCELLED at the RENDER layer ONLY. `filtered` (incl. cancelled)
  // still drives the count badge and any roll-ups; only the rendered card grid /
  // pagination operate on `visibleCards`. Filtering late avoids count-mismatch bugs.
  const visibleCards = useMemo(
    () => filtered.filter((c) => (c.status ?? "").toUpperCase() !== "CANCELLED"),
    [filtered]
  );

  const totalPages = Math.max(1, Math.ceil(visibleCards.length / PAGE_SIZE));
  const pageItems = visibleCards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setSearch("");
    setStatus("All");
    setVisibility("All");
    setPage(1);
  };

  if (loading) {
    return <CampaignCardsSkeleton />;
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
        {pageItems.map((raw) => (
          <BrandCampaignCard key={raw.id} raw={raw} role={role} />
        ))}
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
    return <CampaignCardsSkeleton />;
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
        <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-500/10">
          <CardContent className="p-4 text-sm font-medium text-emerald-700 dark:text-emerald-300">{notice}</CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((raw) => {
          const c = toInfCampaignVM(raw);
          return (
            <article
              key={c.id}
              className="overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-bold text-foreground leading-tight font-serif">{c.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-primary">{c.brand}</p>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  {c.platform}
                </span>
              </div>

              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                <li>Budget: {budgetLabel(c.budget)}</li>
                <li>Content: {c.contentType}</li>
                <li className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" /> Goal: {c.objective}
                </li>
                <li className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Deadline: {c.deadline}
                </li>
              </ul>

              <div className="mt-4 flex gap-2">
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
            </article>
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

// Agency flow: brand → campaign. The agency's campaigns are fetched flat, then
// grouped by their clientBrand so the agency picks a brand before drilling into
// its campaigns (rather than seeing every brand's campaigns flattened together).
function AgencyCampaignsView() {
  const { token, role } = useUserStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedBrandId = searchParams.get("brand");

  const setBrand = (id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("brand", id);
    else params.delete("brand");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (!token) return;
    apiGetCampaigns(token)
      .then(setCampaigns)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  // Group campaigns by client brand (excluding CANCELLED from the counts/cards,
  // mirroring BrandCampaignsView's render-layer rule).
  const brands = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    for (const c of campaigns) {
      if ((c.status ?? "").toUpperCase() === "CANCELLED") continue;
      const id = c.clientBrand?.id;
      if (!id) continue;
      const entry = map.get(id) ?? { id, name: c.clientBrand?.brandName ?? "Brand", count: 0 };
      entry.count += 1;
      map.set(id, entry);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [campaigns]);

  const selectedBrand = brands.find((b) => b.id === selectedBrandId) ?? null;
  const brandCampaigns = useMemo(
    () =>
      selectedBrandId
        ? campaigns.filter(
            (c) =>
              c.clientBrand?.id === selectedBrandId &&
              (c.status ?? "").toUpperCase() !== "CANCELLED"
          )
        : [],
    [campaigns, selectedBrandId]
  );

  if (loading) {
    return <CampaignCardsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-gradient-to-r from-[#059669] to-[#064e3b] text-white">
        <CardContent className="p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight font-serif">
                {selectedBrand ? selectedBrand.name : "Campaigns by Brand"}
              </h1>
              <p className="text-white/80 font-medium">
                {selectedBrand
                  ? "Campaigns for this brand."
                  : "Pick a brand to view and manage its campaigns."}
              </p>
              <div className="pt-2">
                <Badge variant="outline" className="border-white/30 bg-card/10 text-white font-bold px-3 py-1 backdrop-blur-sm">
                  {selectedBrand ? `${brandCampaigns.length} campaigns` : `${brands.length} brands`}
                </Badge>
              </div>
            </div>
            <Button size="lg" asChild className="rounded-xl bg-card text-emerald-700 font-bold shadow-xl hover:bg-card/90">
              <Link href="/campaigns/create">
                <Plus className="mr-2 h-5 w-5" />
                Create Campaign
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {selectedBrand ? (
        <>
          <Button variant="ghost" size="sm" onClick={() => setBrand(null)} className="h-8 px-2 font-bold text-primary">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back to brands
          </Button>
          {brandCampaigns.length === 0 ? (
            <Card className="border-2 border-dashed bg-muted/50 py-20 text-center">
              <CardContent>
                <h3 className="text-lg font-bold font-serif">No campaigns yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">This brand has no active campaigns.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {brandCampaigns.map((raw) => (
                <BrandCampaignCard key={raw.id} raw={raw} role={role} />
              ))}
            </div>
          )}
        </>
      ) : brands.length === 0 ? (
        <Card className="border-2 border-dashed bg-muted/50 py-20 text-center">
          <CardContent>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <LayoutGrid className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-bold font-serif">No brands yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a campaign for a client brand to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((b) => (
            <button
              key={b.id}
              onClick={() => setBrand(b.id)}
              className="group flex items-center justify-between rounded-2xl border border-border bg-card p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  {b.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-foreground font-serif">{b.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {b.count} campaign{b.count === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Admin oversight: every campaign on the platform, regardless of owner. Read
// only — cards are intentionally not links, because GET /campaigns/:id is still
// ownership-scoped and would 403 for an admin. Server-side paginated (unlike the
// brand/agency views, which fetch their own campaigns flat).
function AdminCampaignsView() {
  const { token, role } = useUserStore();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedResponse<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    apiGetAllCampaignsAdmin(token, page)
      .then(setResult)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, page]);

  if (loading && !result) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </p>
    );
  }

  const campaigns = result?.data ?? [];
  const totalPages = result?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">All campaigns</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {result?.total ?? 0} campaign{result?.total === 1 ? "" : "s"} across every brand and agency
        </p>
      </div>

      {campaigns.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No campaigns yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((raw) => (
            <div key={raw.id} className="space-y-1">
              {/* Owner is the column brand/agency views don't need — it is the
                  whole point of the admin view. */}
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {raw.clientBrand?.brandName ?? "—"}
              </p>
              <div className="pointer-events-none">
                <BrandCampaignCard raw={raw} role={role} />
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function CampaignsPageInner() {
  const { role } = useUserStore();
  if (role === "admin") return <AdminCampaignsView />;
  if (role === "agency") return <AgencyCampaignsView />;
  if (role === "brand") return <BrandCampaignsView />;
  return <InfluencerDiscoverCampaignsView />;
}

export default function CampaignsPage() {
  return (
    <Suspense>
      <CampaignsPageInner />
    </Suspense>
  );
}
