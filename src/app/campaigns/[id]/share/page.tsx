"use client";

/**
 * Owner-only internal preview of a campaign's client-review shortlist. Shows the
 * same table the public share page (/campaigns/public/[token]/influencers) shows,
 * but sourced from the authed endpoint and EDITABLE — this is where the owner
 * writes the per-influencer recommendation note + proposed price. "Copy share
 * link" on the campaign management page mints the public token for the read-only
 * version of this list.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CampaignInfluencerList } from "@/components/campaigns/campaign-influencer-list";
import { useUserStore } from "@/store/useUserStore";
import {
  apiGetCampaign,
  apiGetCampaignShortlist,
  apiUpdateCampaignShortlistNote,
  apiRemoveCampaignShortlist,
  type CampaignResponse,
  type CampaignShortlistEntry,
  type PublicInfluencerListInfluencer,
} from "@/lib/api";

function toRow(entry: CampaignShortlistEntry): PublicInfluencerListInfluencer {
  return {
    influencerId: entry.influencerId,
    name: entry.influencer.name,
    avatarUrl: entry.influencer.avatarUrl,
    platforms: entry.influencer.platforms,
    mainPlatform: entry.influencer.mainPlatform,
    mainFollowers: entry.influencer.mainFollowers,
    totalFollowers: entry.influencer.totalFollowers,
    handle: entry.influencer.handle,
    profileUrl: entry.influencer.profileUrl,
    category: entry.influencer.category,
    engagementRate: entry.influencer.engagementRate,
    recommendationNote: entry.recommendationNote,
    proposedPrice: entry.proposedPrice,
  };
}

export default function CampaignInfluencerPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useUserStore();
  const [campaign, setCampaign] = useState<CampaignResponse | null>(null);
  const [entries, setEntries] = useState<CampaignShortlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    // `token` is briefly undefined while the persisted user store rehydrates on a
    // fresh tab (this page opens via target="_blank"), so keep showing the loader
    // rather than erroring until it settles.
    if (!token) {
      setLoading(true);
      setError(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    Promise.all([apiGetCampaign(token, id), apiGetCampaignShortlist(token, id)])
      .then(([c, list]) => {
        if (cancelled) return;
        setCampaign(c);
        setEntries(list);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, id]);

  const rows = useMemo(() => entries.map(toRow), [entries]);

  const handleSave = useCallback(
    async (
      influencerId: string,
      patch: { recommendationNote: string | null; proposedPrice: number | null },
    ) => {
      if (!token || !id) return;
      const updated = await apiUpdateCampaignShortlistNote(
        token,
        id,
        influencerId,
        patch,
      );
      setEntries((prev) =>
        prev.map((e) => (e.influencerId === influencerId ? updated : e)),
      );
    },
    [token, id],
  );

  const handleRemove = useCallback(
    async (influencerId: string) => {
      if (!token || !id) return;
      await apiRemoveCampaignShortlist(token, id, influencerId);
      setEntries((prev) => prev.filter((e) => e.influencerId !== influencerId));
    },
    [token, id],
  );

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 p-6">
        <div className="h-7 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-full max-w-md animate-pulse rounded bg-muted" />
      </section>
    );
  }

  if (error || !campaign) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Preview unavailable
        </h1>
        <p className="text-muted-foreground">
          This campaign could not be loaded, or you do not have access to it.
        </p>
        <Link href="/campaigns" className="font-semibold text-primary hover:underline">
          Back to campaigns
        </Link>
      </section>
    );
  }

  return (
    <CampaignInfluencerList
      campaign={{
        name: campaign.name,
        objective: campaign.objective ?? null,
        brandName: campaign.clientBrand?.brandName ?? null,
      }}
      rows={rows}
      editable
      onSave={handleSave}
      onRemove={handleRemove}
    />
  );
}
