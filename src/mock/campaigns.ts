import { Campaign } from "@/lib/types";

export const seedCampaigns: Campaign[] = [
  {
    id: "camp-1",
    title: "Spring Glow Launch",
    objective: "Drive awareness for new skincare collection",
    budget: 5000,
    status: "active",
    roleOwner: "brand",
    applicants: 18
  },
  {
    id: "camp-2",
    title: "30-Day Fitness Challenge",
    objective: "Increase signups for app trial",
    budget: 7500,
    status: "draft",
    roleOwner: "agency",
    applicants: 9
  }
];
