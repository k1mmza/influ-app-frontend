"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/useUserStore";

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

const stepBar: { id: StepId; label: string }[] = [
  { id: "requirement", label: "Requirement" },
  { id: "brief", label: "Brief" },
];

const requirementFields: { key: keyof RequirementData; label: string }[] = [
  { key: "campaignName", label: "Campaign Name" },
  { key: "objective", label: "Objective" },
  { key: "contentAngle", label: "Content Angle" },
  { key: "productInfo", label: "Product Info" },
  { key: "productLinkOrWebsite", label: "Product link or official website" },
  { key: "ctaMessage", label: "CTA message" },
  { key: "targetAudience", label: "Target Audience" },
  { key: "brandTone", label: "Brand Identity/Tone" },
  { key: "budget", label: "Budget" },
  { key: "timeline", label: "Timeline" },
  { key: "kpi", label: "KPI" },
  { key: "doDont", label: "Do & Dont" },
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
    timeRange: "Jun 1 - Jul 15",
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
      timeline: "Jun 1 - Jul 15",
      kpi: "Reach 2M, CTR 2.5%, 1,000 purchases",
      doDont: "Do: show routine steps. Dont: overclaim product effect.",
    },
  },
  {
    id: "cmp-2",
    name: "Fit Habit Challenge",
    status: "Draft",
    budget: "$8,500",
    timeRange: "May 10 - Jun 20",
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
      timeline: "May 10 - Jun 20",
      kpi: "1,500 signups and 8% conversion",
      doDont: "Do: realistic goals. Dont: shame-based messaging.",
    },
  },
];

function toBriefTemplate(data: RequirementData) {
  const campaignTitle = data.campaignName || "Selected Campaign";
  return {
    strategy: [
      `Campaign: ${campaignTitle}`,
      `Objective: ${data.objective || "-"}`,
      `Target Audience: ${data.targetAudience || "-"}`,
      `Budget: ${data.budget || "-"}`,
      `Timeline: ${data.timeline || "-"}`,
      `KPI: ${data.kpi || "-"}`,
    ].join("\n"),
    concept: [
      `Main Concept: ${data.contentAngle || "-"}`,
      `Product Focus: ${data.productInfo || "-"}`,
      `Brand Tone: ${data.brandTone || "-"}`,
    ].join("\n"),
    briefBody: [
      `Creative Brief - ${campaignTitle}`,
      `Product Link: ${data.productLinkOrWebsite || "-"}`,
      `CTA: ${data.ctaMessage || "-"}`,
      `Do & Dont: ${data.doDont || "-"}`,
    ].join("\n"),
  };
}

function parseRequirementText(text: string): Partial<RequirementData> {
  const clean = text.toLowerCase();
  const extract = (keyword: string) => {
    const index = clean.indexOf(keyword);
    if (index < 0) return "";
    const source = text.slice(index + keyword.length).trim();
    const line = source.split("\n")[0];
    return line.replace(/^[:\-]\s*/, "").trim();
  };

  return {
    campaignName: extract("campaign name"),
    objective: extract("objective"),
    contentAngle: extract("content angle"),
    productInfo: extract("product info"),
    productLinkOrWebsite: extract("product link") || extract("official website") || extract("website"),
    ctaMessage: extract("cta message") || extract("cta"),
    targetAudience: extract("target audience"),
    brandTone: extract("brand"),
    budget: extract("budget"),
    timeline: extract("timeline"),
    kpi: extract("kpi"),
    doDont: extract("do & dont"),
  };
}

export default function SmartPlanPage() {
  const { role } = useUserStore();
  const [promptInput, setPromptInput] = useState("");
  const [activeStep, setActiveStep] = useState<StepId>("requirement");
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlannerVisible, setIsPlannerVisible] = useState(false);
  const [startMode, setStartMode] = useState<StartMode>("none");
  const [viewMode, setViewMode] = useState<"create" | "list" | "detail">("create");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isBriefCampaignPickerOpen, setIsBriefCampaignPickerOpen] = useState(false);
  const [requirements, setRequirements] = useState<RequirementData>({
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
  });
  const [strategyText, setStrategyText] = useState("");
  const [conceptText, setConceptText] = useState("");
  const [briefText, setBriefText] = useState("");
  const [formDraft, setFormDraft] = useState<RequirementData>({
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
  });

  const promptHint = useMemo(() => {
    return hasStarted
      ? "Use @Requirement, @Strategy, @Concept, or @Brief before details (brief step covers strategy, concept, and creative brief)."
      : "Start with @Requirement and describe campaign details for AI planning.";
  }, [hasStarted]);

  const applyPromptText = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return false;

    const tagMatch = trimmed.match(/^@([a-zA-Z]+)\s*/);
    const section = tagMatch?.[1]?.toLowerCase();
    const resolved = section ? sectionAlias[section] : undefined;
    const payload = tagMatch ? trimmed.replace(/^@[a-zA-Z]+\s*/, "") : trimmed;

    setHasStarted(true);
    setIsPlannerVisible(true);

    const briefSubs: BriefSubSection[] = ["strategy", "concept", "briefBody"];
    if (resolved === "requirement") {
      setActiveStep("requirement");
    } else if (resolved === "brief" || (resolved && briefSubs.includes(resolved as BriefSubSection))) {
      setActiveStep("brief");
    }

    if (!resolved || resolved === "requirement") {
      const parsed = parseRequirementText(payload);
      setRequirements((prev) => ({
        campaignName: parsed.campaignName || prev.campaignName,
        objective: parsed.objective || prev.objective,
        contentAngle: parsed.contentAngle || prev.contentAngle,
        productInfo: parsed.productInfo || prev.productInfo,
        productLinkOrWebsite: parsed.productLinkOrWebsite || prev.productLinkOrWebsite,
        ctaMessage: parsed.ctaMessage || prev.ctaMessage,
        targetAudience: parsed.targetAudience || prev.targetAudience,
        brandTone: parsed.brandTone || prev.brandTone,
        budget: parsed.budget || prev.budget,
        timeline: parsed.timeline || prev.timeline,
        kpi: parsed.kpi || prev.kpi,
        doDont: parsed.doDont || prev.doDont,
      }));
      if (!strategyText) setStrategyText("AI Suggestion: Build phased creator funnel and run awareness to conversion sequence.");
      if (!conceptText) setConceptText("AI Suggestion: Hero concept around authentic lifestyle transformation with before/after storytelling.");
      if (!briefText) setBriefText("AI Suggestion: Provide creator brief with content format, CTA, brand guardrails, and timeline.");
    } else if (resolved === "strategy") {
      setStrategyText(payload);
    } else if (resolved === "concept") {
      setConceptText(payload);
    } else if (resolved === "briefBody" || resolved === "brief") {
      setBriefText(payload);
    }

    return true;
  };

  const applyPrompt = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (applyPromptText(promptInput)) {
      setPromptInput("");
    }
  };

  const updateRequirement = (field: keyof RequirementData, value: string) => {
    setRequirements((prev) => ({ ...prev, [field]: value }));
  };

  const applyCampaignRequirementToBrief = (campaign: Campaign | null) => {
    if (!campaign) return;
    setSelectedCampaign(campaign);
    setRequirements(campaign.requirement);
    const template = toBriefTemplate(campaign.requirement);
    setStrategyText(template.strategy);
    setConceptText(template.concept);
    setBriefText(template.briefBody);
  };

  const updateFormDraft = (field: keyof RequirementData, value: string) => {
    setFormDraft((prev) => ({ ...prev, [field]: value }));
  };

  const finishFormFlow = () => {
    setRequirements(formDraft);
    const template = toBriefTemplate(formDraft);
    setStrategyText(template.strategy);
    setConceptText(template.concept);
    setBriefText(template.briefBody);
    setHasStarted(true);
    setIsPlannerVisible(true);
    setActiveStep("requirement");
  };

  if (role !== "brand" && role !== "agency") {
    return (
      <section className="p-6">
        <h1 className="text-2xl font-bold text-slate-900">Smart Plan</h1>
        <p className="mt-2 text-sm text-slate-600">
          This feature is available for agency and brand workspaces. Switch role to continue.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Smart Plan</h1>
          <p className="mt-1 text-sm text-slate-600">Plan your campaign from requirements through the creative brief.</p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Back
        </Link>
      </header>

      {viewMode === "list" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">My Campaign</h2>
            <button
              type="button"
              onClick={() => setViewMode("create")}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90"
            >
              Create New Campaign
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-2">Campaign Name</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Budget</th>
                  <th className="pb-2">Time Range</th>
                  <th className="pb-2">Result</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="text-slate-800">
                {myCampaignSeed.map((campaign) => (
                  <tr key={campaign.id} className="border-t border-slate-100">
                    <td className="py-2">{campaign.name}</td>
                    <td className="py-2">{campaign.status}</td>
                    <td className="py-2">{campaign.budget}</td>
                    <td className="py-2">{campaign.timeRange}</td>
                    <td className="py-2">{campaign.result}</td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => {
                          applyCampaignRequirementToBrief(campaign);
                          setViewMode("detail");
                        }}
                        className="rounded-lg border border-primary/30 px-3 py-1 text-xs font-semibold text-primary/90 hover:bg-primary/5"
                      >
                        See Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === "create" && !isPlannerVisible && (
        <div className="mx-auto w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Start from</span>
            <button
              type="button"
              onClick={() => setStartMode("form")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                startMode === "form" ? "bg-primary text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              Form
            </button>
            <span className="text-sm text-slate-700">or</span>
            <button
              type="button"
              onClick={() => setStartMode("prompt")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                startMode === "prompt" ? "bg-primary text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              Prompt command
            </button>
          </div>

          {startMode === "none" && (
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              Choose how to start Smart Plan: fill the requirement form or use a prompt command.
            </p>
          )}

          {startMode === "prompt" && (
            <>
              <label htmlFor="smart-plan-input" className="mb-2 block text-sm font-medium text-slate-700">
                AI Prompt Command
              </label>
              <textarea
                id="smart-plan-input"
                rows={9}
                value={promptInput}
                onChange={(event) => setPromptInput(event.target.value)}
                placeholder={promptHint}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-primary/80 focus:ring-2 focus:ring-primary/10"
              />
              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  My Campaign
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (applyPromptText(promptInput)) {
                      setPromptInput("");
                      return;
                    }
                    setIsPlannerVisible(true);
                  }}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                >
                  Create Campaign
                </button>
              </div>
            </>
          )}

          {startMode === "form" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Requirement</h2>
                <p className="mt-1 text-xs text-slate-500">Same fields as the planner requirement step. Fill what you know; you can edit later.</p>
              </div>
              <div className="space-y-3">
                {requirementFields.map((field) => (
                  <label key={field.key} className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">{field.label}</span>
                    <input
                      value={formDraft[field.key]}
                      onChange={(event) => updateFormDraft(field.key, event.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-primary/80 focus:ring-2 focus:ring-primary/10"
                      placeholder={requirementInputPlaceholder(field.key, field.label)}
                    />
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  My Campaign
                </button>
                <button
                  type="button"
                  onClick={finishFormFlow}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                >
                  Generate Smart Plan
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {(viewMode === "detail" || (viewMode === "create" && isPlannerVisible)) && (
        <>
          <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            {stepBar.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  activeStep === step.id ? "bg-primary text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {index + 1}. {step.label}
              </button>
            ))}
          </div>

          {viewMode === "detail" && selectedCampaign && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-primary/90">
              Viewing campaign: <span className="font-semibold">{selectedCampaign.name}</span>
            </div>
          )}

          {activeStep === "requirement" && (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Requirement</h2>
              {requirementFields.map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">{field.label}</span>
                  <input
                    value={requirements[field.key]}
                    onChange={(event) => updateRequirement(field.key, event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-primary/80 focus:ring-2 focus:ring-primary/10"
                    placeholder={requirementInputPlaceholder(field.key, field.label)}
                  />
                </label>
              ))}
              <button type="button" className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90">
                Save Requirement
              </button>
            </div>
          )}

          {activeStep === "brief" && (
            <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Brief</h2>
              <p className="text-xs text-slate-500">Strategy, concept, and creative brief live in one place for creators and stakeholders.</p>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-600">
                  {selectedCampaign ? (
                    <>
                      Selected campaign: <span className="font-semibold text-slate-800">{selectedCampaign.name}</span>
                    </>
                  ) : (
                    "No campaign selected"
                  )}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBriefCampaignPickerOpen(true)}
                    className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90"
                  >
                    Select campaign
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBriefCampaignPickerOpen(false)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {isBriefCampaignPickerOpen && (
                <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-medium text-slate-600">Choose campaign</p>
                  {myCampaignSeed.map((campaign) => (
                    <button
                      key={campaign.id}
                      type="button"
                      onClick={() => {
                        applyCampaignRequirementToBrief(campaign);
                        setIsBriefCampaignPickerOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 transition hover:border-primary/30 hover:bg-primary/5"
                    >
                      <span>{campaign.name}</span>
                      <span className="text-xs text-slate-500">{campaign.status}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <span className="block text-xs font-medium text-slate-600">Strategy</span>
                <textarea
                  rows={5}
                  value={strategyText}
                  onChange={(event) => setStrategyText(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-primary/80 focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div className="space-y-2">
                <span className="block text-xs font-medium text-slate-600">Concept</span>
                <textarea
                  rows={5}
                  value={conceptText}
                  onChange={(event) => setConceptText(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-primary/80 focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div className="space-y-2">
                <span className="block text-xs font-medium text-slate-600">Creative brief</span>
                <textarea
                  rows={5}
                  value={briefText}
                  onChange={(event) => setBriefText(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-primary/80 focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <button type="button" className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90">
                Save brief
              </button>
            </div>
          )}

          <form onSubmit={applyPrompt} className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${hasStarted ? "sticky bottom-4" : ""}`}>
            <label htmlFor="smart-plan-input-planner" className="mb-2 block text-sm font-medium text-slate-700">
              AI Prompt Command
            </label>
            <textarea
              id="smart-plan-input-planner"
              rows={hasStarted ? 4 : 9}
              value={promptInput}
              onChange={(event) => setPromptInput(event.target.value)}
              placeholder={promptHint}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-primary/80 focus:ring-2 focus:ring-primary/10"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">{promptHint}</p>
              <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90">
                Run AI Prompt
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  );
}
