"use client";

import { useState } from "react";
import { Influencer } from "@/lib/types";
import { useShortlistStore } from "@/store/useShortlistStore";
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

type PlatformPresentation = { Icon: IconType; iconClassName: string; activeBg: string };

function platformPresentation(platform: string): PlatformPresentation {
  const p = platform.trim().toLowerCase();
  if (p.includes("instagram"))
    return { Icon: SiInstagram, iconClassName: "text-[#E4405F]", activeBg: "bg-[#E4405F]" };
  if (p.includes("youtube"))
    return { Icon: SiYoutube, iconClassName: "text-[#FF0000]", activeBg: "bg-[#FF0000]" };
  if (p.includes("facebook"))
    return { Icon: SiFacebook, iconClassName: "text-[#0866FF]", activeBg: "bg-[#0866FF]" };
  if (p === "x" || p.includes("twitter"))
    return { Icon: SiX, iconClassName: "text-foreground", activeBg: "bg-foreground" };
  if (p.includes("tiktok"))
    return { Icon: SiTiktok, iconClassName: "text-foreground", activeBg: "bg-foreground" };
  if (p.includes("linkedin"))
    return { Icon: FaLinkedinIn, iconClassName: "text-[#0A66C2]", activeBg: "bg-[#0A66C2]" };
  if (p.includes("lemon8"))
    return { Icon: FaMobileAlt, iconClassName: "text-[#C6FF00]", activeBg: "bg-[#C6FF00]" };
  if (p.includes("red note") || p.includes("xiaohongshu"))
    return { Icon: SiXiaohongshu, iconClassName: "text-[#FF2442]", activeBg: "bg-[#FF2442]" };
  return { Icon: FaGlobe, iconClassName: "text-sky-600", activeBg: "bg-sky-600" };
}

interface InfluencerCardProps {
  influencer: Influencer;
  isActive?: boolean;
  onSelect?: (influencer: Influencer) => void;
  onAddToCampaign?: (influencer: Influencer) => void;
}

/**
 * Compact creator card — one shape used everywhere (Discover shelf + grid,
 * shortlist). Small avatar (real photo, or a brand-tinted gradient fallback at
 * avatar size), identity, score + shortlist heart, per-platform switcher, and
 * REACH / ENGAGE only. No cover band, no avg-views cell, no "data as of" line.
 */
export function InfluencerCard({ influencer, isActive = false, onSelect, onAddToCampaign }: InfluencerCardProps) {
  // Canonical order: youtube → tiktok → instagram → rest
  const orderedPlatforms = [
    ...PLATFORM_ORDER.filter((p) => influencer.platforms.includes(p)),
    ...influencer.platforms.filter((p) => !PLATFORM_ORDER.includes(p)),
  ];
  const [activePlatform, setActivePlatform] = useState(orderedPlatforms[0] ?? "");

  const activeFollowers = influencer.followersByPlatform?.[activePlatform] ?? influencer.followers;
  const activeEngagement = influencer.engagementByPlatform?.[activePlatform] ?? influencer.engagementRate;
  const activeHandle = influencer.handleByPlatform?.[activePlatform] ?? null;
  const activeAvatar = influencer.avatarByPlatform?.[activePlatform] ?? influencer.avatarUrl;
  const [avatarFailed, setAvatarFailed] = useState(false);
  const showAvatarImg = Boolean(activeAvatar) && !avatarFailed;

  const { toggle, has } = useShortlistStore();
  const saved = has(influencer.id);

  return (
    <Card
      onClick={() => onSelect?.(influencer)}
      className={cn(
        "group cursor-pointer overflow-hidden border border-border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5",
        isActive ? "ring-2 ring-primary ring-offset-2" : "",
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Identity row: small avatar + name/handle/category + score & heart */}
        <div className="flex items-start gap-3">
          <div className="relative h-12 w-12 shrink-0">
            {showAvatarImg ? (
              <img
                src={activeAvatar as string}
                alt={`${influencer.name} avatar`}
                className="h-12 w-12 rounded-xl object-cover"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-base font-bold text-white">
                {influencer.name.charAt(0).toUpperCase()}
              </div>
            )}
            {activePlatform && (() => {
              const { Icon, iconClassName } = platformPresentation(activePlatform);
              return (
                <span
                  title={activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)}
                  className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border"
                >
                  <Icon className={cn("size-3 shrink-0", iconClassName)} />
                </span>
              );
            })()}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold tracking-tight text-foreground font-serif">{influencer.name}</h3>
            {activeHandle && (
              <p className="truncate text-xs font-medium text-muted-foreground">@{activeHandle.replace(/^@/, "")}</p>
            )}
            {influencer.category && (
              <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {influencer.category}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); toggle(influencer.id, influencer); }}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors cursor-pointer",
                saved ? "bg-rose-500/90 text-white" : "bg-muted text-muted-foreground hover:text-rose-500",
              )}
              aria-label={saved ? "Remove from shortlist" : "Save to shortlist"}
            >
              <Heart className={cn("h-3.5 w-3.5", saved && "fill-current")} />
            </button>
            <Badge className="border-none bg-primary/10 text-primary font-bold text-[10px] hover:bg-primary/10">
              Score {influencer.performanceScore}
            </Badge>
          </div>
        </div>

        {/* Platform switcher — drives the per-platform Reach/Engage below */}
        {orderedPlatforms.length > 1 && (
          <div
            className="flex gap-1.5"
            role="tablist"
            aria-label="Switch platform"
            onClick={(e) => e.stopPropagation()}
          >
            {orderedPlatforms.map((platform) => {
              const { Icon, iconClassName, activeBg } = platformPresentation(platform);
              const isActiveTab = platform === activePlatform;
              return (
                <button
                  key={platform}
                  role="tab"
                  aria-selected={isActiveTab}
                  title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                  onClick={(e) => { e.stopPropagation(); setActivePlatform(platform); }}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border transition-all cursor-pointer",
                    isActiveTab
                      ? `${activeBg} border-transparent text-white shadow-sm`
                      : "border-border bg-muted/50 hover:bg-muted",
                  )}
                >
                  <Icon className={cn("size-3 shrink-0", isActiveTab ? "text-white" : iconClassName)} />
                </button>
              );
            })}
          </div>
        )}

        {/* Stats — REACH + ENGAGE only */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-muted/80 p-2.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Reach</p>
            <p className="text-sm font-bold text-foreground">{activeFollowers.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-muted/80 p-2.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Engage</p>
            <p className="text-sm font-bold text-foreground">{activeEngagement}%</p>
          </div>
        </div>

        <Button
          className="w-full rounded-xl font-bold text-xs h-9 shadow-sm"
          onClick={(e) => { e.stopPropagation(); onAddToCampaign?.(influencer); }}
        >
          <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
          Add to Campaign
        </Button>
      </CardContent>
    </Card>
  );
}
