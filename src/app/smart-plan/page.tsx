"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/useUserStore";
import { apiGenerateSmartPlan } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

type BriefSubSection = "strategy" | "concept" | "briefBody";
type StartMode = "none" | "prompt" | "form";

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

const myCampaignSeed: Campaign[] = [
  {
    id: "cmp-1",
    name: "Glow Summer Launch",
    status: "Active",
    budget: "$12,000",
    timeRange: "Jun 1 – Jul 15",
    result: "78% KPI hit",
    requirement: {
      campaignName: "Glow Summer Launch",
      objective: "Drive awareness and first purchase for summer skincare line",
      contentAngle: "Before/after glow routine with creator storytelling",
      productInfo: "Vitamin C serum and SPF bundle",
      productLinkOrWebsite: "https://glow.example.com/summer",
      ctaMessage: "Shop the summer glow set now",
      targetAudience: "Women 20-35 in urban areas",
      brandTone: "Confident, fresh, and uplifting",
      budget: "$12,000",
      timeline: "Jun 1 – Jul 15",
      kpi: "Reach 2M, CTR 2.5%, 1,000 purchases",
      doDont: "Do: show routine steps. Don't: overclaim product effect.",
    },
  },
  {
    id: "cmp-2",
    name: "Fit Habit Challenge",
    status: "Draft",
    budget: "$8,500",
    timeRange: "May 10 – Jun 20",
    result: "Pending",
    requirement: {
      campaignName: "Fit Habit Challenge",
      objective: "Get signups for 30-day fitness challenge",
      contentAngle: "Daily progress check-ins and accountability",
      productInfo: "Challenge app + coaching plan",
      productLinkOrWebsite: "https://fit.example.com/challenge",
      ctaMessage: "Join the challenge today",
      targetAudience: "Young professionals 22-40",
      brandTone: "Motivational and supportive",
      budget: "$8,500",
      timeline: "May 10 – Jun 20",
      kpi: "1,500 signups and 8% conversion",
      doDont: "Do: realistic goals. Don't: shame-based messaging.",
    },
  },
];

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

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

    // @Requirement or freeform → call AI
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const brief = await apiGenerateSmartPlan(token!, { rawPrompt: trimmed });
      applyGeneratedBrief(brief);
    } catch (err: any) {
      setGenerateError(err.message || "Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
    return true;
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

  const updateFormDraft = (field: keyof RequirementData, value: string) => {
    setFormDraft((prev) => ({ ...prev, [field]: value }));
  };

  const finishFormFlow = async () => {
    setRequirements(formDraft);
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const brief = await apiGenerateSmartPlan(token!, formDraft);
      applyGeneratedBrief(brief);
    } catch (err: any) {
      setGenerateError(err.message || "Generation failed. Please try again.");
      setHasStarted(true);
      setIsPlannerVisible(true);
      setActiveStep("requirement");
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#c2410c] to-[#7c2d12] p-8 text-white shadow-lg">
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
          <div className="grid gap-4 sm:grid-cols-2">
            {myCampaignSeed.map((campaign) => (
              <Card key={campaign.id} className="border-none shadow-sm transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="font-bold font-serif text-foreground">{campaign.name}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">{campaign.timeRange}</p>
                    </div>
                    <Badge
                      variant={campaign.status === "Active" ? "default" : "secondary"}
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
        </div>
      )}

      {/* Create View — Start Mode Selection */}
      {viewMode === "create" && !isPlannerVisible && (
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
                  {requirementFields.map((field) => (
                    <label
                      key={field.key}
                      className={cn("block space-y-1.5", field.fullWidth && "sm:col-span-2")}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {field.label}
                      </span>
                      <Input
                        value={formDraft[field.key]}
                        onChange={(e) => updateFormDraft(field.key, e.target.value)}
                        placeholder={requirementInputPlaceholder(field.key, field.label)}
                        disabled={isGenerating}
                      />
                    </label>
                  ))}
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

      {/* Planner Workspace */}
      {(viewMode === "detail" || (viewMode === "create" && isPlannerVisible)) && (
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
                <div className="flex justify-between border-t border-border pt-4">
                  <div />
                  <Button
                    type="button"
                    onClick={() => setActiveStep("brief")}
                    className="rounded-xl shadow-sm"
                  >
                    Next: Brief <ChevronRight className="ml-2 h-4 w-4" />
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
                      {myCampaignSeed.map((campaign) => (
                        <button
                          key={campaign.id}
                          type="button"
                          onClick={() => {
                            applyCampaignRequirementToBrief(campaign);
                            setIsBriefCampaignPickerOpen(false);
                          }}
                          className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-left text-sm transition hover:border-primary/30 hover:bg-primary/5"
                        >
                          <span className="font-semibold text-foreground">{campaign.name}</span>
                          <Badge variant="secondary" className="rounded-full text-xs">
                            {campaign.status}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

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

                <div className="flex justify-end border-t border-border pt-4">
                  <Button type="button" className="rounded-xl shadow-sm">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Save Brief
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
