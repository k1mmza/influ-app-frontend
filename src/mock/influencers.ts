import { Influencer } from "@/lib/types";

export const influencers: Influencer[] = [
  {
    id: "inf-1",
    name: "Mia Lopez",
    platforms: ["TikTok", "Instagram"],
    followers: 120000,
    followersByPlatform: { TikTok: 78000, Instagram: 42000 },
    avgViewsByPlatform: { TikTok: 95000, Instagram: 142000 },
    engagementRate: 5.2,
    category: "Beauty",
    performanceScore: 88,
    ratePerPost: 600,
    stylePresent: ["Storytelling", "Short Story"]
  },
  {
    id: "inf-2",
    name: "Noah Reed",
    platforms: ["YouTube", "Instagram"],
    followers: 240000,
    followersByPlatform: { YouTube: 152000, Instagram: 88000 },
    avgViewsByPlatform: { YouTube: 165000, Instagram: 72000 },
    engagementRate: 4.6,
    category: "Fitness",
    performanceScore: 84,
    ratePerPost: 900,
    stylePresent: ["Experiment", "Tutorial"]
  },
  {
    id: "inf-3",
    name: "Lina Park",
    platforms: ["TikTok"],
    followers: 90000,
    followersByPlatform: { TikTok: 90000 },
    avgViewsByPlatform: { TikTok: 98000 },
    engagementRate: 6.1,
    category: "Fashion",
    performanceScore: 91,
    ratePerPost: 450,
    stylePresent: ["Storytelling", "Review"]
  },
  {
    id: "inf-4",
    name: "Aria Chen",
    platforms: ["Instagram", "YouTube"],
    followers: 310000,
    followersByPlatform: { Instagram: 198000, YouTube: 112000 },
    avgViewsByPlatform: { Instagram: 155000, YouTube: 98000 },
    engagementRate: 4.9,
    category: "Travel",
    performanceScore: 87,
    ratePerPost: 1100,
    stylePresent: ["Vlog", "Short Story"]
  },
  {
    id: "inf-5",
    name: "Ethan Brooks",
    platforms: ["TikTok", "YouTube"],
    followers: 670000,
    followersByPlatform: { TikTok: 402000, YouTube: 268000 },
    avgViewsByPlatform: { TikTok: 210000, YouTube: 195000 },
    engagementRate: 3.8,
    category: "Tech",
    performanceScore: 82,
    ratePerPost: 1500,
    stylePresent: ["Experiment", "Review"]
  },
  {
    id: "inf-6",
    name: "Nora Diaz",
    platforms: ["Instagram", "TikTok"],
    followers: 54000,
    followersByPlatform: { Instagram: 31000, TikTok: 23000 },
    avgViewsByPlatform: { Instagram: 62000, TikTok: 88000 },
    engagementRate: 7.2,
    category: "Food",
    performanceScore: 90,
    ratePerPost: 350,
    stylePresent: ["Tutorial", "Storytelling"]
  }
];
