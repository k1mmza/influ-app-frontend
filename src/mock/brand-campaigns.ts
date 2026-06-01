export type BrandCampaignListItem = {
  id: string;
  name: string;
  visibility: "public" | "private";
  status: "active" | "pending" | "completed";
  budget: number;
  spent: number;
  deadline: string;
  influencersJoined: number;
  platform: "TikTok" | "Instagram" | "YouTube";
  objective: "Awareness" | "Engagement" | "Conversion";
};

export const brandCampaigns: BrandCampaignListItem[] = [
  {
    id: "glow-summer-2026",
    name: "Summer Skincare Launch",
    visibility: "public",
    status: "active",
    budget: 240000,
    spent: 98000,
    deadline: "2026-05-30",
    influencersJoined: 5,
    platform: "TikTok",
    objective: "Awareness"
  },
  {
    id: "fitbites-snack",
    name: "Healthy Snack Challenge",
    visibility: "public",
    status: "active",
    budget: 180000,
    spent: 72000,
    deadline: "2026-06-10",
    influencersJoined: 4,
    platform: "Instagram",
    objective: "Engagement"
  },
  {
    id: "neogear-private",
    name: "Creator Tech Unbox (Invite-only)",
    visibility: "private",
    status: "pending",
    budget: 320000,
    spent: 0,
    deadline: "2026-06-20",
    influencersJoined: 0,
    platform: "YouTube",
    objective: "Conversion"
  },
  {
    id: "roamly-travel",
    name: "Travel Light Essentials",
    visibility: "private",
    status: "completed",
    budget: 150000,
    spent: 148000,
    deadline: "2026-04-15",
    influencersJoined: 3,
    platform: "TikTok",
    objective: "Awareness"
  }
];

export type TrackingInfluencerRow = {
  id: string;
  influencerName: string;
  contentLabel: string;
  contentType: "video" | "image" | "post";
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  growthRate: number;
};

export const trackingByCampaign: Record<string, TrackingInfluencerRow[]> = {
  "glow-summer-2026": [
    {
      id: "r1",
      influencerName: "Maya Lee",
      contentLabel: "TikTok — Morning routine",
      contentType: "video",
      views: 182000,
      likes: 12400,
      comments: 640,
      shares: 312,
      engagementRate: 5.2,
      growthRate: 8.1
    },
    {
      id: "r2",
      influencerName: "Nina V.",
      contentLabel: "IG Reel — Before/after",
      contentType: "video",
      views: 96000,
      likes: 5100,
      comments: 220,
      shares: 140,
      engagementRate: 4.1,
      growthRate: 3.4
    }
  ],
  "fitbites-snack": [
    {
      id: "r3",
      influencerName: "Pat K.",
      contentLabel: "IG Carousel — Product shots",
      contentType: "image",
      views: 72000,
      likes: 4800,
      comments: 180,
      shares: 95,
      engagementRate: 4.5,
      growthRate: 5.0
    }
  ]
};
