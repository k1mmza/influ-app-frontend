export type Role = "agency" | "brand" | "influencer";

export interface AudienceInsightData {
  malePct: number | null;
  femalePct: number | null;
  ageDistribution: Record<string, number> | null;
}

export interface TopCountry {
  country: string;
  viewPct: number;
}

export interface Influencer {
  id: string;
  handle?: string | null;
  name: string;
  gender?: "male" | "female" | "other" | null;
  /** Platforms sorted YouTube → TikTok → Instagram → others */
  platforms: string[];
  followers: number;
  followersByPlatform: Record<string, number>;
  avgViewsByPlatform: Record<string, number>;
  engagementByPlatform: Record<string, number>;
  handleByPlatform: Record<string, string>;
  /** Per-platform public profile URLs — used as contact points on the profile. */
  profileUrlByPlatform?: Record<string, string | null>;
  avatarByPlatform: Record<string, string | null>;
  syncedAtByPlatform: Record<string, string | null>;
  spotlightByPlatform: Record<string, { id: string; title: string; thumbnail: string } | null>;
  /** Per-platform YouTube Analytics fields */
  watchTimeMinsByPlatform?: Record<string, number | null>;
  avgViewDurationByPlatform?: Record<string, number | null>;
  avgViewPctByPlatform?: Record<string, number | null>;
  subscribersGainedByPlatform?: Record<string, number | null>;
  topCountriesByPlatform?: Record<string, TopCountry[] | null>;
  audienceInsightsByPlatform?: Record<string, AudienceInsightData | null>;
  engagementRate: number;
  category: string;
  performanceScore: number;
  ratePerPost: number;
  stylePresent: string[];
  avatarUrl?: string | null;
  spotlightVideo?: { id: string; title: string; thumbnail: string } | null;
  syncStatus?: string;
  lastDataPulledAt?: string | null;
  rateCardFileUrl?: string | null;
}

export interface Campaign {
  id: string;
  title: string;
  objective: string;
  budget: number;
  status: "draft" | "active" | "completed";
  roleOwner: "agency" | "brand";
  applicants: number;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  sentAt: string;
}
