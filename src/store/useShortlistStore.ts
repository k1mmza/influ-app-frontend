"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Influencer } from "@/lib/types";
import { apiGetShortlist, apiAddToShortlist, apiRemoveFromShortlist } from "@/lib/api";
import { useUserStore } from "./useUserStore";

interface ShortlistState {
  ids: string[];
  influencers: Influencer[];
  error: string | null;
  toggle: (id: string, influencer?: Influencer) => Promise<void>;
  has: (id: string) => boolean;
  clear: () => void;
  clearError: () => void;
  syncFromServer: (token: string) => Promise<void>;
}

export const useShortlistStore = create<ShortlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      influencers: [],
      error: null,

      has: (id) => get().ids.includes(id),

      clear: () => set({ ids: [], influencers: [], error: null }),

      clearError: () => set({ error: null }),

      syncFromServer: async (token: string) => {
        try {
          const data: Influencer[] = await apiGetShortlist(token);
          set({ ids: data.map((i) => i.id), influencers: data, error: null });
        } catch {
          // Non-fatal — local cache stays as fallback until next successful sync
        }
      },

      toggle: async (id: string, influencer?: Influencer) => {
        const { ids, influencers } = get();
        const isSaved = ids.includes(id);

        // Optimistic update
        if (isSaved) {
          set({ ids: ids.filter((i) => i !== id), influencers: influencers.filter((i) => i.id !== id), error: null });
        } else {
          set({
            ids: [...ids, id],
            influencers: influencer ? [...influencers, influencer] : influencers,
            error: null,
          });
        }

        const token = useUserStore.getState().token;
        if (!token) return;

        try {
          if (isSaved) {
            await apiRemoveFromShortlist(token, id);
          } else {
            await apiAddToShortlist(token, id);
          }
        } catch {
          // Rollback on API failure
          const { ids: currentIds, influencers: currentInfluencers } = get();
          if (isSaved) {
            set({
              ids: currentIds.includes(id) ? currentIds : [...currentIds, id],
              influencers: currentInfluencers.some((i) => i.id === id)
                ? currentInfluencers
                : influencer ? [...currentInfluencers, influencer] : currentInfluencers,
              error: 'Failed to remove from shortlist',
            });
          } else {
            set({
              ids: currentIds.filter((i) => i !== id),
              influencers: currentInfluencers.filter((i) => i.id !== id),
              error: 'Failed to add to shortlist',
            });
          }
        }
      },
    }),
    {
      name: "influapp-shortlist",
      // Only persist ids and influencers — error is transient UI state
      // and must not resurface on the next page load or device.
      partialize: (state) => ({ ids: state.ids, influencers: state.influencers }),
    },
  ),
);
