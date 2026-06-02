import { Influencer } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function apiGetInfluencers(filters: any = {}) {
  const cleanFilters: any = {};
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null) {
      cleanFilters[key] = filters[key];
    }
  });

  const query = new URLSearchParams(cleanFilters).toString();
  const res = await fetch(`${API_URL}/influencers?${query}`, {
    method: "GET",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch influencers");
  }
  return res.json();
}
