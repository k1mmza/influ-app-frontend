import { Influencer } from "@/lib/types";

export function getTopAvgViewsPlatform(influencer: Influencer): { platform: string; avgViews: number } {
  const entries = Object.entries(influencer.avgViewsByPlatform);
  if (entries.length === 0) {
    const main = getMainFollowerPlatform(influencer);
    return { platform: main.platform, avgViews: 0 };
  }
  let bestPlatform = entries[0]![0];
  let bestViews = entries[0]![1];
  for (const [platform, views] of entries) {
    if (views > bestViews) {
      bestPlatform = platform;
      bestViews = views;
    }
  }
  return { platform: bestPlatform, avgViews: bestViews };
}

/** Deterministic demo embed for discover detail (not the creator’s real upload). */
export function getShowcaseDemoEmbed(
  platformName: string,
  influencerId: string
): { kind: "iframe"; src: string; title: string } | { kind: "external"; href: string; label: string; title: string } {
  const pick = (salt: string, list: string[]) => {
    const seed = influencerId + salt;
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return list[h % list.length]!;
  };

  const p = platformName.toLowerCase();

  if (p.includes("youtube")) {
    const id = pick("yt", ["jfKfPfyJRdk", "L_LUpnjgPso", "nxg4C365LbQ"]);
    return {
      kind: "iframe",
      src: `https://www.youtube.com/embed/${id}?rel=0`,
      title: `${platformName} preview (demo)`
    };
  }

  if (p.includes("tiktok")) {
    const vid = pick("tt", ["7251280955097675019", "7318778849472299272", "7235595409795155205"]);
    return {
      kind: "iframe",
      src: `https://www.tiktok.com/embed/v2/${vid}`,
      title: `${platformName} preview (demo)`
    };
  }

  if (p.includes("instagram")) {
    return {
      kind: "external",
      href: `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(platformName + " creator")}`,
      label: "Open Instagram",
      title: "Instagram preview opens in a new tab (embed limited)"
    };
  }

  const id = pick("fallback", ["jfKfPfyJRdk", "L_LUpnjgPso"]);
  return {
    kind: "iframe",
    src: `https://www.youtube.com/embed/${id}?rel=0`,
    title: "Video preview (demo)"
  };
}

export function getMainFollowerPlatform(influencer: Influencer): { platform: string; followers: number } {
  const entries = Object.entries(influencer.followersByPlatform);
  if (entries.length === 0) {
    return { platform: influencer.platforms[0] ?? "Instagram", followers: influencer.followers };
  }
  let bestPlatform = entries[0]![0];
  let bestCount = entries[0]![1];
  for (const [platform, count] of entries) {
    if (count > bestCount) {
      bestPlatform = platform;
      bestCount = count;
    }
  }
  return { platform: bestPlatform, followers: bestCount };
}
