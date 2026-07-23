"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, Check, Download, DollarSign, Edit, FileText, ImageIcon, LayoutGrid, Link2, Loader2, MessageSquare, Rows3, Send, Share2, Trash2, UserPlus, X } from "lucide-react";
import {
  apiApplyToCampaign,
  apiDeleteCampaign,
  apiGetCampaign,
  apiGetCampaignApplications,
  apiGetPublicCampaigns,
  apiGetShortlist,
  apiInviteToCampaign,
  apiUpdateCampaign,
  apiUploadCampaignCover,
  apiUploadCampaignBriefImage,
  apiDeleteCampaignBriefImage,
  apiUpdateCampaignApplicationStatus,
  apiFetchInfluencer,
  apiGetCampaignShortlist,
  apiAddCampaignShortlist,
  CampaignApplicationResponse,
  CampaignResponse,
  CampaignStatus,
  CampaignShortlistEntry,
} from "@/lib/api";
import { CampaignPartnerReviews } from "@/components/CampaignPartnerReviews";
import { InfluencerDetailPanel } from "@/components/influencer-detail-panel";
import { useUserStore } from "@/store/useUserStore";
import { ShareCampaignModal } from "@/components/campaigns/share-campaign-modal";
import { ShareInfluencersModal } from "@/components/campaigns/share-influencers-modal";
import { Role } from "@/lib/types";
import { useCampaignCollaborationStore } from "@/store/useCampaignCollaborationStore";
import { exportRowsToExcel } from "@/lib/excel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function formatFollowers(n?: number) {
  if (!n || n <= 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function applicationAvatar(name: string) {
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(name || "creator")}`;
}

function getPrimaryAccount(
  accounts?: Array<{ platform: string; handle: string; followers?: number; avgViews?: number; engagementRate?: number }>,
) {
  if (!accounts || accounts.length === 0) return null;
  return [...accounts].sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0))[0];
}

function toCategoryList(categories: unknown): string[] {
  return Array.isArray(categories) ? categories.filter((c): c is string => typeof c === "string") : [];
}

const objectives = ["Awareness", "Engagement", "Conversion", "UGC / content production"];

function numberOrUndefined(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value.trim() !== "" ? parsed : undefined;
}

function listOrUndefined(value: string) {
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}

function getInfluencerName(application: CampaignApplicationResponse) {
  // Mirror the backend's resolution order (formatShortlistInfluencer): external/
  // unclaimed profiles have no linked User, so fall back to a platform account's
  // displayName, then the externalHandle, before giving up.
  const inf = application.influencer;
  return (
    inf?.user?.name ||
    inf?.platformAccounts?.find((a) => a.displayName)?.displayName ||
    inf?.externalHandle ||
    inf?.user?.email ||
    "Unnamed creator"
  );
}

// Clickable influencer profile card — shared between the Applications section and
// the Confirmed-influencers roster. Closure-bound bits (detail-panel loading state,
// open handler, action buttons) are passed in so this can live at module scope.
function ApplicantCard({
  application,
  detailLoadingId,
  onOpenDetail,
  actions,
  readOnly = false,
}: {
  application: CampaignApplicationResponse;
  detailLoadingId: string | null;
  onOpenDetail: (influencerId?: string) => void;
  actions?: ReactNode;
  // Confirmed-roster mode: hide Accept/Reject (already-confirmed creators);
  // everything else — click-to-open-detail, stats, categories — stays identical.
  readOnly?: boolean;
}) {
  const name = getInfluencerName(application);
  const accounts = application.influencer?.platformAccounts ?? [];
  const primary = getPrimaryAccount(accounts);
  const cats = toCategoryList(application.influencer?.categories).slice(0, 3);
  const isLoadingDetail = detailLoadingId === application.influencer?.id;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetail(application.influencer?.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetail(application.influencer?.id);
        }
      }}
      className="flex cursor-pointer flex-col rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={applicationAvatar(name)}
          alt={name}
          className="h-12 w-12 shrink-0 rounded-full border border-border bg-muted object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {primary ? `${primary.platform} @${primary.handle}` : "No connected platform"}
          </p>
        </div>
        <Badge className={cn("border-none uppercase", statusClass(application.status))}>{application.status}</Badge>
      </div>

      {application.influencer?.bio ? (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{application.influencer.bio}</p>
      ) : null}

      {primary ? (
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-2 text-center">
          <div>
            <p className="text-sm font-semibold text-foreground">{formatFollowers(primary.followers)}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Followers</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{formatFollowers(primary.avgViews)}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Avg views</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {primary.engagementRate != null ? `${primary.engagementRate.toFixed(1)}%` : "—"}
            </p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Eng.</p>
          </div>
        </div>
      ) : null}

      {cats.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {cats.map((c) => (
            <span key={c} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {c}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
        {isLoadingDetail ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" /> Loading profile…
          </>
        ) : (
          "Click to view full profile"
        )}
      </div>

      {readOnly ? null : (
        <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { role, token, name: accountDisplayName } = useUserStore();
  const [campaign, setCampaign] = useState<CampaignResponse | null>(null);
  const [applications, setApplications] = useState<CampaignApplicationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [applicationsView, setApplicationsView] = useState<"text" | "card">("text");
  const [detailInfluencer, setDetailInfluencer] = useState<any | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingBriefImage, setUploadingBriefImage] = useState(false);
  const [deletingImageUrl, setDeletingImageUrl] = useState<string | null>(null);
  const briefImageInputRef = useRef<HTMLInputElement>(null);
  const MAX_BRIEF_IMAGES = 6;
  const collaborations = useCampaignCollaborationStore((s) => s.collaborations);
  const recordCampaignFinished = useCampaignCollaborationStore((s) => s.recordCampaignFinished);

  // ── Invite-from-shortlist state ──────────────────────────────────────────
  const [showInvitePicker, setShowInvitePicker] = useState(false);
  const [shortlist, setShortlist] = useState<any[]>([]);
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  // ── Campaign shortlist (client-review list) state ────────────────────────
  const [campaignShortlist, setCampaignShortlist] = useState<CampaignShortlistEntry[]>([]);
  const [addingToListId, setAddingToListId] = useState<string | null>(null);
  const [shareInfluencersOpen, setShareInfluencersOpen] = useState(false);

  const canManageCampaign = role === "brand" || role === "agency";
  // Brief/product image gallery — falls back to the single briefImageUrl for
  // campaigns loaded before the gallery migration backfilled briefImageUrls.
  const briefImages = campaign?.briefImageUrls?.length
    ? campaign.briefImageUrls
    : campaign?.briefImageUrl
      ? [campaign.briefImageUrl]
      : [];
  const [shareOpen, setShareOpen] = useState(false);

  // Commercial-term lock: once ≥1 application is ACCEPTED (from either an
  // APPLICATION or INVITATION origin — both converge on status 'ACCEPTED'), the
  // campaign's commercial terms are frozen. This mirrors the backend enforcement
  // in campaigns.service.updateCampaign; the UI just disables the inputs so the
  // brand can't attempt an edit that the backend would 400 anyway.
  const termsLocked = applications.some((a) => a.status === "ACCEPTED");
  const lockedInputProps = termsLocked
    ? { disabled: true, title: "Locked — campaign has accepted creators" }
    : {};

  // Split the unified application list: brand-initiated invites vs. influencer-initiated applications.
  const invitations = applications.filter((a) => a.origin === "INVITATION");
  const inboundApplications = applications.filter((a) => (a.origin ?? "APPLICATION") === "APPLICATION");
  // Confirmed roster: everyone who has accepted, regardless of origin. These
  // creators intentionally also still appear in their Applications/Invited section.
  const confirmed = applications.filter((a) => a.status === "ACCEPTED");
  const isCampaignFinished =
    !!campaign &&
    (campaign.status === "COMPLETED" || collaborations.some((item) => item.campaignId === campaign.id));

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
          const [campaignData, applicationData, shortlistData] = await Promise.all([
            apiGetCampaign(token, id),
            apiGetCampaignApplications(token, id),
            apiGetCampaignShortlist(token, id),
          ]);
          if (!cancelled) {
            setCampaign(campaignData);
            setApplications(applicationData);
            setCampaignShortlist(shortlistData);
          }
        } else {
          const publicCampaigns = await apiGetPublicCampaigns(token);
          const publicCampaign = publicCampaigns.data.find((item) => item.id === id) ?? null;
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

  const handleDeleteCampaign = async () => {
    if (!token || !campaign) return;
    if (!confirm(`Delete "${campaign.name}"? This cannot be undone.`)) return;
    setBusyAction("delete");
    setError(null);
    try {
      await apiDeleteCampaign(token, campaign.id);
      router.push("/campaigns");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete campaign");
      setBusyAction(null);
    }
  };

  const refreshApplications = async () => {
    if (!token) return;
    const fresh = await apiGetCampaignApplications(token, id);
    setApplications(fresh);
  };

  const openInvitePicker = async () => {
    if (!token) return;
    setShowInvitePicker(true);
    setShortlistLoading(true);
    setError(null);
    try {
      setShortlist(await apiGetShortlist(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shortlist");
    } finally {
      setShortlistLoading(false);
    }
  };

  const inviteFromShortlist = async (influencerId: string) => {
    if (!token || !campaign) return;
    setInvitingId(influencerId);
    setError(null);
    setMessage("");
    try {
      const res = await apiInviteToCampaign(token, campaign.id, influencerId);
      const msgByResult: Record<string, string> = {
        INVITED: "Invitation sent.",
        RE_INVITED: "Invitation re-sent.",
        ALREADY_INVITED: "This influencer is already invited.",
        ALREADY_ACCEPTED: "This influencer already accepted.",
      };
      setMessage(msgByResult[res.inviteResult] ?? "Invitation sent.");
      await refreshApplications();
    } catch (err) {
      // Includes the "already applied" conflict message.
      setError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setInvitingId(null);
    }
  };

  const refreshCampaignShortlist = async () => {
    if (!token) return;
    setCampaignShortlist(await apiGetCampaignShortlist(token, id));
  };

  const addToCampaignList = async (influencerId: string) => {
    if (!token || !campaign) return;
    setAddingToListId(influencerId);
    setError(null);
    setMessage("");
    try {
      await apiAddCampaignShortlist(token, campaign.id, influencerId);
      await refreshCampaignShortlist();
      setMessage("Added to the campaign's influencer list.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add to list");
    } finally {
      setAddingToListId(null);
    }
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
      const result = await apiUpdateCampaignApplicationStatus(token, campaign.id, applicationId, status);
      // On ACCEPTED, backend returns conversationId — update state immediately so Message button appears
      // without requiring a full page reload
      if (status === "ACCEPTED" && result.conversationId) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId
              ? { ...app, status: "ACCEPTED", conversationId: result.conversationId }
              : app,
          ),
        );
      } else {
        await refreshApplications();
      }
      setMessage(status === "ACCEPTED" ? "Application accepted." : "Application rejected.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update application");
    } finally {
      setBusyAction(null);
    }
  };

  // Open the Discover-style detail panel for an applicant's influencer profile.
  const openInfluencerDetail = async (influencerId?: string) => {
    if (!influencerId) return;
    setDetailLoadingId(influencerId);
    try {
      const data = await apiFetchInfluencer(influencerId);
      if (data) setDetailInfluencer(data);
    } catch {
      // Non-fatal — leave the panel closed if the profile can't be fetched.
    } finally {
      setDetailLoadingId(null);
    }
  };

  // Accept / Reject / Message actions — shared between the text and card views.
  const renderApplicationActions = (application: CampaignApplicationResponse) => (
    <>
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
      {application.status === "ACCEPTED" && application.conversationId ? (
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl"
          onClick={() => router.push(`/messages?convId=${application.conversationId}`)}
        >
          <MessageSquare className="mr-2 h-3 w-3" />
          Message
        </Button>
      ) : null}
    </>
  );

  // Exports the campaign shortlist (the client-review list with notes/prices),
  // matching what the influencers preview + public share link present.
  const exportCampaignShortlistExcel = () => {
    if (!campaign) return;
    exportRowsToExcel({
      filename: `campaign-${campaign.id}-shortlist.xls`,
      sheetName: "Influencer List",
      headers: [
        "Marker",
        "KOL name",
        "Social media link",
        "Platform",
        "Platform Follower No.",
        "Category/Niche",
        "Engagement Rate",
        "Why we recommend",
        "Proposed price (THB)",
      ],
      rows: campaignShortlist.map((entry, index) => [
        index + 1,
        entry.influencer.name,
        entry.influencer.profileUrl ?? "",
        entry.influencer.mainPlatform ?? "",
        entry.influencer.mainFollowers,
        entry.influencer.category ?? "",
        `${entry.influencer.engagementRate}%`,
        entry.recommendationNote ?? "",
        entry.proposedPrice ?? "",
      ]),
    });
    setMessage("Influencer list exported as CSV (opens in Excel & Numbers).");
  };

  const startEdit = () => {
    if (!campaign) return;
    const requirement = campaign.requirements?.[0] ?? {};
    setEditFormData({
      name: campaign.name,
      objective: campaign.objective,
      budget: campaign.budget != null ? String(campaign.budget) : "",
      visibility: campaign.visibility ?? "PUBLIC",
      paymentType: campaign.paymentType ?? "",
      keyMessage: campaign.keyMessage ?? "",
      deliverables: campaign.deliverables ?? "",
      doAndDont: campaign.doAndDont ?? "",
      applyDeadline: campaign.applyDeadline ? campaign.applyDeadline.substring(0, 10) : "",
      submissionDate: campaign.submissionDate ? campaign.submissionDate.substring(0, 10) : "",
      reviewDate: campaign.reviewDate ? campaign.reviewDate.substring(0, 10) : "",
      paymentDate: campaign.paymentDate ? campaign.paymentDate.substring(0, 10) : "",
      minFollowers: requirement.minFollowers != null ? String(requirement.minFollowers) : "",
      minEngagementRate: requirement.minEngagementRate != null ? String(requirement.minEngagementRate) : "",
      minAvgViews: requirement.minAvgViews != null ? String(requirement.minAvgViews) : "",
      platforms: Array.isArray(requirement.platforms) ? requirement.platforms.join(", ") : "",
      locations: Array.isArray(requirement.locations) ? requirement.locations.join(", ") : "",
      categories: Array.isArray(requirement.categories) ? requirement.categories.join(", ") : "",
      contentType: requirement.contentType ?? "",
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditFormData(null);
  };

  const handleCoverUpload = async (file: File | undefined) => {
    if (!token || !campaign || !file) return;
    setUploadingCover(true);
    setError(null);
    setMessage("");
    try {
      const updated = await apiUploadCampaignCover(token, campaign.id, file);
      setCampaign(updated);
      setMessage("Cover image updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload cover image");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const handleBriefImageUpload = async (file: File | undefined) => {
    if (!token || !campaign || !file) return;
    setUploadingBriefImage(true);
    setError(null);
    setMessage("");
    try {
      const updated = await apiUploadCampaignBriefImage(token, campaign.id, file);
      setCampaign(updated);
      setMessage("Product image added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload product image");
    } finally {
      setUploadingBriefImage(false);
      if (briefImageInputRef.current) briefImageInputRef.current.value = "";
    }
  };

  const handleBriefImageDelete = async (url: string) => {
    if (!token || !campaign) return;
    setDeletingImageUrl(url);
    setError(null);
    setMessage("");
    try {
      const updated = await apiDeleteCampaignBriefImage(token, campaign.id, url);
      setCampaign(updated);
      setMessage("Product image removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove product image");
    } finally {
      setDeletingImageUrl(null);
    }
  };

  const saveChanges = async () => {
    if (!token || !campaign || !editFormData) return;
    setBusyAction("save");
    setError(null);
    setMessage("");
    try {
      const requirement = {
        minFollowers: numberOrUndefined(editFormData.minFollowers || ""),
        minEngagementRate: numberOrUndefined(editFormData.minEngagementRate || ""),
        minAvgViews: numberOrUndefined(editFormData.minAvgViews || ""),
        platforms: listOrUndefined(editFormData.platforms || ""),
        locations: listOrUndefined(editFormData.locations || ""),
        categories: listOrUndefined(editFormData.categories || ""),
        contentType: editFormData.contentType?.trim() || undefined,
      };
      const hasRequirement = Object.values(requirement).some((value) => value != null && !(Array.isArray(value) && value.length === 0));
      const updatedFields: any = {
        // Always-free fields
        name: editFormData.name?.trim() || undefined,
        objective: editFormData.objective || undefined,
        visibility: editFormData.visibility || undefined,
        keyMessage: editFormData.keyMessage?.trim() || undefined,
        doAndDont: editFormData.doAndDont?.trim() || undefined,
        // Extend-only date fields (backend rejects a shorten regardless)
        applyDeadline: editFormData.applyDeadline || undefined,
        submissionDate: editFormData.submissionDate || undefined,
        reviewDate: editFormData.reviewDate || undefined,
        paymentDate: editFormData.paymentDate || undefined,
        // Commercial-term (LOCK-bucket) fields: omit entirely once locked so we
        // never send an unchanged value that the backend's requirements[] guard
        // (or a trim/format edge) would reject. Backend stays the source of truth.
        budget: termsLocked ? undefined : numberOrUndefined(editFormData.budget || ""),
        paymentType: termsLocked ? undefined : editFormData.paymentType?.trim() || undefined,
        deliverables: termsLocked ? undefined : editFormData.deliverables?.trim() || undefined,
        requirements: termsLocked ? undefined : hasRequirement ? [requirement] : undefined,
      };
      const updated = await apiUpdateCampaign(token, campaign.id, updatedFields);
      setCampaign(updated);
      setIsEditing(false);
      setEditFormData(null);
      setMessage("Campaign updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update campaign");
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) {
    return (
      <section className="space-y-6">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 space-y-5">
            <Skeleton className="h-40 w-full rounded-2xl sm:h-56" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-xl" />
              <Skeleton className="h-9 w-24 rounded-xl" />
              <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      </section>
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
      {isEditing && editFormData ? (
        /* ── Edit mode — clean form card ──────────────────────────────── */
        <Card className="border border-border shadow-sm">
          <CardContent className="space-y-5 p-6">
            {/* Cover uploader */}
            <div className="relative h-40 w-full overflow-hidden rounded-xl bg-muted sm:h-56">
              {campaign.coverImageUrl ? (
                <img
                  src={campaign.coverImageUrl ?? ""}
                  alt={`${campaign.name} cover`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-sm font-medium">No cover image yet</span>
                </div>
              )}
              {canManageCampaign && (
                <>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => handleCoverUpload(e.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={uploadingCover}
                    onClick={() => coverInputRef.current?.click()}
                    className="absolute bottom-3 right-3 rounded-full font-semibold shadow-md"
                  >
                    {uploadingCover ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <ImageIcon className="mr-1.5 h-4 w-4" />
                    )}
                    {campaign.coverImageUrl ? "Change cover" : "Upload cover"}
                  </Button>
                </>
              )}
            </div>

            <div>
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                value={editFormData.name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Campaign name"
                className="mt-1 w-full rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="editObjective">Objective</Label>
              <select
                id="editObjective"
                value={editFormData.objective || objectives[0]}
                onChange={(e) => setEditFormData({ ...editFormData, objective: e.target.value })}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
              >
                {objectives.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="editBudget">Budget</Label>
                <Input
                  id="editBudget"
                  type="number"
                  min={0}
                  value={editFormData.budget || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value })}
                  className="mt-1 rounded-xl"
                  placeholder="Budget in THB"
                  {...lockedInputProps}
                />
                {termsLocked ? <p className="mt-1 text-sm text-muted-foreground">Locked — campaign has accepted creators</p> : null}
              </div>
              <div>
                <Label htmlFor="editVisibility">Visibility</Label>
                <select
                  id="editVisibility"
                  value={editFormData.visibility || "PUBLIC"}
                  onChange={(e) => setEditFormData({ ...editFormData, visibility: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                >
                  <option value="PUBLIC">Public marketplace</option>
                  <option value="PRIVATE">Private invite only</option>
                </select>
              </div>
              <div>
                <Label htmlFor="editPaymentType">Payment type</Label>
                <Input
                  id="editPaymentType"
                  value={editFormData.paymentType || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, paymentType: e.target.value })}
                  className="mt-1 rounded-xl"
                  placeholder="Per post, package, affiliate"
                  {...lockedInputProps}
                />
                {termsLocked ? <p className="mt-1 text-sm text-muted-foreground">Locked — campaign has accepted creators</p> : null}
              </div>
            </div>

            {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
            {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button onClick={saveChanges} disabled={busyAction != null} className="rounded-full">
                {busyAction === "save" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
              <Button onClick={cancelEdit} variant="outline" disabled={busyAction != null} className="rounded-full">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ── View mode — full-bleed travelogue hero (Stitch) ──────────── */
        <div className="space-y-6">
          <div className="group relative h-[280px] w-full overflow-hidden rounded-xl border border-border shadow-sm sm:h-[320px]">
            {campaign.coverImageUrl ? (
              <img
                src={campaign.coverImageUrl}
                alt={`${campaign.name} cover`}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary via-primary/85 to-secondary" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
            <div className="absolute inset-x-6 bottom-6 flex flex-wrap items-end justify-between gap-4 sm:inset-x-8 sm:bottom-8">
              <div className="min-w-0 text-white">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
                  {campaign.clientBrand?.brandName ?? "Campaign"}
                </span>
                <h1 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">{campaign.name}</h1>
                {campaign.objective ? (
                  <p className="mt-1 max-w-xl font-serif text-lg italic text-white/90">{campaign.objective}</p>
                ) : null}
              </div>
              <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm",
                    campaign.status === "ACTIVE" ? "bg-primary/90" : "bg-black/60",
                  )}
                >
                  {campaign.status === "ACTIVE" ? <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> : null}
                  {campaign.status}
                </span>
                {campaign.visibility ? (
                  <span className="inline-flex items-center rounded-full bg-black/60 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
                    {campaign.visibility}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Controls row — stat trio + rounded-full actions */}
          <div className="flex flex-wrap items-center justify-between gap-6 border-b border-border pb-6">
            <div className="flex flex-wrap gap-x-10 gap-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Brand</p>
                <p className="mt-1 font-serif text-sm text-foreground">{campaign.clientBrand?.brandName ?? "Brand"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Payment</p>
                <p className="mt-1 font-serif text-sm text-foreground">{campaign.paymentType ?? "TBD"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Applications</p>
                <p className="mt-1 font-serif text-sm text-foreground">{applications.length || campaign.applications?.length || 0}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {canManageCampaign && campaign.status === "DRAFT" ? (
                <>
                  <Button onClick={startEdit} variant="outline" className="rounded-full">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button onClick={() => updateCampaignStatus("ACTIVE")} disabled={busyAction != null} className="rounded-full">
                    {busyAction === "ACTIVE" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Publish
                  </Button>
                  <Button onClick={handleDeleteCampaign} disabled={busyAction != null} variant="outline" className="rounded-full border-destructive text-destructive hover:bg-destructive/10">
                    {busyAction === "delete" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Delete
                  </Button>
                </>
              ) : null}
              {canManageCampaign && campaign.status === "ACTIVE" ? (
                <>
                  <Button onClick={startEdit} variant="outline" className="rounded-full">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button onClick={() => updateCampaignStatus("COMPLETED")} disabled={busyAction != null} className="rounded-full">
                    {busyAction === "COMPLETED" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Mark complete
                  </Button>
                  <Button onClick={() => updateCampaignStatus("CANCELLED")} disabled={busyAction != null} variant="outline" className="rounded-full border-destructive text-destructive hover:bg-destructive/10">
                    {busyAction === "CANCELLED" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                    Cancel campaign
                  </Button>
                </>
              ) : null}
              {canManageCampaign && campaign.status === "CANCELLED" ? (
                <Button onClick={handleDeleteCampaign} disabled={busyAction != null} variant="outline" className="rounded-full border-destructive text-destructive hover:bg-destructive/10">
                  {busyAction === "delete" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Delete
                </Button>
              ) : null}
              {!canManageCampaign && role === "influencer" ? (
                <Button onClick={applyToCampaign} disabled={busyAction != null} className="rounded-full">
                  {busyAction === "apply" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Apply now
                </Button>
              ) : null}
              <Button variant="outline" asChild className="rounded-full">
                <Link href="/campaigns">Back to campaigns</Link>
              </Button>
            </div>
          </div>

          {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
        </div>
      )}

      {/* Two-column body: main content (left) + investment right rail (Stitch) */}
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_400px]">
        <div className="min-w-0 space-y-6">

      <Card className="relative overflow-hidden border border-border shadow-sm">
        <FileText className="pointer-events-none absolute right-6 top-6 h-16 w-16 text-primary opacity-10" />
        <CardHeader>
          <CardTitle className="inline-block border-b border-primary/20 pb-2 font-serif text-xl">Brief &amp; Creative Direction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 text-sm text-muted-foreground">
            {isEditing && editFormData ? (
              <>
                <div>
                  <Label htmlFor="editKeyMessage" className="font-semibold text-foreground mb-1">Key message</Label>
                  <textarea
                    id="editKeyMessage"
                    value={editFormData.keyMessage || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, keyMessage: e.target.value })}
                    placeholder="Enter key message"
                    className="w-full min-h-[100px] p-2 mt-1 rounded-xl border border-input bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <Label htmlFor="editDeliverables" className="font-semibold text-foreground mb-1">Deliverables</Label>
                  <textarea
                    id="editDeliverables"
                    value={editFormData.deliverables || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, deliverables: e.target.value })}
                    placeholder="Enter deliverables"
                    className="w-full min-h-[100px] p-2 mt-1 rounded-xl border border-input bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                    {...lockedInputProps}
                  />
                  {termsLocked ? <p className="mt-1 text-sm text-muted-foreground">Locked — campaign has accepted creators</p> : null}
                </div>
                <div>
                  <Label htmlFor="editDoAndDont" className="font-semibold text-foreground mb-1">Do and don't</Label>
                  <textarea
                    id="editDoAndDont"
                    value={editFormData.doAndDont || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, doAndDont: e.target.value })}
                    placeholder="Enter guidance"
                    className="w-full min-h-[100px] p-2 mt-1 rounded-xl border border-input bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Key message</p>
                  <p className="mt-2 whitespace-pre-wrap border-l-2 border-primary/20 pl-4 italic leading-relaxed">{campaign.keyMessage || "No key message yet."}</p>
                </div>
                <div className="grid gap-8 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Deliverables</p>
                    <p className="mt-2 whitespace-pre-wrap leading-relaxed">{campaign.deliverables || "No deliverables yet."}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Do and don't</p>
                    <p className="mt-2 whitespace-pre-wrap leading-relaxed">{campaign.doAndDont || "No guidance yet."}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

      {(isEditing || campaign.requirements?.length) ? (
        <section>
          <h4 className="mb-4 font-serif text-xl font-semibold text-foreground">Creator requirements</h4>
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
            {isEditing && editFormData ? (
              <>
              {termsLocked ? (
                <p className="mb-3 text-sm text-muted-foreground">
                  Creator requirements are locked — this campaign has accepted creators.
                </p>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2 rounded-xl border border-border p-4">
                <div>
                  <Label htmlFor="editMinFollowers">Min followers</Label>
                  <Input
                    id="editMinFollowers"
                    type="number"
                    min={0}
                    value={editFormData.minFollowers || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, minFollowers: e.target.value })}
                    className="mt-1 rounded-xl"
                    placeholder="e.g. 10000"
                    {...lockedInputProps}
                  />
                </div>
                <div>
                  <Label htmlFor="editMinEngagementRate">Min engagement %</Label>
                  <Input
                    id="editMinEngagementRate"
                    type="number"
                    min={0}
                    value={editFormData.minEngagementRate || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, minEngagementRate: e.target.value })}
                    className="mt-1 rounded-xl"
                    placeholder="e.g. 5"
                    {...lockedInputProps}
                  />
                </div>
                <div>
                  <Label htmlFor="editMinAvgViews">Min avg views</Label>
                  <Input
                    id="editMinAvgViews"
                    type="number"
                    min={0}
                    value={editFormData.minAvgViews || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, minAvgViews: e.target.value })}
                    className="mt-1 rounded-xl"
                    placeholder="e.g. 15000"
                    {...lockedInputProps}
                  />
                </div>
                <div>
                  <Label htmlFor="editPlatforms">Platforms</Label>
                  <Input
                    id="editPlatforms"
                    value={editFormData.platforms || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, platforms: e.target.value })}
                    className="mt-1 rounded-xl"
                    placeholder="TikTok, Instagram, YouTube"
                    {...lockedInputProps}
                  />
                </div>
                <div>
                  <Label htmlFor="editLocations">Locations</Label>
                  <Input
                    id="editLocations"
                    value={editFormData.locations || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, locations: e.target.value })}
                    className="mt-1 rounded-xl"
                    placeholder="Bangkok, Thailand"
                    {...lockedInputProps}
                  />
                </div>
                <div>
                  <Label htmlFor="editCategories">Categories</Label>
                  <Input
                    id="editCategories"
                    value={editFormData.categories || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, categories: e.target.value })}
                    className="mt-1 rounded-xl"
                    placeholder="Fashion, Lifestyle"
                    {...lockedInputProps}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="editContentType">Content type</Label>
                  <Input
                    id="editContentType"
                    value={editFormData.contentType || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, contentType: e.target.value })}
                    className="mt-1 rounded-xl"
                    placeholder="Reels, Story, Short"
                    {...lockedInputProps}
                  />
                </div>
              </div>
              </>
            ) : (
              <div className="space-y-8">
                {(campaign.requirements ?? []).map((requirement, index) => {
                  const cats = Array.isArray(requirement.categories) ? requirement.categories : [];
                  const tiles = [
                    { label: "Min followers", value: requirement.minFollowers?.toLocaleString() ?? "Any" },
                    { label: "Engagement", value: requirement.minEngagementRate != null ? `${requirement.minEngagementRate}%` : "Any" },
                    { label: "Avg views", value: requirement.minAvgViews?.toLocaleString() ?? "Any" },
                    { label: "Location", value: Array.isArray(requirement.locations) && requirement.locations.length ? requirement.locations.join(", ") : "Any" },
                    { label: "Platforms", value: Array.isArray(requirement.platforms) && requirement.platforms.length ? requirement.platforms.join(", ") : "Any" },
                    { label: "Content type", value: requirement.contentType || "Any" },
                  ];
                  return (
                    <div key={requirement.id ?? index} className="space-y-4">
                      {cats.length ? (
                        <div className="flex flex-wrap gap-2">
                          {cats.map((c) => (
                            <span key={c} className="rounded-md bg-secondary/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-secondary">{c}</span>
                          ))}
                        </div>
                      ) : null}
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {tiles.map((tile) => (
                          <div key={tile.label} className="rounded-lg border-b-2 border-primary/10 bg-muted p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{tile.label}</p>
                            <p className="mt-1 font-serif text-lg text-foreground">{tile.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {canManageCampaign ? (
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-serif text-xl font-semibold text-foreground">Confirmed influencers</h4>
            <Badge variant="outline" className="rounded-full">
              {confirmed.length} confirmed
            </Badge>
          </div>
          <div>
            {confirmed.length === 0 ? (
              <p className="text-sm text-muted-foreground">No confirmed influencers yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {confirmed.map((application) => (
                  <ApplicantCard
                    key={application.id}
                    application={application}
                    detailLoadingId={detailLoadingId}
                    onOpenDetail={openInfluencerDetail}
                    readOnly
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {canManageCampaign ? (
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-serif text-xl font-semibold text-foreground">Applications</h4>
            {inboundApplications.length > 0 ? (
              <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                {([
                  ["text", "Text", Rows3],
                  ["card", "Profile card", LayoutGrid],
                ] as const).map(([mode, label, Icon]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setApplicationsView(mode)}
                    aria-pressed={applicationsView === mode}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition",
                      applicationsView === mode
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div>
            {inboundApplications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            ) : applicationsView === "text" ? (
              <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                {inboundApplications.map((application) => {
                  const accounts = application.influencer?.platformAccounts ?? [];
                  return (
                    <div key={application.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold text-foreground">{getInfluencerName(application)}</p>
                          <Badge className={cn("border-none uppercase", statusClass(application.status))}>{application.status}</Badge>
                        </div>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {accounts.length
                            ? accounts.map((account) => `${account.platform} @${account.handle}`).join(" | ")
                            : "No connected platform data"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">{renderApplicationActions(application)}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {inboundApplications.map((application) => (
                  <ApplicantCard
                    key={application.id}
                    application={application}
                    detailLoadingId={detailLoadingId}
                    onOpenDetail={openInfluencerDetail}
                    actions={renderApplicationActions(application)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {canManageCampaign ? (
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-serif text-xl font-semibold text-foreground">Invited influencers</h4>
            <Button size="sm" onClick={openInvitePicker} className="rounded-xl">
              <UserPlus className="mr-2 h-3.5 w-3.5" />
              Invite from shortlist
            </Button>
          </div>
          <div>
            {invitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No invitations yet. Invite creators from your shortlist or from Discover.
              </p>
            ) : (
              <div className="space-y-5">
                {([
                  ["INVITED", "Awaiting response"],
                  ["ACCEPTED", "Accepted"],
                  ["DECLINED", "Declined"],
                ] as const).map(([groupStatus, label]) => {
                  const rows = invitations.filter((i) => i.status === groupStatus);
                  if (rows.length === 0) return null;
                  return (
                    <div key={groupStatus} className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {label} ({rows.length})
                      </p>
                      {rows.map((invitation) => {
                        const accounts = invitation.influencer?.platformAccounts ?? [];
                        return (
                          <div key={invitation.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-foreground">{getInfluencerName(invitation)}</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {accounts.length
                                    ? accounts.map((account) => `${account.platform} @${account.handle}`).join(" | ")
                                    : "No connected platform data"}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={cn("border-none uppercase", statusClass(invitation.status))}>
                                  {invitation.status}
                                </Badge>
                                {invitation.status === "ACCEPTED" && invitation.conversationId ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl"
                                    onClick={() => router.push(`/messages?convId=${invitation.conversationId}`)}
                                  >
                                    <MessageSquare className="mr-2 h-3 w-3" />
                                    Message
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {canManageCampaign ? (
        <section>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h4 className="font-serif text-xl font-semibold text-foreground">Campaign shortlist</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                A client-facing list of recommended creators with notes and proposed
                pricing — separate from formal invitations above.
              </p>
            </div>
            <Badge variant="outline" className="rounded-full">
              {campaignShortlist.length} on list
            </Badge>
          </div>
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={openInvitePicker} className="rounded-xl">
                <UserPlus className="mr-2 h-3.5 w-3.5" />
                Add from shortlist
              </Button>
              <Button variant="outline" size="sm" asChild className="rounded-xl">
                <Link href={`/campaigns/${campaign.id}/share`} target="_blank" rel="noreferrer">
                  Open influencers preview
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShareInfluencersOpen(true)}
                disabled={campaignShortlist.length === 0}
                className="rounded-xl"
              >
                <Link2 className="mr-2 h-3.5 w-3.5" />
                Share link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportCampaignShortlistExcel}
                disabled={campaignShortlist.length === 0}
                className="rounded-xl"
              >
                <Download className="mr-2 h-3.5 w-3.5" />
                Export CSV
              </Button>
            </div>
            {campaignShortlist.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No creators on this list yet. Use{" "}
                <span className="font-medium text-foreground">Add from shortlist</span>{" "}
                to build a client-facing preview.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Add notes and pricing in the{" "}
                <span className="font-medium text-foreground">influencers preview</span>,
                then share the public link with your client.
              </p>
            )}
          </div>
        </section>
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
        <section>
          <h4 className="mb-4 font-serif text-xl font-semibold text-foreground">Share campaign</h4>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="mb-3 text-sm text-muted-foreground">
              Generate a public, account-less link to a presentation-safe view of
              this campaign. Budget, payment, and applicant data are never shown.
            </p>
            <Button variant="outline" onClick={() => setShareOpen(true)} className="rounded-xl">
              <Share2 className="mr-2 h-4 w-4" />
              Share campaign
            </Button>
          </div>
        </section>
      ) : null}

      {shareOpen && token ? (
        <ShareCampaignModal
          token={token}
          campaignId={id}
          onClose={() => setShareOpen(false)}
        />
      ) : null}

      {shareInfluencersOpen && token ? (
        <ShareInfluencersModal
          token={token}
          campaignId={id}
          onClose={() => setShareInfluencersOpen(false)}
        />
      ) : null}

      {detailInfluencer && detailInfluencer.meta ? (
        <InfluencerDetailPanel
          influencer={detailInfluencer}
          meta={detailInfluencer.meta}
          onClose={() => setDetailInfluencer(null)}
        />
      ) : null}

      {showInvitePicker ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowInvitePicker(false)}
        >
          <Card className="w-full max-w-md shadow-2xl border-none" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">From your shortlist</CardTitle>
                <button
                  onClick={() => setShowInvitePicker(false)}
                  className="rounded-full p-1 hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Add to the client list or invite directly to{" "}
                <span className="font-semibold text-foreground">{campaign.name}</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-2 pb-4 max-h-[60vh] overflow-y-auto">
              {shortlistLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : shortlist.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Your shortlist is empty. Save creators from Discover first.
                </p>
              ) : (
                shortlist.map((inf) => {
                  const existing = applications.find((a) => a.influencer?.id === inf.id);
                  const already = existing?.status === "INVITED" || existing?.status === "ACCEPTED";
                  const onList = campaignShortlist.some((e) => e.influencerId === inf.id);
                  return (
                    <div
                      key={inf.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{inf.name}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {Array.isArray(inf.platforms) && inf.platforms.length
                            ? inf.platforms.join(", ")
                            : "No platform data"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          size="sm"
                          variant={onList ? "outline" : "default"}
                          disabled={onList || addingToListId === inf.id}
                          onClick={() => addToCampaignList(inf.id)}
                          className="rounded-xl"
                        >
                          {addingToListId === inf.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : onList ? (
                            "On list"
                          ) : (
                            "Add to list"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={already || invitingId === inf.id}
                          onClick={() => inviteFromShortlist(inf.id)}
                          className="rounded-xl"
                        >
                          {invitingId === inf.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : already ? (
                            existing?.status === "ACCEPTED" ? "Accepted" : "Invited"
                          ) : (
                            "Invite"
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
        </div>

        {/* Right rail — Investment & Schedule (terracotta) */}
        <aside className="space-y-6 lg:sticky lg:top-6">
          <Card className="border-none bg-primary text-primary-foreground shadow-sm">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">
                <DollarSign className="h-4 w-4" /> Investment &amp; Schedule
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-foreground/60">Total budget</p>
                <p className="mt-1 font-serif text-3xl font-bold">{formatMoney(campaign.budget)}</p>
                {campaign.paymentType ? (
                  <p className="mt-1 text-sm text-primary-foreground/70">{campaign.paymentType}</p>
                ) : null}
              </div>
              <div className="border-t border-primary-foreground/20 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-foreground/60">Timeline</p>
                <p className="mt-1.5 flex items-center gap-2 text-sm font-semibold">
                  <Calendar className="h-4 w-4 shrink-0" /> Apply by {formatDate(campaign.applyDeadline)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline (Stitch) — moved into the right rail */}
          <section>
            <h4 className="mb-4 flex items-center gap-2 font-serif text-xl font-semibold text-foreground">
              <Calendar className="h-5 w-5 text-primary" />
              Timeline
            </h4>
            <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
              {isEditing && editFormData ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="editApplyDeadline">Apply deadline</Label>
                    <Input
                      id="editApplyDeadline"
                      type="date"
                      value={editFormData.applyDeadline || ""}
                      min={termsLocked ? campaign.applyDeadline?.substring(0, 10) : undefined}
                      onChange={(e) => setEditFormData({ ...editFormData, applyDeadline: e.target.value })}
                      className="mt-1 rounded-xl"
                    />
                    {termsLocked ? <p className="mt-1 text-sm text-muted-foreground">Can be extended, not shortened</p> : null}
                  </div>
                  <div>
                    <Label htmlFor="editSubmissionDate">Submission date</Label>
                    <Input
                      id="editSubmissionDate"
                      type="date"
                      value={editFormData.submissionDate || ""}
                      min={termsLocked ? campaign.submissionDate?.substring(0, 10) : undefined}
                      onChange={(e) => setEditFormData({ ...editFormData, submissionDate: e.target.value })}
                      className="mt-1 rounded-xl"
                    />
                    {termsLocked ? <p className="mt-1 text-sm text-muted-foreground">Can be extended, not shortened</p> : null}
                  </div>
                  <div>
                    <Label htmlFor="editReviewDate">Review date</Label>
                    <Input
                      id="editReviewDate"
                      type="date"
                      value={editFormData.reviewDate || ""}
                      min={termsLocked ? campaign.reviewDate?.substring(0, 10) : undefined}
                      onChange={(e) => setEditFormData({ ...editFormData, reviewDate: e.target.value })}
                      className="mt-1 rounded-xl"
                    />
                    {termsLocked ? <p className="mt-1 text-sm text-muted-foreground">Can be extended, not shortened</p> : null}
                  </div>
                  <div>
                    <Label htmlFor="editPaymentDate">Payment date</Label>
                    <Input
                      id="editPaymentDate"
                      type="date"
                      value={editFormData.paymentDate || ""}
                      min={termsLocked ? campaign.paymentDate?.substring(0, 10) : undefined}
                      onChange={(e) => setEditFormData({ ...editFormData, paymentDate: e.target.value })}
                      className="mt-1 rounded-xl"
                    />
                    {termsLocked ? <p className="mt-1 text-sm text-muted-foreground">Can be extended, not shortened</p> : null}
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {[
                    { label: "Apply deadline", value: formatDate(campaign.applyDeadline) },
                    { label: "Submission date", value: formatDate(campaign.submissionDate) },
                    { label: "Review date", value: formatDate(campaign.reviewDate) },
                    { label: "Payment date", value: formatDate(campaign.paymentDate) },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between border-b border-border/60 py-3 last:border-0">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{row.label}</span>
                      <span className="font-serif text-sm text-foreground">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Product images (Stitch "Latest Assets") — brief image gallery */}
          {(briefImages.length > 0 || (isEditing && canManageCampaign)) ? (
            <Card className="border-none shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <ImageIcon className="h-4 w-4" /> Product Images
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground/70">
                    {briefImages.length}/{MAX_BRIEF_IMAGES}
                  </span>
                </div>
                {briefImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {briefImages.map((url, index) => (
                      <div
                        key={url}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`${campaign.name} product ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        {isEditing && canManageCampaign ? (
                          <button
                            type="button"
                            onClick={() => handleBriefImageDelete(url)}
                            disabled={deletingImageUrl === url}
                            aria-label="Remove image"
                            className="absolute right-1.5 top-1.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/80 disabled:cursor-not-allowed"
                          >
                            {deletingImageUrl === url ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border border-border bg-muted text-muted-foreground">
                    <ImageIcon className="h-7 w-7" />
                    <span className="text-xs font-medium">No product images yet</span>
                  </div>
                )}
                {isEditing && canManageCampaign && (
                  <>
                    <input
                      ref={briefImageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => handleBriefImageUpload(e.target.files?.[0])}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={uploadingBriefImage || briefImages.length >= MAX_BRIEF_IMAGES}
                      onClick={() => briefImageInputRef.current?.click()}
                      className="mt-3 w-full rounded-xl font-bold"
                    >
                      {uploadingBriefImage ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <ImageIcon className="mr-1.5 h-4 w-4" />
                      )}
                      {briefImages.length >= MAX_BRIEF_IMAGES
                        ? "Maximum reached"
                        : briefImages.length > 0
                          ? "Add product image"
                          : "Upload product image"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>
    </section>
  );
}