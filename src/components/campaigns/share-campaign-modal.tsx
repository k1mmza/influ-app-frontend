"use client";

/**
 * "Share Campaign" modal — owner-only (agency/brand) affordance shown on the
 * campaign detail page. Generates public, account-less links to a presentation-
 * safe view of the campaign, lists the campaign's active links, and revokes them
 * individually.
 *
 * Multiple links per campaign are supported and each is independently revocable,
 * so a leaked link can be killed without breaking others already handed out. The
 * public URL is composed here from the browser origin + token; the backend never
 * returns a URL. Mirrors the tracking module's ShareReportModal.
 */

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Link2, Loader2, Plus, Trash2, X } from "lucide-react";
import {
  apiCreateCampaignShareLink,
  apiListCampaignShareLinks,
  apiRevokeCampaignShareLink,
  type CampaignShareLink,
} from "@/lib/api";
import { cn } from "@/lib/utils";

function publicUrl(token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/campaigns/public/${token}`;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ShareCampaignModal({
  token,
  campaignId,
  onClose,
}: {
  token: string;
  campaignId: string;
  onClose: () => void;
}) {
  const [links, setLinks] = useState<CampaignShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiListCampaignShareLinks(token, campaignId)
      .then((l) => {
        setLinks(l);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load links"))
      .finally(() => setLoading(false));
  }, [token, campaignId]);

  useEffect(() => {
    load();
  }, [load]);

  const generate = async () => {
    setCreating(true);
    setError(null);
    try {
      const link = await apiCreateCampaignShareLink(token, campaignId);
      setLinks((prev) => [link, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create link");
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: string) => {
    setRevokingId(id);
    setError(null);
    try {
      await apiRevokeCampaignShareLink(token, id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke link");
    } finally {
      setRevokingId(null);
    }
  };

  const copy = async (link: CampaignShareLink) => {
    try {
      await navigator.clipboard.writeText(publicUrl(link.token));
      setCopiedId(link.id);
      setTimeout(() => setCopiedId((v) => (v === link.id ? null : v)), 1500);
    } catch {
      /* clipboard blocked — the URL is still visible/selectable in the field */
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">Share campaign</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <p className="text-sm text-muted-foreground">
            Anyone with a link can view this campaign&apos;s public brief — no
            login required. Budget, payment, and applicant data are never shown.
            Links expire automatically; revoke one anytime to disable it
            immediately.
          </p>

          {error ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {/* Links */}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading links…
            </div>
          ) : links.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              No active links yet. Generate one to share this campaign.
            </div>
          ) : (
            <ul className="space-y-3">
              {links.map((link) => {
                const expires = formatDate(link.expiresAt);
                return (
                  <li
                    key={link.id}
                    className="rounded-xl border border-border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={publicUrl(link.token)}
                        onFocus={(e) => e.target.select()}
                        className="min-w-0 flex-1 truncate rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => copy(link)}
                        title="Copy link"
                        className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
                      >
                        {copiedId === link.id ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => revoke(link.id)}
                        disabled={revokingId === link.id}
                        title="Revoke link"
                        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      >
                        {revokingId === link.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    {expires ? (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Expires {expires}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Generate */}
          <button
            type="button"
            onClick={generate}
            disabled={creating}
            className={cn(
              "flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            )}
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Generate new link
          </button>
        </div>
      </div>
    </div>
  );
}
