"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X as XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Influencer } from "@/lib/types";
import { CampaignResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

// The picker invites a creator, so only ACTIVE campaigns are valid targets
// (drafts/completed aren't recruiting). Paginate so the list can't overflow the modal.
const CAMPAIGN_PICKER_PAGE_SIZE = 4;

interface AddToCampaignModalProps {
  /** When null the modal renders nothing (closed). */
  influencer: Influencer | null;
  /** All of the brand/agency's campaigns; the modal filters to ACTIVE internally. */
  campaigns: CampaignResponse[];
  pickedCampaignId: string | null;
  onPick: (campaignId: string) => void;
  inviting: boolean;
  addConfirmed: boolean;
  inviteError: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Shared "Add to Campaign" invite picker used by Discover and Shortlist.
 * Owns the ACTIVE-only filter and pagination; the parent owns the invite call
 * (apiInviteToCampaign) and its status state.
 */
export function AddToCampaignModal({
  influencer,
  campaigns,
  pickedCampaignId,
  onPick,
  inviting,
  addConfirmed,
  inviteError,
  onConfirm,
  onClose,
}: AddToCampaignModalProps) {
  const [page, setPage] = useState(0);

  const activeCampaigns = useMemo(
    () => campaigns.filter((c) => c.status === "ACTIVE"),
    [campaigns],
  );
  const pageCount = Math.max(
    1,
    Math.ceil(activeCampaigns.length / CAMPAIGN_PICKER_PAGE_SIZE),
  );
  const pagedCampaigns = activeCampaigns.slice(
    page * CAMPAIGN_PICKER_PAGE_SIZE,
    page * CAMPAIGN_PICKER_PAGE_SIZE + CAMPAIGN_PICKER_PAGE_SIZE,
  );

  // Reset to the first page each time the picker opens for a new creator.
  useEffect(() => {
    setPage(0);
  }, [influencer]);

  if (!influencer) return null;

  const isUrlDerived = influencer.id.startsWith("url-derived-");

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md shadow-2xl border-none"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-serif">Add to Campaign</CardTitle>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-muted transition-colors cursor-pointer"
            >
              <XIcon className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            Invite <span className="font-semibold text-foreground">{influencer.name}</span> to one of your campaigns
          </p>
        </CardHeader>
        <CardContent className="space-y-2 pb-4">
          {activeCampaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No active campaigns. Activate or create one first.</p>
          ) : (
            <>
              {pagedCampaigns.map((campaign) => (
                <button
                  key={campaign.id}
                  onClick={() => onPick(campaign.id)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left transition-all cursor-pointer",
                    pickedCampaignId === campaign.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/50"
                  )}
                >
                  <p className="text-sm font-semibold">{campaign.name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{campaign.objective}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="secondary" className="text-xs h-5">{campaign.status}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {campaign.budget != null ? `THB ${Number(campaign.budget).toLocaleString()}` : "Budget TBD"}
                    </span>
                  </div>
                </button>
              ))}
              {pageCount > 1 && (
                <div className="flex items-center justify-between pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-lg px-3"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" /> Prev
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {page + 1} of {pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-lg px-3"
                    disabled={page >= pageCount - 1}
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  >
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
          {isUrlDerived && (
            <div className="flex items-center gap-2 text-xs font-medium text-amber-600 pt-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              This creator isn&apos;t registered on InfluApp yet, so they can&apos;t be invited.
            </div>
          )}
          {addConfirmed && (
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 pt-1">
              <CheckCheck className="h-4 w-4" />
              Invitation sent to {influencer.name}!
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
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl"
              disabled={!pickedCampaignId || addConfirmed || inviting || isUrlDerived}
              onClick={onConfirm}
            >
              {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Invitation"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
