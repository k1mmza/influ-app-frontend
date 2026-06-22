"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import {
  apiAnalyzeMediaKit,
  apiGetProfile,
  apiUpdateProfile,
  type MediaKitAnalysis,
} from "@/lib/api";
import {
  Loader2,
  Check,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

type FieldKind = "text" | "textarea" | "list" | "rateCard";

interface ReviewField {
  key: "bio" | "categories" | "styleTags" | "keywords" | "hashtags" | "availabilityStatus" | "rateCard";
  label: string;
  kind: FieldKind;
  current: string;
  // editable working copy of the proposed value (string form for inputs)
  proposedText: string;
  // for rateCard only: editable proposed prices
  rateCard?: Record<string, string>;
  rateCardCurrent?: Record<string, string>;
  accepted: boolean;
}

const RATE_FIELDS: Array<{ k: string; label: string }> = [
  { k: "pricePerPost", label: "Per post" },
  { k: "pricePerVideo", label: "Per video" },
  { k: "pricePerStory", label: "Per story" },
  { k: "packagePrice", label: "Package" },
  { k: "packageDescription", label: "Package note" },
];

function joinList(v: unknown): string {
  return Array.isArray(v) ? v.join(", ") : "";
}
function parseList(s: string): string[] {
  return s.split(/[,\n]/g).map((x) => x.trim()).filter(Boolean);
}

const METRIC_LABELS: Record<string, string> = {
  followers: "Followers",
  avgViews: "Avg. views",
  engagementRate: "Engagement rate",
  growthRate: "Growth rate",
};

export interface MediaKitImportHandle {
  /** Analyze a picked media kit file and open the review panel. */
  analyze: (file: File) => Promise<void>;
}

interface Props {
  token: string;
  /** Called after a successful save so the parent can reload profile data. */
  onApplied?: () => void;
}

export const MediaKitImportPanel = forwardRef<MediaKitImportHandle, Props>(
  function MediaKitImportPanel({ token, onApplied }, ref) {
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<MediaKitAnalysis | null>(null);
    const [fields, setFields] = useState<ReviewField[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [applying, setApplying] = useState(false);
    const [savedMsg, setSavedMsg] = useState<string | null>(null);

    const reset = () => {
      setAnalysis(null);
      setFields([]);
      setError(null);
      setSavedMsg(null);
    };

    const analyze = async (file: File) => {
      reset();
      setLoading(true);
      try {
        // Fetch current profile (for the diff) and the proposal in parallel.
        const [result, profileData] = await Promise.all([
          apiAnalyzeMediaKit(token, file),
          apiGetProfile(token).catch(() => null),
        ]);
        setAnalysis(result);
        setFields(buildFields(result, profileData?.profile));
      } catch (err: any) {
        setError(err.message || "Analysis failed");
      } finally {
        setLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({ analyze }));

    const buildFields = (result: MediaKitAnalysis, profile: any): ReviewField[] => {
      const p = result.proposed;
      const out: ReviewField[] = [];
      const cur = profile ?? {};

      if (p.bio !== undefined)
        out.push({ key: "bio", label: "Bio", kind: "textarea", current: cur.bio ?? "", proposedText: p.bio, accepted: true });
      if (p.categories !== undefined)
        out.push({ key: "categories", label: "Categories", kind: "list", current: joinList(cur.categories), proposedText: joinList(p.categories), accepted: true });
      if (p.styleTags !== undefined)
        out.push({ key: "styleTags", label: "Style tags", kind: "list", current: joinList(cur.styleTags), proposedText: joinList(p.styleTags), accepted: true });
      if (p.keywords !== undefined)
        out.push({ key: "keywords", label: "Keywords", kind: "list", current: joinList(cur.keywords), proposedText: joinList(p.keywords), accepted: true });
      if (p.hashtags !== undefined)
        out.push({ key: "hashtags", label: "Hashtags", kind: "list", current: joinList(cur.hashtags), proposedText: joinList(p.hashtags), accepted: true });
      if (p.availabilityStatus !== undefined)
        out.push({ key: "availabilityStatus", label: "Availability", kind: "text", current: cur.availabilityStatus ?? "", proposedText: p.availabilityStatus, accepted: true });

      if (p.rateCard) {
        const existing = Array.isArray(cur.rateCards) ? cur.rateCards[0] : undefined;
        const rc: Record<string, string> = {};
        const rcCur: Record<string, string> = {};
        for (const { k } of RATE_FIELDS) {
          const v = (p.rateCard as any)[k];
          if (v !== undefined && v !== null) rc[k] = String(v);
          const cv = existing?.[k];
          if (cv !== undefined && cv !== null) rcCur[k] = String(cv);
        }
        out.push({ key: "rateCard", label: "Rate card", kind: "rateCard", current: "", proposedText: "", rateCard: rc, rateCardCurrent: rcCur, accepted: true });
      }
      return out;
    };

    const updateField = (idx: number, patch: Partial<ReviewField>) => {
      setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
    };
    const updateRate = (idx: number, k: string, value: string) => {
      setFields((prev) =>
        prev.map((f, i) =>
          i === idx ? { ...f, rateCard: { ...(f.rateCard ?? {}), [k]: value } } : f,
        ),
      );
    };

    const applySelected = async () => {
      setApplying(true);
      setError(null);
      try {
        const influencerProfile: Record<string, any> = {};
        for (const f of fields) {
          if (!f.accepted) continue;
          switch (f.kind) {
            case "textarea":
            case "text":
              influencerProfile[f.key] = f.proposedText;
              break;
            case "list":
              influencerProfile[f.key] = parseList(f.proposedText);
              break;
            case "rateCard": {
              const rc: Record<string, any> = {};
              for (const { k } of RATE_FIELDS) {
                const raw = f.rateCard?.[k];
                if (raw === undefined || raw === "") continue;
                if (k === "packageDescription") rc[k] = raw;
                else {
                  const n = Number(String(raw).replace(/[, ]/g, ""));
                  if (Number.isFinite(n)) rc[k] = n;
                }
              }
              if (Object.keys(rc).length) influencerProfile.rateCard = rc;
              break;
            }
          }
        }

        if (Object.keys(influencerProfile).length === 0) {
          setError("Nothing selected to apply.");
          setApplying(false);
          return;
        }

        await apiUpdateProfile(token, { influencerProfile });
        setSavedMsg("Profile updated from your media kit.");
        setAnalysis(null);
        setFields([]);
        onApplied?.();
      } catch (err: any) {
        setError(err.message || "Failed to save");
      } finally {
        setApplying(false);
      }
    };

    const claimedEntries = analysis
      ? Object.entries(analysis.claimedMetrics).filter(([, v]) => v !== undefined && v !== null)
      : [];

    // Nothing to show until the user picks a file from the header button.
    if (!loading && !analysis && !savedMsg && !error) return null;

    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Import from media kit</h2>
            <p className="text-xs text-muted-foreground">
              Review the extracted fields — nothing is saved until you confirm.
            </p>
          </div>
        </div>

        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Analyzing your media kit…
          </p>
        )}

        {savedMsg && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <Check className="h-3.5 w-3.5" /> {savedMsg}
          </p>
        )}
        {error && <p className="text-xs font-medium text-destructive">{error}</p>}

        {analysis && (
          <div className="space-y-4">
            {/* warnings */}
            {analysis.warnings.length > 0 && (
              <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 dark:border-amber-700/50 dark:bg-amber-950/30">
                {analysis.warnings.map((w, i) => (
                  <p key={i} className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {w}
                  </p>
                ))}
              </div>
            )}

            {/* review diff */}
            {fields.length > 0 ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Review proposed changes ({analysis.source.toUpperCase()})
                </p>
                <div className="space-y-3">
                  {fields.map((f, idx) => (
                    <div
                      key={f.key}
                      className={`rounded-xl border p-3 transition ${f.accepted ? "border-border bg-background" : "border-dashed border-border bg-muted/40 opacity-70"}`}
                    >
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={f.accepted}
                          onChange={(e) => updateField(idx, { accepted: e.target.checked })}
                          className="h-4 w-4 cursor-pointer accent-primary"
                        />
                        <span className="text-sm font-semibold text-foreground">{f.label}</span>
                      </label>

                      {f.kind === "rateCard" ? (
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {RATE_FIELDS.filter(({ k }) => f.rateCard?.[k] !== undefined).map(({ k, label }) => (
                            <div key={k}>
                              <span className="text-[11px] text-muted-foreground">{label}</span>
                              <div className="text-[11px] text-muted-foreground/70">
                                current: {f.rateCardCurrent?.[k] ?? "—"}
                              </div>
                              <input
                                value={f.rateCard?.[k] ?? ""}
                                disabled={!f.accepted}
                                onChange={(e) => updateRate(idx, k, e.target.value)}
                                className="mt-0.5 w-full rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary/70 disabled:opacity-60"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2">
                          <div className="mb-1 text-[11px] text-muted-foreground/70">
                            current: <span className="text-muted-foreground">{f.current || "—"}</span>
                          </div>
                          {f.kind === "textarea" ? (
                            <textarea
                              value={f.proposedText}
                              disabled={!f.accepted}
                              onChange={(e) => updateField(idx, { proposedText: e.target.value })}
                              rows={2}
                              className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary/70 disabled:opacity-60"
                            />
                          ) : (
                            <input
                              value={f.proposedText}
                              disabled={!f.accepted}
                              onChange={(e) => updateField(idx, { proposedText: e.target.value })}
                              className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary/70 disabled:opacity-60"
                            />
                          )}
                          {f.kind === "list" && (
                            <p className="mt-0.5 text-[10px] text-muted-foreground/70">Comma-separated</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                No editable profile fields were found in this file.
              </p>
            )}

            {/* claimed metrics — read-only, never saved */}
            {claimedEntries.length > 0 && (
              <div className="rounded-xl border border-border bg-muted/50 p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
                  Claimed in media kit
                </p>
                <p className="mb-2 text-[11px] text-muted-foreground">
                  Not verified and not saved. Your real stats come only from connected accounts.
                </p>
                <div className="flex flex-wrap gap-2">
                  {claimedEntries.map(([k, v]) => (
                    <span key={k} className="rounded-full bg-background px-2.5 py-1 text-[11px] text-muted-foreground">
                      {METRIC_LABELS[k] ?? k}: <strong className="text-foreground/80">{String(v)}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* actions */}
            <div className="flex items-center gap-2">
              {fields.length > 0 && (
                <button
                  type="button"
                  onClick={applySelected}
                  disabled={applying}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0369A1] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#075985] disabled:opacity-60"
                >
                  {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Apply selected
                </button>
              )}
              <button
                type="button"
                onClick={reset}
                disabled={applying}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
);
