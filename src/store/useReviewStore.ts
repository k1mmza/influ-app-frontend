"use client";

import type { Role } from "@/lib/types";
import { parseParticipantKey, participantKey } from "@/lib/campaign-participants";
import { useCampaignCollaborationStore } from "@/store/useCampaignCollaborationStore";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PartnerReview = {
  id: string;
  campaignName: string;
  fromRole: Role;
  fromName: string;
  toRole: Role;
  toName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

interface ReviewState {
  reviews: PartnerReview[];
  submitReview: (input: {
    campaignName: string;
    fromRole: Role;
    fromName: string;
    toRole: Role;
    toName: string;
    rating: number;
    comment: string;
  }) => { ok: true } | { ok: false; reason: string };
  getAverageRatingReceived: (role: Role, displayName: string) => number | null;
  getReviewsWrittenBy: (role: Role, displayName: string) => PartnerReview[];
  getReviewsReceivedBy: (role: Role, displayName: string) => PartnerReview[];
  hasReviewForPair: (campaignName: string, fromKey: string, toKey: string) => boolean;
}

function sameRecipient(r: PartnerReview, role: Role, displayName: string) {
  return r.toRole === role && r.toName.trim() === displayName.trim();
}

function sameAuthor(r: PartnerReview, role: Role, displayName: string) {
  return r.fromRole === role && r.fromName.trim() === displayName.trim();
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      reviews: [],
      hasReviewForPair: (campaignName, fromKey, toKey) => {
        return get().reviews.some((r) => {
          if (r.campaignName !== campaignName) return false;
          const from = parseParticipantKey(fromKey);
          const to = parseParticipantKey(toKey);
          if (!from || !to) return false;
          return sameAuthor(r, from.role, from.name) && sameRecipient(r, to.role, to.name);
        });
      },
      submitReview: ({ campaignName, fromRole, fromName, toRole, toName, rating, comment }) => {
        const trimmedFrom = fromName.trim();
        const trimmedTo = toName.trim();
        if (!trimmedFrom || !trimmedTo) {
          return { ok: false, reason: "Missing name." };
        }
        if (rating < 1 || rating > 5 || !Number.isFinite(rating)) {
          return { ok: false, reason: "Rating must be between 1 and 5." };
        }
        const fromK = participantKey(fromRole, trimmedFrom);
        const toK = participantKey(toRole, trimmedTo);
        const { canReviewEachOther } = useCampaignCollaborationStore.getState();
        if (!canReviewEachOther(campaignName, fromK, toK)) {
          return { ok: false, reason: "You can only review partners on a campaign you finished together." };
        }
        if (fromK === toK) {
          return { ok: false, reason: "You cannot review yourself." };
        }
        if (get().reviews.some((r) => r.campaignName === campaignName && sameAuthor(r, fromRole, trimmedFrom) && sameRecipient(r, toRole, trimmedTo))) {
          return { ok: false, reason: "You already left a review for this person on this campaign." };
        }
        const row: PartnerReview = {
          id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          campaignName,
          fromRole,
          fromName: trimmedFrom,
          toRole,
          toName: trimmedTo,
          rating: Math.round(rating),
          comment: comment.trim(),
          createdAt: new Date().toISOString()
        };
        set((s) => ({ reviews: [...s.reviews, row] }));
        return { ok: true };
      },
      getAverageRatingReceived: (role, displayName) => {
        const list = get().reviews.filter((r) => sameRecipient(r, role, displayName));
        if (list.length === 0) return null;
        return Math.round((list.reduce((a, r) => a + r.rating, 0) / list.length) * 10) / 10;
      },
      getReviewsWrittenBy: (role, displayName) =>
        get()
          .reviews.filter((r) => sameAuthor(r, role, displayName))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      getReviewsReceivedBy: (role, displayName) =>
        get()
          .reviews.filter((r) => sameRecipient(r, role, displayName))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }),
    { name: "influapp-partner-reviews" }
  )
);
