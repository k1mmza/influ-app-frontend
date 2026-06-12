import { Role } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function apiRegister(name: string, email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Registration failed");
  }
  return res.json();
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Login failed");
  }
  return res.json();
}

export async function apiSelectRole(token: string, role: Role) {
  const res = await fetch(`${API_URL}/auth/select-role`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ role: role.toUpperCase() }), // Backend Prisma might expect UPPERCASE like AGENCY, BRAND, INFLUENCER depending on UserRole schema
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Role selection failed");
  }
  return res.json();
}

export async function apiGetDashboard(token: string) {
  const res = await fetch(`${API_URL}/dashboard`, {
    method: "GET",
    headers: { 
      "Authorization": `Bearer ${token}`
    },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch dashboard data");
  }
  return res.json();
}

export async function apiGetConversations(token: string) {
  const res = await fetch(`${API_URL}/conversations`, {
    method: "GET",
    headers: { 
      "Authorization": `Bearer ${token}`
    },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch conversations");
  }
  return res.json();
}

export async function apiGetMessages(token: string, conversationId: string) {
  const res = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
    method: "GET",
    headers: { 
      "Authorization": `Bearer ${token}`
    },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch messages");
  }
  return res.json();
}

export async function apiGetProfile(token: string) {
  const res = await fetch(`${API_URL}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch profile");
  }
  return res.json();
}

export async function apiLookupInfluencerByUrl(
  platform: string,
  handle: string,
): Promise<{ found: boolean; source?: "db" | "api"; loading?: boolean; influencer?: any }> {
  const params = new URLSearchParams({ platform, handle });
  const res = await fetch(`${API_URL}/influencers/lookup?${params}`);
  if (!res.ok) throw new Error("Lookup failed");
  return res.json();
}

export async function apiFetchInfluencer(id: string): Promise<any | null> {
  const res = await fetch(`${API_URL}/influencers/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export async function apiGetClaimCandidates(
  token: string,
  influencerId: string,
): Promise<any[]> {
  const res = await fetch(
    `${API_URL}/influencers/claim-candidates?influencerId=${influencerId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error("Failed to fetch claim candidates");
  return res.json();
}

export async function apiClaimProfile(
  token: string,
  externalInfluencerId: string,
  claimerInfluencerId: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/influencers/claim/${externalInfluencerId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ claimerInfluencerId }),
  });
  if (!res.ok) throw new Error("Claim failed");
}

export async function apiUpdateProfile(token: string, data: Record<string, any>) {
  const res = await fetch(`${API_URL}/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update profile");
  }
  return res.json();
}

export interface SmartPlanInput {
  campaignName?: string;
  objective?: string;
  contentAngle?: string;
  productInfo?: string;
  productLinkOrWebsite?: string;
  ctaMessage?: string;
  targetAudience?: string;
  brandTone?: string;
  budget?: string;
  timeline?: string;
  kpi?: string;
  doDont?: string;
  rawPrompt?: string;
}

export interface GeneratedBrief {
  strategy: string;
  concept: string;
  briefBody: string;
}

export async function apiGenerateSmartPlan(
  token: string,
  data: SmartPlanInput,
): Promise<GeneratedBrief> {
  const res = await fetch(`${API_URL}/smart-plan/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to generate campaign brief");
  }
  return res.json();
}

export async function apiUploadRateCard(token: string, file: File): Promise<{ rateCardFileUrl: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/profile/rate-card`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Upload failed");
  }
  return res.json();
}

export async function apiDeleteRateCard(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/profile/rate-card`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to remove rate card");
}

export async function apiGetCampaigns(token: string): Promise<any[]> {
  const res = await fetch(`${API_URL}/campaigns`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch campaigns");
  return res.json();
}

export async function apiGetPublicCampaigns(token: string): Promise<any[]> {
  const res = await fetch(`${API_URL}/campaigns/public`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch public campaigns");
  return res.json();
}

export async function apiConnectYouTube(token: string): Promise<{ authUrl: string }> {
  const res = await fetch(`${API_URL}/auth/youtube/connect`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to initiate YouTube connection");
  }
  return res.json();
}

export async function apiDisconnectYouTube(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/youtube/connect`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to disconnect YouTube account");
}

export async function apiSendMessage(token: string, conversationId: string, content: string) {
  const res = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to send message");
  }
  return res.json();
}
