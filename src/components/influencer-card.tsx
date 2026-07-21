"use client";

import { useState } from "react";
import { Influencer } from "@/lib/types";
import { useShortlistStore } from "@/store/useShortlistStore";
import { useUserStore } from "@/store/useUserStore";
import type { IconType } from "react-icons";
import { FaGlobe, FaLinkedinIn, FaMobileAlt } from "react-icons/fa";
import {
  SiFacebook,
  SiInstagram,
  SiTiktok,
  SiX,
  SiXiaohongshu,
  SiYoutube,
} from "react-icons/si";
import { Heart, PlusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PLATFORM_ORDER = ["youtube", "tiktok", "instagram"];

type PlatformPresentation = { Icon: IconType; activeBg: string };

function platformPresentation(platform: string): PlatformPresentation {
  const p = platform.trim().toLowerCase();
  if (p.includes("instagram")) return { Icon: SiInstagram, activeBg: "bg-[#E4405F]" };
  if (p.includes("youtube")) return { Icon: SiYoutube, activeBg: "bg-[#FF0000]" };
  if (p.includes("facebook")) return { Icon: SiFacebook, activeBg: "bg-[#0866FF]" };
  if (p === "x" || p.includes("twitter")) return { Icon: SiX, activeBg: "bg-foreground" };
  if (p.includes("tiktok")) return { Icon: SiTiktok, activeBg: "bg-foreground" };
  if (p.includes("linkedin")) return { Icon: FaLinkedinIn, activeBg: "bg-[#0A66C2]" };
  if (p.includes("lemon8")) return { Icon: FaMobileAlt, activeBg: "bg-[#C6FF00]" };
  if (p.includes("red note") || p.includes("xiaohongshu"))
    return { Icon: SiXiaohongshu, activeBg: "bg-[#FF2442]" };
  return { Icon: FaGlobe, activeBg: "bg-sky-600" };
}

interface InfluencerCardProps {
  influencer: Influencer;
  isActive?: boolean;
  onSelect?: (influencer: Influencer) => void;
  onAddToCampaign?: (influencer: Influencer) => void;
}

/**
 * Uniform creator card — one shape used everywhere (Discover shelf + grid,
 * shortlist). Two equal-feeling halves: a fixed-aspect picture (real photo or a
 * brand-tinted gradient fallback) with name / tags / platform·followers / score
 * / shortlist overlaid, and an info half with REACH + ENGAGE and the Add button.
 * `flex h-full` + `mt-auto` keep every card the same height with the button
 * pinned to the bottom.
 */
export function InfluencerCard({ influencer, isActive = false, onSelect, onAddToCampaign }: InfluencerCardProps) {
  // Canonical order: youtube → tiktok → instagram → rest
  const orderedPlatforms = [
    ...PLATFORM_ORDER.filter((p) => influencer.platforms.includes(p)),
    ...influencer.platforms.filter((p) => !PLATFORM_ORDER.includes(p)),
  ];
  // Default to the primary platform (most followers), not the canonical first.
  // Falls back to canonical order when no per-platform follower data exists.
  const primaryPlatform =
    orderedPlatforms.reduce<{ platform: string; followers: number } | null>((best, p) => {
      const followers = influencer.followersByPlatform?.[p] ?? -1;
      return best === null || followers > best.followers ? { platform: p, followers } : best;
    }, null)?.platform ??
    orderedPlatforms[0] ??
    "";
  const [activePlatform, setActivePlatform] = useState(primaryPlatform);

  const activeFollowers = influencer.followersByPlatform?.[activePlatform] ?? influencer.followers;
  const activeEngagement = influencer.engagementByPlatform?.[activePlatform] ?? influencer.engagementRate;
  const activeHandle = influencer.handleByPlatform?.[activePlatform] ?? null;
  const activeAvatar = influencer.avatarByPlatform?.[activePlatform] ?? influencer.avatarUrl ?? null;
  const [avatarFailed, setAvatarFailed] = useState(false);
  const showAvatarImg = Boolean(activeAvatar) && !avatarFailed;

  // Show the category only, so the card matches what the primary Category
  // filter filters on. (stylePresent / content-style is an advanced filter and
  // deliberately isn't surfaced on the compact card.)
  const tags = [influencer.category].filter(Boolean);

  const { toggle, has } = useShortlistStore();
  const saved = has(influencer.id);
  // Shortlisting is an authed-only feature; logged-out visitors (public Discover
  // reached from the landing page) don't get the heart.
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);

  return (
    <Card
      onClick={() => onSelect?.(influencer)}
      className={cn(
        "group flex h-full cursor-pointer flex-col overflow-hidden border border-border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5",
        isActive ? "ring-2 ring-primary ring-offset-2" : "",
      )}
    >
      {/* Top — picture (fixed aspect so all cards' image regions match) */}
      <div className="relative aspect-[6/5] w-full shrink-0 overflow-hidden">
        {showAvatarImg ? (
          <img
            src={activeAvatar as string}
            alt={`${influencer.name} profile`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-secondary">
            <span className="select-none text-4xl font-black text-white/90">
              {influencer.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/15 to-transparent" />

        {/* shortlist heart (top-left) — authed users only */}
        {isLoggedIn ? (
          <button
            onClick={(e) => { e.stopPropagation(); toggle(influencer.id, influencer); }}
            className={cn(
              "absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-sm transition-colors cursor-pointer",
              saved ? "bg-rose-500/90 text-white" : "bg-card/80 text-muted-foreground hover:text-rose-500",
            )}
            aria-label={saved ? "Remove from shortlist" : "Save to shortlist"}
          >
            <Heart className={cn("h-4 w-4", saved && "fill-current")} />
          </button>
        ) : null}

        {/* score (top-right) */}
        <Badge className="absolute right-2 top-2 border-none bg-card/90 text-primary font-bold backdrop-blur-sm hover:bg-card">
          Score {influencer.performanceScore}
        </Badge>

        {/* overlaid identity (bottom) */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="truncate text-base font-bold tracking-tight text-white font-serif">{influencer.name}</h3>
          {tags.length > 0 && (
            <p className="truncate text-xs font-medium text-white/70">{tags.join(", ")}</p>
          )}
          <p className="mt-0.5 truncate text-xs font-semibold text-emerald-300">
            {activePlatform ? `${activePlatform} · ` : ""}{activeFollowers.toLocaleString()} followers
          </p>
        </div>
      </div>

      {/* Bottom — info. flex-1 so it sizes to its content (button never clipped)
          and stretches to keep grid rows uniform. */}
      <CardContent className="flex flex-1 flex-col gap-2.5 p-4">
        {orderedPlatforms.length > 0 && (
          <div
            className="flex gap-1.5"
            role="tablist"
            aria-label="Switch platform"
            onClick={(e) => e.stopPropagation()}
          >
            {orderedPlatforms.map((platform) => {
              const { Icon, activeBg } = platformPresentation(platform);
              const isActiveTab = platform === activePlatform;
              return (
                <button
                  key={platform}
                  role="tab"
                  aria-selected={isActiveTab}
                  title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                  onClick={(e) => { e.stopPropagation(); setActivePlatform(platform); }}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border transition-all cursor-pointer",
                    isActiveTab
                      ? `${activeBg} border-transparent text-background shadow-sm`
                      : "border-border bg-background hover:bg-muted",
                  )}
                >
                  <Icon className={cn("size-5 shrink-0", isActiveTab ? "text-background" : "text-muted-foreground")} />
                </button>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Total reach</p>
            <p className="text-sm font-bold text-foreground">{activeFollowers.toLocaleString()}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Engagement</p>
            <p className="text-sm font-bold text-foreground">{activeEngagement}%</p>
          </div>
        </div>

        {onAddToCampaign ? (
          <Button
            className="mt-auto w-full rounded-xl font-bold text-sm h-9 shadow-sm"
            onClick={(e) => { e.stopPropagation(); onAddToCampaign(influencer); }}
          >
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
            Add to Campaign
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
