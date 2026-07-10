"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  apiGetDrafts,
  apiCreateDraft,
  apiUpdateDraft,
  apiDeleteDraft,
  apiReviewDraft,
  apiUploadDraftFile,
  apiGetPayments,
  apiCreatePayment,
  apiUploadPaymentProof,
  apiConfirmPayment,
  type ConversationBrief,
  type Draft,
  type Payment,
} from "@/lib/api";

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
      <span className="text-xs font-medium text-muted-foreground">{workPhaseLabel(phase)}</span>
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

type ProcessVariant = "influencer" | "brand";

const DRAFT_STATUS_BADGE: Record<Draft["status"], string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SUBMITTED: "bg-sky-100 text-sky-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REVISION_REQUESTED: "bg-amber-100 text-amber-700",
};

const DRAFT_STATUS_LABEL: Record<Draft["status"], string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REVISION_REQUESTED: "Revision requested",
};

/** Render a Json requirement value (array → comma list; scalar → string). Returns null when empty. */
function formatReqValue(value: unknown): string | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value.length ? value.join(", ") : null;
  const s = String(value).trim();
  return s.length ? s : null;
}

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

export function ProcessOfWorkPanel({
  variant,
  currentPhase,
  brandPhaseReady = false,
  influencerPhaseReady = false,
  onFinishPhase,
  onFileUpload,
  attachments,
  linkedCampaign,
  brief,
  conversationId,
  token,
  draftsRefreshKey = 0,
  paymentsRefreshKey = 0,
}: {
  variant: ProcessVariant;
  currentPhase?: WorkPhase;
  brandPhaseReady?: boolean;
  influencerPhaseReady?: boolean;
  onFinishPhase?: () => void;
  onFileUpload?: (type: "contract" | "brief" | "payment", file: File) => void;
  attachments?: { contractUrl: string | null; briefFileUrl: string | null; paymentProofUrl: string | null };
  linkedCampaign?: { id: string; name: string } | null;
  brief?: ConversationBrief | null;
  conversationId?: string | null;
  token?: string | null;
  draftsRefreshKey?: number;
  paymentsRefreshKey?: number;
}) {
  const [active, setActive] = useState<WorkPhase | null>(null);
  const isInfluencer = variant === "influencer";

  // ── Real draft state ──
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Influencer create form
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newMode, setNewMode] = useState<"upload" | "link">("upload");
  const [newLink, setNewLink] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  // Brand review form, keyed by draft id
  const [revisionNotes, setRevisionNotes] = useState<Record<string, string>>({});

  const loadDrafts = useCallback(async () => {
    if (!token || !conversationId) return;
    try {
      setDraftsLoading(true);
      setDrafts(await apiGetDrafts(token, conversationId));
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "Failed to load drafts");
    } finally {
      setDraftsLoading(false);
    }
  }, [token, conversationId]);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts, draftsRefreshKey]);

  // Published content = approved drafts that carry a live link.
  const publishedLinks = useMemo(
    () => drafts.filter((d) => d.status === "APPROVED" && !!d.linkUrl),
    [drafts],
  );

  // ── Real payment state ──
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [payBusy, setPayBusy] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newPaymentType, setNewPaymentType] = useState("");

  const loadPayments = useCallback(async () => {
    if (!token || !conversationId) return;
    try {
      setPaymentsLoading(true);
      setPayments(await apiGetPayments(token, conversationId));
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Failed to load payments");
    } finally {
      setPaymentsLoading(false);
    }
  }, [token, conversationId]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments, paymentsRefreshKey]);

  const handleCreatePayment = async () => {
    if (!token || !conversationId) return;
    const amount = Number(newAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError("Enter a valid amount.");
      return;
    }
    setPayBusy(true);
    setPaymentError(null);
    try {
      await apiCreatePayment(token, conversationId, {
        amount,
        paymentType: newPaymentType.trim() || undefined,
      });
      setNewAmount("");
      setNewPaymentType("");
      await loadPayments();
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Failed to create payment");
    } finally {
      setPayBusy(false);
    }
  };

  const handleUploadProof = async (paymentId: string, file: File) => {
    if (!token || !conversationId) return;
    setPayBusy(true);
    setPaymentError(null);
    try {
      await apiUploadPaymentProof(token, conversationId, paymentId, file);
      await loadPayments();
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Failed to upload proof");
    } finally {
      setPayBusy(false);
    }
  };

  const handleConfirmPayment = async (paymentId: string) => {
    if (!token || !conversationId) return;
    setPayBusy(true);
    setPaymentError(null);
    try {
      await apiConfirmPayment(token, conversationId, paymentId);
      await loadPayments();
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Failed to confirm payment");
    } finally {
      setPayBusy(false);
    }
  };

  const close = useCallback(() => setActive(null), []);

  const handleCreateDraft = async () => {
    if (!token || !conversationId || !newTitle.trim()) return;
    setBusy(true);
    setDraftError(null);
    try {
      const created = await apiCreateDraft(token, conversationId, {
        title: newTitle.trim(),
        notes: newNotes.trim() || undefined,
        linkUrl: newMode === "link" ? newLink.trim() || undefined : undefined,
        contentType: newMode === "link" ? "link" : undefined,
      });
      if (newMode === "upload" && newFile) {
        await apiUploadDraftFile(token, conversationId, created.id, newFile);
      }
      setNewTitle("");
      setNewNotes("");
      setNewLink("");
      setNewFile(null);
      setNewMode("upload");
      await loadDrafts();
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "Failed to create draft");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!token || !conversationId) return;
    setBusy(true);
    try {
      await apiDeleteDraft(token, conversationId, draftId);
      await loadDrafts();
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "Failed to delete draft");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitDraft = async (draftId: string) => {
    if (!token || !conversationId) return;
    setBusy(true);
    try {
      await apiUpdateDraft(token, conversationId, draftId, { status: "SUBMITTED" });
      await loadDrafts();
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "Failed to submit draft");
    } finally {
      setBusy(false);
    }
  };

  const handleReplaceDraftFile = async (draftId: string, file: File) => {
    if (!token || !conversationId) return;
    setBusy(true);
    try {
      await apiUploadDraftFile(token, conversationId, draftId, file);
      await loadDrafts();
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setBusy(false);
    }
  };

  const handleReviewDraft = async (
    draftId: string,
    status: "APPROVED" | "REVISION_REQUESTED",
  ) => {
    if (!token || !conversationId) return;
    const note = revisionNotes[draftId]?.trim();
    if (status === "REVISION_REQUESTED" && !note) {
      setDraftError("Add a revision note before requesting changes.");
      return;
    }
    setBusy(true);
    setDraftError(null);
    try {
      await apiReviewDraft(token, conversationId, draftId, {
        status,
        revisionNote: status === "REVISION_REQUESTED" ? note : undefined,
      });
      setRevisionNotes((r) => ({ ...r, [draftId]: "" }));
      await loadDrafts();
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "Failed to review draft");
    } finally {
      setBusy(false);
    }
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

  // Brief data derived from the conversation's linked campaign (real backend data).
  const briefCampaign = brief?.campaign ?? null;
  const requirement = brief?.requirement ?? null;
  const smartPlanBrief = brief?.smartPlanBrief ?? null;
  const requirementRows = useMemo(() => {
    if (!requirement) return [] as { label: string; value: string }[];
    const fmtNum = (n: number | null) => (n == null ? null : n.toLocaleString());
    const rows: { label: string; value: string | null }[] = [
      { label: "Min. followers", value: fmtNum(requirement.minFollowers) },
      {
        label: "Min. engagement rate",
        value: requirement.minEngagementRate == null ? null : `${requirement.minEngagementRate}%`,
      },
      { label: "Min. avg. views", value: fmtNum(requirement.minAvgViews) },
      { label: "Platforms", value: formatReqValue(requirement.platforms) },
      { label: "Categories", value: formatReqValue(requirement.categories) },
      { label: "Locations", value: formatReqValue(requirement.locations) },
      { label: "Follower tier", value: requirement.followerTier },
      { label: "Content type", value: requirement.contentType },
    ];
    return rows.filter((r): r is { label: string; value: string } => !!r.value);
  }, [requirement]);

  const smartPlanText =
    smartPlanBrief?.generatedBrief ||
    [smartPlanBrief?.strategy, smartPlanBrief?.concept, smartPlanBrief?.briefBody]
      .filter(Boolean)
      .join("\n\n") ||
    null;

  const briefName = briefCampaign?.name ?? linkedCampaign?.name ?? "No campaign linked";
  const resolvedBriefFileUrl = brief?.briefFileUrl ?? attachments?.briefFileUrl ?? null;

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
                <span className={`truncate text-sm font-semibold leading-tight sm:text-sm ${done ? "text-emerald-900" : isActive ? "text-primary" : "text-foreground"}`}>{s.label}</span>
                <span className={`truncate text-xs leading-tight ${done ? "text-emerald-700" : isActive ? "text-primary/70" : "text-muted-foreground"}`}>{done ? "✓ Done" : isActive ? "Active" : s.hint}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Phase confirmation — both parties must confirm to advance */}
      {currentPhase && currentPhase !== "payment" && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/60 px-4 py-3">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
              <span className="rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                You confirmed ✓
              </span>
            ) : (
              <button
                type="button"
                onClick={onFinishPhase}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-primary/90"
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
            <span className="text-sm font-semibold text-emerald-700">Uploaded</span>
            <a href={attachments.contractUrl ?? "#"} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary hover:underline truncate">
              View contract
            </a>
          </div>
        ) : null}
        <label className="mt-4 block text-sm font-semibold text-foreground">
          {attachments?.contractUrl ? "Replace file" : "Upload image / PDF"}
        </label>
        <input
          type="file"
          accept="image/*,.pdf"
          className="mt-1 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/5 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary/90"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && onFileUpload) onFileUpload("contract", file);
          }}
        />
        <div className="mt-4">
          <button
            type="button"
            className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white"
            onClick={() => downloadBlob("contact-agreement-template.txt", "Agreement template (demo)\n— replace with your PDF in production.")}
          >
            Download template
          </button>
        </div>
      </Modal>

      <Modal open={active === "brief"} title="Brief" onClose={close}>
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Brief overview</p>
                <h4 className="text-base font-semibold text-foreground">{briefName}</h4>
              </div>
              {briefCampaign ? (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary/90">Campaign-linked</span>
              ) : null}
            </div>

            {briefCampaign ? (
              <div className="mt-4 space-y-3 text-sm">
                {briefCampaign.objective ? (
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">Objective:</span> {briefCampaign.objective}
                  </p>
                ) : null}
                {briefCampaign.keyMessage ? (
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    <span className="font-semibold text-foreground">Key message:</span> {briefCampaign.keyMessage}
                  </p>
                ) : null}
                {briefCampaign.budget != null ? (
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">Budget:</span> THB {briefCampaign.budget.toLocaleString()}
                    {briefCampaign.paymentType ? ` (${briefCampaign.paymentType})` : ""}
                  </p>
                ) : null}
                {briefCampaign.submissionDate ? (
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">Submission date:</span>{" "}
                    {new Date(briefCampaign.submissionDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                ) : null}
                {!briefCampaign.objective && !briefCampaign.keyMessage && briefCampaign.budget == null ? (
                  <p className="text-sm text-muted-foreground">No overview details provided for this campaign yet.</p>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">This conversation has no linked campaign brief.</p>
            )}
          </div>

          {requirementRows.length > 0 ? (
            <div className="rounded-xl border border-border bg-muted p-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Requirement details</p>
              <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                {requirementRows.map((row) => (
                  <p key={row.label} className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{row.label}:</span> {row.value}
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          {briefCampaign?.deliverables ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Deliverables</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{briefCampaign.deliverables}</p>
            </div>
          ) : null}

          {briefCampaign?.doAndDont ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Do &amp; Don&apos;t</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{briefCampaign.doAndDont}</p>
            </div>
          ) : null}

          {briefCampaign?.briefImageUrl ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Reference image</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={briefCampaign.briefImageUrl ?? ""}
                alt="Brief reference"
                className="mt-2 max-h-80 w-full rounded-lg border border-border object-contain"
              />
            </div>
          ) : null}

          {smartPlanText ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary/80">
                Smart Plan brief{smartPlanBrief?.inputMode ? ` · ${smartPlanBrief.inputMode}` : ""}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{smartPlanText}</p>
            </div>
          ) : null}
        </div>

        {variant === "brand" ? (
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <label className="block text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {resolvedBriefFileUrl ? "Replace brief file" : "Upload brief (PDF / doc)"}
            </label>
            {resolvedBriefFileUrl ? (
              <a href={resolvedBriefFileUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-semibold text-primary hover:underline">
                View uploaded brief
              </a>
            ) : null}
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="mt-2 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/5 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary/90"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onFileUpload) onFileUpload("brief", file);
              }}
            />
          </div>
        ) : resolvedBriefFileUrl ? (
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Brief file</p>
            <a href={resolvedBriefFileUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-semibold text-primary hover:underline">
              Download brief
            </a>
          </div>
        ) : null}
      </Modal>

      <Modal open={active === "draft"} title="Draft management" onClose={close}>
        {draftError ? (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{draftError}</p>
        ) : null}

        <div className="space-y-3">
          {draftsLoading && drafts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading drafts…</p>
          ) : drafts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
              {isInfluencer ? "No drafts yet — create your first one below." : "The influencer hasn't submitted any drafts yet."}
            </p>
          ) : (
            drafts.map((d) => {
              const draftFile = d.fileUrl;
              return (
                <div key={d.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{d.title}</p>
                      {d.notes ? <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">{d.notes}</p> : null}
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${DRAFT_STATUS_BADGE[d.status]}`}>
                      {DRAFT_STATUS_LABEL[d.status]}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                    {draftFile ? (
                      <a href={draftFile} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">
                        View file{d.contentType ? ` (${d.contentType})` : ""}
                      </a>
                    ) : null}
                    {d.linkUrl ? (
                      <a href={d.linkUrl} target="_blank" rel="noreferrer" className="break-all font-semibold text-primary hover:underline">
                        Open link
                      </a>
                    ) : null}
                    {!draftFile && !d.linkUrl ? <span className="text-muted-foreground">No file or link attached</span> : null}
                  </div>

                  {d.status === "REVISION_REQUESTED" && d.revisionNote ? (
                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Revision requested</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-amber-800">{d.revisionNote}</p>
                    </div>
                  ) : null}

                  {/* Influencer actions */}
                  {isInfluencer ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {d.status === "DRAFT" || d.status === "REVISION_REQUESTED" ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleSubmitDraft(d.id)}
                          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          Submit for review
                        </button>
                      ) : null}
                      <label className="cursor-pointer rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-muted">
                        {draftFile ? "Replace file" : "Upload file"}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleReplaceDraftFile(d.id, f);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDeleteDraft(d.id)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}

                  {/* Brand/agency review actions */}
                  {!isInfluencer && d.status !== "APPROVED" ? (
                    <div className="mt-3 space-y-2 border-t border-border pt-3">
                      <textarea
                        value={revisionNotes[d.id] ?? ""}
                        onChange={(e) => setRevisionNotes((r) => ({ ...r, [d.id]: e.target.value }))}
                        placeholder="Revision feedback (required to request changes)…"
                        rows={2}
                        className="w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleReviewDraft(d.id, "APPROVED")}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleReviewDraft(d.id, "REVISION_REQUESTED")}
                          className="rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                        >
                          Request revision
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {/* Influencer: create a new draft */}
        {isInfluencer ? (
          <div className="mt-4 space-y-2 rounded-xl border border-border bg-muted/40 p-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">New draft</p>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Draft title"
              className="w-full rounded-lg border border-border px-2 py-1.5 text-sm"
            />
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Description / notes (optional)"
              rows={2}
              className="w-full rounded-lg border border-border px-2 py-1.5 text-sm"
            />
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                onClick={() => setNewMode("upload")}
                className={`rounded-lg px-3 py-1.5 font-semibold ${newMode === "upload" ? "bg-primary text-white" : "border border-border bg-card text-foreground"}`}
              >
                Upload file (pdf/image)
              </button>
              <button
                type="button"
                onClick={() => setNewMode("link")}
                className={`rounded-lg px-3 py-1.5 font-semibold ${newMode === "link" ? "bg-primary text-white" : "border border-border bg-card text-foreground"}`}
              >
                Paste link (video/Drive)
              </button>
            </div>
            {newMode === "upload" ? (
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/5 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary/90"
              />
            ) : (
              <input
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="https://youtube.com/... or Drive/Frame.io link"
                className="w-full rounded-lg border border-border px-2 py-1.5 text-sm"
              />
            )}
            <button
              type="button"
              disabled={busy || !newTitle.trim()}
              onClick={handleCreateDraft}
              className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Saving…" : "Add draft"}
            </button>
          </div>
        ) : null}
      </Modal>

      <Modal open={active === "work"} title="Published content" onClose={close}>
        <p className="text-sm text-muted-foreground">
          Live links come from approved drafts. Approve a draft in the Draft phase to publish it here.
        </p>
        <div className="mt-3 space-y-2">
          {publishedLinks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
              No approved content links yet.
            </p>
          ) : (
            publishedLinks.map((d) => (
              <div key={d.id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm font-semibold text-foreground">{d.title}</p>
                <a
                  href={d.linkUrl ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block break-all text-sm font-semibold text-primary hover:underline"
                >
                  {d.linkUrl}
                </a>
              </div>
            ))
          )}
        </div>
        {isInfluencer ? (
          <p className="mt-3 text-sm text-muted-foreground">
            To publish, add a draft with a link (e.g. your TikTok/YouTube post) and have the brand approve it.
          </p>
        ) : null}
      </Modal>

      <Modal open={active === "payment"} title="Payment" onClose={close}>
        <p className="text-sm text-muted-foreground">
          Payments are settled off-platform (PromptPay / bank transfer). The platform only records the
          transaction — the influencer confirms receipt to mark it paid.
        </p>
        {paymentError ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{paymentError}</p>
        ) : null}

        <div className="mt-3 space-y-3">
          {paymentsLoading && payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading payments…</p>
          ) : payments.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
              {isInfluencer ? "No payments recorded yet." : "No payments yet — create one below."}
            </p>
          ) : (
            payments.map((p) => {
              const proof = p.proofUrl;
              const statusBadge =
                p.status === "PAID"
                  ? "bg-emerald-100 text-emerald-700"
                  : p.status === "AWAITING_CONFIRMATION"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-muted text-muted-foreground";
              const statusLabel =
                p.status === "PAID"
                  ? "Paid"
                  : p.status === "AWAITING_CONFIRMATION"
                  ? "Awaiting confirmation"
                  : "Pending";
              return (
                <div key={p.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        THB {p.amount.toLocaleString()}
                        {p.paymentType ? <span className="text-muted-foreground"> · {p.paymentType}</span> : null}
                      </p>
                      {p.confirmedAt ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Confirmed {new Date(p.confirmedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      ) : null}
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge}`}>{statusLabel}</span>
                  </div>

                  {proof ? (
                    <a href={proof} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
                      View payment proof
                    </a>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">No proof uploaded yet.</p>
                  )}

                  {/* Brand/agency: upload (or replace) proof until influencer confirms */}
                  {!isInfluencer && p.status !== "PAID" ? (
                    <label className="mt-2 inline-block cursor-pointer rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-muted">
                      {proof ? "Replace proof" : "Upload payment proof"}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadProof(p.id, f);
                        }}
                      />
                    </label>
                  ) : null}

                  {/* Influencer: confirm receipt once proof is uploaded */}
                  {isInfluencer && p.status === "AWAITING_CONFIRMATION" ? (
                    <button
                      type="button"
                      disabled={payBusy}
                      onClick={() => handleConfirmPayment(p.id)}
                      className="mt-2 block rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Confirm received
                    </button>
                  ) : null}
                  {isInfluencer && p.status === "PENDING" ? (
                    <p className="mt-2 text-sm text-muted-foreground">Waiting for the brand to upload payment proof.</p>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {/* Brand/agency: record a new payment */}
        {!isInfluencer ? (
          <div className="mt-4 space-y-2 rounded-xl border border-border bg-muted/40 p-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Record a payment</p>
            <input
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              type="number"
              min="0"
              placeholder="Amount (THB)"
              className="w-full rounded-lg border border-border px-2 py-1.5 text-sm"
            />
            <input
              value={newPaymentType}
              onChange={(e) => setNewPaymentType(e.target.value)}
              placeholder="Type (e.g. Full, Deposit) — optional"
              className="w-full rounded-lg border border-border px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              disabled={payBusy || !newAmount}
              onClick={handleCreatePayment}
              className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {payBusy ? "Saving…" : "Submit Payment"}
            </button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
