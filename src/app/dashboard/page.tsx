"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandDashboard } from "@/components/brand-dashboard";
import { useUserStore } from "@/store/useUserStore";
import {
  apiGetDashboard,
  apiGetInvitations,
  apiAcceptInvitation,
  apiDeclineInvitation,
  Invitation,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Rocket,
  FileText,
  MessageSquare,
  Bell,
  CheckCircle2,
  Loader2,
  Inbox,
  Check,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Inbox className="h-4 w-4" /> Campaign Invitations
          {hasInvitations && (
            <Badge className="bg-primary text-primary-foreground">{invitations.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          {hasInvitations
            ? "Brands have invited you to these campaigns."
            : "Brands that invite you to campaigns will appear here."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
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
      </CardContent>
    </Card>
  );
}

function InfluencerDashboard({ data }: { data: any }) {
  const stats = {
    walletBalance: data?.stats?.walletBalance ?? 0,
    activeCampaigns: data?.stats?.activeCampaigns ?? 0,
    pendingApplications: data?.stats?.pendingApplications ?? 0,
    unreadMessages: data?.stats?.unreadMessages ?? 0,
    growthRate: data?.stats?.growthRate ?? null,
    engagementRate: data?.stats?.engagementRate ?? null,
    totalEarned: data?.stats?.totalEarned ?? 0,
    pendingPayout: data?.stats?.pendingPayout ?? 0,
  };

  const recentActivity = data?.recentActivity ?? [];

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
        <Button asChild className="rounded-xl shadow-lg shadow-primary/20">
          <Link href="/campaigns">Find Campaigns</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl bg-background">
          <Link href="/messages">View Messages</Link>
        </Button>
      </div>

      <InfluencerInvitations />

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
            {/* Brief + Submit Work both live in the campaign conversation's
                workPhase flow (contact→brief→draft→work→payment). Rather than
                rebuild standalone actions here, send the influencer to Messages. */}
            <Button asChild size="sm" className="w-full rounded-lg">
              <Link href="/messages">
                <MessageSquare className="mr-2 h-3.5 w-3.5" /> Go to Messages
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Performance</CardTitle>
            <CardDescription>Engagement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Growth Rate hidden until sync populates it — the platform adapters
                are still stubs (growthRate always 0), so showing it is misleading. */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Engagement</span>
              </div>
              <span className="text-sm font-bold text-foreground">
                {stats.engagementRate != null ? `${stats.engagementRate.toFixed(1)}%` : "—"}
              </span>
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
              <p className="text-xl font-bold text-foreground">THB {stats.totalEarned.toLocaleString()}</p>
            </div>
            {stats.pendingPayout > 0 && (
              <p className="text-xs text-muted-foreground">
                Pending payout: <span className="font-semibold text-foreground">THB {stats.pendingPayout.toLocaleString()}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity — reads data.recentActivity (Notification rows written by
          notify() on draft review, invitation, and application-accept). */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500" /> Recent Activity
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

  if (role === "brand") return <BrandDashboard data={data} />;
  if (role === "influencer") return <InfluencerDashboard data={data} />;
  return <BrandDashboard data={data} variant="agency" />;
}
