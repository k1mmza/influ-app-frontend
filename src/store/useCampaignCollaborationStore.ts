"use client";

import type { Role } from "@/lib/types";
import { buildCampaignParticipantKeys, participantKey } from "@/lib/campaign-participants";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CampaignCollaboration = {
  campaignId: string;
  campaignName: string;
  participantKeys: string[];
  completedAt: string;
};

interface CampaignCollaborationState {
  collaborations: CampaignCollaboration[];
  /** Record a finished campaign so cross-role reviews are allowed (same campaign name / cohort). */
  recordCampaignFinished: (input: { campaignId: string; campaignName: string; currentRole: Role; currentDisplayName: string }) => void;
  /** True if both parties appear on the same finished campaign (by name). */
  canReviewEachOther: (campaignName: string, reviewerKey: string, revieweeKey: string) => boolean;
  getParticipantKeysForCampaign: (campaignId: string) => string[] | null;
}

const seedCollaborations: CampaignCollaboration[] = [
  {
    campaignId: "roamly-travel",
    campaignName: "Travel Light Essentials",
    participantKeys: [
      participantKey("brand", "David Kim"),
      participantKey("agency", "Sarah Chen"),
      participantKey("influencer", "Lina Park")
    ],
    completedAt: "2026-04-15T12:00:00.000Z"
  }
];

export const useCampaignCollaborationStore = create<CampaignCollaborationState>()(
  persist(
    (set, get) => ({
      collaborations: seedCollaborations,
      recordCampaignFinished: ({ campaignId, campaignName, currentRole, currentDisplayName }) => {
        const participantKeys = buildCampaignParticipantKeys(currentRole, currentDisplayName);
        set((state) => {
          if (state.collaborations.some((c) => c.campaignId === campaignId)) {
            return state;
          }
          return {
            collaborations: [
              ...state.collaborations,
              {
                campaignId,
                campaignName,
                participantKeys,
                completedAt: new Date().toISOString()
              }
            ]
          };
        });
      },
      canReviewEachOther: (campaignName, reviewerKey, revieweeKey) => {
        return get().collaborations.some(
          (c) =>
            c.campaignName === campaignName &&
            c.participantKeys.includes(reviewerKey) &&
            c.participantKeys.includes(revieweeKey)
        );
      },
      getParticipantKeysForCampaign: (campaignId) => {
        const row = get().collaborations.find((c) => c.campaignId === campaignId);
        return row ? row.participantKeys : null;
      }
    }),
    { name: "inflique-campaign-collaborations" }
  )
);
