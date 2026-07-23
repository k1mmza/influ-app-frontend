"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Heart, Loader2, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfluencerCard } from "@/components/influencer-card";
import { InfluencerDetailPanel } from "@/components/influencer-detail-panel";
import { AddToCampaignModal } from "@/components/add-to-campaign-modal";
import { Influencer } from "@/lib/types";
import {
  apiGetCampaigns,
  apiInviteToCampaign,
  apiStartConversation,
  CampaignResponse,
} from "@/lib/api";
import { useShortlistStore } from "@/store/useShortlistStore";
import { useUserStore } from "@/store/useUserStore";

export default function ShortlistPage() {
  const router = useRouter();
  const { token, role } = useUserStore();
  const { influencers, error, syncFromServer } = useShortlistStore();
  const [loading, setLoading] = useState(true);

  // Paginate the saved grid: 8 per page (4 per row × 2 rows).
  const PER_PAGE = 8;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(influencers.length / PER_PAGE));
  const paginatedInfluencers = useMemo(
    () => influencers.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [influencers, page],
  );
  // Keep the page in range when the shortlist shrinks (e.g. an item is removed).
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const [campaigns, setCampaigns] = useState<CampaignResponse[]>([]);
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string | null>(null);

  // Campaign picker / invite state
  const [campaignPickerInfluencer, setCampaignPickerInfluencer] = useState<Influencer | null>(null);
  const [pickedCampaignId, setPickedCampaignId] = useState<string | null>(null);
  const [addConfirmed, setAddConfirmed] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Message / start conversation state
  const [messagePickerInfluencer, setMessagePickerInfluencer] = useState<Influencer | null>(null);
  const [messagePickedCampaignId, setMessagePickedCampaignId] = useState<string | null>(null);
  const [startingConv, setStartingConv] = useState(false);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    syncFromServer(token).finally(() => setLoading(false));
  }, [token, syncFromServer]);

  useEffect(() => {
    if (!token || role === "influencer") {
      setCampaigns([]);
      return;
    }
    apiGetCampaigns(token)
      .then(setCampaigns)
      .catch((err) => console.error("Failed to fetch campaigns:", err));
  }, [role, token]);

  // Close the detail panel if the selected influencer is removed from the shortlist
  useEffect(() => {
    if (!selectedInfluencerId) return;
    if (!influencers.some((i) => i.id === selectedInfluencerId)) {
      setSelectedInfluencerId(null);
    }
  }, [influencers, selectedInfluencerId]);

  const selectedInfluencer = influencers.find((i) => i.id === selectedInfluencerId) ?? null;
  const selectedInfluencerMeta = selectedInfluencer ? (selectedInfluencer as any).meta ?? null : null;

  const openCampaignPicker = (inf: Influencer) => {
    setCampaignPickerInfluencer(inf);
    setPickedCampaignId(null);
    setAddConfirmed(false);
    setInviteError(null);
  };

  const handleConfirmInvite = async () => {
    if (!token || !campaignPickerInfluencer || !pickedCampaignId) return;
    if (campaignPickerInfluencer.id.startsWith("url-derived-")) {
      setInviteError("This creator isn't registered on Inflique yet, so they can't be invited.");
      return;
    }
    setInviting(true);
    setInviteError(null);
    try {
      await apiInviteToCampaign(token, pickedCampaignId, campaignPickerInfluencer.id);
      setAddConfirmed(true);
      setTimeout(() => setCampaignPickerInfluencer(null), 1500);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleStartConversation = async () => {
    if (!token || !messagePickerInfluencer || !messagePickedCampaignId) return;
    setStartingConv(true);
    try {
      const conv = await apiStartConversation(token, messagePickerInfluencer.id, messagePickedCampaignId);
      router.push(`/messages?convId=${conv.id}`);
    } catch (err) {
      console.error("Failed to start conversation:", err);
    } finally {
      setStartingConv(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Travelogue banner — "Saved Creators" in the page accent (bg-primary). */}
      <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-xl bg-primary p-8 text-primary-foreground shadow-sm sm:flex-row sm:items-end">
        <div className="relative z-10">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
            Curated Selection
          </span>
          <h1 className="mt-2 font-serif text-4xl font-bold italic sm:text-5xl">Saved Creators</h1>
        </div>
        {influencers.length > 0 && (
          <span className="relative z-10 flex items-center gap-2 font-serif text-lg italic text-primary-foreground/90">
            <Heart className="h-4 w-4" />
            {influencers.length} Saved
          </span>
        )}
        <Heart className="pointer-events-none absolute -bottom-10 -right-8 h-56 w-56 opacity-10" />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-muted aspect-[4/5]" />
          ))}
        </div>
      ) : influencers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10">
            <Heart className="h-8 w-8 text-rose-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground font-serif">No influencers saved yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Heart an influencer on the Discover page to add them here.
            </p>
          </div>
          <Button asChild className="rounded-xl font-semibold">
            <Link href="/discover">Browse Creators</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {paginatedInfluencers.map((influencer) => (
              <InfluencerCard
                key={influencer.id}
                influencer={influencer}
                compact
                isActive={selectedInfluencerId === influencer.id}
                onSelect={(selected) => setSelectedInfluencerId(selected.id)}
                onAddToCampaign={openCampaignPicker}
              />
            ))}
          </div>

          {influencers.length > PER_PAGE && (
            <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    aria-current={p === page ? "page" : undefined}
                    className={
                      "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition cursor-pointer " +
                      (p === page
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:bg-muted")
                    }
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Next page"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <p className="font-serif text-sm italic text-muted-foreground">
                Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, influencers.length)} of {influencers.length} saved
              </p>
            </div>
          )}
        </>
      )}

      {selectedInfluencer && selectedInfluencerMeta && (
        <InfluencerDetailPanel
          influencer={selectedInfluencer}
          meta={selectedInfluencerMeta}
          onClose={() => setSelectedInfluencerId(null)}
          onAddToCampaign={openCampaignPicker}
          onMessage={(inf) => { setMessagePickerInfluencer(inf); setMessagePickedCampaignId(null); }}
        />
      )}

      {/* Campaign picker modal */}
      <AddToCampaignModal
        influencer={campaignPickerInfluencer}
        campaigns={campaigns}
        pickedCampaignId={pickedCampaignId}
        onPick={setPickedCampaignId}
        inviting={inviting}
        addConfirmed={addConfirmed}
        inviteError={inviteError}
        onConfirm={handleConfirmInvite}
        onClose={() => setCampaignPickerInfluencer(null)}
      />

      {/* Message / start conversation picker modal */}
      {messagePickerInfluencer && role !== "influencer" && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setMessagePickerInfluencer(null)}
        >
          <Card
            className="w-full max-w-md shadow-2xl border-none"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-serif">Message Influencer</CardTitle>
                <button
                  onClick={() => setMessagePickerInfluencer(null)}
                  className="rounded-full p-1 hover:bg-muted transition-colors cursor-pointer"
                >
                  <XIcon className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Starting a conversation with <span className="font-semibold text-foreground">{messagePickerInfluencer.name}</span>. Select a campaign to link this conversation to.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {campaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No campaigns yet. Create one first.</p>
              ) : (
                <select
                  value={messagePickedCampaignId ?? ""}
                  onChange={(e) => setMessagePickedCampaignId(e.target.value || null)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="">— Select a campaign —</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setMessagePickerInfluencer(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl"
                  disabled={!messagePickedCampaignId || startingConv}
                  onClick={handleStartConversation}
                >
                  {startingConv ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Conversation"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
