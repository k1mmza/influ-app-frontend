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
  const avatarUrl = `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(influencer.name)}`;
  const main = getMainFollowerPlatform(influencer);
  const presentationTags = Array.from(
    new Set([influencer.category, ...influencer.stylePresent].filter(Boolean)),
  );

  return (
    <article
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={() => onSelect?.(influencer)}
      onKeyDown={(event) => {
        if (!onSelect) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(influencer);
        }
      }}
      className={`w-full overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${
        isActive ? "border-indigo-400 ring-2 ring-indigo-200" : "border-slate-200"
      } ${onSelect ? "cursor-pointer" : ""}`}
    >
      <div className="relative border-b border-slate-100">
        <img src={avatarUrl} alt={`${influencer.name} profile`} className="h-60 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
        <span className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-indigo-700 shadow-sm backdrop-blur-sm">
          Score {influencer.performanceScore}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-white">{influencer.name}</h3>
            <p className="mt-2 line-clamp-2 text-sm text-slate-100">
              {presentationTags.join(", ")}
            </p>
            <p className="mt-2 truncate text-xs font-medium text-emerald-100">
              {main.platform} · {main.followers.toLocaleString()} followers
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-1.5" role="list" aria-label="Supported platforms">
          {influencer.platforms.map((platform) => {
            const { Icon, iconClassName } = platformPresentation(platform);
            return (
              <span
                key={platform}
                role="listitem"
                title={platform}
                className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white"
              >
                <Icon className={`size-[22px] shrink-0 ${iconClassName}`} aria-hidden />
                <span className="sr-only">{platform}</span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 px-4 pb-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-slate-50 p-2.5">
            <p className="text-slate-500">Total reach</p>
            <p className="font-semibold text-slate-900">{influencer.followers.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5">
            <p className="text-slate-500">Engagement</p>
            <p className="font-semibold text-slate-900">{influencer.engagementRate}%</p>
          </div>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
          }}
          className="w-full rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Add to list
        </button>
      </div>
    </article>
  );
}
