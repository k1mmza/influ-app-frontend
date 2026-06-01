/**
 * Influencer discover list uses different ids than brand/agency `brandCampaigns`.
 * Map discover → canonical brand campaign id for shared detail + reviews.
 */
const INFLUENCER_DISCOVER_TO_BRAND: Record<string, string> = {
  "summer-skincare": "glow-summer-2026",
  "fit-snack": "fitbites-snack",
  "tech-drop": "neogear-private",
  "travel-light": "roamly-travel"
};

export function resolveBrandCampaignId(routeCampaignId: string): string {
  return INFLUENCER_DISCOVER_TO_BRAND[routeCampaignId] ?? routeCampaignId;
}
