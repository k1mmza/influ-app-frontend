"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CampaignPartnerReviews } from "@/components/CampaignPartnerReviews";
import { resolveBrandCampaignId } from "@/lib/campaign-id-bridge";
import { useUserStore } from "@/store/useUserStore";
import { useCampaignCollaborationStore } from "@/store/useCampaignCollaborationStore";
import { brandCampaigns, trackingByCampaign } from "@/mock/brand-campaigns";
import { getMainFollowerPlatform } from "@/lib/influencer-platforms";
import { influencers } from "@/mock/influencers";
import { exportRowsToExcel } from "@/lib/excel";

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { role, name: accountDisplayName } = useUserStore();
  const [shareMessage, setShareMessage] = useState("");

  const bridgeId = resolveBrandCampaignId(id);
  const brandCampaign = brandCampaigns.find((c) => c.id === bridgeId);
  const collaborations = useCampaignCollaborationStore((s) => s.collaborations);
  const recordCampaignFinished = useCampaignCollaborationStore((s) => s.recordCampaignFinished);

  const isCampaignFinished =
    !!brandCampaign &&
    (brandCampaign.status === "completed" || collaborations.some((c) => c.campaignId === brandCampaign.id));

  const canManageCampaign = role === "brand" || role === "agency";

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
        const socialMediaLink = `https://www.${host}/@${socialHandle}`;
        return {
          marker: index + 1,
          kolName: influencer.name,
          socialMediaLink,
          platform: primaryPlatform,
          platformFollowers,
          category: influencer.category,
          estimateView: Math.round(influencer.followers * 0.35),
          engagementRate: influencer.engagementRate,
          kolRate: influencer.ratePerPost
        };
      }),
    []
  );

  const copyShareLink = async () => {
    const shareUrl =
      typeof window === "undefined" ? "" : `${window.location.origin}/campaigns/${bridgeId}/share`;
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage("Client share link copied.");
    } catch {
      setShareMessage("Unable to copy automatically. Please copy from browser URL.");
    }
  };

  const exportInfluencersExcel = () => {
    exportRowsToExcel({
      filename: `campaign-${bridgeId}-influencers.xls`,
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
        "KOL Rate"
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
        `THB ${row.kolRate}`
      ])
    });
    setShareMessage("Influencer list exported to Excel.");
  };

  const markCampaignFinished = () => {
    if (!brandCampaign) return;
    recordCampaignFinished({
      campaignId: brandCampaign.id,
      campaignName: brandCampaign.name,
      currentRole: role,
      currentDisplayName: accountDisplayName
    });
    setShareMessage("Campaign marked finished. Please submit partner reviews below.");
  };

  if (role === "influencer" && brandCampaign) {
    const displayStatus = isCampaignFinished ? "completed" : brandCampaign.status;
    return (
      <section className="space-y-6">
        <article className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground font-serif">{brandCampaign.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Influencer view — same job as brand/agency list (linked IDs).</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                displayStatus === "active"
                  ? "bg-emerald-100 text-emerald-800"
                  : displayStatus === "pending"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {displayStatus}
            </span>
          </div>
          <div className="mt-4 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
            <p>Objective: {brandCampaign.objective}</p>
            <p>Platform: {brandCampaign.platform}</p>
            <p>Budget: THB {brandCampaign.budget.toLocaleString()}</p>
            <p>Deadline: {brandCampaign.deadline}</p>
          </div>
          {!isCampaignFinished ? (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-medium text-primary-foreground">Wrap up this campaign</p>
              <p className="mt-1 text-xs text-primary/95">
                When deliverables are done, mark finished so you and partners can leave required ratings.
              </p>
              <button
                type="button"
                onClick={markCampaignFinished}
                className="mt-3 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90"
              >
                Mark campaign as finished
              </button>
              {shareMessage ? <p className="mt-2 text-xs font-medium text-emerald-700">{shareMessage}</p> : null}
            </div>
          ) : null}
        </article>

        {isCampaignFinished && brandCampaign ? (
          <CampaignPartnerReviews
            campaignId={brandCampaign.id}
            campaignName={brandCampaign.name}
            currentRole={role}
            currentDisplayName={accountDisplayName}
          />
        ) : null}

        <Link href="/campaigns" className="inline-flex rounded-lg bg-muted px-3 py-2 text-sm font-semibold text-foreground">
          Back to campaigns
        </Link>
      </section>
    );
  }

  if (canManageCampaign && !brandCampaign) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground font-serif">Campaign not found</h1>
        <p className="text-muted-foreground">This ID is not in your brand campaigns list.</p>
        <Link href="/campaigns" className="text-primary hover:underline">
          Back to campaigns
        </Link>
      </section>
    );
  }

  if (canManageCampaign && brandCampaign) {
    const rows = trackingByCampaign[bridgeId] ?? [];
    const displayStatus = isCampaignFinished ? "completed" : brandCampaign.status;

    return (
      <section className="space-y-6">
        <article className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground font-serif">Campaign management</h1>
              <p className="mt-1 text-sm text-muted-foreground">{brandCampaign.name}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  displayStatus === "active"
                    ? "bg-emerald-100 text-emerald-800"
                    : displayStatus === "pending"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {displayStatus}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                {brandCampaign.visibility === "public" ? "Public" : "Private"}
              </span>
            </div>
          </div>
          <div className="mt-4 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
            <p>Objective: {brandCampaign.objective}</p>
            <p>Platform: {brandCampaign.platform}</p>
            <p>Budget: THB {brandCampaign.budget.toLocaleString()}</p>
            <p>Spent: THB {brandCampaign.spent.toLocaleString()}</p>
            <p>Deadline: {brandCampaign.deadline}</p>
            <p>Influencers joined: {brandCampaign.influencersJoined}</p>
          </div>
          {!isCampaignFinished ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-amber-900">Finish campaign</p>
                <p className="mt-1 text-xs text-amber-800">
                  Mark complete when work is done. Brand, agency, and influencers can then rate each other for this
                  campaign name.
                </p>
              </div>
              <button
                type="button"
                onClick={markCampaignFinished}
                className="shrink-0 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
              >
                Mark as finished
              </button>
            </div>
          ) : null}
          {shareMessage ? <p className="mt-3 text-xs font-medium text-emerald-700">{shareMessage}</p> : null}
        </article>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground font-serif">Influencers &amp; content</h2>
            {rows.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No submissions yet. Use Discover to invite creators for private campaigns.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                {rows.map((r) => (
                  <li key={r.id} className="rounded-lg border border-border px-3 py-2">
                    {r.influencerName} — {r.contentLabel}{" "}
                    <span className="text-muted-foreground">({r.contentType})</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
          <article className="rounded-2xl bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground font-serif">Actions</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/discover"
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white"
              >
                Discover influencers
              </Link>
              <Link
                href="/messages"
                className="rounded-lg bg-muted px-3 py-1.5 text-sm font-semibold text-foreground"
              >
                Open messages
              </Link>
              <Link
                href="/tracking"
                className="rounded-lg bg-muted px-3 py-1.5 text-sm font-semibold text-foreground"
              >
                Tracking
              </Link>
            </div>
          </article>
        </div>

        {isCampaignFinished ? (
          <CampaignPartnerReviews
            campaignId={brandCampaign.id}
            campaignName={brandCampaign.name}
            currentRole={role}
            currentDisplayName={accountDisplayName}
          />
        ) : null}

        <article className="rounded-2xl bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground font-serif">Share influencer list</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Share a read-only list with your client (mock: Sarah Chen → David Kim). Open preview to see the same view
                they get, including comments.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/campaigns/${bridgeId}/share`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-semibold text-primary/95 hover:bg-primary/10"
              >
                Open client preview
              </Link>
              <button
                type="button"
                onClick={copyShareLink}
                className="rounded-lg bg-muted px-3 py-1.5 text-sm font-semibold text-foreground"
              >
                Copy share link
              </button>
              <button
                type="button"
                onClick={exportInfluencersExcel}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white"
              >
                Export Excel
              </button>
            </div>
          </div>
          {shareMessage && !isCampaignFinished ? <p className="mt-3 text-xs font-medium text-emerald-700">{shareMessage}</p> : null}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Marker</th>
                  <th className="px-4 py-2 font-medium">KOL name</th>
                  <th className="px-4 py-2 font-medium">Social media link</th>
                  <th className="px-4 py-2 font-medium">Platform</th>
                  <th className="px-4 py-2 font-medium">Platform Follower No.</th>
                  <th className="px-4 py-2 font-medium">Category/Niche</th>
                  <th className="px-4 py-2 font-medium">Estimate view</th>
                  <th className="px-4 py-2 font-medium">Engagement Rate</th>
                  <th className="px-4 py-2 font-medium">KOL Rate</th>
                </tr>
              </thead>
              <tbody>
                {influencerRows.map((row) => (
                  <tr key={row.kolName} className="border-t border-border">
                    <td className="px-4 py-2 text-foreground">{row.marker}</td>
                    <td className="px-4 py-2 font-medium text-foreground">{row.kolName}</td>
                    <td className="px-4 py-2 text-primary">{row.socialMediaLink}</td>
                    <td className="px-4 py-2 text-foreground">{row.platform}</td>
                    <td className="px-4 py-2 text-foreground">{row.platformFollowers.toLocaleString()}</td>
                    <td className="px-4 py-2 text-foreground">{row.category}</td>
                    <td className="px-4 py-2 text-foreground">{row.estimateView.toLocaleString()}</td>
                    <td className="px-4 py-2 text-foreground">{row.engagementRate}%</td>
                    <td className="px-4 py-2 text-foreground">THB {row.kolRate.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <Link href="/campaigns" className="inline-flex rounded-lg bg-muted px-3 py-2 text-sm font-semibold text-foreground">
          Back to campaigns
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <article className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-serif">Campaign Detail</h1>
            <p className="mt-1 text-sm text-muted-foreground">Summer Skincare Awareness Campaign</p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white">Apply Now</button>
            <button className="rounded-lg bg-muted px-3 py-1.5 text-sm font-semibold text-foreground">Save</button>
          </div>
        </div>
        <div className="mt-4 grid gap-1 text-sm text-muted-foreground">
          <p>Brand: GlowLab</p>
          <p>Platform: TikTok / Instagram</p>
          <p className="text-base font-semibold text-emerald-600">Budget: THB 8,000 - THB 10,000</p>
          <p>Deadline: 30 May 2026</p>
        </div>
      </article>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground font-serif">Quick Stats</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Follower requirement: 10,000+</li>
            <li>Engagement requirement: 3%+</li>
            <li>Content type: Video / Story</li>
            <li>Location: Thailand</li>
          </ul>
        </article>

        <article className="rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground font-serif">Timeline</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Apply deadline: 20 May 2026</li>
            <li>Submission date: 28 May 2026</li>
            <li>Review date: 30 May 2026</li>
            <li>Payment date: 05 Jun 2026</li>
          </ul>
        </article>
      </div>

      <article className="rounded-2xl bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground font-serif">Campaign Brief</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <div>
            <h3 className="font-semibold text-foreground font-serif">Overview</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>Goal: Brand awareness</li>
              <li>Brand: Dermatologist-tested skincare</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground font-serif">Requirements</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>1 short video + 3 stories</li>
              <li>Real usage demonstration</li>
              <li>Key message: gentle for daily use</li>
              <li>Do: mention results, Don&apos;t: medical claims</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground font-serif">Deliverables</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>1 TikTok video</li>
              <li>3 IG stories</li>
            </ul>
          </div>
        </div>
      </article>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground font-serif">Payment Details</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Budget: Range based on experience</li>
            <li>Payment type: Per post / Package</li>
            <li>Method: Bank transfer</li>
          </ul>
        </article>

        <article className="rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground font-serif">Brand Info</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>GlowLab official profile</li>
            <li>Past campaigns available on request</li>
          </ul>
          <button className="mt-4 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white">Message Brand</button>
        </article>
      </div>

      <article className="rounded-2xl bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground font-serif">Similar Campaigns</h2>
        <p className="mt-2 text-sm text-muted-foreground">Suggested jobs: Beauty routine challenge, skincare review bundle.</p>
      </article>

      <Link href="/campaigns" className="inline-flex rounded-lg bg-muted px-3 py-2 text-sm font-semibold text-foreground">
        Back to Campaigns
      </Link>
    </section>
  );
}
