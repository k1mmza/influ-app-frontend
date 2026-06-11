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
