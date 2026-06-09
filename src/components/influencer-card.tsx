import { getMainFollowerPlatform } from "@/lib/influencer-platforms";
import { Influencer } from "@/lib/types";
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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PlatformPresentation = {
  Icon: IconType;
  /** Passed to SVG so branded marks use realistic colours (`currentColor`). */
  iconClassName: string;
};

function platformPresentation(platform: string): PlatformPresentation {
  const p = platform.trim().toLowerCase();
  if (p.includes("instagram"))
    return { Icon: SiInstagram, iconClassName: "text-[#E4405F]" };
  if (p.includes("youtube"))
    return { Icon: SiYoutube, iconClassName: "text-[#FF0000]" };
  if (p.includes("facebook"))
    return { Icon: SiFacebook, iconClassName: "text-[#0866FF]" };
  if (p === "x" || p.includes("twitter"))
    return { Icon: SiX, iconClassName: "text-black dark:text-white" };
  if (p.includes("tiktok"))
    return { Icon: SiTiktok, iconClassName: "text-black dark:text-white" };
  if (p.includes("linkedin"))
    return { Icon: FaLinkedinIn, iconClassName: "text-[#0A66C2]" };
  if (p.includes("lemon8"))
    return {
      Icon: FaMobileAlt,
      iconClassName: "text-[#C6FF00]",
    };
  if (p.includes("red note") || p.includes("xiaohongshu"))
    return { Icon: SiXiaohongshu, iconClassName: "text-[#FF2442]" };
  return { Icon: FaGlobe, iconClassName: "text-sky-600" };
}

interface InfluencerCardProps {
  influencer: Influencer;
  isActive?: boolean;
  onSelect?: (influencer: Influencer) => void;
}

export function InfluencerCard({ influencer, isActive = false, onSelect }: InfluencerCardProps) {
  const fallbackAvatar = `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(influencer.name)}`;
  const avatarUrl = influencer.avatarUrl ?? fallbackAvatar;
  // Prefer video thumbnail for card hero (richer visual), fall back to channel avatar
  const cardBg = influencer.latestVideo?.thumbnail ?? avatarUrl;
  const main = getMainFollowerPlatform(influencer);
  const presentationTags = Array.from(
    new Set([influencer.category, ...influencer.stylePresent].filter(Boolean)),
  );

  return (
    <Card
      onClick={() => onSelect?.(influencer)}
      className={cn(
        "group cursor-pointer overflow-hidden border-none shadow-sm transition-all hover:shadow-xl hover:translate-y-[-4px]",
        isActive ? "ring-2 ring-primary ring-offset-2" : ""
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={cardBg}
          alt={`${influencer.name} profile`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/20 to-transparent" />
        
        <div className="absolute top-3 right-3">
          <Badge className="bg-card/90 text-primary font-bold backdrop-blur-sm border-none shadow-sm hover:bg-card">
            Score {influencer.performanceScore}
          </Badge>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="truncate text-lg font-bold text-white tracking-tight font-serif">{influencer.name}</h3>
          <div className="mt-2 flex flex-wrap gap-1">
            {presentationTags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-1 truncate text-xs font-semibold text-emerald-400">
            {main.platform} · {main.followers.toLocaleString()}
          </p>
        </div>
      </div>

      <CardContent className="p-4 space-y-4 bg-background">
        <div className="flex flex-wrap gap-1.5" role="list">
          {influencer.platforms.map((platform) => {
            const { Icon, iconClassName } = platformPresentation(platform);
            return (
              <div
                key={platform}
                title={platform}
                className="flex size-8 items-center justify-center rounded-full border border-border bg-muted/50 transition-colors hover:bg-muted"
              >
                <Icon className={cn("size-4 shrink-0", iconClassName)} />
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-muted/80 p-2.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Reach</p>
            <p className="text-sm font-bold text-foreground">{influencer.followers.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-muted/80 p-2.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Engage</p>
            <p className="text-sm font-bold text-foreground">{influencer.engagementRate}%</p>
          </div>
        </div>

        <Button 
          className="w-full rounded-xl font-bold text-xs h-10 shadow-sm"
          onClick={(e) => { e.stopPropagation(); }}
        >
          Add to Campaign
        </Button>
      </CardContent>
    </Card>
  );
}
