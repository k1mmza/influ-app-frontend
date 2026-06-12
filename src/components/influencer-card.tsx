"use client";

import { useState } from "react";
import { getMainFollowerPlatform } from "@/lib/influencer-platforms";
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
import { Heart, PlusCircle, RefreshCw } from "lucide-react";
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

export function InfluencerCard({ influencer, isActive = false, onSelect, onAddToCampaign }: InfluencerCardProps) {
  // Canonical order: youtube → tiktok → instagram → rest
  const orderedPlatforms = [
    ...PLATFORM_ORDER.filter((p) => influencer.platforms.includes(p)),
    ...influencer.platforms.filter((p) => !PLATFORM_ORDER.includes(p)),
  ];
  const [activePlatform, setActivePlatform] = useState(orderedPlatforms[0] ?? "");

  const activeFollowers = influencer.followersByPlatform?.[activePlatform] ?? influencer.followers;
  const activeEngagement = influencer.engagementByPlatform?.[activePlatform] ?? influencer.engagementRate;
  const activeSyncedAt = influencer.syncedAtByPlatform?.[activePlatform] ?? influencer.lastDataPulledAt;
  const activeAvatar = influencer.avatarByPlatform?.[activePlatform] ?? influencer.avatarUrl;

  const fallbackAvatar = `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(influencer.name)}`;
  const cardBg = activeAvatar ?? fallbackAvatar;

  const presentationTags = Array.from(
    new Set([influencer.category, ...(influencer.stylePresent ?? [])].filter(Boolean)),
  );
  const { toggle, has } = useShortlistStore();
  const saved = has(influencer.id);
  const multiPlatform = orderedPlatforms.length > 1;

  return (
    <Card
      onClick={() => onSelect?.(influencer)}
      className={cn(
        "group cursor-pointer overflow-hidden border-none shadow-sm transition-all hover:shadow-xl hover:translate-y-[-4px]",
        isActive ? "ring-2 ring-primary ring-offset-2" : "",
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={cardBg}
          alt={`${influencer.name} profile`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => { (e.target as HTMLImageElement).src = fallbackAvatar; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/20 to-transparent" />

        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); toggle(influencer.id); }}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-colors cursor-pointer",
              saved ? "bg-rose-500/90 text-white" : "bg-card/80 text-muted-foreground hover:text-rose-500",
            )}
            aria-label={saved ? "Remove from shortlist" : "Save to shortlist"}
          >
            <Heart className={cn("h-4 w-4", saved && "fill-current")} />
          </button>
          <Badge className="bg-card/90 text-primary font-bold backdrop-blur-sm border-none shadow-sm hover:bg-card">
            Score {influencer.performanceScore}
          </Badge>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="truncate text-lg font-bold text-white tracking-tight font-serif">{influencer.name}</h3>
          <div className="mt-2 flex flex-wrap gap-1">
            {presentationTags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-1 truncate text-xs font-semibold text-emerald-400">
            {activePlatform} · {activeFollowers.toLocaleString()}
          </p>
        </div>
      </div>

      <CardContent className="p-4 space-y-3 bg-background">
        {/* Platform switcher pills — only when 2+ platforms */}
        {multiPlatform && (
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
                    "flex h-7 w-7 items-center justify-center rounded-full border transition-all cursor-pointer",
                    isActiveTab
                      ? `${activeBg} border-transparent text-white shadow-sm`
                      : "border-border bg-muted/50 hover:bg-muted",
                  )}
                >
                  <Icon className={cn("size-3.5 shrink-0", isActiveTab ? "text-white" : iconClassName)} />
                </button>
              );
            })}
          </div>
        )}

        {/* Stats for active platform */}
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
          className="w-full rounded-xl font-bold text-xs h-10 shadow-sm"
          onClick={(e) => { e.stopPropagation(); onAddToCampaign?.(influencer); }}
        >
          <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
          Add to Campaign
        </Button>

        {activeSyncedAt && (
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <RefreshCw className="h-2.5 w-2.5 shrink-0" />
            Data as of{" "}
            {new Date(activeSyncedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
