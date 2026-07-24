"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import {
  apiGenerateSmartPlan,
  apiGetCampaigns,
  apiGetSmartPlanBrief,
  apiSaveSmartPlanBrief,
  apiCreateCampaignFromPlan,
  apiDeleteSmartPlanBrief,
  apiUploadBriefImage,
  apiUploadCampaignBriefImage,
  type CampaignFields,
  type Provenance,
  type GeneratePlanResponse,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Brain,
  FileText,
  LayoutList,
  ChevronRight,
  ArrowLeft,
  Target,
  Zap,
  Plus,
  CheckCircle2,
  Lightbulb,
  PenLine,
  BookOpen,
  Loader2,
  Calendar,
  Building2,
  Wand2,
  Rocket,
  ImageIcon,
  X,
  Trash2,
} from "lucide-react";

type StepId = "requirement" | "brief";

type RequirementData = {
  campaignName: string;
  objective: string;
  contentAngle: string;
  productInfo: string;
  productLinkOrWebsite: string;
  ctaMessage: string;
  targetAudience: string;
  brandTone: string;
  budget: string;
  timeline: string;
  kpi: string;
  doDont: string;
};

type Campaign = {
  id: string;
  name: string;
  status: string;
  budget: string;
  timeRange: string;
  result: string;
  briefImageUrl: string | null;
  requirement: RequirementData;
};

const stepBar: { id: StepId; label: string; icon: React.ReactNode }[] = [
  { id: "requirement", label: "Requirement", icon: <Target className="h-4 w-4" /> },
  { id: "brief", label: "Brief", icon: <BookOpen className="h-4 w-4" /> },
];

const requirementFields: { key: keyof RequirementData; label: string; fullWidth?: boolean }[] = [
  { key: "campaignName", label: "Campaign Name", fullWidth: true },
  { key: "objective", label: "Objective", fullWidth: true },
  { key: "contentAngle", label: "Content Angle" },
  { key: "productInfo", label: "Product Info" },
  { key: "productLinkOrWebsite", label: "Product Link / Website" },
  { key: "ctaMessage", label: "CTA Message" },
  { key: "targetAudience", label: "Target Audience" },
  { key: "brandTone", label: "Brand Identity / Tone" },
  { key: "budget", label: "Budget" },
  { key: "timeline", label: "Timeline" },
  { key: "kpi", label: "KPI", fullWidth: true },
  { key: "doDont", label: "Do & Don't", fullWidth: true },
];

// Fields the user must fill before generating a Smart Plan from the form.
const REQUIRED_FORM_FIELDS: (keyof RequirementData)[] = ["campaignName", "objective", "productInfo"];

// A required field needs real content — at least one letter or number (Unicode
// aware, so Thai/other scripts count). A lone space, "-", or other punctuation
// does NOT count as filled.
const hasMeaningfulContent = (v: string): boolean => /[\p{L}\p{N}]/u.test(v ?? "");

type BriefSubSection = "strategy" | "concept" | "briefBody";
type StartMode = "none" | "prompt" | "form";

// New: review phase between generation and campaign creation
type FlowPhase = "input" | "review" | "creating";

// Human labels for campaignFields keys (dot-notation for nested requirements.*)
const FIELD_LABELS: Record<string, string> = {
  name: "Campaign name",
  objective: "Objective",
  budget: "Budget (THB)",
  visibility: "Visibility",
  paymentType: "Payment type",
  keyMessage: "Key message",
  doAndDont: "Do & Don't",
  deliverables: "Deliverables",
  applyDeadline: "Apply deadline",
  submissionDate: "Submission date",
  reviewDate: "Review date",
  paymentDate: "Payment date",
  "requirements.minFollowers": "Min followers",
  "requirements.minEngagementRate": "Min engagement rate (%)",
  "requirements.minAvgViews": "Min avg views",
  "requirements.platforms": "Platforms",
  "requirements.locations": "Locations",
  "requirements.categories": "Categories",
  "requirements.contentType": "Content type",
};

// Date fields always come back null from the backend — rendered as empty date inputs.
const DATE_PATHS = ["applyDeadline", "submissionDate", "reviewDate", "paymentDate"];
const NUMBER_PATHS = ["budget", "requirements.minFollowers", "requirements.minEngagementRate", "requirements.minAvgViews"];
const ARRAY_PATHS = ["requirements.platforms", "requirements.locations", "requirements.categories"];
const TEXTAREA_PATHS = ["keyMessage", "doAndDont", "deliverables"];

function getByPath(obj: CampaignFields, path: string): unknown {
  if (!path.includes(".")) return (obj as Record<string, unknown>)[path];
  const [parent, child] = path.split(".");
  const nested = (obj as Record<string, any>)[parent];
  return nested ? nested[child] : undefined;
}

/** Immutably set a (possibly nested) path on a CampaignFields object. */
function setByPath(obj: CampaignFields, path: string, value: unknown): CampaignFields {
  if (!path.includes(".")) {
    return { ...obj, [path]: value };
  }
  const [parent, child] = path.split(".");
  const nested = { ...((obj as Record<string, any>)[parent] ?? {}), [child]: value };
  return { ...obj, [parent]: nested };
}

function requirementInputPlaceholder(field: keyof RequirementData, label: string) {
  if (field === "productLinkOrWebsite") return "https://…";
  if (field === "ctaMessage") return "e.g. Shop now, link in bio";
  return `Enter ${label.toLowerCase()}`;
}

const sectionAlias: Record<string, StepId | BriefSubSection> = {
  requirement: "requirement",
  strategy: "strategy",
  concept: "concept",
  brief: "briefBody",
  influencer: "brief",
  message: "brief",
  messages: "brief",
  tracking: "brief",
};

/** Maps a raw API campaign to the local Campaign shape used by the list view. */
function apiCampaignToLocal(c: any): Campaign {
  const budget = c.budget != null ? `฿${Number(c.budget).toLocaleString()}` : "—";
  const start = c.applyDeadline ? new Date(c.applyDeadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : null;
  const end = c.paymentDate ? new Date(c.paymentDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : null;
  const timeRange = start && end ? `${start} – ${end}` : start ?? end ?? "—";
  return {
    id: c.id,
    name: c.name,
    status: c.status ?? "DRAFT",
    budget,
    timeRange,
    result: "—", // TODO: wire real KPI result when tracking is implemented
    briefImageUrl: c.briefImageUrl ?? null,
    requirement: {
      campaignName: c.name ?? "",
      objective: c.objective ?? "",
      contentAngle: "",
      productInfo: "",
      productLinkOrWebsite: "",
      ctaMessage: "",
      targetAudience: "",
      brandTone: "",
      budget: c.budget != null ? String(c.budget) : "",
      timeline: timeRange,
      kpi: "",
      doDont: c.doAndDont ?? "",
    },
  };
}

const emptyRequirement: RequirementData = {
  campaignName: "",
  objective: "",
  contentAngle: "",
  productInfo: "",
  productLinkOrWebsite: "",
  ctaMessage: "",
  targetAudience: "",
  brandTone: "",
  budget: "",
  timeline: "",
  kpi: "",
  doDont: "",
};

export default function SmartPlanPage() {
  const { role, token } = useUserStore();
  const router = useRouter();
  const [promptInput, setPromptInput] = useState("");
  const [activeStep, setActiveStep] = useState<StepId>("requirement");
  const [activeBriefSub, setActiveBriefSub] = useState<BriefSubSection>("strategy");
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlannerVisible, setIsPlannerVisible] = useState(false);
  const [startMode, setStartMode] = useState<StartMode>("none");
  const [viewMode, setViewMode] = useState<"create" | "list" | "detail">("create");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isBriefCampaignPickerOpen, setIsBriefCampaignPickerOpen] = useState(false);
  const [requirements, setRequirements] = useState<RequirementData>(emptyRequirement);
  const [strategyText, setStrategyText] = useState("");
  const [conceptText, setConceptText] = useState("");
  const [briefText, setBriefText] = useState("");
  const [formDraft, setFormDraft] = useState<RequirementData>(emptyRequirement);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof RequirementData, string>>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Fix 1 — Save Brief state
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [isDeleting, setIsDeleting] = useState(false);
  // Brief reference image for the SELECTED existing campaign (upload + replace).
  const [campaignBriefImgUploading, setCampaignBriefImgUploading] = useState(false);
  const [campaignBriefImgError, setCampaignBriefImgError] = useState<string | null>(null);

  // Fix 2 — Real campaigns from API
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignsError, setCampaignsError] = useState<string | null>(null);

  // Smart Plan → Draft Campaign: review phase state
  const [flowPhase, setFlowPhase] = useState<FlowPhase>("input");
  const [campaignFields, setCampaignFields] = useState<CampaignFields | null>(null);
  const [provenance, setProvenance] = useState<Provenance>({ userProvided: [], aiSuggested: [] });
  const [createError, setCreateError] = useState<string | null>(null);
  // Agency-only: client brand id, typed manually (same mechanism as the Create Campaign page,
  // which uses a plain text input — no list endpoint exists for an agency's client brands).
  // TODO: replace with a proper dropdown once GET /agency/client-brands (or similar) exists.
  const [agencyClientBrandId, setAgencyClientBrandId] = useState("");
  // Optional reference image shown to the creator in the brief. Display-only —
  // uploaded to /uploads before the campaign exists, then its URL is included in
  // the create-campaign payload. Never sent to the AI generate step.
  const [briefImageUrl, setBriefImageUrl] = useState<string | null>(null);
  const [briefImageUploading, setBriefImageUploading] = useState(false);
  const [briefImageError, setBriefImageError] = useState<string | null>(null);

  // Fix 1 — restore last saved brief when the page loads (brand/agency only)
  useEffect(() => {
    if (!token || (role !== "brand" && role !== "agency")) return;
    apiGetSmartPlanBrief(token).then((saved) => {
      if (saved && (saved.strategy || saved.concept || saved.briefBody)) {
        applyGeneratedBrief(saved);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // Fix 2 — load the user's campaigns for brand/agency. Needed by BOTH the list view
  // and the brief-panel campaign picker (which renders in the create/detail views), so
  // it must not be gated on viewMode. Refetches on view change to stay fresh.
  useEffect(() => {
    if (!token || (role !== "brand" && role !== "agency")) return;
    setCampaignsLoading(true);
    setCampaignsError(null);
    apiGetCampaigns(token)
      .then((data) => setMyCampaigns(data.map(apiCampaignToLocal)))
      .catch((err) => setCampaignsError(err.message ?? "Failed to load campaigns"))
      .finally(() => setCampaignsLoading(false));
  }, [token, role, viewMode]);

  const promptHint = useMemo(() => {
    return hasStarted
      ? "Use @Requirement, @Strategy, @Concept, or @Brief before details."
      : "Start with @Requirement and describe your campaign for AI planning.";
  }, [hasStarted]);

  const applyGeneratedBrief = (brief: { strategy: string; concept: string; briefBody: string }) => {
    setStrategyText(brief.strategy);
    setConceptText(brief.concept);
    setBriefText(brief.briefBody);
    setHasStarted(true);
    setIsPlannerVisible(true);
    setActiveStep("brief");
    setActiveBriefSub("strategy");
  };

  // New: capture the full generated plan and enter the REVIEW phase.
  // Brief text is stored too so the "Just save the brief" path still works.
  const applyGeneratedPlan = (result: GeneratePlanResponse) => {
    setStrategyText(result.strategy);
    setConceptText(result.concept);
    setBriefText(result.briefBody);
    setCampaignFields(result.campaignFields ?? {});
    setProvenance(result.provenance ?? { userProvided: [], aiSuggested: [] });
    setCreateError(null);
    setFlowPhase("review");
  };

  const updateCampaignField = (path: string, value: unknown) => {
    setCampaignFields((prev) => setByPath(prev ?? {}, path, value));
  };

  // Optional brief reference image — uploaded immediately on pick so we hold a URL
  // to include in the create-campaign payload. Not part of the AI generate call.
  const handleBriefImagePick = async (file: File | null) => {
    if (!token || !file) return;
    setBriefImageUploading(true);
    setBriefImageError(null);
    try {
      const { url } = await apiUploadBriefImage(token, file);
      setBriefImageUrl(url);
    } catch (err: any) {
      setBriefImageError(err?.message || "Failed to upload image. Please try again.");
    } finally {
      setBriefImageUploading(false);
    }
  };

  // Primary CTA — create the DRAFT campaign from the (possibly edited) fields.
  const handleCreateDraftCampaign = async () => {
    if (!token || !campaignFields) return;
    setFlowPhase("creating");
    setCreateError(null);
    try {
      const { campaignId } = await apiCreateCampaignFromPlan(token, {
        campaignFields,
        strategy: strategyText,
        concept: conceptText,
        briefBody: briefText,
        briefImageUrl: briefImageUrl ?? undefined,
        clientBrandId: role === "agency" ? agencyClientBrandId.trim() || undefined : undefined,
      });
      router.push(`/campaigns/${campaignId}`);
    } catch (err: any) {
      // Inline error banner (this page has no toast lib — matches generateError pattern)
      setCreateError(err?.message || "Failed to create campaign. Please try again.");
      setFlowPhase("review");
    }
  };

  // Secondary CTA — preserve today's brief-only behavior: drop into the brief tabs
  // and persist the standalone brief via the existing save endpoint.
  const handleJustSaveBrief = async () => {
    setFlowPhase("input");
    applyGeneratedBrief({ strategy: strategyText, concept: conceptText, briefBody: briefText });
    await handleSaveBrief();
  };

  // Renders one editable field in the review screen based on its path's value type.
  const renderReviewField = (path: string) => {
    const label = FIELD_LABELS[path] ?? path;
    const raw = getByPath(campaignFields ?? {}, path);
    const isDate = DATE_PATHS.includes(path);
    const isNumber = NUMBER_PATHS.includes(path);
    const isArray = ARRAY_PATHS.includes(path);
    const isTextarea = TEXTAREA_PATHS.includes(path);

    let control: React.ReactNode;
    if (isArray) {
      const arr = Array.isArray(raw) ? (raw as string[]) : [];
      control = (
        <Input
          value={arr.join(", ")}
          onChange={(e) =>
            updateCampaignField(
              path,
              e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
            )
          }
          placeholder="Comma-separated"
        />
      );
    } else if (isNumber) {
      control = (
        <Input
          type="number"
          value={raw == null ? "" : String(raw)}
          onChange={(e) =>
            updateCampaignField(path, e.target.value === "" ? undefined : Number(e.target.value))
          }
          placeholder="0"
        />
      );
    } else if (isDate) {
      control = (
        <Input
          type="date"
          value={typeof raw === "string" ? raw : ""}
          onChange={(e) => updateCampaignField(path, e.target.value || null)}
        />
      );
    } else if (isTextarea) {
      control = (
        <textarea
          rows={3}
          value={typeof raw === "string" ? raw : ""}
          onChange={(e) => updateCampaignField(path, e.target.value)}
          className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/80 focus:ring-2 focus:ring-primary/10"
        />
      );
    } else {
      control = (
        <Input
          value={typeof raw === "string" || typeof raw === "number" ? String(raw) : ""}
          onChange={(e) => updateCampaignField(path, e.target.value)}
        />
      );
    }

    return (
      <label key={path} className="block space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        {control}
        {isDate && (
          <span className="text-[10px] text-muted-foreground">Optional — you can set this on the campaign page.</span>
        )}
      </label>
    );
  };

  const applyPromptText = async (input: string): Promise<boolean> => {
    const trimmed = input.trim();
    if (!trimmed) return false;

    const tagMatch = trimmed.match(/^@([a-zA-Z]+)\s*/);
    const section = tagMatch?.[1]?.toLowerCase();
    const resolved = section ? sectionAlias[section] : undefined;
    const payload = tagMatch ? trimmed.replace(/^@[a-zA-Z]+\s*/, "") : trimmed;

    // Direct text overrides — no AI call needed
    if (resolved === "strategy") {
      setStrategyText(payload);
      setHasStarted(true);
      setIsPlannerVisible(true);
      setActiveStep("brief");
      setActiveBriefSub("strategy");
      return true;
    }
    if (resolved === "concept") {
      setConceptText(payload);
      setHasStarted(true);
      setIsPlannerVisible(true);
      setActiveStep("brief");
      setActiveBriefSub("concept");
      return true;
    }
    if (resolved === "briefBody") {
      setBriefText(payload);
      setHasStarted(true);
      setIsPlannerVisible(true);
      setActiveStep("brief");
      setActiveBriefSub("briefBody");
      return true;
    }

    // @Requirement or freeform → call AI, then enter the REVIEW phase
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const result = await apiGenerateSmartPlan(token!, { rawPrompt: trimmed });
      applyGeneratedPlan(result);
    } catch (err: any) {
      setGenerateError(err.message || "Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
    return true;
  };

  // Fix 1 — Save Brief handler
  const handleSaveBrief = async () => {
    if (!token) return;
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      await apiSaveSmartPlanBrief(token, {
        strategy: strategyText,
        concept: conceptText,
        briefBody: briefText,
        campaignId: selectedCampaign?.id,
      });
      setSaveStatus("saved");
      // Reset the success indicator after 3 s
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete the current brief (the saved copy too, so it doesn't restore on reload)
  // and drop back to the Requirement step. Requirement inputs are kept so the user
  // can adjust and regenerate.
  const handleDeleteBrief = async () => {
    if (!token) return;
    if (!window.confirm("Delete this brief? This can't be undone.")) return;
    setIsDeleting(true);
    setSaveStatus("idle");
    try {
      await apiDeleteSmartPlanBrief(token, selectedCampaign?.id);
      // Clear the current brief content + any generated/review state
      setStrategyText("");
      setConceptText("");
      setBriefText("");
      setBriefImageUrl(null);
      setBriefImageError(null);
      setCampaignFields(null);
      setProvenance({ userProvided: [], aiSuggested: [] });
      setFlowPhase("input");
      setActiveStep("requirement");
    } catch {
      setSaveStatus("error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Upload/replace the brief reference image on the currently selected campaign.
  // Persists in one call and reflects immediately in the influencer's brief view.
  const handleCampaignBriefImageUpload = async (file: File | null) => {
    if (!token || !file || !selectedCampaign) return;
    const campaignId = selectedCampaign.id;
    setCampaignBriefImgUploading(true);
    setCampaignBriefImgError(null);
    try {
      const updated = await apiUploadCampaignBriefImage(token, campaignId, file);
      const newUrl = updated.briefImageUrl ?? null;
      setSelectedCampaign((prev) =>
        prev && prev.id === campaignId ? { ...prev, briefImageUrl: newUrl } : prev,
      );
      setMyCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? { ...c, briefImageUrl: newUrl } : c)),
      );
    } catch (err: any) {
      setCampaignBriefImgError(err?.message || "Failed to upload image. Please try again.");
    } finally {
      setCampaignBriefImgUploading(false);
    }
  };

  const applyPrompt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const applied = await applyPromptText(promptInput);
    if (applied) setPromptInput("");
  };

  const updateRequirement = (field: keyof RequirementData, value: string) => {
    setRequirements((prev) => ({ ...prev, [field]: value }));
  };

  const applyCampaignRequirementToBrief = (campaign: Campaign | null) => {
    if (!campaign) return;
    setSelectedCampaign(campaign);
    setRequirements(campaign.requirement);
    setStrategyText("");
    setConceptText("");
    setBriefText("");
  };

  // Picking a campaign in the brief panel starts a FRESH brief for it: wipe the
  // current brief + review state and drop back to the generate entry (form
  // prefilled with the campaign's requirement), so each campaign gets its own
  // brief instead of reusing the first one that was generated/restored. Picking
  // the already-selected campaign is a no-op so a brief isn't wiped by accident.
  const resetBriefForCampaign = (campaign: Campaign | null) => {
    if (!campaign || campaign.id === selectedCampaign?.id) return;
    setSelectedCampaign(campaign);
    setRequirements(campaign.requirement);
    setFormDraft(campaign.requirement);
    // wipe the previous brief / review state
    setStrategyText("");
    setConceptText("");
    setBriefText("");
    setCampaignFields(null);
    setProvenance({ userProvided: [], aiSuggested: [] });
    setBriefImageUrl(null);
    setBriefImageError(null);
    setCreateError(null);
    setGenerateError(null);
    setFormErrors({});
    setSaveStatus("idle");
    // return to the generate entry so the "Generate" CTA is available again
    setFlowPhase("input");
    setIsPlannerVisible(false);
    setViewMode("create");
    setStartMode("form");
    setActiveStep("requirement");
    setHasStarted(false);
  };

  const updateFormDraft = (field: keyof RequirementData, value: string) => {
    setFormDraft((prev) => ({ ...prev, [field]: value }));
    // Clear this field's error as soon as it has real content.
    if (formErrors[field] && hasMeaningfulContent(value)) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const finishFormFlow = async () => {
    // Block submit if any required field is empty (trimmed); show inline errors.
    const errors: Partial<Record<keyof RequirementData, string>> = {};
    for (const key of REQUIRED_FORM_FIELDS) {
      if (!hasMeaningfulContent(formDraft[key])) {
        const label = requirementFields.find((f) => f.key === key)?.label ?? key;
        errors[key] = `${label} must include letters or numbers`;
      }
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setRequirements(formDraft);
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const result = await apiGenerateSmartPlan(token!, formDraft);
      applyGeneratedPlan(result);
    } catch (err: any) {
      setGenerateError(err.message || "Generation failed. Please try again.");
      setHasStarted(true);
      setIsPlannerVisible(true);
      setActiveStep("requirement");
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate (or regenerate) the brief from the planner's requirement fields.
  // The planner requirement step is reached for an existing/selected campaign
  // (e.g. via "View Details" or the step bar), so on success we land in the
  // brief tabs rather than the create-campaign review flow. This is what lets a
  // new campaign get its own brief instead of being stuck on the old one.
  const generateFromRequirements = async () => {
    if (!token) return;
    const missing = REQUIRED_FORM_FIELDS.filter(
      (k) => !hasMeaningfulContent(requirements[k]),
    );
    if (missing.length > 0) {
      const labels = missing.map(
        (k) => requirementFields.find((f) => f.key === k)?.label ?? k,
      );
      setGenerateError(`Please fill in: ${labels.join(", ")}.`);
      return;
    }
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const result = await apiGenerateSmartPlan(token, requirements);
      applyGeneratedBrief({
        strategy: result.strategy,
        concept: result.concept,
        briefBody: result.briefBody,
      });
    } catch (err: any) {
      setGenerateError(err.message || "Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (role !== "brand" && role !== "agency") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <Card className="max-w-md border-none shadow-sm text-center">
          <CardContent className="p-10">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Brain className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold font-serif">Smart Plan</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This feature is available for Agency and Brand workspaces. Switch role to continue.
            </p>
            <Button asChild className="mt-6 rounded-xl" variant="outline">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-secondary p-8 text-white shadow-lg">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10">
          <Brain className="h-40 w-40" />
        </div>
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-white/80" />
              <Badge className="border-none bg-white/20 text-xs text-white hover:bg-white/25">
                AI-Powered
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight font-serif">Smart Plan</h1>
            <p className="mt-2 max-w-md text-sm text-white/70">
              Plan your campaign from requirements through the creative brief.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost" size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-xl text-white hover:bg-white/15"
            >
              <LayoutList className="mr-2 h-4 w-4" /> My Campaigns
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-xl text-white hover:bg-white/15">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Campaign List View */}
      {viewMode === "list" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-serif text-foreground">My Campaigns</h2>
            <Button
              size="sm"
              onClick={() => setViewMode("create")}
              className="rounded-xl shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4" /> New Campaign
            </Button>
          </div>

          {/* Loading skeleton */}
          {campaignsLoading && (
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1].map((i) => (
                <Card key={i} className="border-none shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Skeleton className="h-2.5 w-14" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <div className="space-y-1.5">
                        <Skeleton className="h-2.5 w-14" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                    <Skeleton className="mt-4 h-8 w-full rounded-xl" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error state */}
          {campaignsError && !campaignsLoading && (
            <p className="text-sm text-destructive">{campaignsError}</p>
          )}

          {/* Empty state */}
          {!campaignsLoading && !campaignsError && myCampaigns.length === 0 && (
            <Card className="border-none shadow-sm">
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <FileText className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">No campaigns yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create your first campaign to track it here.
                  </p>
                </div>
                <Button asChild size="sm" className="rounded-xl shadow-sm">
                  <Link href="/campaigns/create">
                    <Plus className="mr-2 h-4 w-4" /> Create your first campaign
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Campaign cards */}
          {!campaignsLoading && !campaignsError && myCampaigns.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {myCampaigns.map((campaign) => (
                <Card key={campaign.id} className="border-none shadow-sm transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="font-bold font-serif text-foreground">{campaign.name}</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">{campaign.timeRange}</p>
                      </div>
                      <Badge
                        variant={campaign.status === "ACTIVE" ? "default" : "secondary"}
                        className="rounded-full"
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Budget</p>
                        <p className="text-sm font-semibold text-foreground">{campaign.budget}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Result</p>
                        <p className="text-sm font-semibold text-foreground">{campaign.result}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-4 w-full justify-between rounded-xl font-bold text-primary hover:text-primary/80"
                      onClick={() => {
                        applyCampaignRequirementToBrief(campaign);
                        setViewMode("detail");
                        setIsPlannerVisible(true);
                        setHasStarted(true);
                        setActiveStep("requirement");
                      }}
                    >
                      View Details <ChevronRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create View — Start Mode Selection */}
      {viewMode === "create" && !isPlannerVisible && flowPhase === "input" && (
        <div className="space-y-6">
          {startMode === "none" && (
            <>
              <div>
                <h2 className="text-lg font-bold font-serif text-foreground">How do you want to start?</h2>
                <p className="mt-1 text-sm text-muted-foreground">Choose a method to build your campaign plan.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setStartMode("form")}
                  className="group text-left"
                >
                  <Card className="h-full cursor-pointer border-2 border-transparent transition-all hover:border-primary/40 hover:shadow-md">
                    <CardContent className="p-6">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 transition-all group-hover:bg-primary/15">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-bold font-serif text-foreground">Fill the Form</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        Structured fields for campaign name, objective, budget, timeline, and more.
                      </p>
                    </CardContent>
                  </Card>
                </button>
                <button
                  type="button"
                  onClick={() => setStartMode("prompt")}
                  className="group text-left"
                >
                  <Card className="h-full cursor-pointer border-2 border-transparent transition-all hover:border-secondary/40 hover:shadow-md">
                    <CardContent className="p-6">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 transition-all group-hover:bg-secondary/15">
                        <Sparkles className="h-6 w-6 text-secondary" />
                      </div>
                      <h3 className="font-bold font-serif text-foreground">AI Prompt</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        Describe your campaign in natural language and let AI generate the full brief.
                      </p>
                    </CardContent>
                  </Card>
                </button>
              </div>
            </>
          )}

          {startMode === "prompt" && (
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 font-serif">
                      <Sparkles className="h-4 w-4 text-secondary" />
                      AI Prompt Command
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Use <code className="rounded bg-muted px-1 py-0.5 text-xs">@Requirement</code> to start, or just describe your campaign freely.
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStartMode("none")} className="text-muted-foreground">
                    ← Back
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  rows={9}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  disabled={isGenerating}
                  placeholder={promptHint}
                  className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/80 focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
                />
                {generateError && (
                  <p className="text-sm text-destructive">{generateError}</p>
                )}
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => setViewMode("list")} className="rounded-xl">
                    My Campaigns
                  </Button>
                  <Button
                    disabled={isGenerating || !promptInput.trim()}
                    onClick={async () => {
                      const applied = await applyPromptText(promptInput);
                      if (applied) setPromptInput("");
                    }}
                    className="rounded-xl shadow-sm"
                  >
                    {isGenerating ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</>
                    ) : (
                      "Create Campaign"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {startMode === "form" && (
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 font-serif">
                      <FileText className="h-4 w-4 text-primary" />
                      Campaign Requirements
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Fill what you know — AI will generate strategy, concept, and brief from these fields.
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStartMode("none")} className="text-muted-foreground">
                    ← Back
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {requirementFields.map((field) => {
                    const required = REQUIRED_FORM_FIELDS.includes(field.key);
                    const error = formErrors[field.key];
                    return (
                      <label
                        key={field.key}
                        className={cn("block space-y-1.5", field.fullWidth && "sm:col-span-2")}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {field.label}
                          {required && <span className="ml-0.5 text-destructive">*</span>}
                        </span>
                        <Input
                          value={formDraft[field.key]}
                          onChange={(e) => updateFormDraft(field.key, e.target.value)}
                          placeholder={requirementInputPlaceholder(field.key, field.label)}
                          disabled={isGenerating}
                          aria-invalid={error ? true : undefined}
                          className={cn(error && "border-destructive focus-visible:ring-destructive/30")}
                        />
                        {error && <p className="text-xs text-destructive">{error}</p>}
                      </label>
                    );
                  })}
                </div>
                {generateError && (
                  <p className="text-sm text-destructive">{generateError}</p>
                )}
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <Button variant="outline" size="sm" onClick={() => setViewMode("list")} className="rounded-xl">
                    My Campaigns
                  </Button>
                  <Button onClick={finishFormFlow} disabled={isGenerating} className="rounded-xl shadow-sm">
                    {isGenerating ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</>
                    ) : (
                      <><Zap className="mr-2 h-4 w-4" /> Generate Smart Plan</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Review Phase — confirm AI-inferred campaign before creating a draft.
          Stays mounted during "creating" so the button spinner is visible. */}
      {viewMode === "create" && flowPhase !== "input" && campaignFields && (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold font-serif text-foreground">Review your campaign</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                We drafted these fields from your input. Edit anything before creating the draft campaign.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFlowPhase("input"); }}
              className="text-muted-foreground"
            >
              ← Back
            </Button>
          </div>

          {createError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {createError}
            </div>
          )}

          {/* You provided */}
          {provenance.userProvided.length > 0 && (
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-serif text-base">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  You provided
                </CardTitle>
                <CardDescription>Fields taken directly from your input.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {provenance.userProvided.map((path) => renderReviewField(path))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI suggested */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 font-serif text-base">
                <Wand2 className="h-4 w-4 text-secondary" />
                AI suggested — review these
              </CardTitle>
              <CardDescription>Best-guess values. Double-check and adjust as needed.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* AI-suggested fields + the four date fields (always shown, empty) */}
                {[
                  ...provenance.aiSuggested,
                  ...DATE_PATHS.filter((d) => !provenance.aiSuggested.includes(d)),
                ].map((path) => renderReviewField(path))}
              </div>
            </CardContent>
          </Card>

          {/* Agency-only client brand selector (required by the backend for AGENCY) */}
          {role === "agency" && (
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-serif text-base">
                  <Building2 className="h-4 w-4 text-primary" />
                  Client brand
                </CardTitle>
                <CardDescription>
                  Required — the campaign is created under this client brand.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <label className="block space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Client brand ID
                  </span>
                  <Input
                    value={agencyClientBrandId}
                    onChange={(e) => setAgencyClientBrandId(e.target.value)}
                    placeholder="Paste the client brand ID"
                  />
                </label>
              </CardContent>
            </Card>
          )}

          {/* Optional reference image — shown to the creator in the brief only. Not sent to AI. */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 font-serif text-base">
                <ImageIcon className="h-4 w-4 text-primary" />
                Reference image
                <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </CardTitle>
              <CardDescription>
                Shown to the creator inside the brief for visual reference. Not used by the AI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {briefImageUrl ? (
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={briefImageUrl ?? ""}
                    alt="Brief reference"
                    className="h-24 w-24 rounded-xl border border-border object-cover"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => { setBriefImageUrl(null); setBriefImageError(null); }}
                  >
                    <X className="mr-1 h-4 w-4" /> Remove
                  </Button>
                </div>
              ) : (
                <label className="flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
                  {briefImageUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="h-4 w-4" />
                  )}
                  {briefImageUploading ? "Uploading…" : "Upload an image"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    disabled={briefImageUploading}
                    onChange={(e) => handleBriefImagePick(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
              {briefImageError && (
                <p className="mt-2 text-xs font-medium text-destructive">{briefImageError}</p>
              )}
            </CardContent>
          </Card>

          {/* Generated brief — collapsible, unchanged content */}
          <details className="rounded-2xl border border-border bg-card shadow-sm">
            <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 text-sm font-semibold text-foreground">
              <BookOpen className="h-4 w-4 text-primary" />
              View generated brief (strategy, concept, creative brief)
            </summary>
            <div className="space-y-4 border-t border-border p-5">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Strategy</span>
                <p className="whitespace-pre-wrap text-sm text-foreground">{strategyText || "—"}</p>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Concept</span>
                <p className="whitespace-pre-wrap text-sm text-foreground">{conceptText || "—"}</p>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Creative Brief</span>
                <p className="whitespace-pre-wrap text-sm text-foreground">{briefText || "—"}</p>
              </div>
            </div>
          </details>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
            <Button
              variant="outline"
              onClick={handleJustSaveBrief}
              disabled={flowPhase === "creating"}
              className="rounded-xl"
            >
              <FileText className="mr-2 h-4 w-4" /> Just save the brief
            </Button>
            <Button
              onClick={handleCreateDraftCampaign}
              disabled={
                flowPhase === "creating" ||
                !campaignFields ||
                (role === "agency" && !agencyClientBrandId.trim())
              }
              className="rounded-xl shadow-sm"
            >
              {flowPhase === "creating" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</>
              ) : (
                <><Rocket className="mr-2 h-4 w-4" /> Create draft campaign</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Planner Workspace */}
      {flowPhase === "input" && (viewMode === "detail" || (viewMode === "create" && isPlannerVisible)) && (
        <div className="space-y-6">
          {/* Step Bar */}
          <Card className="border-none shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                {stepBar.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveStep(step.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                        activeStep === step.id
                          ? "bg-primary text-white shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <span className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                        activeStep === step.id ? "bg-white/20 text-white" : "bg-muted-foreground/20"
                      )}>
                        {index + 1}
                      </span>
                      {step.label}
                    </button>
                    {index < stepBar.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Campaign context banner */}
          {viewMode === "detail" && selectedCampaign && (
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm font-medium text-primary">
                Viewing campaign: <span className="font-bold">{selectedCampaign.name}</span>
              </p>
            </div>
          )}

          {/* Requirement Step */}
          {activeStep === "requirement" && (
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-serif">
                  <Target className="h-5 w-5 text-primary" />
                  Requirement
                </CardTitle>
                <CardDescription>Define what you need from this campaign.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {requirementFields.map((field) => (
                    <label
                      key={field.key}
                      className={cn("block space-y-1.5", field.fullWidth && "sm:col-span-2")}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {field.label}
                      </span>
                      <Input
                        value={requirements[field.key]}
                        onChange={(e) => updateRequirement(field.key, e.target.value)}
                        placeholder={requirementInputPlaceholder(field.key, field.label)}
                      />
                    </label>
                  ))}
                </div>
                {generateError && (
                  <p className="text-sm text-destructive">{generateError}</p>
                )}
                <div className="flex justify-between border-t border-border pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveStep("brief")}
                    className="rounded-xl"
                  >
                    View Current Brief <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    onClick={generateFromRequirements}
                    disabled={isGenerating}
                    className="rounded-xl shadow-sm"
                  >
                    {isGenerating ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</>
                    ) : (
                      <><Zap className="mr-2 h-4 w-4" /> Generate Brief</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Brief Step */}
          {activeStep === "brief" && (
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-serif">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Brief
                </CardTitle>
                <CardDescription>Strategy, concept, and creative brief in one place.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Campaign picker */}
                <div className="rounded-xl border border-border bg-muted/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Campaign</p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">
                        {selectedCampaign ? selectedCampaign.name : "No campaign selected"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsBriefCampaignPickerOpen((v) => !v)}
                      className="rounded-xl"
                    >
                      {isBriefCampaignPickerOpen ? "Cancel" : "Select Campaign"}
                    </Button>
                  </div>

                  {isBriefCampaignPickerOpen && (
                    <div className="mt-4 space-y-2 border-t border-border pt-4">
                      {campaignsLoading ? (
                        <p className="text-sm text-muted-foreground">Loading campaigns…</p>
                      ) : campaignsError ? (
                        <p className="text-sm text-destructive">{campaignsError}</p>
                      ) : myCampaigns.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No campaigns yet.{" "}
                          <Link href="/campaigns/create" className="text-primary hover:underline">
                            Create one first.
                          </Link>
                        </p>
                      ) : (
                        myCampaigns.map((campaign) => (
                          <button
                            key={campaign.id}
                            type="button"
                            onClick={() => {
                              resetBriefForCampaign(campaign);
                              setIsBriefCampaignPickerOpen(false);
                            }}
                            className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-left text-sm transition hover:border-primary/30 hover:bg-primary/5"
                          >
                            <span className="font-semibold text-foreground">{campaign.name}</span>
                            <Badge variant="secondary" className="rounded-full text-xs">
                              {campaign.status}
                            </Badge>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Brief reference image — tied to the selected campaign, shown to the
                    influencer in their brief view. Display-only; upload + replace. */}
                {selectedCampaign && (
                  <div className="rounded-xl border border-border bg-muted/50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Brief Image
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          Optional reference image shown to the creator in the brief. Not used by the AI.
                        </p>
                      </div>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/40",
                          campaignBriefImgUploading && "pointer-events-none opacity-60",
                        )}
                      >
                        {campaignBriefImgUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ImageIcon className="h-4 w-4" />
                        )}
                        {campaignBriefImgUploading
                          ? "Uploading…"
                          : selectedCampaign.briefImageUrl
                            ? "Change image"
                            : "Upload image"}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          className="hidden"
                          disabled={campaignBriefImgUploading}
                          onChange={(e) => handleCampaignBriefImageUpload(e.target.files?.[0] ?? null)}
                        />
                      </label>
                    </div>
                    {selectedCampaign.briefImageUrl && (
                      <div className="mt-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedCampaign.briefImageUrl ?? ""}
                          alt="Brief reference"
                          className="max-h-56 w-full rounded-lg border border-border object-contain"
                        />
                      </div>
                    )}
                    {campaignBriefImgError && (
                      <p className="mt-2 text-xs font-medium text-destructive">{campaignBriefImgError}</p>
                    )}
                  </div>
                )}

                {/* Brief subsection tabs */}
                <div className="flex rounded-xl bg-muted p-1 gap-1">
                  {(
                    [
                      { id: "strategy" as BriefSubSection, label: "Strategy", icon: <Target className="h-3.5 w-3.5" /> },
                      { id: "concept" as BriefSubSection, label: "Concept", icon: <Lightbulb className="h-3.5 w-3.5" /> },
                      { id: "briefBody" as BriefSubSection, label: "Creative Brief", icon: <PenLine className="h-3.5 w-3.5" /> },
                    ] as const
                  ).map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setActiveBriefSub(sub.id)}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
                        activeBriefSub === sub.id
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {sub.icon}
                      {sub.label}
                    </button>
                  ))}
                </div>

                {activeBriefSub === "strategy" && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Strategy</span>
                    <textarea
                      rows={8}
                      value={strategyText}
                      onChange={(e) => setStrategyText(e.target.value)}
                      className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/80 focus:ring-2 focus:ring-primary/10"
                      placeholder="Describe your campaign strategy..."
                    />
                  </div>
                )}

                {activeBriefSub === "concept" && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Concept</span>
                    <textarea
                      rows={8}
                      value={conceptText}
                      onChange={(e) => setConceptText(e.target.value)}
                      className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/80 focus:ring-2 focus:ring-primary/10"
                      placeholder="Describe your creative concept..."
                    />
                  </div>
                )}

                {activeBriefSub === "briefBody" && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Creative Brief</span>
                    <textarea
                      rows={8}
                      value={briefText}
                      onChange={(e) => setBriefText(e.target.value)}
                      className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/80 focus:ring-2 focus:ring-primary/10"
                      placeholder="Write the creative brief for creators..."
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                  {saveStatus === "saved" && (
                    <span className="flex items-center gap-1.5 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" /> Brief saved
                    </span>
                  )}
                  {saveStatus === "error" && (
                    <span className="text-sm text-destructive">Something went wrong — try again</span>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDeleteBrief}
                    disabled={isDeleting || isSaving}
                    className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    {isDeleting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting…</>
                    ) : (
                      <><Trash2 className="mr-2 h-4 w-4" /> Delete Brief</>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveBrief}
                    disabled={isSaving || isDeleting}
                    className="rounded-xl shadow-sm"
                  >
                    {isSaving ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                    ) : (
                      <><CheckCircle2 className="mr-2 h-4 w-4" /> Save Brief</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Prompt — sticky bottom */}
          <form
            onSubmit={applyPrompt}
            className={cn(
              "rounded-2xl border border-border bg-card shadow-sm",
              hasStarted && "sticky bottom-4 shadow-xl"
            )}
          >
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <label
                  htmlFor="smart-plan-input-planner"
                  className="flex items-center gap-2 text-sm font-semibold text-foreground"
                >
                  <Sparkles className="h-4 w-4 text-secondary" />
                  AI Prompt
                </label>
                <p className="text-xs text-muted-foreground">{promptHint}</p>
              </div>
              <textarea
                id="smart-plan-input-planner"
                rows={hasStarted ? 3 : 5}
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                disabled={isGenerating}
                placeholder={promptHint}
                className="w-full resize-none rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/80 focus:bg-background focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
              />
              {generateError && (
                <p className="mt-2 text-sm text-destructive">{generateError}</p>
              )}
              <div className="mt-3 flex justify-end">
                <Button type="submit" disabled={isGenerating || !promptInput.trim()} className="rounded-xl shadow-sm">
                  {isGenerating ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</>
                  ) : (
                    <><Zap className="mr-2 h-4 w-4" /> Run AI Prompt</>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
