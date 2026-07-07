"use client";

/**
 * Public, account-less "Share Campaign" page.
 *
 * What a visitor sees when they open a shared campaign link (no login). It fetches
 * the presentation-safe public DTO by share token and renders a safe subset of the
 * campaign brief — never budget, payment, applicant, or internal data.
 *
 * The app-shell renders this route bare (no sidebar/nav) since the visitor has no
 * account. A 404 (unknown / revoked / expired token) shows a friendly "link
 * unavailable" state rather than leaking whether the campaign exists.
 */

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Link2 } from "lucide-react";
import { apiGetPublicCampaign, fileUrl, type PublicCampaign } from "@/lib/api";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
      {children}
    </div>
  );
}

export default function PublicCampaignPage() {
  const params = useParams<{ token: string }>();
  const shareToken = params?.token;

  const [campaign, setCampaign] = useState<PublicCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareToken) return;
    setLoading(true);
    apiGetPublicCampaign(shareToken)
      .then((c) => {
        setCampaign(c);
        setError(null);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "This campaign link is no longer available")
      )
      .finally(() => setLoading(false));
  }, [shareToken]);

  const dates = campaign
    ? [
        ["Started", formatDate(campaign.startedAt)],
        ["Apply by", formatDate(campaign.applyDeadline)],
        ["Content due", formatDate(campaign.submissionDate)],
        ["Review", formatDate(campaign.reviewDate)],
      ].filter(([, v]) => v)
    : [];

  return (
    <div className="min-h-screen bg-[#F8F9FA] px-4 py-8 dark:bg-neutral-950 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-3xl">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-neutral-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading campaign…
          </div>
        ) : error ? (
          <div className="mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white p-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F8F9FA] dark:bg-neutral-800">
              <Link2 className="h-5 w-5 text-neutral-400" />
            </div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              This campaign link is unavailable
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              The link may have expired or been revoked. Please request a new link
              from the campaign owner.
            </p>
          </div>
        ) : campaign ? (
          <div className="space-y-5">
            {/* Header */}
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              {campaign.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fileUrl(campaign.coverImageUrl) ?? ""}
                  alt=""
                  className="h-40 w-full object-cover"
                />
              ) : null}
              <div className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-100 text-sm font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  {campaign.brandLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fileUrl(campaign.brandLogoUrl) ?? ""} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(campaign.brandName)
                  )}
                </div>
                <div className="min-w-0">
                  {campaign.brandName ? (
                    <p className="text-xs font-medium text-neutral-500">{campaign.brandName}</p>
                  ) : null}
                  <h1 className="truncate text-xl font-bold text-neutral-900 dark:text-neutral-100">
                    {campaign.name}
                  </h1>
                  <span className="mt-1 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium capitalize text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    {campaign.status.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>

            {dates.length ? (
              <div className="flex flex-wrap gap-2">
                {dates.map(([label, value]) => (
                  <span
                    key={label as string}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                  >
                    <span className="font-medium">{label}:</span> {value}
                  </span>
                ))}
              </div>
            ) : null}

            {campaign.objective ? (
              <Section title="Objective">
                <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                  {campaign.objective}
                </p>
              </Section>
            ) : null}

            {campaign.keyMessage ? (
              <Section title="Key message">
                <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                  {campaign.keyMessage}
                </p>
              </Section>
            ) : null}

            {campaign.deliverables ? (
              <Section title="Deliverables">
                <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                  {campaign.deliverables}
                </p>
              </Section>
            ) : null}

            {campaign.doAndDont ? (
              <Section title="Do's &amp; Don'ts">
                <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                  {campaign.doAndDont}
                </p>
              </Section>
            ) : null}

            {campaign.requirements.length ? (
              <Section title="Creator requirements">
                <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                  {campaign.requirements.map((r, i) => (
                    <li key={i} className="flex flex-wrap gap-x-4 gap-y-1">
                      {r.minFollowers ? <span>Min followers: {r.minFollowers.toLocaleString()}</span> : null}
                      {r.minEngagementRate ? <span>Min ER: {r.minEngagementRate}%</span> : null}
                      {r.minAvgViews ? <span>Min avg views: {r.minAvgViews.toLocaleString()}</span> : null}
                      {r.platforms?.length ? <span>Platforms: {r.platforms.join(", ")}</span> : null}
                      {r.categories?.length ? <span>Categories: {r.categories.join(", ")}</span> : null}
                      {r.locations?.length ? <span>Locations: {r.locations.join(", ")}</span> : null}
                      {r.followerTier ? <span>Tier: {r.followerTier}</span> : null}
                      {r.contentType ? <span>Content: {r.contentType}</span> : null}
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            <p className="mt-6 text-center text-xs text-neutral-400">Shared via InfluApp</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
