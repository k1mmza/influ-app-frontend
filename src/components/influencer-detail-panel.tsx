import { getMainFollowerPlatform, getShowcaseDemoEmbed, getTopAvgViewsPlatform } from "@/lib/influencer-platforms";
import { Influencer } from "@/lib/types";

interface InfluencerMeta {
  country: string;
  city: string;
  extraPlatforms: string[];
  audienceCountryPercent: number;
  averageViews: number;
  growthRate: number;
  keywords: string[];
  intents: string[];
  audienceGender: string;
  audienceAgeGroup: string;
  qualityScore: number;
  responseRate: number;
}

interface InfluencerDetailPanelProps {
  influencer: Influencer;
  meta: InfluencerMeta;
  onClose: () => void;
}

const getTopCountries = (country: string) => {
  const map: Record<string, string[]> = {
    Thailand: ["Thailand", "Vietnam", "Malaysia"],
    Vietnam: ["Vietnam", "Thailand", "Singapore"],
    Singapore: ["Singapore", "Malaysia", "Indonesia"],
    Malaysia: ["Malaysia", "Thailand", "Indonesia"]
  };

  return map[country] ?? [country, "Thailand", "Singapore"];
};

const getTopCities = (city: string) => [city, "Bangkok", "Ho Chi Minh City"];

const getTone = (styles: string[]) => {
  if (styles.includes("Review")) return "Educational";
  if (styles.includes("Storytelling")) return "Story-driven";
  if (styles.includes("Vlog")) return "Lifestyle";
  return "Balanced";
};

export function InfluencerDetailPanel({ influencer, meta, onClose }: InfluencerDetailPanelProps) {
  const topCountries = getTopCountries(meta.country);
  const topCities = getTopCities(meta.city);
  const engagementAuthenticity = Math.min(99, Math.round((meta.qualityScore + influencer.performanceScore) / 2));
  const consistencyScore = Math.min(100, Math.round((meta.growthRate * 6 + influencer.engagementRate * 5) / 2));
  const estimatedCpm = Math.max(1, Math.round((influencer.ratePerPost / Math.max(meta.averageViews, 1)) * 1000));
  const estimatedCostPerEngagement = (influencer.ratePerPost / Math.max(meta.averageViews * (influencer.engagementRate / 100), 1)).toFixed(2);
  const avatarUrl = `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(influencer.name)}`;
  const allPlatforms = [...influencer.platforms, ...meta.extraPlatforms];
  const mainFollowers = getMainFollowerPlatform(influencer);
  const topByViews = getTopAvgViewsPlatform(influencer);
  const showcaseEmbed = getShowcaseDemoEmbed(topByViews.platform, influencer.id);
  const headlineAvgViews = topByViews.avgViews > 0 ? topByViews.avgViews : meta.averageViews;

  return (
    <aside className="fixed right-4 top-20 z-30 h-[calc(100vh-6rem)] w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 p-4 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={avatarUrl} alt={`${influencer.name} profile`} className="h-12 w-12 rounded-full border border-slate-200" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">Creator media kit</p>
                <p className="text-lg font-semibold text-slate-900">{influencer.name}</p>
                <p className="text-xs text-slate-600">
                  @{influencer.name.toLowerCase().replace(/\s+/g, "")} • {meta.city}, {meta.country}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </header>

        <div className="space-y-4 overflow-y-auto p-4 text-sm">
          <section className="rounded-xl border border-indigo-100 bg-gradient-to-b from-indigo-50/80 to-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Spotlight · highest avg views</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white">{topByViews.platform}</span>
              <span className="text-xs text-slate-600">~{headlineAvgViews.toLocaleString()} avg views on this platform</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Demo sample video for this platform — not this creator’s real post.</p>
            {showcaseEmbed.kind === "iframe" ? (
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-black shadow-inner">
                <div className="relative aspect-video w-full">
                  <iframe
                    title={showcaseEmbed.title}
                    src={showcaseEmbed.src}
                    className="absolute inset-0 h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (
              <a
                href={showcaseEmbed.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-indigo-700 shadow-sm hover:bg-slate-50"
              >
                {showcaseEmbed.label}
              </a>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Identity &amp; platforms</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {allPlatforms.map((platform) => (
                <span key={platform} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                  {platform}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Primary footprint:</span> {mainFollowers.platform} ·{" "}
              {mainFollowers.followers.toLocaleString()} followers
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-slate-500">Total reach</p>
                <p className="font-semibold text-slate-900">{influencer.followers.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-slate-500">Avg views</p>
                <p className="font-semibold text-slate-900">{meta.averageViews.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-slate-500">Engagement</p>
                <p className="font-semibold text-slate-900">{influencer.engagementRate}%</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-slate-500">Growth</p>
                <p className="font-semibold text-slate-900">{meta.growthRate}%</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Performance benchmarks</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg bg-indigo-50 p-2">
                <p className="text-indigo-600">Platform Score</p>
                <p className="font-semibold text-indigo-900">{influencer.performanceScore}/100</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2">
                <p className="text-emerald-600">Consistency</p>
                <p className="font-semibold text-emerald-900">{consistencyScore}/100</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2">
                <p className="text-amber-600">30d Trend</p>
                <p className="font-semibold text-amber-900">{meta.growthRate > 0 ? "Up" : "Down"}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Audience snapshot</p>
            <div className="mt-2 space-y-1 text-xs text-slate-700">
              <p>Gender mix: {meta.audienceGender}</p>
              <p>Age group: {meta.audienceAgeGroup}</p>
              <p>Top countries: {topCountries.join(", ")}</p>
              <p>Top cities: {topCities.join(", ")}</p>
              <p>Audience quality: {meta.qualityScore}/100</p>
              <p>Engagement authenticity: {engagementAuthenticity}%</p>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Content reel (preview)</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="rounded-lg border border-slate-200 p-2 text-xs">
                  <div className="mb-2 h-12 rounded bg-slate-100" />
                  <p className="font-medium text-slate-800">Top Post #{item}</p>
                  <p className="text-slate-600">{Math.round(meta.averageViews * (1.2 - item * 0.1)).toLocaleString()} views</p>
                  <p className="text-slate-600">{Math.round(meta.averageViews * 0.03).toLocaleString()} likes</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Niche, tone &amp; tags</p>
            <p className="mt-2 text-xs text-slate-700">Tone: {getTone(influencer.stylePresent)}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {meta.keywords.map((word) => (
                <span key={word} className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs text-indigo-700">
                  #{word}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rate card &amp; estimates</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-slate-500">Price / Post</p>
                <p className="font-semibold text-slate-900">${influencer.ratePerPost}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-slate-500">Price / Video</p>
                <p className="font-semibold text-slate-900">${Math.round(influencer.ratePerPost * 1.3)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-slate-500">Est. CPM</p>
                <p className="font-semibold text-slate-900">${estimatedCpm}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-slate-500">Cost / Engagement</p>
                <p className="font-semibold text-slate-900">${estimatedCostPerEngagement}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Turnaround &amp; reliability</p>
            <div className="mt-2 space-y-1 text-xs text-slate-700">
              <p>Status: {meta.responseRate >= 75 ? "Available" : "Busy"}</p>
              <p>Response rate: {meta.responseRate}%</p>
              <p>Avg response time: {meta.responseRate >= 75 ? "2-6 hours" : "12-24 hours"}</p>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Featured collaborations</p>
            <ul className="mt-2 space-y-1 text-xs text-slate-700">
              <li>GlowLab - Product seeding campaign</li>
              <li>Nova Retail - Seasonal launch bundle</li>
              <li>Peak Media - UGC conversion sprint</li>
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next step</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" className="rounded-lg bg-indigo-600 px-2 py-2 text-xs font-semibold text-white hover:bg-indigo-700">
                Add to list
              </button>
              <button type="button" className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                Send Message
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Request the full PDF kit or historical screenshots from the creator in chat.</p>
          </section>
        </div>
      </div>
    </aside>
  );
}
