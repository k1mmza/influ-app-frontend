"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

export type WorkPhase = "contact" | "brief" | "draft" | "work" | "payment";

const PHASE_ORDER: WorkPhase[] = ["contact", "brief", "draft", "work", "payment"];

export function isPhaseDone(phase: WorkPhase, currentPhase: WorkPhase): boolean {
  return PHASE_ORDER.indexOf(phase) < PHASE_ORDER.indexOf(currentPhase);
}

const phaseDotClass: Record<WorkPhase, string> = {
  contact: "bg-secondary",
  brief: "bg-sky-600",
  draft: "bg-amber-500",
  work: "bg-primary",
  payment: "bg-emerald-600",
};

export function workPhaseLabel(phase: WorkPhase): string {
  const labels: Record<WorkPhase, string> = {
    contact: "Agreement/Contract",
    brief: "Brief",
    draft: "Draft",
    work: "Published content",
    payment: "Payment",
  };
  return labels[phase];
}

export function WorkStatusIndicator({ phase, className = "" }: { phase: WorkPhase; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} title={workPhaseLabel(phase)}>
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${phaseDotClass[phase]}`} aria-hidden />
      <span className="text-[11px] font-medium text-muted-foreground">{workPhaseLabel(phase)}</span>
    </span>
  );
}

/** Compact dot for conversation list cards (matches message preview card pattern). */
export function WorkStatusDot({ phase }: { phase: WorkPhase }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${phaseDotClass[phase]}`}
      title={workPhaseLabel(phase)}
      aria-label={`Work status: ${workPhaseLabel(phase)}`}
    />
  );
}

type DraftRow = { id: string; name: string; version: string; status: string; updated: string; notes: string };
type BriefCampaign = {
  id: string;
  name: string;
  objective: string;
  targetAudience: string;
  contentAngle: string;
  productInfo: string;
  productLink: string;
  ctaMessage: string;
  brandTone: string;
  budget: string;
  timeline: string;
  kpi: string;
  keyMessages: string;
  doDont: string;
};

type ProcessVariant = "influencer" | "brand";

function downloadBlob(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Modal({
  open,
  title,
  onClose,
  children,
  zClass = "z-50",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  zClass?: string;
}) {
  if (!open) return null;
  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 ${zClass}`}>
      <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Close dialog" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
          <h3 className="text-lg font-semibold text-foreground font-serif">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            ✕
          </button>
        </div>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
}

const initialDrafts: DraftRow[] = [
  { id: "1", name: "TikTok hook v1", version: "v1", status: "In review", updated: "4 May 2026", notes: "15s hook, product at 0:03." },
  { id: "2", name: "TikTok full cut", version: "v0.9", status: "Draft", updated: "3 May 2026", notes: "Awaiting CTA line from brand." },
];

const briefCampaignSeed: BriefCampaign[] = [
  {
    id: "summer-skincare",
    name: "Summer Skincare",
    objective: "Awareness + trial sign-ups.",
    targetAudience: "Women 20-35 interested in skincare and wellness.",
    contentAngle: "Daily skin routine with before/after storytelling.",
    productInfo: "Gentle cleanser, vitamin serum, and SPF50 day cream.",
    productLink: "https://example.com/summer-skincare",
    ctaMessage: "Try the Summer Skincare set now.",
    brandTone: "Confident, educational, and friendly.",
    budget: "THB 120,000",
    timeline: "1 Jun - 31 Jul 2026",
    kpi: "2M reach, 3% CTR, 1,200 trial sign-ups.",
    keyMessages: "Gentle routine, SPF daily, dermatologist-tested.",
    doDont: "No medical claims; show product label clearly.",
  },
  {
    id: "fit-habit",
    name: "Fit Habit Challenge",
    objective: "Drive challenge registration and app downloads.",
    targetAudience: "Office workers 22-40 who want sustainable fitness habits.",
    contentAngle: "30-day challenge journey with realistic progress updates.",
    productInfo: "Fitness app subscription + guided challenge plan.",
    productLink: "https://example.com/fit-habit",
    ctaMessage: "Join the 30-day Fit Habit challenge.",
    brandTone: "Motivational, supportive, and practical.",
    budget: "THB 85,000",
    timeline: "10 May - 20 Jun 2026",
    kpi: "1,500 registrations, 900 app installs.",
    keyMessages: "30-day routine, achievable progress, coach-backed tips.",
    doDont: "No body-shaming; avoid unrealistic transformation claims.",
  },
];

export function ProcessOfWorkPanel({
  variant,
  currentPhase,
  brandPhaseReady = false,
  influencerPhaseReady = false,
  onFinishPhase,
  onFileUpload,
  attachments,
  linkedCampaign,
}: {
  variant: ProcessVariant;
  currentPhase?: WorkPhase;
  brandPhaseReady?: boolean;
  influencerPhaseReady?: boolean;
  onFinishPhase?: () => void;
  onFileUpload?: (type: "contract" | "brief" | "payment", file: File) => void;
  attachments?: { contractUrl: string | null; briefFileUrl: string | null; paymentProofUrl: string | null };
  linkedCampaign?: { id: string; name: string } | null;
}) {
  const [active, setActive] = useState<WorkPhase | null>(null);
  const [drafts, setDrafts] = useState<DraftRow[]>(initialDrafts);
  const [selectedDraft, setSelectedDraft] = useState<DraftRow | null>(null);
  const [newDraftName, setNewDraftName] = useState("");
  const [workLink, setWorkLink] = useState("https://tiktok.com/@demo/video/000");
  const [brandComments, setBrandComments] = useState<Record<string, string[]>>({ "1": ["Strong open—tighten CTA at end."] });
  const [commentInput, setCommentInput] = useState("");
  const [selectedBriefCampaignId, setSelectedBriefCampaignId] = useState<string>(
    linkedCampaign?.id ?? briefCampaignSeed[0].id
  );

  const close = useCallback(() => setActive(null), []);

  const addDraft = () => {
    const name = newDraftName.trim() || `Draft ${drafts.length + 1}`;
    setDrafts((d) => [
      ...d,
      {
        id: String(Date.now()),
        name,
        version: "v1",
        status: "Draft",
        updated: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        notes: "New draft — add description.",
      },
    ]);
    setNewDraftName("");
  };

  const appendComment = (draftId: string) => {
    const t = commentInput.trim();
    if (!t) return;
    setBrandComments((c) => ({ ...c, [draftId]: [...(c[draftId] ?? []), t] }));
    setCommentInput("");
  };

  const steps = useMemo(
    () =>
      [
        { id: "contact" as const, label: "Agreement", hint: variant === "influencer" ? "Sign & download" : "Send & upload" },
        { id: "brief" as const, label: "Brief", hint: variant === "influencer" ? "View & download" : "Upload & download" },
        { id: "draft" as const, label: "Draft", hint: "Manage versions" },
        { id: "work" as const, label: "Published content", hint: variant === "influencer" ? "Submit live link" : "View influencer link" },
        { id: "payment" as const, label: "Payment", hint: "Details & evidence" },
      ],
    [variant]
  );

  const allBriefCampaigns = useMemo(() => {
    if (!linkedCampaign) return briefCampaignSeed;
    const alreadyIncluded = briefCampaignSeed.some((c) => c.id === linkedCampaign.id);
    if (alreadyIncluded) return briefCampaignSeed;
    const realCampaign: BriefCampaign = {
      id: linkedCampaign.id,
      name: linkedCampaign.name,
      objective: "-",
      targetAudience: "-",
      contentAngle: "-",
      productInfo: "-",
      productLink: "",
      ctaMessage: "-",
      brandTone: "-",
      budget: "-",
      timeline: "-",
      kpi: "-",
      keyMessages: "-",
      doDont: "-",
    };
    return [realCampaign, ...briefCampaignSeed];
  }, [linkedCampaign]);

  const selectedBriefCampaign = useMemo(
    () => allBriefCampaigns.find((campaign) => campaign.id === selectedBriefCampaignId) ?? null,
    [allBriefCampaigns, selectedBriefCampaignId]
  );

  return (
    <div>
      <ul className="flex flex-wrap gap-2">
        {steps.map((s) => {
          const done = currentPhase ? isPhaseDone(s.id, currentPhase) : false;
          const isActive = s.id === currentPhase;
          return (
            <li key={s.id} className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setActive(s.id)}
                className={`flex w-full flex-col gap-0.5 rounded-xl border px-3 py-2 text-left text-sm transition ${
                  done
                    ? "border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:bg-emerald-100"
                    : isActive
                    ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
                    : "border-border bg-muted/80 hover:border-primary/20 hover:bg-card"
                }`}
              >
                <span className={`truncate text-xs font-semibold leading-tight sm:text-sm ${done ? "text-emerald-900" : isActive ? "text-primary" : "text-foreground"}`}>{s.label}</span>
                <span className={`truncate text-[10px] leading-tight ${done ? "text-emerald-700" : isActive ? "text-primary/70" : "text-muted-foreground"}`}>{done ? "✓ Done" : isActive ? "Active" : s.hint}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Phase confirmation — both parties must confirm to advance */}
      {currentPhase && currentPhase !== "payment" && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/60 px-4 py-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className={`flex items-center gap-1 font-medium ${brandPhaseReady ? "text-emerald-600" : "text-muted-foreground"}`}>
              <span className={`h-2 w-2 rounded-full ${brandPhaseReady ? "bg-emerald-500" : "bg-border"}`} />
              Brand
            </span>
            <span className={`flex items-center gap-1 font-medium ${influencerPhaseReady ? "text-emerald-600" : "text-muted-foreground"}`}>
              <span className={`h-2 w-2 rounded-full ${influencerPhaseReady ? "bg-emerald-500" : "bg-border"}`} />
              Influencer
            </span>
            <span className="text-muted-foreground">
              {brandPhaseReady && influencerPhaseReady
                ? "✓ Advancing…"
                : "Both must confirm to advance"}
            </span>
          </div>
          {(() => {
            const myReady = variant === "brand" ? brandPhaseReady : influencerPhaseReady;
            return myReady ? (
              <span className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                You confirmed ✓
              </span>
            ) : (
              <button
                type="button"
                onClick={onFinishPhase}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary/90"
              >
                Finish {workPhaseLabel(currentPhase)} →
              </button>
            );
          })()}
        </div>
      )}

      <Modal open={active === "contact"} title="Agreement/Contract" onClose={close}>
        <p className="text-sm text-muted-foreground">
          {variant === "influencer"
            ? "Upload a photo or scan of your signed agreement. You can download the template below."
            : "Upload the contract to share with the creator. They can download a copy for their records."}
        </p>
        {attachments?.contractUrl ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span className="text-xs font-semibold text-emerald-700">Uploaded</span>
            <a href={attachments.contractUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:underline truncate">
              View contract
            </a>
          </div>
        ) : null}
        <label className="mt-4 block text-xs font-semibold text-foreground">
          {attachments?.contractUrl ? "Replace file" : "Upload image / PDF"}
        </label>
        <input
          type="file"
          accept="image/*,.pdf"
          className="mt-1 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/5 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary/90"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && onFileUpload) onFileUpload("contract", file);
          }}
        />
        <div className="mt-4">
          <button
            type="button"
            className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"
            onClick={() => downloadBlob("contact-agreement-template.txt", "Agreement template (demo)\n— replace with your PDF in production.")}
          >
            Download template
          </button>
        </div>
      </Modal>

      <Modal open={active === "brief"} title="Brief" onClose={close}>
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/10 bg-gradient-to-r from-primary/5 to-sky-50 p-4">
            <label htmlFor="brief-campaign-select" className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Select campaign
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select
                id="brief-campaign-select"
                value={selectedBriefCampaignId}
                onChange={(event) => setSelectedBriefCampaignId(event.target.value)}
                className="min-w-[220px] flex-1 rounded-lg border border-primary/20 bg-card px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/80 focus:ring-2 focus:ring-primary/10"
              >
                <option value="">No campaign selected</option>
                {allBriefCampaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSelectedBriefCampaignId("")}
                className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
              >
                Cancel campaign
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Brief overview</p>
                <h4 className="text-base font-semibold text-foreground">{selectedBriefCampaign?.name ?? "No campaign selected"}</h4>
              </div>
              {selectedBriefCampaign ? (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary/90">Requirement-linked</span>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Objective:</span> {selectedBriefCampaign?.objective ?? "-"}
              </p>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Target audience:</span> {selectedBriefCampaign?.targetAudience ?? "-"}
              </p>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Content angle:</span> {selectedBriefCampaign?.contentAngle ?? "-"}
              </p>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Brand tone:</span> {selectedBriefCampaign?.brandTone ?? "-"}
              </p>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Budget:</span> {selectedBriefCampaign?.budget ?? "-"}
              </p>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Timeline:</span> {selectedBriefCampaign?.timeline ?? "-"}
              </p>
              <p className="text-muted-foreground sm:col-span-2">
                <span className="font-semibold text-foreground">KPI:</span> {selectedBriefCampaign?.kpi ?? "-"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Requirement details</p>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Product info:</span> {selectedBriefCampaign?.productInfo ?? "-"}
              </p>
              <p>
                <span className="font-semibold text-foreground">Product link:</span>{" "}
                {selectedBriefCampaign?.productLink ? (
                  <a
                    href={selectedBriefCampaign.productLink}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {selectedBriefCampaign.productLink}
                  </a>
                ) : (
                  "-"
                )}
              </p>
              <p>
                <span className="font-semibold text-foreground">CTA:</span> {selectedBriefCampaign?.ctaMessage ?? "-"}
              </p>
              <p>
                <span className="font-semibold text-foreground">Key messages:</span> {selectedBriefCampaign?.keyMessages ?? "-"}
              </p>
              <p>
                <span className="font-semibold text-foreground">Do / Don&apos;t:</span> {selectedBriefCampaign?.doDont ?? "-"}
              </p>
            </div>
          </div>
        </div>
        {variant === "brand" ? (
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {attachments?.briefFileUrl ? "Replace brief file" : "Upload brief (PDF / doc)"}
            </label>
            {attachments?.briefFileUrl ? (
              <a href={attachments.briefFileUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-primary hover:underline">
                View uploaded brief
              </a>
            ) : null}
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="mt-2 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/5 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary/90"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onFileUpload) onFileUpload("brief", file);
              }}
            />
          </div>
        ) : (
          attachments?.briefFileUrl ? (
            <div className="mt-4 rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Brief file</p>
              <a href={attachments.briefFileUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-primary hover:underline">
                Download brief
              </a>
            </div>
          ) : null
        )}
        <button
          type="button"
          className="mt-4 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
          onClick={() => downloadBlob("campaign-brief.txt", "Full brief export (demo).")}
        >
          Download brief
        </button>
      </Modal>

      <Modal open={active === "draft"} title="Draft management" onClose={close}>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[320px] text-left text-xs">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-2 py-2 font-semibold">Name</th>
                <th className="px-2 py-2 font-semibold">Ver.</th>
                <th className="px-2 py-2 font-semibold">Status</th>
                <th className="px-2 py-2 font-semibold">Updated</th>
                <th className="px-2 py-2 font-semibold"> </th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-2 py-2 text-foreground">{row.name}</td>
                  <td className="px-2 py-2 text-muted-foreground">{row.version}</td>
                  <td className="px-2 py-2 text-muted-foreground">{row.status}</td>
                  <td className="px-2 py-2 text-muted-foreground">{row.updated}</td>
                  <td className="px-2 py-2">
                    <button type="button" className="text-primary hover:underline" onClick={() => setSelectedDraft(row)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {variant === "influencer" ? (
          <div className="mt-3 flex gap-2">
            <input
              value={newDraftName}
              onChange={(e) => setNewDraftName(e.target.value)}
              placeholder="New draft name"
              className="min-w-0 flex-1 rounded-lg border border-border px-2 py-1.5 text-xs"
            />
            <button type="button" onClick={addDraft} className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white">
              Add draft
            </button>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!selectedDraft}
        title={selectedDraft ? selectedDraft.name : ""}
        onClose={() => setSelectedDraft(null)}
        zClass="z-[60]"
      >
        {selectedDraft ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">Version:</span> {selectedDraft.version}
            </p>
            <p>
              <span className="font-semibold text-foreground">Status:</span> {selectedDraft.status}
            </p>
            <p>
              <span className="font-semibold text-foreground">Notes:</span> {selectedDraft.notes}
            </p>
            {variant === "brand" ? (
              <div className="rounded-lg border border-border bg-muted p-3">
                <p className="text-xs font-semibold text-foreground">Comments</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">
                  {(brandComments[selectedDraft.id] ?? []).map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
                <div className="mt-3 flex gap-2">
                  <input
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Add comment…"
                    className="min-w-0 flex-1 rounded-lg border border-border px-2 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => appendComment(selectedDraft.id)}
                    className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal open={active === "work"} title="Published content" onClose={close}>
        {variant === "influencer" ? (
          <>
            <p className="text-sm text-muted-foreground">Paste the public URL to your published post or video for tracking.</p>
            <label className="mt-3 block text-xs font-semibold text-foreground">Work link</label>
            <input
              value={workLink}
              onChange={(e) => setWorkLink(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
            <button type="button" className="mt-3 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white" onClick={close}>
              Save link
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Content submitted by the influencer.</p>
            <a href={workLink} target="_blank" rel="noreferrer" className="mt-3 inline-block break-all text-sm font-semibold text-primary hover:underline">
              {workLink}
            </a>
          </>
        )}
      </Modal>

      <Modal open={active === "payment"} title="Payment" onClose={close}>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Influencer payout:</span> THB 9,000 (fixed)
          </p>
          <p>
            <span className="font-semibold text-foreground">Status:</span> Pending transfer after post goes live
          </p>
          <p>
            <span className="font-semibold text-foreground">Method:</span> Bank transfer (demo)
          </p>
        </div>
        <div className="mt-4 rounded-lg border border-border bg-muted p-3">
          <p className="text-xs font-semibold text-foreground">Proof of Payment from client/ agency</p>
          <p className="mt-1 text-xs text-muted-foreground">transfer_receipt_demo.png (uploaded 2 May 2026)</p>
          <button
            type="button"
            className="mt-2 text-xs font-semibold text-primary hover:underline"
            onClick={() => downloadBlob("transfer-receipt-note.txt", "Receipt preview (demo).")}
          >
            Download sample receipt
          </button>
        </div>
        {attachments?.paymentProofUrl ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span className="text-xs font-semibold text-emerald-700">Proof uploaded</span>
            <a href={attachments.paymentProofUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:underline">
              View receipt
            </a>
          </div>
        ) : null}
        {variant === "brand" ? (
          <>
            <label className="mt-4 block text-xs font-semibold text-foreground">
              {attachments?.paymentProofUrl ? "Replace payment proof" : "Upload payment proof (image / PDF)"}
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              className="mt-1 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/5 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary/90"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onFileUpload) onFileUpload("payment", file);
              }}
            />
          </>
        ) : null}
      </Modal>
    </div>
  );
}
