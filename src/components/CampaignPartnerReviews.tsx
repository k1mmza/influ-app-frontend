"use client";

import { useMemo, useState } from "react";
import type { Role } from "@/lib/types";
import { parseParticipantKey, participantKey } from "@/lib/campaign-participants";
import { useCampaignCollaborationStore } from "@/store/useCampaignCollaborationStore";
import { useReviewStore } from "@/store/useReviewStore";

type Props = {
  campaignId: string;
  campaignName: string;
  currentRole: Role;
  currentDisplayName: string;
};

export function CampaignPartnerReviews({ campaignId, campaignName, currentRole, currentDisplayName }: Props) {
  const getParticipantKeysForCampaign = useCampaignCollaborationStore((s) => s.getParticipantKeysForCampaign);
  const submitReview = useReviewStore((s) => s.submitReview);
  const hasReviewForPair = useReviewStore((s) => s.hasReviewForPair);
  const reviews = useReviewStore((s) => s.reviews);

  const selfKey = participantKey(currentRole, currentDisplayName);
  const keys = getParticipantKeysForCampaign(campaignId);

  const partners = useMemo(() => {
    if (!keys?.length) return [];
    return keys
      .filter((k) => k !== selfKey)
      .map((k) => parseParticipantKey(k))
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [keys, selfKey]);

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  if (!keys || keys.length === 0) {
    return (
      <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-900">Partner reviews</h2>
        <p className="mt-2 text-sm text-amber-800">
          Mark this campaign as finished to unlock ratings for brand, agency, and influencer partners who ran this campaign
          together.
        </p>
      </article>
    );
  }

  if (!keys.includes(selfKey)) {
    return (
      <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Partner reviews</h2>
        <p className="mt-2 text-sm text-slate-600">
          Your account name does not match this campaign&apos;s participant list. Use the same display name as when you
          completed the campaign (demo: Brand <strong>David Kim</strong>, Agency <strong>Sarah Chen</strong>, Influencer{" "}
          <strong>Lina Park</strong>).
        </p>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-primary/20 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Rate your campaign partners</h2>
      <p className="mt-1 text-sm text-slate-600">
        After a finished campaign, leave a star rating and short note for each partner. Reviews show on their profile.
      </p>

      {message ? (
        <p className={`mt-3 text-sm font-medium ${message.type === "ok" ? "text-emerald-700" : "text-rose-700"}`}>
          {message.text}
        </p>
      ) : null}

      <ul className="mt-4 space-y-6">
        {partners.map((p) => {
          const pk = participantKey(p.role, p.name);
          const done = hasReviewForPair(campaignName, selfKey, pk);
          const existing = reviews.find(
            (r) =>
              r.campaignName === campaignName &&
              r.fromRole === currentRole &&
              r.fromName === currentDisplayName.trim() &&
              r.toRole === p.role &&
              r.toName === p.name
          );
          return (
            <li key={pk} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">
                  {p.name}{" "}
                  <span className="text-xs font-normal text-slate-500">({p.role})</span>
                </p>
                {done && existing ? (
                  <span className="text-sm text-emerald-700">
                    You rated {existing.rating}/5 — thank you.
                  </span>
                ) : null}
              </div>

              {done && existing ? (
                <p className="mt-2 text-sm text-slate-600">&ldquo;{existing.comment || "No comment."}&rdquo;</p>
              ) : (
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="mb-1 text-xs font-medium text-slate-600">Rating</p>
                    <div className="flex flex-wrap gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRatings((prev) => ({ ...prev, [pk]: n }))}
                          className={`h-9 w-9 rounded-lg text-sm font-semibold transition ${
                            (ratings[pk] ?? 0) >= n ? "bg-rose-500 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200"
                          }`}
                          aria-label={`${n} stars`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="block text-sm">
                    <span className="text-slate-600">Comment</span>
                    <textarea
                      value={comments[pk] ?? ""}
                      onChange={(e) => setComments((prev) => ({ ...prev, [pk]: e.target.value }))}
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="What went well or what to improve?"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const rating = ratings[pk] ?? 0;
                      const result = submitReview({
                        campaignName,
                        fromRole: currentRole,
                        fromName: currentDisplayName,
                        toRole: p.role,
                        toName: p.name,
                        rating,
                        comment: comments[pk] ?? ""
                      });
                      if (result.ok) {
                        setMessage({ type: "ok", text: "Review saved." });
                      } else {
                        setMessage({ type: "err", text: result.reason });
                      }
                    }}
                    className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90"
                  >
                    Submit review
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </article>
  );
}
