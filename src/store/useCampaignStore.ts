"use client";

import { Campaign } from "@/lib/types";
import { seedCampaigns } from "@/mock/campaigns";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CampaignState {
  campaigns: Campaign[];
  addCampaign: (campaign: Campaign) => void;
}

export const useCampaignStore = create<CampaignState>()(
  persist(
    (set) => ({
      campaigns: seedCampaigns,
      addCampaign: (campaign) =>
        set((state) => ({ campaigns: [campaign, ...state.campaigns] }))
    }),
    { name: "influapp-campaigns" }
  )
);
