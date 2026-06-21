"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Loader2, AlertCircle, CheckCheck, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfluencerCard } from "@/components/influencer-card";
import { InfluencerDetailPanel } from "@/components/influencer-detail-panel";
import { Influencer } from "@/lib/types";
import {
  apiGetCampaigns,
  apiInviteToCampaign,
  apiStartConversation,
  CampaignResponse,
} from "@/lib/api";
import { useShortlistStore } from "@/store/useShortlistStore";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";

export default function ShortlistPage() {
  const router = useRouter();
  const { token, role } = useUserStore();
  const { influencers, error, syncFromServer } = useShortlistStore();
  const [loading, setLoading] = useState(true);

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
      setInviteError("This creator isn't registered on InfluApp yet, so they can't be invited.");
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
          <Heart className="h-5 w-5 text-rose-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">Shortlist</h1>
          <p className="text-sm text-muted-foreground">
            Saved influencers — {influencers.length} creator{influencers.length !== 1 ? "s" : ""}
          </p>
        </div>
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
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {influencers.map((influencer) => (
            <InfluencerCard
              key={influencer.id}
              influencer={influencer}
              isActive={selectedInfluencerId === influencer.id}
              onSelect={(selected) => setSelectedInfluencerId(selected.id)}
              onAddToCampaign={openCampaignPicker}
            />
          ))}
        </div>
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
      {campaignPickerInfluencer && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setCampaignPickerInfluencer(null)}
        >
          <Card
            className="w-full max-w-md shadow-2xl border-none"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-serif">Add to Campaign</CardTitle>
                <button
                  onClick={() => setCampaignPickerInfluencer(null)}
                  className="rounded-full p-1 hover:bg-muted transition-colors cursor-pointer"
                >
                  <XIcon className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Invite <span className="font-semibold text-foreground">{campaignPickerInfluencer.name}</span> to one of your campaigns
              </p>
            </CardHeader>
            <CardContent className="space-y-2 pb-4">
              {campaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No campaigns yet. Create one first.</p>
              ) : (
                campaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    onClick={() => setPickedCampaignId(campaign.id)}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left transition-all cursor-pointer",
                      pickedCampaignId === campaign.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                    )}
                  >
                    <p className="text-sm font-semibold">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{campaign.objective}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="secondary" className="text-[10px] h-5">{campaign.status}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {campaign.budget != null ? `THB ${Number(campaign.budget).toLocaleString()}` : "Budget TBD"}
                      </span>
                    </div>
                  </button>
                ))
              )}
              {campaignPickerInfluencer.id.startsWith("url-derived-") && (
                <div className="flex items-center gap-2 text-xs font-medium text-amber-600 pt-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  This creator isn&apos;t registered on InfluApp yet, so they can&apos;t be invited.
                </div>
              )}
              {addConfirmed && (
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 pt-1">
                  <CheckCheck className="h-4 w-4" />
                  Invitation sent to {campaignPickerInfluencer.name}!
                </div>
              )}
              {inviteError && (
                <div className="flex items-center gap-2 text-sm font-semibold text-rose-600 pt-1">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {inviteError}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setCampaignPickerInfluencer(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl"
                  disabled={
                    !pickedCampaignId ||
                    addConfirmed ||
                    inviting ||
                    campaignPickerInfluencer.id.startsWith("url-derived-")
                  }
                  onClick={handleConfirmInvite}
                >
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Invitation"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
