"use client";

/**
 * Shared presentational table for a campaign's client-review shortlist, used by
 * BOTH the owner's internal preview (/campaigns/[id]/share, editable) and the
 * public share page (/campaigns/public/[token]/influencers, read-only).
 *
 * The row shape is the backend's public allowlist (PublicInfluencerListInfluencer):
 * per-influencer proposedPrice IS shown; campaign budget/payment never are. The
 * internal page maps its authed CampaignShortlistEntry rows into this same shape
 * so the two surfaces render identically.
 */

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import type { PublicInfluencerListInfluencer } from "@/lib/api";
import { cn } from "@/lib/utils";

function platformLabel(p: string | null): string {
  if (!p) return "—";
  return p.charAt(0).toUpperCase() + p.slice(1);
}

function priceLabel(price: number | null): string {
  return price == null ? "—" : `THB ${price.toLocaleString()}`;
}

export interface CampaignInfluencerListProps {
  campaign: { name: string; objective: string | null; brandName: string | null };
  rows: PublicInfluencerListInfluencer[];
  /** Owner mode — renders editable note/price + remove per row. */
  editable?: boolean;
  onSave?: (
    influencerId: string,
    patch: { recommendationNote: string | null; proposedPrice: number | null },
  ) => Promise<void>;
  onRemove?: (influencerId: string) => Promise<void>;
}

export function CampaignInfluencerList({
  campaign,
  rows,
  editable = false,
  onSave,
  onRemove,
}: CampaignInfluencerListProps) {
  return (
    <section className="mx-auto max-w-5xl space-y-6 p-4 pb-16 sm:p-6">
      <header className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-card p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {editable ? "Influencers preview" : "Client-facing preview"}
        </p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-foreground">
          {campaign.name}
        </h1>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {campaign.brandName ? (
            <span className="rounded-full bg-card px-2.5 py-1 font-medium text-foreground shadow-sm">
              {campaign.brandName}
            </span>
          ) : null}
          <span className="rounded-full bg-card px-2.5 py-1 font-medium text-foreground shadow-sm">
            Objective: {campaign.objective ?? "—"}
          </span>
          <span className="rounded-full bg-card px-2.5 py-1 font-medium text-foreground shadow-sm">
            {rows.length} creator{rows.length === 1 ? "" : "s"}
          </span>
        </div>
      </header>

      <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3 sm:px-6">
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Influencer shortlist
          </h2>
          <p className="text-sm text-muted-foreground">
            {rows.length === 0
              ? "No influencers on this list yet."
              : "Ranked list with recommendation notes and proposed pricing."}
          </p>
        </div>

        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium sm:px-6">#</th>
                  <th className="px-4 py-2 font-medium sm:px-6">Creator</th>
                  <th className="px-4 py-2 font-medium sm:px-6">Platform</th>
                  <th className="px-4 py-2 font-medium sm:px-6">Followers</th>
                  <th className="px-4 py-2 font-medium sm:px-6">Niche</th>
                  <th className="px-4 py-2 font-medium sm:px-6">ER</th>
                  <th className="px-4 py-2 font-medium sm:px-6">Why we recommend</th>
                  <th className="px-4 py-2 font-medium sm:px-6">Proposed price</th>
                  {editable ? <th className="px-4 py-2 font-medium sm:px-6" /> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <InfluencerRow
                    key={row.influencerId}
                    marker={index + 1}
                    row={row}
                    editable={editable}
                    onSave={onSave}
                    onRemove={onRemove}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </article>

      {!editable ? (
        <p className="text-center text-xs text-muted-foreground">
          Shared via a private link. Pricing shown is a proposal, not a final quote.
        </p>
      ) : null}
    </section>
  );
}

function InfluencerRow({
  marker,
  row,
  editable,
  onSave,
  onRemove,
}: {
  marker: number;
  row: PublicInfluencerListInfluencer;
  editable: boolean;
  onSave?: CampaignInfluencerListProps["onSave"];
  onRemove?: CampaignInfluencerListProps["onRemove"];
}) {
  const [note, setNote] = useState(row.recommendationNote ?? "");
  const [price, setPrice] = useState(
    row.proposedPrice == null ? "" : String(row.proposedPrice),
  );
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const dirty =
    note !== (row.recommendationNote ?? "") ||
    price !== (row.proposedPrice == null ? "" : String(row.proposedPrice));

  const save = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      const parsed = price.trim() === "" ? null : Number(price);
      await onSave(row.influencerId, {
        recommendationNote: note.trim() === "" ? null : note,
        proposedPrice:
          parsed == null || Number.isNaN(parsed) ? null : Math.round(parsed),
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!onRemove) return;
    setRemoving(true);
    try {
      await onRemove(row.influencerId);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <tr className="border-t border-border align-top">
      <td className="px-4 py-3 text-muted-foreground sm:px-6">{marker}</td>
      <td className="px-4 py-3 sm:px-6">
        <p className="font-medium text-foreground">{row.name}</p>
        {row.profileUrl ? (
          <a
            href={row.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary hover:underline"
          >
            {row.handle ? `@${row.handle.replace(/^@/, "")}` : row.profileUrl}
          </a>
        ) : row.handle ? (
          <span className="text-xs text-muted-foreground">@{row.handle.replace(/^@/, "")}</span>
        ) : null}
      </td>
      <td className="px-4 py-3 text-foreground sm:px-6">{platformLabel(row.mainPlatform)}</td>
      <td className="px-4 py-3 text-foreground sm:px-6">{row.mainFollowers.toLocaleString()}</td>
      <td className="px-4 py-3 text-foreground sm:px-6">{row.category ?? "—"}</td>
      <td className="px-4 py-3 text-foreground sm:px-6">{row.engagementRate}%</td>

      {editable ? (
        <>
          <td className="px-4 py-3 sm:px-6">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Why this creator fits…"
              className="w-56 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary/40"
            />
          </td>
          <td className="px-4 py-3 sm:px-6">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">THB</span>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="w-24 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary/40"
              />
            </div>
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              className={cn(
                "mt-2 inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                dirty && !saving
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {saving ? "Saving…" : dirty ? "Save" : "Saved"}
            </button>
          </td>
          <td className="px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={remove}
              disabled={removing}
              title="Remove from list"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            >
              {removing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          </td>
        </>
      ) : (
        <>
          <td className="px-4 py-3 text-foreground sm:px-6">
            {row.recommendationNote ? (
              <span className="whitespace-pre-wrap">{row.recommendationNote}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </td>
          <td className="px-4 py-3 font-medium text-foreground sm:px-6">
            {priceLabel(row.proposedPrice)}
          </td>
        </>
      )}
    </tr>
  );
}
