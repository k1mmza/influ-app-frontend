"use client";

/**
 * Public, account-less "Share Report" page.
 *
 * What a client sees when they open a shared link (no login). It fetches the
 * presentation-safe public DTO by share token and renders the SAME
 * <CampaignReportBody> the authenticated report uses, in `isPublic` mode — which
 * hides owner-only affordances (Share, internal analytics, workflow Status).
 *
 * The app-shell renders this route bare (no sidebar/nav) since the visitor has
 * no account. A 404 (unknown / revoked / expired token) shows a friendly
 * "link unavailable" state rather than leaking whether the campaign exists.
 */

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Link2 } from "lucide-react";
import {
  apiGetPublicTrackingReport,
  type PublicTrackingReport,
} from "@/lib/api";
import {
  CampaignReportBody,
  CARD,
  T_PRIMARY,
  T_SECOND,
  T_MUTED,
} from "@/components/tracking/report-view";
import { cn } from "@/lib/utils";

export default function PublicReportPage() {
  const params = useParams<{ token: string }>();
  const shareToken = params?.token;

  const [report, setReport] = useState<PublicTrackingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareToken) return;
    setLoading(true);
    apiGetPublicTrackingReport(shareToken)
      .then((r) => {
        setReport(r);
        setError(null);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "This report link is no longer available")
      )
      .finally(() => setLoading(false));
  }, [shareToken]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] px-4 py-8 dark:bg-neutral-950 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        {loading ? (
          <div className={cn("flex items-center justify-center gap-2 py-24", T_MUTED)}>
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading report…
          </div>
        ) : error ? (
          <div className={cn(CARD, "mx-auto max-w-md p-10 text-center")}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F8F9FA] dark:bg-neutral-800">
              <Link2 className={cn("h-5 w-5", T_MUTED)} />
            </div>
            <p className={cn("font-medium", T_PRIMARY)}>This report link is unavailable</p>
            <p className={cn("mt-1 text-sm", T_SECOND)}>
              The link may have expired or been revoked. Please request a new link
              from the campaign owner.
            </p>
          </div>
        ) : report ? (
          <>
            <CampaignReportBody report={report} isPublic />
            <p className={cn("mt-10 text-center text-xs", T_MUTED)}>
              Shared via InfluApp
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
