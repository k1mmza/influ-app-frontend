"use client";

import { Influencer } from "@/lib/types";
import { influencers } from "@/mock/influencers";
import { create } from "zustand";

interface DiscoverState {
  influencers: Influencer[];
  category: string;
  minFollowers: number;
  setCategory: (category: string) => void;
  setMinFollowers: (count: number) => void;
}

export const useInfluencerStore = create<DiscoverState>((set) => ({
  influencers,
  category: "All",
  minFollowers: 0,
  setCategory: (category) => set({ category }),
  setMinFollowers: (count) => set({ minFollowers: count })
}));
