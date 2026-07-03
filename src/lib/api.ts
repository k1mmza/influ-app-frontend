import { Role } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Resolve a stored file path into an absolute URL against the backend origin.
 * Uploaded files are stored as root-relative paths (e.g. "/uploads/conversations/x.pdf").
 * Used verbatim, the browser resolves these against the frontend origin (:3000) → 404.
 * Prefixing with API_URL points them at the backend (:3001) where useStaticAssets serves them.
 * Returns null for empty input; passes through values that are already absolute URLs.
 */
export function fileUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^(https?:\/\/|data:)/i.test(path)) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function readApiError(res: Response, fallback: string) {
  try {
    const error = await res.json();
    return Array.isArray(error.message) ? error.message.join(", ") : error.message || fallback;
  } catch {
    return fallback;
  }
}

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

// ── Smart Plan → Draft Campaign ─────────────────────────────────────────────

export interface PlanRequirements {
  minFollowers?: number;
  minEngagementRate?: number;
  minAvgViews?: number;
  platforms?: string[];
  locations?: string[];
  categories?: string[];
  contentType?: string;
}

/** Campaign fields inferred by /smart-plan/generate. Mirrors the backend PlanCampaignFields. */
export interface CampaignFields {
  name?: string;
  objective?: string;
  budget?: number;
  visibility?: string;
  paymentType?: string;
  keyMessage?: string;
  doAndDont?: string;
  deliverables?: string;
  applyDeadline?: string | null;
  submissionDate?: string | null;
  reviewDate?: string | null;
  paymentDate?: string | null;
  requirements?: PlanRequirements;
}

export interface Provenance {
  userProvided: string[];
  aiSuggested: string[];
}

/** New /smart-plan/generate response: brief + inferred campaign fields + provenance. */
export interface GeneratePlanResponse extends GeneratedBrief {
  campaignFields: CampaignFields;
  provenance: Provenance;
}

export async function apiGenerateSmartPlan(
  token: string,
  data: SmartPlanInput,
): Promise<GeneratePlanResponse> {
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

export interface CreateFromPlanPayload {
  campaignFields: CampaignFields;
  strategy?: string;
  concept?: string;
  briefBody?: string;
  /** Required for AGENCY users — the backend returns 400 without it. */
  clientBrandId?: string;
}

export async function apiCreateCampaignFromPlan(
  token: string,
  payload: CreateFromPlanPayload,
): Promise<{ campaignId: string }> {
  const res = await fetch(`${API_URL}/smart-plan/create-campaign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to create campaign"));
  return res.json();
}

export interface SaveBriefInput {
  strategy?: string;
  concept?: string;
  briefBody?: string;
  campaignId?: string;
}

export async function apiSaveSmartPlanBrief(
  token: string,
  data: SaveBriefInput,
): Promise<{ id: string }> {
  const res = await fetch(`${API_URL}/smart-plan/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to save brief");
  }
  return res.json();
}

export async function apiGetSmartPlanBrief(
  token: string,
): Promise<GeneratedBrief | null> {
  const res = await fetch(`${API_URL}/smart-plan/brief`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  // Backend returns null when no brief exists → NestJS sends a 200 with an EMPTY
  // body (not "null"), so res.json() would throw "unexpected end of data". Read as
  // text and only parse when there's actually content.
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text) as GeneratedBrief;
}

export async function apiSetAvatarUrl(token: string, avatarUrl: string): Promise<void> {
  await fetch(`${API_URL}/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ avatarUrl }),
  });
}

export async function apiUploadAvatar(token: string, file: File): Promise<{ avatarUrl: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/profile/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Avatar upload failed");
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

export interface MediaKitRateCard {
  pricePerPost?: number;
  pricePerVideo?: number;
  pricePerStory?: number;
  packagePrice?: number;
  packageDescription?: string;
}

export interface MediaKitProposed {
  bio?: string;
  categories?: string[];
  styleTags?: string[];
  keywords?: string[];
  hashtags?: string[];
  availabilityStatus?: string;
  rateCard?: MediaKitRateCard;
}

export interface MediaKitAnalysis {
  proposed: MediaKitProposed;
  claimedMetrics: Record<string, number>;
  warnings: string[];
  source: "json" | "pdf" | "image" | "unknown";
}

/**
 * Upload a media kit (JSON or text PDF) for AI/deterministic extraction.
 * Returns PROPOSED self-reported fields for review — saves NOTHING. The user
 * confirms, then apiUpdateProfile performs the only write.
 */
export async function apiAnalyzeMediaKit(token: string, file: File): Promise<MediaKitAnalysis> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/profile/media-kit/analyze`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Media kit analysis failed");
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
  if (!res.ok) throw new Error(await readApiError(res, "Failed to fetch campaigns"));
  return res.json();
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function apiGetPublicCampaigns(token: string, page = 1, pageSize = 12): Promise<PaginatedResponse<any>> {
  const res = await fetch(`${API_URL}/campaigns/public?page=${page}&pageSize=${pageSize}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to fetch public campaigns"));
  return res.json();
}

export type CampaignVisibility = "PUBLIC" | "PRIVATE";
export type CampaignStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface CampaignRequirementInput {
  minFollowers?: number;
  minEngagementRate?: number;
  minAvgViews?: number;
  platforms?: string[];
  locations?: string[];
  categories?: string[];
  followerTier?: string;
  contentType?: string;
}

export interface CampaignInput {
  name: string;
  objective?: string;
  budget?: number;
  visibility?: CampaignVisibility;
  paymentType?: string;
  keyMessage?: string;
  doAndDont?: string;
  deliverables?: string;
  applyDeadline?: string;
  submissionDate?: string;
  reviewDate?: string;
  paymentDate?: string;
  clientBrandId?: string;
  requirements?: CampaignRequirementInput[];
}

export interface CampaignResponse extends CampaignInput {
  id: string;
  status: CampaignStatus;
  coverImageUrl?: string | null;
  budgetSpent?: number;
  createdAt?: string;
  updatedAt?: string;
  clientBrand?: {
    id: string;
    brandName: string;
    brandEmail?: string | null;
    brandWebsite?: string | null;
  };
  applications?: CampaignApplicationResponse[];
  requirements?: Array<CampaignRequirementInput & { id?: string; campaignId?: string }>;
}

export interface CampaignApplicationResponse {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "INVITED" | "DECLINED" | string;
  // APPLICATION = influencer applied; INVITATION = brand invited. Older rows may omit it.
  origin?: "APPLICATION" | "INVITATION" | string;
  appliedAt?: string;
  conversationId?: string | null;
  influencer?: {
    id: string;
    bio?: string | null;
    categories?: unknown;
    user?: { name?: string | null; email?: string | null };
    platformAccounts?: Array<{
      id: string;
      platform: string;
      handle: string;
      followers?: number;
      avgViews?: number;
      engagementRate?: number;
    }>;
  };
}

export interface ClientBrandResponse {
  id: string;
  brandName: string;
  brandEmail?: string | null;
  brandWebsite?: string | null;
  logoUrl?: string | null;
  origin?: "SELF_REGISTERED" | "AGENCY_MANAGED" | string;
}

/**
 * Client brands the caller can create campaigns for (agency: all managed brands; brand: its own).
 * `search` narrows by brand name; it is always applied on top of the server's
 * owner-scoping, so it can only ever filter the caller's own brands.
 */
export async function apiGetClientBrands(token: string, search?: string): Promise<ClientBrandResponse[]> {
  const qs = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  const res = await fetch(`${API_URL}/client-brands${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to fetch client brands"));
  return res.json();
}

export interface CreateManagedBrandInput {
  brandName: string;
  brandEmail?: string;
  logoUrl?: string;
}

/** Agency-only: create a managed (account-less) brand inline. Returns the new brand. */
export async function apiCreateManagedBrand(
  token: string,
  data: CreateManagedBrandInput,
): Promise<ClientBrandResponse> {
  const res = await fetch(`${API_URL}/client-brands`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to create brand"));
  return res.json();
}

export async function apiCreateCampaign(token: string, data: CampaignInput): Promise<CampaignResponse> {
  const res = await fetch(`${API_URL}/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to create campaign"));
  return res.json();
}

export async function apiGetCampaign(token: string, id: string): Promise<CampaignResponse> {
  const res = await fetch(`${API_URL}/campaigns/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to fetch campaign"));
  return res.json();
}

export async function apiUpdateCampaign(
  token: string,
  id: string,
  data: Partial<CampaignInput> & { status?: CampaignStatus },
): Promise<CampaignResponse> {
  const res = await fetch(`${API_URL}/campaigns/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to update campaign"));
  return res.json();
}

export async function apiUploadCampaignCover(
  token: string,
  id: string,
  file: File,
): Promise<CampaignResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/campaigns/${id}/cover`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to upload cover image"));
  return res.json();
}

export async function apiDeleteCampaign(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/campaigns/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to delete campaign"));
}

export async function apiApplyToCampaign(token: string, id: string): Promise<CampaignApplicationResponse> {
  const res = await fetch(`${API_URL}/campaigns/${id}/apply`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to apply to campaign"));
  return res.json();
}

export async function apiGetCampaignApplications(token: string, id: string): Promise<CampaignApplicationResponse[]> {
  const res = await fetch(`${API_URL}/campaigns/${id}/applications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to fetch applications"));
  return res.json();
}

export async function apiUpdateCampaignApplicationStatus(
  token: string,
  campaignId: string,
  applicationId: string,
  status: "PENDING" | "ACCEPTED" | "REJECTED",
): Promise<CampaignApplicationResponse> {
  const res = await fetch(`${API_URL}/campaigns/${campaignId}/applications/${applicationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to update application"));
  return res.json();
}

// ── Tracking ────────────────────────────────────────────────────────────────

export interface TrackingSummaryRow {
  id: string;
  name: string;
  status: string;
  influencerCount: number;
  totalViews: number;
  avgEngagementRate: number;
}

export interface TrackingDetailRow {
  id: string;
  influencerName: string;
  platform: string | null;
  contentType: string | null;
  contentUrl: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  growthRate: number;
  recordedAt: string;
}

export async function apiGetTracking(token: string): Promise<TrackingSummaryRow[]> {
  const res = await fetch(`${API_URL}/tracking`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to fetch tracking data"));
  return res.json();
}

export async function apiGetTrackingDetail(token: string, campaignId: string): Promise<TrackingDetailRow[]> {
  const res = await fetch(`${API_URL}/tracking/${campaignId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to fetch tracking detail"));
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

export async function apiMarkPhaseReady(token: string, conversationId: string) {
  const res = await fetch(`${API_URL}/conversations/${conversationId}/phase-ready`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to confirm phase");
  }
  return res.json() as Promise<{ workPhase: string; brandPhaseReady: boolean; influencerPhaseReady: boolean }>;
}

// Removed apiUpdateConversationPhase — the backend PATCH /conversations/:id/phase
// endpoint was deleted (unguarded phase-set with no consumer). Phase progression
// goes through apiMarkPhaseReady (POST /:id/phase-ready).

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

export interface ConversationBrief {
  campaign: {
    id: string;
    name: string;
    objective: string | null;
    budget: number | null;
    paymentType: string | null;
    keyMessage: string | null;
    deliverables: string | null;
    doAndDont: string | null;
    applyDeadline: string | null;
    submissionDate: string | null;
  } | null;
  requirement: {
    minFollowers: number | null;
    minEngagementRate: number | null;
    minAvgViews: number | null;
    platforms: unknown;
    locations: unknown;
    categories: unknown;
    followerTier: string | null;
    contentType: string | null;
  } | null;
  smartPlanBrief: {
    id: string;
    strategy: string | null;
    concept: string | null;
    briefBody: string | null;
    generatedBrief: string | null;
    inputMode: string | null;
  } | null;
  briefFileUrl: string | null;
}

export async function apiGetConversationBrief(token: string, conversationId: string): Promise<ConversationBrief | null> {
  const res = await fetch(`${API_URL}/conversations/${conversationId}/brief`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

// ── Shortlist ─────────────────────────────────────────────────────────────

export async function apiGetShortlist(token: string): Promise<any[]> {
  const res = await fetch(`${API_URL}/shortlist`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await readApiError(res, 'Failed to fetch shortlist'));
  return res.json();
}

export async function apiAddToShortlist(token: string, influencerId: string): Promise<void> {
  const res = await fetch(`${API_URL}/shortlist/${influencerId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await readApiError(res, 'Failed to add to shortlist'));
}

export async function apiRemoveFromShortlist(token: string, influencerId: string): Promise<void> {
  const res = await fetch(`${API_URL}/shortlist/${influencerId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await readApiError(res, 'Failed to remove from shortlist'));
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

// ── Drafts (conversation-scoped) ────────────────────────────────────────────

export interface Draft {
  id: string;
  conversationId: string;
  title: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REVISION_REQUESTED";
  notes: string | null;
  fileUrl: string | null;
  linkUrl: string | null;
  contentType: string | null;
  revisionNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function apiGetDrafts(token: string, conversationId: string): Promise<Draft[]> {
  const res = await fetch(`${API_URL}/conversations/${conversationId}/drafts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to fetch drafts"));
  return res.json();
}

export async function apiCreateDraft(
  token: string,
  conversationId: string,
  data: { title: string; notes?: string; linkUrl?: string; contentType?: string },
): Promise<Draft> {
  const res = await fetch(`${API_URL}/conversations/${conversationId}/drafts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to create draft"));
  return res.json();
}

export async function apiUpdateDraft(
  token: string,
  conversationId: string,
  draftId: string,
  data: { title?: string; notes?: string; linkUrl?: string; contentType?: string; status?: "DRAFT" | "SUBMITTED" },
): Promise<Draft> {
  const res = await fetch(`${API_URL}/conversations/${conversationId}/drafts/${draftId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to update draft"));
  return res.json();
}

export async function apiDeleteDraft(token: string, conversationId: string, draftId: string): Promise<void> {
  const res = await fetch(`${API_URL}/conversations/${conversationId}/drafts/${draftId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to delete draft"));
}

export async function apiReviewDraft(
  token: string,
  conversationId: string,
  draftId: string,
  data: { status: "APPROVED" | "REVISION_REQUESTED"; revisionNote?: string },
): Promise<Draft> {
  const res = await fetch(`${API_URL}/conversations/${conversationId}/drafts/${draftId}/review`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to review draft"));
  return res.json();
}

export async function apiUploadDraftFile(
  token: string,
  conversationId: string,
  draftId: string,
  file: File,
): Promise<Draft> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/conversations/${conversationId}/drafts/${draftId}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to upload draft file"));
  return res.json();
}

// ── Payments (conversation-scoped) ──────────────────────────────────────────

export interface Payment {
  id: string;
  campaignId: string;
  influencerId: string;
  amount: number;
  paymentType: string | null;
  status: "PENDING" | "AWAITING_CONFIRMATION" | "PAID";
  proofUrl: string | null;
  confirmedAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export async function apiGetPayments(token: string, conversationId: string): Promise<Payment[]> {
  const res = await fetch(`${API_URL}/conversations/${conversationId}/payments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to fetch payments"));
  return res.json();
}

export async function apiCreatePayment(
  token: string,
  conversationId: string,
  data: { amount: number; paymentType?: string },
): Promise<Payment> {
  const res = await fetch(`${API_URL}/conversations/${conversationId}/payments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to create payment"));
  return res.json();
}

export async function apiUploadPaymentProof(
  token: string,
  conversationId: string,
  paymentId: string,
  file: File,
): Promise<Payment> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/conversations/${conversationId}/payments/${paymentId}/proof`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to upload payment proof"));
  return res.json();
}

export async function apiConfirmPayment(
  token: string,
  conversationId: string,
  paymentId: string,
): Promise<Payment> {
  const res = await fetch(`${API_URL}/conversations/${conversationId}/payments/${paymentId}/confirm`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to confirm payment"));
  return res.json();
}

// ── Campaign Invitations ────────────────────────────────────────────────────
// Brand/agency invites a registered influencer to a campaign; influencer accepts/declines.
// Reuses the CampaignApplication model (status INVITED → ACCEPTED/DECLINED).

export type InviteResult = "INVITED" | "RE_INVITED" | "ALREADY_INVITED" | "ALREADY_ACCEPTED";

export interface InviteResponse {
  id: string;
  campaignId: string;
  influencerId: string;
  status: string;
  origin: string;
  inviteResult: InviteResult;
}

export interface Invitation {
  id: string;
  status: string;
  invitedAt: string;
  campaignId: string;
  campaignName: string | null;
  objective: string | null;
  budget: number | null;
  keyMessage: string | null;
  deliverables: string | null;
  applyDeadline: string | null;
  visibility: string | null;
  brandName: string | null;
}

/**
 * Invite an influencer to a campaign.
 * Throws with "This influencer has already applied to this campaign." (409) when the
 * influencer already has a pending application — surface this message to the user.
 */
export async function apiInviteToCampaign(
  token: string,
  campaignId: string,
  influencerId: string,
): Promise<InviteResponse> {
  const res = await fetch(`${API_URL}/campaigns/${campaignId}/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ influencerId }),
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to send invitation"));
  return res.json();
}

export async function apiGetInvitations(token: string): Promise<Invitation[]> {
  const res = await fetch(`${API_URL}/invitations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to fetch invitations"));
  return res.json();
}

export async function apiAcceptInvitation(
  token: string,
  invitationId: string,
): Promise<{ id: string; status: string; conversationId: string }> {
  const res = await fetch(`${API_URL}/invitations/${invitationId}/accept`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to accept invitation"));
  return res.json();
}

export async function apiDeclineInvitation(token: string, invitationId: string): Promise<void> {
  const res = await fetch(`${API_URL}/invitations/${invitationId}/decline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to decline invitation"));
}
