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

export async function apiGetCompleteness(token: string): Promise<number> {
  const res = await fetch(`${API_URL}/profile/completeness`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.profileCompleteness ?? 0;
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

export async function apiConnectPlatform(token: string, platform: string): Promise<{ authUrl: string }> {
  const res = await fetch(`${API_URL}/auth/platform/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ platform }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || `Failed to initiate ${platform} connection`);
  }
  return res.json();
}

export async function apiDisconnectPlatform(token: string, platform: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/platform/connect`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ platform }),
  });
  if (!res.ok) throw new Error(`Failed to disconnect ${platform} account`);
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

export async function apiStartConversation(token: string, influencerId: string, campaignId: string) {
  const res = await fetch(`${API_URL}/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ influencerId, campaignId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to start conversation");
  }
  return res.json();
}

export async function apiUpdateConversationPhase(token: string, conversationId: string, workPhase: string) {
  const res = await fetch(`${API_URL}/conversations/${conversationId}/phase`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ workPhase }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update phase");
  }
  return res.json();
}

export async function apiMarkConversationRead(token: string, conversationId: string) {
  const res = await fetch(`${API_URL}/conversations/${conversationId}/read`, {
    method: "PATCH",
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!res.ok) return;
}

export async function apiGetConversation(token: string, conversationId: string) {
  const res = await fetch(`${API_URL}/conversations/${conversationId}`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function apiUploadConversationFile(
  token: string,
  conversationId: string,
  type: "contract" | "brief" | "payment",
  file: File,
) {
  const form = new FormData();
  form.append("file", file);
  form.append("type", type);
  const res = await fetch(`${API_URL}/conversations/${conversationId}/upload`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Upload failed");
  }
  return res.json() as Promise<{ url: string; type: string }>;
}
