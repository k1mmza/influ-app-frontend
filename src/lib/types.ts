export type Role = "agency" | "brand" | "influencer";

export interface Influencer {
  id: string;
  handle?: string | null;
  name: string;
  platforms: string[];
  /** Total reach; should align with sum of followersByPlatform when both are set. */
  followers: number;
  /** Follower count per platform; largest entry is the creator's primary audience platform. */
  followersByPlatform: Record<string, number>;
  /** Avg views per post/reel/video by platform; used to pick the top “views” platform for showcases. */
  avgViewsByPlatform: Record<string, number>;
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
