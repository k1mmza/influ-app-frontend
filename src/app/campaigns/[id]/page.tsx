"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Calendar, Check, Download, Loader2, Send, X } from "lucide-react";
import {
  apiApplyToCampaign,
  apiGetCampaign,
  apiGetCampaignApplications,
  apiGetPublicCampaigns,
  apiUpdateCampaign,
  apiUpdateCampaignApplicationStatus,
  CampaignApplicationResponse,
  CampaignResponse,
  CampaignStatus,
} from "@/lib/api";
import { CampaignPartnerReviews } from "@/components/CampaignPartnerReviews";
import { useUserStore } from "@/store/useUserStore";
import { Role } from "@/lib/types";
import { useCampaignCollaborationStore } from "@/store/useCampaignCollaborationStore";
import { getMainFollowerPlatform } from "@/lib/influencer-platforms";
import { influencers } from "@/mock/influencers";
import { exportRowsToExcel } from "@/lib/excel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString() : "TBD";
}

function formatMoney(value?: number) {
  return value != null ? `THB ${Number(value).toLocaleString()}` : "TBD";
}

function statusClass(status?: string) {
  const lower = status?.toLowerCase();
  if (lower === "active" || lower === "accepted") return "bg-emerald-50 text-emerald-700";
  if (lower === "draft" || lower === "pending") return "bg-amber-50 text-amber-700";
  if (lower === "rejected") return "bg-destructive/10 text-destructive";
  return "bg-muted text-muted-foreground";
}

function getInfluencerName(application: CampaignApplicationResponse) {
  return application.influencer?.user?.name || application.influencer?.user?.email || "Unnamed creator";
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { role, token, name: accountDisplayName } = useUserStore();
  const [campaign, setCampaign] = useState<CampaignResponse | null>(null);
  const [applications, setApplications] = useState<CampaignApplicationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const collaborations = useCampaignCollaborationStore((s) => s.collaborations);
  const recordCampaignFinished = useCampaignCollaborationStore((s) => s.recordCampaignFinished);

  const canManageCampaign = role === "brand" || role === "agency";
  const isCampaignFinished =
    !!campaign &&
    (campaign.status === "COMPLETED" || collaborations.some((item) => item.campaignId === campaign.id));

  const influencerRows = useMemo(
    () =>
      influencers.map((influencer, index) => {
        const { platform: primaryPlatform, followers: platformFollowers } = getMainFollowerPlatform(influencer);
        const socialHandle = influencer.name.toLowerCase().replace(/\s+/g, "");
        const host =
          primaryPlatform === "YouTube"
            ? "youtube.com"
            : primaryPlatform === "TikTok"
              ? "tiktok.com"
              : primaryPlatform === "Instagram"
                ? "instagram.com"
                : `${primaryPlatform.toLowerCase()}.com`;
        return {
          marker: index + 1,
          kolName: influencer.name,
          socialMediaLink: `https://www.${host}/@${socialHandle}`,
          platform: primaryPlatform,
          platformFollowers,
          category: influencer.category,
          estimateView: Math.round(influencer.followers * 0.35),
          engagementRate: influencer.engagementRate,
          kolRate: influencer.ratePerPost,
        };
      }),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadCampaign() {
      if (!token || !role) {
        setLoading(false);
        setError("Please log in to view campaign details.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        if (role === "brand" || role === "agency") {
          const [campaignData, applicationData] = await Promise.all([
            apiGetCampaign(token, id),
            apiGetCampaignApplications(token, id),
          ]);
          if (!cancelled) {
            setCampaign(campaignData);
            setApplications(applicationData);
          }
        } else {
          const publicCampaigns = await apiGetPublicCampaigns(token);
          const publicCampaign = publicCampaigns.find((item) => item.id === id) ?? null;
          if (!cancelled) setCampaign(publicCampaign);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load campaign");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCampaign();
    return () => {
      cancelled = true;
    };
  }, [id, role, token]);

  const refreshApplications = async () => {
    if (!token) return;
    const fresh = await apiGetCampaignApplications(token, id);
    setApplications(fresh);
  };

  const updateCampaignStatus = async (status: CampaignStatus) => {
    if (!token || !campaign) return;
    setBusyAction(status);
    setError(null);
    setMessage("");
    try {
      const updated = await apiUpdateCampaign(token, campaign.id, { status });
      setCampaign(updated);
      if (status === "COMPLETED") {
        recordCampaignFinished({
          campaignId: updated.id,
          campaignName: updated.name,
          currentRole: role as Role,
          currentDisplayName: accountDisplayName,
        });
        setMessage("Campaign marked complete. Partner reviews are now available.");
      } else {
        setMessage("Campaign published and visible according to its visibility setting.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update campaign");
    } finally {
      setBusyAction(null);
    }
  };

  const applyToCampaign = async () => {
    if (!token || !campaign) return;
    setBusyAction("apply");
    setError(null);
    setMessage("");
    try {
      await apiApplyToCampaign(token, campaign.id);
      setMessage("Application submitted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply to campaign");
    } finally {
      setBusyAction(null);
    }
  };

  const updateApplication = async (applicationId: string, status: "ACCEPTED" | "REJECTED") => {
    if (!token || !campaign) return;
    setBusyAction(applicationId);
    setError(null);
    setMessage("");
    try {
      await apiUpdateCampaignApplicationStatus(token, campaign.id, applicationId, status);
      await refreshApplications();
      setMessage(status === "ACCEPTED" ? "Application accepted." : "Application rejected.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update application");
    } finally {
      setBusyAction(null);
    }
  };

  const copyShareLink = async () => {
    if (!campaign || typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/campaigns/${campaign.id}/share`);
      setMessage("Client share link copied.");
    } catch {
      setMessage("Unable to copy automatically. Copy the URL from the preview page.");
    }
  };

  const exportInfluencersExcel = () => {
    if (!campaign) return;
    exportRowsToExcel({
      filename: `campaign-${campaign.id}-influencers.xls`,
      sheetName: "Influencer List",
      headers: [
        "Marker",
        "KOL name",
        "Social media link",
        "Platform",
        "Platform Follower No.",
        "Category/Niche",
        "Estimate view",
        "Engagement Rate",
        "KOL Rate",
      ],
      rows: influencerRows.map((row) => [
        row.marker,
        row.kolName,
        row.socialMediaLink,
        row.platform,
        row.platformFollowers,
        row.category,
        row.estimateView,
        `${row.engagementRate}%`,
        `THB ${row.kolRate}`,
      ]),
    });
    setMessage("Influencer list exported to Excel.");
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground font-serif">Campaign not found</h1>
        <p className="text-muted-foreground">{error || "This campaign is unavailable for your account."}</p>
        <Link href="/campaigns" className="text-primary hover:underline">
          Back to campaigns
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground font-serif">
                {canManageCampaign ? "Campaign management" : campaign.name}
              </h1>
              {canManageCampaign ? <p className="mt-1 text-sm text-muted-foreground">{campaign.name}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={cn("border-none uppercase", statusClass(campaign.status))}>{campaign.status}</Badge>
              {campaign.visibility ? (
                <Badge variant="secondary" className="uppercase">
                  {campaign.visibility}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
            <p>Brand: {campaign.clientBrand?.brandName ?? "Brand"}</p>
            <p>Objective: {campaign.objective ?? "TBD"}</p>
            <p>Budget: {formatMoney(campaign.budget)}</p>
            <p>Payment: {campaign.paymentType ?? "TBD"}</p>
            <p>Apply deadline: {formatDate(campaign.applyDeadline)}</p>
            <p>Applications: {applications.length || campaign.applications?.length || 0}</p>
          </div>

          {message ? <p className="mt-4 text-sm font-medium text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-4 text-sm font-medium text-destructive">{error}</p> : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {canManageCampaign && campaign.status === "DRAFT" ? (
              <Button onClick={() => updateCampaignStatus("ACTIVE")} disabled={busyAction != null} className="rounded-xl">
                {busyAction === "ACTIVE" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Publish
              </Button>
            ) : null}
            {canManageCampaign && campaign.status === "ACTIVE" ? (
              <Button onClick={() => updateCampaignStatus("COMPLETED")} disabled={busyAction != null} className="rounded-xl">
                {busyAction === "COMPLETED" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Mark complete
              </Button>
            ) : null}
            {!canManageCampaign && role === "influencer" ? (
              <Button onClick={applyToCampaign} disabled={busyAction != null} className="rounded-xl">
                {busyAction === "apply" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Apply now
              </Button>
            ) : null}
            <Button variant="outline" asChild className="rounded-xl">
              <Link href="/campaigns">Back to campaigns</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Campaign brief</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground">Key message</p>
              <p className="mt-1 whitespace-pre-wrap">{campaign.keyMessage || "No key message yet."}</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Deliverables</p>
              <p className="mt-1 whitespace-pre-wrap">{campaign.deliverables || "No deliverables yet."}</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Do and don't</p>
              <p className="mt-1 whitespace-pre-wrap">{campaign.doAndDont || "No guidance yet."}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground">
            <p>Apply deadline: {formatDate(campaign.applyDeadline)}</p>
            <p>Submission date: {formatDate(campaign.submissionDate)}</p>
            <p>Review date: {formatDate(campaign.reviewDate)}</p>
            <p>Payment date: {formatDate(campaign.paymentDate)}</p>
          </CardContent>
        </Card>
      </div>

      {campaign.requirements?.length ? (
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Creator requirements</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
            {campaign.requirements.map((requirement, index) => (
              <div key={requirement.id ?? index} className="rounded-xl border border-border p-4">
                <p>Min followers: {requirement.minFollowers?.toLocaleString() ?? "Any"}</p>
                <p>Min engagement: {requirement.minEngagementRate != null ? `${requirement.minEngagementRate}%` : "Any"}</p>
                <p>Min avg views: {requirement.minAvgViews?.toLocaleString() ?? "Any"}</p>
                <p>Platforms: {Array.isArray(requirement.platforms) ? requirement.platforms.join(", ") : "Any"}</p>
                <p>Content type: {requirement.contentType || "Any"}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {canManageCampaign ? (
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            ) : (
              <div className="space-y-3">
                {applications.map((application) => {
                  const accounts = application.influencer?.platformAccounts ?? [];
                  return (
                    <div key={application.id} className="rounded-xl border border-border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{getInfluencerName(application)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {accounts.length
                              ? accounts.map((account) => `${account.platform} @${account.handle}`).join(" | ")
                              : "No connected platform data"}
                          </p>
                        </div>
                        <Badge className={cn("border-none uppercase", statusClass(application.status))}>{application.status}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateApplication(application.id, "ACCEPTED")}
                          disabled={busyAction != null || application.status === "ACCEPTED"}
                        >
                          {busyAction === application.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Check className="mr-2 h-3 w-3" />}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateApplication(application.id, "REJECTED")}
                          disabled={busyAction != null || application.status === "REJECTED"}
                        >
                          <X className="mr-2 h-3 w-3" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {isCampaignFinished ? (
        <CampaignPartnerReviews
          campaignId={campaign.id}
          campaignName={campaign.name}
          currentRole={role as Role}
          currentDisplayName={accountDisplayName}
        />
      ) : null}

      {canManageCampaign ? (
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Share influencer list</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild className="rounded-xl">
                <Link href={`/campaigns/${campaign.id}/share`} target="_blank" rel="noreferrer">
                  Open client preview
                </Link>
              </Button>
              <Button variant="outline" onClick={copyShareLink} className="rounded-xl">
                Copy share link
              </Button>
              <Button onClick={exportInfluencersExcel} className="rounded-xl">
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
