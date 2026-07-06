"use client";

/**
 * Campaign Tracking Presentation Page (authenticated owner view).
 *
 * Premium, editorial "campaign report" a logged-in agency/brand presents to a
 * client. The report body itself lives in the shared <CampaignReportBody> (also
 * used by the public /tracking/public/[token] page); this page owns only the
 * owner-view chrome: data fetch, the report canvas, the back link, and the
 * "Share Report" modal that mints public links.
 *
 * DATA HONESTY (see the tracking data audit): growth % omitted everywhere;
 * "Approved" (reviewedAt) shown as a fallback when a true publish date isn't
 * captured; unsynced content shows "Not yet synced", never a fabricated 0.
 */

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { apiGetTrackingReport, type TrackingReport } from "@/lib/api";
import {
  CampaignReportBody,
  CARD,
  T_PRIMARY,
  T_SECOND,
  T_MUTED,
} from "@/components/tracking/report-view";
import { ShareReportModal } from "@/components/tracking/share-report-modal";
import { cn } from "@/lib/utils";

export default function CampaignReportPage() {
  const params = useParams<{ campaignId: string }>();
  const campaignId = params?.campaignId;
  const { role, token } = useUserStore();
  const isBrandSide = role === "brand" || role === "agency";

  const [report, setReport] = useState<TrackingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!token || !campaignId) return;
    setLoading(true);
    apiGetTrackingReport(token, campaignId)
      .then((r) => {
        setReport(r);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load report"))
      .finally(() => setLoading(false));
  }, [token, campaignId]);

  if (!token) {
    return (
      <div className={cn("mx-auto max-w-md py-24 text-center", T_SECOND)}>
        Please log in to view this report.
      </div>
    );
  }
  if (!isBrandSide) {
    return (
      <div className={cn("mx-auto max-w-md py-24 text-center", T_SECOND)}>
        This report is available to agencies and brands.
      </div>
    );
  }

  return (
    // Full-bleed neutral canvas — overrides the shell's per-route tint so the
    // report reads as a clean white document per the presentation spec.
    <div className="report-canvas -mx-4 -mt-4 -mb-6 min-h-screen bg-[#F8F9FA] px-4 py-8 dark:bg-neutral-950 lg:-mx-6 lg:-mt-5 lg:px-10 lg:py-10">
      {/* Print rules: hide app chrome + non-print actions, flatten background. */}
      <style>{`
        @media print {
          aside { display: none !important; }
          .no-print { display: none !important; }
          body, main { background: #fff !important; }
          .report-canvas { margin: 0 !important; padding: 0 !important; background: #fff !important; }
        }
      `}</style>

      <div className="mx-auto max-w-5xl">
        <Link
          href="/tracking"
          className={cn(
            "no-print mb-6 inline-flex cursor-pointer items-center gap-1.5 text-sm hover:underline",
            T_SECOND
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tracking
        </Link>

        {loading ? (
          <div className={cn("flex items-center justify-center gap-2 py-24", T_MUTED)}>
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading report…
          </div>
        ) : error ? (
          <div className={cn(CARD, "p-10 text-center")}>
            <p className={cn("font-medium", T_PRIMARY)}>Unable to load this report</p>
            <p className={cn("mt-1 text-sm", T_SECOND)}>{error}</p>
          </div>
        ) : report ? (
          <CampaignReportBody report={report} onShare={() => setShareOpen(true)} />
        ) : null}
      </div>

      {shareOpen && campaignId ? (
        <ShareReportModal
          token={token}
          campaignId={campaignId}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
    </div>
  );
}
