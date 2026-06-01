"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MediaKitSocialAccount = {
  platform: string;
  username: string;
  followers: number;
  avgViews: number;
  engagementRate: number;
};

export type MediaKitState = {
  displayName: string;
  handle: string;
  bio: string;
  location: string;
  email: string;
  profileCompleteness: number;
  totalFollowers: number;
  averageViews: number;
  engagementRate: number;
  growthRate: number;
  categories: string[];
  socialAccounts: MediaKitSocialAccount[];
  audience: {
    gender: string;
    age: string;
    topCountries: string[];
    topCities: string[];
  };
  pricing: { post: number; video: number; bundle: number };
  services: string[];
  portfolio: string[];
  pastCollaborations: string[];
  availability: string;
  notificationSettings: { messageAlerts: boolean; campaignAlerts: boolean };
  privacy: string;
  /** Set when user uploads a PDF; JSON export can note an attachment. */
  uploadedPdfFileName: string | null;
};

const defaultMediaKit = (): MediaKitState => ({
  displayName: "Lina Park",
  handle: "@linapark.creates",
  bio: "Beauty + lifestyle creator. I make story-driven product content with strong save/share performance.",
  location: "Bangkok, Thailand",
  email: "lina@influapp.mock",
  profileCompleteness: 86,
  totalFollowers: 242000,
  averageViews: 83000,
  engagementRate: 5.4,
  growthRate: 7.2,
  categories: ["Beauty", "Lifestyle", "Travel"],
  socialAccounts: [
    { platform: "TikTok", username: "@linapark.creates", followers: 145000, avgViews: 68000, engagementRate: 5.8 },
    { platform: "Instagram", username: "@linapark.creates", followers: 76000, avgViews: 22000, engagementRate: 4.9 },
    { platform: "YouTube", username: "Lina Park", followers: 21000, avgViews: 12000, engagementRate: 3.9 }
  ],
  audience: {
    gender: "Female 72% / Male 26% / Other 2%",
    age: "18-24 (38%), 25-34 (41%), 35-44 (15%), 45+ (6%)",
    topCountries: ["Thailand 64%", "Malaysia 14%", "Singapore 9%"],
    topCities: ["Bangkok", "Chiang Mai", "Kuala Lumpur"]
  },
  pricing: { post: 4500, video: 7800, bundle: 12000 },
  services: ["UGC Content", "Product Review", "Affiliate", "Brand Ambassador"],
  portfolio: [
    "Summer Skincare Launch - TikTok x IG Stories",
    "Travel Essentials Reels Series",
    "Daily Routine Product Integration"
  ],
  pastCollaborations: ["GlowLab — product seeding", "Nova Retail — seasonal launch", "Peak Media — UGC sprint"],
  availability: "Available",
  notificationSettings: { messageAlerts: true, campaignAlerts: true },
  privacy: "Public",
  uploadedPdfFileName: null
});

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseMediaKitJson(raw: unknown): Partial<MediaKitState> | null {
  if (!isRecord(raw)) return null;
  const out: Partial<MediaKitState> = {};
  if (typeof raw.displayName === "string") out.displayName = raw.displayName;
  if (typeof raw.handle === "string") out.handle = raw.handle;
  if (typeof raw.bio === "string") out.bio = raw.bio;
  if (typeof raw.location === "string") out.location = raw.location;
  if (typeof raw.email === "string") out.email = raw.email;
  if (typeof raw.profileCompleteness === "number") out.profileCompleteness = raw.profileCompleteness;
  if (typeof raw.totalFollowers === "number") out.totalFollowers = raw.totalFollowers;
  if (typeof raw.averageViews === "number") out.averageViews = raw.averageViews;
  if (typeof raw.engagementRate === "number") out.engagementRate = raw.engagementRate;
  if (typeof raw.growthRate === "number") out.growthRate = raw.growthRate;
  if (Array.isArray(raw.categories) && raw.categories.every((c) => typeof c === "string")) out.categories = raw.categories;
  if (Array.isArray(raw.services) && raw.services.every((c) => typeof c === "string")) out.services = raw.services;
  if (Array.isArray(raw.portfolio) && raw.portfolio.every((c) => typeof c === "string")) out.portfolio = raw.portfolio;
  if (
    Array.isArray(raw.pastCollaborations) &&
    raw.pastCollaborations.every((c) => typeof c === "string")
  ) {
    out.pastCollaborations = raw.pastCollaborations;
  }
  if (typeof raw.availability === "string") out.availability = raw.availability;
  if (typeof raw.privacy === "string") out.privacy = raw.privacy;
  if (isRecord(raw.pricing)) {
    const p = raw.pricing;
    const post = typeof p.post === "number" ? p.post : undefined;
    const video = typeof p.video === "number" ? p.video : undefined;
    const bundle = typeof p.bundle === "number" ? p.bundle : undefined;
    if (post != null && video != null && bundle != null) out.pricing = { post, video, bundle };
  }
  if (isRecord(raw.audience)) {
    const a = raw.audience;
    const gender = typeof a.gender === "string" ? a.gender : undefined;
    const age = typeof a.age === "string" ? a.age : undefined;
    const topCountries = Array.isArray(a.topCountries) && a.topCountries.every((c) => typeof c === "string") ? a.topCountries : undefined;
    const topCities = Array.isArray(a.topCities) && a.topCities.every((c) => typeof c === "string") ? a.topCities : undefined;
    if (gender && age && topCountries && topCities) {
      out.audience = { gender, age, topCountries, topCities };
    }
  }
  if (Array.isArray(raw.socialAccounts)) {
    const accs: MediaKitSocialAccount[] = [];
    for (const row of raw.socialAccounts) {
      if (!isRecord(row)) continue;
      const platform = typeof row.platform === "string" ? row.platform : "";
      const username = typeof row.username === "string" ? row.username : "";
      const followers = typeof row.followers === "number" ? row.followers : 0;
      const avgViews = typeof row.avgViews === "number" ? row.avgViews : 0;
      const engagementRate = typeof row.engagementRate === "number" ? row.engagementRate : 0;
      if (platform) accs.push({ platform, username, followers, avgViews, engagementRate });
    }
    if (accs.length) out.socialAccounts = accs;
  }
  if (isRecord(raw.notificationSettings)) {
    const n = raw.notificationSettings;
    const messageAlerts = typeof n.messageAlerts === "boolean" ? n.messageAlerts : undefined;
    const campaignAlerts = typeof n.campaignAlerts === "boolean" ? n.campaignAlerts : undefined;
    if (messageAlerts != null && campaignAlerts != null) {
      out.notificationSettings = { messageAlerts, campaignAlerts };
    }
  }
  if (typeof raw.uploadedPdfFileName === "string" || raw.uploadedPdfFileName === null) {
    out.uploadedPdfFileName = raw.uploadedPdfFileName as string | null;
  }
  return Object.keys(out).length ? out : null;
}

interface MediaKitStore extends MediaKitState {
  setKit: (partial: Partial<MediaKitState>) => void;
  setSocialRow: (index: number, partial: Partial<MediaKitSocialAccount>) => void;
  setUploadedPdfFileName: (name: string | null) => void;
  applyImport: (partial: Partial<MediaKitState>) => void;
  resetToDemo: () => void;
}

export const useMediaKitStore = create<MediaKitStore>()(
  persist(
    (set, get) => ({
      ...defaultMediaKit(),
      setKit: (partial) => set(partial),
      setSocialRow: (index, partial) => {
        const accounts = [...get().socialAccounts];
        if (!accounts[index]) return;
        accounts[index] = { ...accounts[index], ...partial };
        set({ socialAccounts: accounts });
      },
      setUploadedPdfFileName: (uploadedPdfFileName) => set({ uploadedPdfFileName }),
      applyImport: (partial) => set((state) => ({ ...state, ...partial })),
      resetToDemo: () => set(defaultMediaKit())
    }),
    {
      name: "influapp-media-kit",
      partialize: (s) => ({
        displayName: s.displayName,
        handle: s.handle,
        bio: s.bio,
        location: s.location,
        email: s.email,
        profileCompleteness: s.profileCompleteness,
        totalFollowers: s.totalFollowers,
        averageViews: s.averageViews,
        engagementRate: s.engagementRate,
        growthRate: s.growthRate,
        categories: s.categories,
        socialAccounts: s.socialAccounts,
        audience: s.audience,
        pricing: s.pricing,
        services: s.services,
        portfolio: s.portfolio,
        pastCollaborations: s.pastCollaborations,
        availability: s.availability,
        notificationSettings: s.notificationSettings,
        privacy: s.privacy,
        uploadedPdfFileName: s.uploadedPdfFileName
      })
    }
  )
);

export function parseMediaKitImportFile(text: string): Partial<MediaKitState> | null {
  try {
    const data = JSON.parse(text) as unknown;
    if (isRecord(data) && data.mediaKit != null) {
      return parseMediaKitJson(data.mediaKit);
    }
    return parseMediaKitJson(data);
  } catch {
    return null;
  }
}

export function buildMediaKitExportPayload(kit: MediaKitState) {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    mediaKit: {
      displayName: kit.displayName,
      handle: kit.handle,
      bio: kit.bio,
      location: kit.location,
      email: kit.email,
      profileCompleteness: kit.profileCompleteness,
      totalFollowers: kit.totalFollowers,
      averageViews: kit.averageViews,
      engagementRate: kit.engagementRate,
      growthRate: kit.growthRate,
      categories: kit.categories,
      socialAccounts: kit.socialAccounts,
      audience: kit.audience,
      pricing: kit.pricing,
      services: kit.services,
      portfolio: kit.portfolio,
      pastCollaborations: kit.pastCollaborations,
      availability: kit.availability,
      notificationSettings: kit.notificationSettings,
      privacy: kit.privacy,
      uploadedPdfFileName: kit.uploadedPdfFileName
    }
  };
}
