"use client";

/**
 * Public, account-less influencers preview for a campaign shortlist share token.
 * No login required — the token in the path is the only credential. Rendered bare
 * (no sidebar) because app-shell's public allowlist covers /campaigns/public/*.
 * A 404 (unknown / revoked / expired token) shows a friendly unavailable message.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CampaignInfluencerList } from "@/components/campaigns/campaign-influencer-list";
import { apiGetPublicInfluencerList, type PublicInfluencerList } from "@/lib/api";

export default function PublicInfluencerPreviewPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicInfluencerList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    apiGetPublicInfluencerList(token)
      .then((d) => {
        if (!cancelled) setData(d);
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
  }, [token]);

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 p-6">
        <div className="h-7 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-full max-w-md animate-pulse rounded bg-muted" />
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="font-serif text-2xl font-bold text-foreground">
          This link is no longer available
        </h1>
        <p className="text-muted-foreground">
          The share link may have been revoked or expired. Ask the sender for a new one.
        </p>
        <Link href="/" className="font-semibold text-primary hover:underline">
          Back to home
        </Link>
      </section>
    );
  }

  return <CampaignInfluencerList campaign={data.campaign} rows={data.influencers} />;
}
