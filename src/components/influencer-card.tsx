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
  /**
   * Visual treatment. "default" is the shadcn card used by /shortlist and the
   * authenticated Discover — do not change its output. "travelogue" is the
   * opt-in skin for logged-out Discover: squared paper edges, hairline borders,
   * terracotta accent, no drop shadows (the design brief builds depth from
   * tonal layering, not shadows). Passed explicitly so authenticated surfaces
   * are never re-skinned by proximity.
   */
  skin?: "default" | "travelogue";
  /** Denser layout (shorter cover, tighter padding, smaller controls) for grids
   *  that pack more cards per row, e.g. /shortlist. Default keeps Discover's size. */
  compact?: boolean;
}

/**
 * Uniform creator card — one shape used everywhere (Discover shelf + grid,
 * shortlist). Two equal-feeling halves: a fixed-aspect picture (real photo or a
 * brand-tinted gradient fallback) with name / tags / platform·followers / score
 * / shortlist overlaid, and an info half with REACH + ENGAGE and the Add button.
 * `flex h-full` + `mt-auto` keep every card the same height with the button
 * pinned to the bottom.
 */
export function InfluencerCard({ influencer, isActive = false, onSelect, onAddToCampaign, skin = "default", compact = false }: InfluencerCardProps) {
  const tv = skin === "travelogue";
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
        "group flex h-full cursor-pointer flex-col overflow-hidden transition-all",
        tv
          ? "rounded-tv-lg border border-tv-outline-variant bg-tv-surface-container-lowest shadow-none hover:border-tv-primary"
          : "border border-border bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5",
        isActive
          ? tv ? "border-tv-primary ring-1 ring-tv-primary" : "ring-2 ring-primary ring-offset-2"
          : "",
      )}
    >
      {/* Top — picture (fixed aspect so all cards' image regions match) */}
      <div className={cn("relative w-full shrink-0 overflow-hidden", compact ? "aspect-[3/2]" : "aspect-[6/5]")}>
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

        {/* score (top-right) — opaque fill so it stays legible over any avatar,
            including solid-black images. The tv-* tokens resolve in both the
            public (.tv-scope marketing layout) and authed (.app-tv .tv-scope
            shell) contexts — see app-shell + globals.css. */}
        <span
          className={cn(
            "absolute right-2 top-2 inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold shadow-sm",
            tv
              ? "rounded-tv-lg border-tv-outline-variant bg-tv-surface font-tv-body text-tv-label-caps uppercase text-tv-primary"
              : "rounded-md border-transparent bg-card font-bold text-primary",
          )}
        >
          Score {influencer.performanceScore}
        </span>

        {/* overlaid identity (bottom) */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className={cn("truncate text-white", tv ? "font-tv-serif text-lg" : "text-base font-bold tracking-tight font-serif")}>{influencer.name}</h3>
          {tags.length > 0 && (
            <p className={cn("truncate text-white/70", tv ? "font-tv-body text-tv-label-caps uppercase" : "text-xs font-medium")}>{tags.join(", ")}</p>
          )}
          <p className={cn("mt-0.5 truncate text-xs font-semibold", tv ? "font-tv-body text-tv-primary-fixed" : "text-emerald-300")}>
            {activePlatform ? `${activePlatform} · ` : ""}{activeFollowers.toLocaleString()} followers
          </p>
        </div>
      </div>

      {/* Bottom — info. flex-1 so it sizes to its content (button never clipped)
          and stretches to keep grid rows uniform. */}
      <CardContent className={cn("flex flex-1 flex-col", compact ? "gap-2 p-3" : "gap-2.5 p-4")}>
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
                    "flex items-center justify-center rounded-full border transition-all cursor-pointer",
                    compact ? "h-7 w-7" : "h-9 w-9",
                    isActiveTab
                      ? `${activeBg} border-transparent text-background shadow-sm`
                      : "border-border bg-background hover:bg-muted",
                  )}
                >
                  <Icon className={cn("shrink-0", compact ? "size-4" : "size-5", isActiveTab ? "text-background" : "text-muted-foreground")} />
                </button>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-0.5">
            <p className={cn("text-[9px] uppercase tracking-widest", tv ? "font-tv-body font-semibold text-tv-muted-text" : "font-bold text-muted-foreground")}>Total reach</p>
            <p className={cn("text-sm font-bold", tv ? "font-tv-serif text-tv-on-surface" : "text-foreground")}>{activeFollowers.toLocaleString()}</p>
          </div>
          <div className="space-y-0.5">
            <p className={cn("text-[9px] uppercase tracking-widest", tv ? "font-tv-body font-semibold text-tv-muted-text" : "font-bold text-muted-foreground")}>Engagement</p>
            <p className={cn("text-sm font-bold", tv ? "font-tv-serif text-tv-on-surface" : "text-foreground")}>{activeEngagement}%</p>
          </div>
        </div>

        {onAddToCampaign ? (
          <Button
            className={cn(
              "mt-auto w-full",
              compact ? "h-8 text-xs" : "h-9 text-sm",
              tv
                ? "rounded-tv-lg bg-tv-primary font-tv-body text-tv-label-caps uppercase text-tv-on-primary shadow-none hover:bg-tv-primary-container"
                : "rounded-xl font-bold shadow-sm",
            )}
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
