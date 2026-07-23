"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandDashboard } from "@/components/brand-dashboard";
import { useUserStore } from "@/store/useUserStore";
import {
  apiGetAdminDashboard,
  apiGetDashboard,
  apiGetInvitations,
  apiAcceptInvitation,
  apiDeclineInvitation,
  apiSyncMyPlatforms,
  apiTriggerAdminSync,
  Invitation,
  SyncResult,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Rocket,
  FileText,
  MessageSquare,
  Bell,
  CheckCircle2,
  Loader2,
  Inbox,
  Check,
  X,
  RefreshCw,
  Megaphone,
  Wallet,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * On-demand "Sync now" trigger, shared by the influencer and admin dashboards.
 * The parent supplies the actual call (self-sync vs. platform-wide) as `sync`,
 * so this component never needs to know which endpoint it's hitting. Shows a
 * spinner while running and a one-line result ("Synced 2 of 3 accounts").
 */
function ManualSyncButton({
  sync,
  idleLabel = "Sync now",
}: {
  sync: () => Promise<SyncResult>;
  idleLabel?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const r = await sync();
      setResult(
        r.total === 0
          ? "No connected accounts to sync"
          : `Synced ${r.synced} of ${r.total} account${r.total === 1 ? "" : "s"}`,
      );
    } catch (err: any) {
      setResult(err?.message ?? "Sync failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        onClick={run}
        disabled={loading}
        variant="outline"
        className="rounded-xl bg-background"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        {idleLabel}
      </Button>
      {result && <span className="text-sm text-muted-foreground">{result}</span>}
    </div>
  );
}

function InfluencerInvitations() {
  const { token } = useUserStore();
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGetInvitations(token);
        if (!cancelled) setInvitations(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load invitations");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const accept = async (invitation: Invitation) => {
    if (!token) return;
    setBusyId(invitation.id);
    setError(null);
    try {
      const res = await apiAcceptInvitation(token, invitation.id);
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
      // Land on the conversation, same as an accepted application today.
      if (res.conversationId) router.push(`/messages?convId=${res.conversationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invitation");
    } finally {
      setBusyId(null);
    }
  };

  const decline = async (invitation: Invitation) => {
    if (!token) return;
    setBusyId(invitation.id);
    setError(null);
    try {
      await apiDeclineInvitation(token, invitation.id);
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decline invitation");
    } finally {
      setBusyId(null);
    }
  };

  const hasInvitations = invitations.length > 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <h4 className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
          <Inbox className="h-5 w-5 text-primary" /> Campaign Invitations
        </h4>
        {hasInvitations && (
          <Badge className="bg-primary text-primary-foreground">{invitations.length}</Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasInvitations
          ? "Brands have invited you to these campaigns."
          : "Brands that invite you to campaigns will appear here."}
      </p>
      <div className="mt-4 space-y-3">
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading invitations…
          </div>
        ) : !hasInvitations && !error ? (
          <p className="text-sm text-muted-foreground">No pending invitations right now.</p>
        ) : null}
        {!loading && invitations.map((inv) => (
          <div key={inv.id} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-foreground font-serif">{inv.campaignName ?? "Campaign"}</p>
                <p className="text-sm text-muted-foreground">{inv.brandName ?? "Brand"}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {inv.objective ? (
                    <span>Objective: <span className="font-medium text-foreground">{inv.objective}</span></span>
                  ) : null}
                  {inv.budget != null ? (
                    <span>Budget: <span className="font-medium text-foreground">THB {Number(inv.budget).toLocaleString()}</span></span>
                  ) : null}
                  {inv.applyDeadline ? (
                    <span>Deadline: <span className="font-medium text-foreground">{new Date(inv.applyDeadline).toLocaleDateString()}</span></span>
                  ) : null}
                </div>
                {inv.keyMessage ? (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{inv.keyMessage}</p>
                ) : null}
              </div>
              {inv.visibility ? (
                <Badge variant="secondary" className="uppercase">{inv.visibility}</Badge>
              ) : null}
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" disabled={busyId === inv.id} onClick={() => accept(inv)} className="rounded-xl">
                {busyId === inv.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Check className="mr-2 h-3 w-3" />}
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === inv.id}
                onClick={() => decline(inv)}
                className="rounded-xl"
              >
                <X className="mr-2 h-3 w-3" />
                Decline
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfluencerDashboard({ data }: { data: any }) {
  const { token, name } = useUserStore();
  const stats = {
    activeCampaigns: data?.stats?.activeCampaigns ?? 0,
    pendingApplications: data?.stats?.pendingApplications ?? 0,
    unreadMessages: data?.stats?.unreadMessages ?? 0,
    growthRate: data?.stats?.growthRate ?? null,
    engagementRate: data?.stats?.engagementRate ?? null,
    totalEarned: data?.stats?.totalEarned ?? 0,
    pendingPayout: data?.stats?.pendingPayout ?? 0,
  };

  const recentActivity = data?.recentActivity ?? [];

  // Stamp-tilt KPI tiles (mirrors the brand-dashboard mockup). `tilt` alternates
  // the resting rotation; `big` keeps the money tile from overflowing.
  const kpis: Array<{ label: string; value: string; hint: string; icon: typeof Rocket; big?: boolean }> = [
    { label: "Active Campaigns", value: String(stats.activeCampaigns), hint: "In progress", icon: Rocket },
    { label: "Pending Invitations", value: String(stats.pendingApplications), hint: "Awaiting your reply", icon: Inbox },
    { label: "Unread Messages", value: String(stats.unreadMessages), hint: "In your inbox", icon: MessageSquare },
    { label: "Total Earned", value: `THB ${stats.totalEarned.toLocaleString()}`, hint: stats.pendingPayout > 0 ? `THB ${stats.pendingPayout.toLocaleString()} pending` : "All settled", icon: Wallet, big: true },
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Creator workspace</p>
            <h1 className="mt-2 font-serif text-3xl font-bold">Welcome back{name ? `, ${name}` : ""}</h1>
            <p className="mt-1 text-sm text-white/70">Your active campaigns, invitations, and earnings at a glance.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/campaigns"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white/20"
            >
              <Megaphone className="h-4 w-4" /> Find Campaigns
            </Link>
            <Link
              href="/messages"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#334155] shadow-lg shadow-black/20 transition hover:bg-white/90"
            >
              <MessageSquare className="h-4 w-4" /> Messages
            </Link>
          </div>
        </div>
      </header>

      {/* KPI grid — stamp-tilt cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, hint, icon: Icon, big }) => (
          <div
            key={label}
            className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow duration-300 hover:shadow-md"
          >
            <Icon className="pointer-events-none absolute right-3 top-3 h-10 w-10 text-primary/[0.06]" />
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
              <Icon className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p className={cn("mt-2 font-serif font-bold text-primary", big ? "text-2xl" : "text-4xl")}>{value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
          </div>
        ))}
      </div>

      {/* Bento: invitations (left) + snapshot rail (right) */}
      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-8">
          <InfluencerInvitations />
        </section>

        <section className="col-span-12 space-y-6 lg:col-span-4">
          <div className="rounded-2xl border border-border bg-muted/40 p-6 shadow-sm">
            <h4 className="font-serif text-lg font-semibold text-foreground">Your snapshot</h4>
            <dl className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" /> Engagement
                </dt>
                <dd className="font-serif text-base font-bold text-foreground">
                  {stats.engagementRate != null ? `${stats.engagementRate.toFixed(1)}%` : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-4">
                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wallet className="h-4 w-4 text-primary" /> Total earned
                </dt>
                <dd className="font-serif text-base font-bold text-foreground">THB {stats.totalEarned.toLocaleString()}</dd>
              </div>
              {stats.pendingPayout > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">Pending payout</dt>
                  <dd className="text-sm font-semibold text-foreground">THB {stats.pendingPayout.toLocaleString()}</dd>
                </div>
              )}
            </dl>
            <div className="mt-5 space-y-2 border-t border-border pt-5">
              {token && <ManualSyncButton sync={() => apiSyncMyPlatforms(token)} idleLabel="Sync my stats" />}
              <Link
                href="/messages"
                className="flex items-center justify-between rounded-xl px-1 py-2 text-sm font-semibold text-primary transition hover:opacity-80"
              >
                Go to Messages <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Recent Activity — reads data.recentActivity (Notification rows written by
          notify() on draft review, invitation, and application-accept). */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h4 className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
          <Bell className="h-5 w-5 text-primary" /> Recent Activity
        </h4>
        <div className="mt-4 space-y-4">
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
        </div>
      </div>
    </div>
  );
}

/** Platform-wide counts. Fetches its own data: the shared /dashboard endpoint is
 *  role-scoped and returns a "not implemented for this role" payload for ADMIN. */
function AdminDashboard() {
  const { token } = useUserStore();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    apiGetAdminDashboard(token)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [token]);

  if (error) {
    return (
      <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </p>
    );
  }

  const tiles = [
    { label: "Campaigns", value: data?.campaigns, icon: Rocket },
    { label: "Active campaigns", value: data?.activeCampaigns, icon: CheckCircle2 },
    { label: "Brands", value: data?.brands, icon: FileText },
    { label: "Agencies", value: data?.agencies, icon: FileText },
    { label: "Creators", value: data?.influencers, icon: MessageSquare },
    { label: "Total users", value: data?.users, icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Platform overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Read-only view across all brands and agencies</p>
        </div>
        {token && (
          <ManualSyncButton sync={() => apiTriggerAdminSync(token)} idleLabel="Sync all creators" />
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{label}</p>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              {data ? (
                <p className="mt-2 text-2xl font-bold text-foreground">{value ?? 0}</p>
              ) : (
                <Skeleton className="mt-2 h-7 w-2/3" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <Link
        href="/campaigns"
        className="inline-block cursor-pointer text-sm font-semibold text-secondary hover:underline"
      >
        View all campaigns →
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const { role, token, logout, hasHydrated } = useUserStore();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait until persist has read localStorage. Before rehydrate, token is the
    // empty default even for a logged-in user, so redirecting here would bounce
    // them to /login on every fresh load/refresh.
    if (!hasHydrated) return;
    // No token at all → not logged in. Send to login rather than fetching with "Bearer null".
    if (!token) {
      router.replace("/login");
      return;
    }
    // Guard above guarantees token is non-null here; capture the narrowed value
    // so it stays typed as string inside the async closure below.
    const authToken = token;
    async function fetchDashboard() {
      try {
        setLoading(true);
        const dashboardData = await apiGetDashboard(authToken);
        setData(dashboardData);
      } catch (err: any) {
        // Expired/invalid token (1d TTL) → clear the dead session and re-login.
        if (err?.message === "Unauthorized") {
          logout();
          router.replace("/login");
          return;
        }
        console.error("Dashboard fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [hasHydrated, token, logout, router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="border-none shadow-sm">
              <CardContent className="p-6 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-7 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Before the fallthrough: an unhandled role silently renders the agency
  // dashboard, which for an admin would be wrong rather than merely empty.
  if (role === "admin") return <AdminDashboard />;
  if (role === "brand") return <BrandDashboard data={data} />;
  if (role === "influencer") return <InfluencerDashboard data={data} />;
  return <BrandDashboard data={data} variant="agency" />;
}
