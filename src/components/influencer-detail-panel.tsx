import { useState } from "react";
import { getShowcaseDemoEmbed, getTopAvgViewsPlatform } from "@/lib/influencer-platforms";
import { Influencer } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  X,
  MapPin,
  BarChart3,
  Users,
  MessageCircle,
  PlusCircle,
  ExternalLink,
  FileText,
  RefreshCw,
  TrendingUp,
  AtSign,
} from "lucide-react";
import { SiYoutube, SiTiktok, SiInstagram, SiFacebook, SiX as SiXIcon } from "react-icons/si";
import { FaGlobe } from "react-icons/fa";
import { cn } from "@/lib/utils";

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
  audienceTopLocations?: string[] | null;
  qualityScore: number;
  audienceQualityScore?: number | null;
  responseRate: number;
  bio?: string | null;
  // YouTube Analytics fields (populated from PlatformAccount + AudienceInsight)
  watchTimeMins?: number | null;
  avgViewDuration?: number | null;
  avgViewPct?: number | null;
  subscribersGained?: number | null;
  topCountries?: { country: string; viewPct: number }[] | null;
  audienceInsights?: {
    malePct: number | null;
    femalePct: number | null;
    ageDistribution: Record<string, number> | null;
  } | null;
}

interface InfluencerDetailPanelProps {
  influencer: Influencer;
  meta: InfluencerMeta;
  onClose: () => void;
  onAddToCampaign?: (influencer: Influencer) => void;
  onMessage?: (influencer: Influencer) => void;
}

const PLATFORM_ORDER = ["youtube", "tiktok", "instagram"];

/** Format seconds as "m:ss" */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Format watch time: show hours if >= 60 minutes, else minutes */
function formatWatchTime(minutes: number): string {
  if (minutes >= 60) {
    const h = (minutes / 60).toFixed(1);
    return `${h}h`;
  }
  return `${Math.round(minutes)}m`;
}

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const p = platform.toLowerCase();
  if (p === "youtube") return <SiYoutube className={className} />;
  if (p === "tiktok") return <SiTiktok className={className} />;
  if (p === "instagram") return <SiInstagram className={className} />;
  if (p === "facebook") return <SiFacebook className={className} />;
  if (p === "x" || p === "twitter") return <SiXIcon className={className} />;
  return <FaGlobe className={className} />;
}

const PLATFORM_ACTIVE_BG: Record<string, string> = {
  youtube: "bg-[#FF0000]",
  tiktok: "bg-slate-900 dark:bg-slate-100",
  instagram: "bg-[#E4405F]",
  facebook: "bg-[#0866FF]",
};

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

export function InfluencerDetailPanel({ influencer, meta, onClose, onAddToCampaign, onMessage }: InfluencerDetailPanelProps) {
  const orderedPlatforms = [
    ...PLATFORM_ORDER.filter((p) => influencer.platforms.includes(p)),
    ...influencer.platforms.filter((p) => !PLATFORM_ORDER.includes(p)),
  ];
  const [activePlatform, setActivePlatform] = useState(orderedPlatforms[0] ?? "youtube");

  // Active platform data
  const activeFollowers = influencer.followersByPlatform?.[activePlatform] ?? influencer.followers;
  const activeEngagement = influencer.engagementByPlatform?.[activePlatform] ?? influencer.engagementRate;
  const activeAvgViews = influencer.avgViewsByPlatform?.[activePlatform] ?? meta.averageViews;
  const activeSyncedAt = influencer.syncedAtByPlatform?.[activePlatform] ?? influencer.lastDataPulledAt;
  const activeHandle = influencer.handleByPlatform?.[activePlatform] ?? influencer.handle;
  const activeAvatar = influencer.avatarByPlatform?.[activePlatform] ?? influencer.avatarUrl;
  const realVideo = influencer.spotlightByPlatform?.[activePlatform] ?? influencer.spotlightVideo;

  // Per-platform analytics (for YouTube Analytics section)
  const activeWatchTimeMins = influencer.watchTimeMinsByPlatform?.[activePlatform] ?? meta.watchTimeMins ?? null;
  const activeAvgViewDuration = influencer.avgViewDurationByPlatform?.[activePlatform] ?? meta.avgViewDuration ?? null;
  const activeAvgViewPct = influencer.avgViewPctByPlatform?.[activePlatform] ?? meta.avgViewPct ?? null;
  const activeSubscribersGained = influencer.subscribersGainedByPlatform?.[activePlatform] ?? meta.subscribersGained ?? null;
  const activeTopCountries = influencer.topCountriesByPlatform?.[activePlatform] ?? meta.topCountries ?? null;
  const activeAudienceInsights = influencer.audienceInsightsByPlatform?.[activePlatform] ?? meta.audienceInsights ?? null;

  const hasYouTubeOnlyMetrics =
    activePlatform === "youtube" &&
    (activeWatchTimeMins != null ||
      activeAvgViewDuration != null ||
      activeAvgViewPct != null ||
      activeSubscribersGained != null);

  const hasPlatformInsights =
    activeAudienceInsights != null ||
    (activeTopCountries && activeTopCountries.length > 0);

  // Synced per-platform countries win; then the creator's self-reported audience
  // locations; then a guess derived from the creator's own country.
  const topLocationNames: string[] =
    activeTopCountries && activeTopCountries.length > 0
      ? activeTopCountries.map((c) => c.country)
      : meta.audienceTopLocations && meta.audienceTopLocations.length > 0
      ? meta.audienceTopLocations
      : meta.country
      ? getTopCountries(meta.country)
      : [];
  const estimatedCpm = influencer.ratePerPost
    ? Math.max(1, Math.round((influencer.ratePerPost / Math.max(activeAvgViews, 1)) * 1000))
    : null;
  const fallbackAvatar = `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(influencer.name)}`;
  const avatarUrl = activeAvatar ?? fallbackAvatar;
  const showcaseEmbed = getShowcaseDemoEmbed(activePlatform, influencer.id);
  const spotlightExternalUrl =
    activePlatform === "instagram" ? `https://www.instagram.com/p/${realVideo?.id}/`
    : activePlatform === "tiktok" ? `https://www.tiktok.com/@${activeHandle ?? influencer.name}/video/${realVideo?.id}`
    : realVideo?.id ? `https://www.youtube.com/watch?v=${realVideo.id}` : "#";
  const multiPlatform = orderedPlatforms.length > 1;

  return (
    <aside className="fixed right-0 top-0 z-50 h-screen w-full max-w-xl border-l bg-background shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-4">
            <img src={avatarUrl} alt="" className="h-12 w-12 rounded-full border bg-muted" onError={(e) => { (e.target as HTMLImageElement).src = fallbackAvatar; }} />
            <div>
              <h2 className="text-xl font-bold tracking-tight font-serif">{influencer.name}</h2>
              {(meta.city || meta.country) && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <MapPin className="h-3 w-3" />
                  {[meta.city, meta.country].filter(Boolean).join(", ")}
                </div>
              )}
              {influencer.gender && (
                <div className="mt-0.5 text-xs text-muted-foreground font-medium capitalize">
                  {influencer.gender}
                </div>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
            <X className="h-5 w-5 text-muted-foreground" />
          </Button>
        </header>

        {/* Platform switcher — only when 2+ platforms */}
        {multiPlatform && (
          <div className="flex items-center gap-2 border-b px-6 py-3" role="tablist">
            {orderedPlatforms.map((platform) => {
              const isActiveTab = platform === activePlatform;
              const activeBg = PLATFORM_ACTIVE_BG[platform] ?? "bg-primary";
              return (
                <button
                  key={platform}
                  role="tab"
                  aria-selected={isActiveTab}
                  onClick={() => setActivePlatform(platform)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                    isActiveTab
                      ? `${activeBg} text-white shadow-sm`
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                >
                  <PlatformIcon platform={platform} className="h-3.5 w-3.5" />
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Top Performance Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reach</p>
              <p className="text-lg font-bold">{activeFollowers.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Engagement</p>
              <p className="text-lg font-bold text-primary">{activeEngagement}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quality</p>
              <p className="text-lg font-bold text-emerald-600">{meta.qualityScore != null ? `${meta.qualityScore}%` : "—"}</p>
            </div>
          </div>
          {activeSyncedAt && (
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground -mt-2">
              <RefreshCw className="h-2.5 w-2.5 shrink-0" />
              Data as of {new Date(activeSyncedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}

          <Separator />

          {/* About — AI-generated bio */}
          {meta.bio && (
            <section className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2 font-serif">
                <FileText className="h-4 w-4" />
                About
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{meta.bio}</p>
            </section>
          )}

          {/* Media Showcase */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground font-serif">Content Spotlight</h3>
              <Badge variant="outline" className="font-bold text-[10px] capitalize">{activePlatform}</Badge>
            </div>
            {realVideo ? (
              <>
                <Card className="overflow-hidden border-none bg-slate-950 shadow-lg">
                  <div className="relative aspect-video w-full">
                    {activePlatform === "youtube" ? (
                      <iframe
                        title={realVideo.title}
                        src={`https://www.youtube.com/embed/${realVideo.id}?rel=0`}
                        className="absolute inset-0 h-full w-full border-0"
                        allowFullScreen
                      />
                    ) : (
                      <a href={spotlightExternalUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 block">
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-400 text-sm gap-2">
                          <ExternalLink className="h-5 w-5 shrink-0" />
                          <span>View on {activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)}</span>
                        </div>
                        {realVideo.thumbnail && (
                          <img
                            src={realVideo.thumbnail}
                            alt={realVideo.title}
                            className="absolute inset-0 h-full w-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        )}
                      </a>
                    )}
                  </div>
                </Card>
                <a
                  href={spotlightExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate">{realVideo.title || `View on ${activePlatform}`}</span>
                </a>
              </>
            ) : showcaseEmbed.kind === "iframe" ? (
              <>
                <Card className="overflow-hidden border-none bg-slate-950 shadow-lg">
                  <div className="relative aspect-video w-full">
                    <iframe
                      title={showcaseEmbed.title}
                      src={showcaseEmbed.src}
                      className="absolute inset-0 h-full w-full border-0"
                      allowFullScreen
                    />
                  </div>
                </Card>
                <p className="text-[10px] text-center text-muted-foreground font-medium italic">Demo sample video shown for context.</p>
              </>
            ) : (
              <Button variant="outline" asChild className="w-full h-24 rounded-2xl border-dashed">
                <a href={showcaseEmbed.href} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Portfolio on {activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)}
                </a>
              </Button>
            )}
          </section>

          {/* Performance Metrics */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2 font-serif">
              <BarChart3 className="h-4 w-4" />
              Performance Metrics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-none bg-muted/80 shadow-none">
                <CardContent className="p-4 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avg Views</p>
                  <p className="text-base font-bold">{activeAvgViews.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="border-none bg-muted/80 shadow-none">
                <CardContent className="p-4 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Growth Rate</p>
                  <p className="text-base font-bold text-emerald-600">+{meta.growthRate}%</p>
                </CardContent>
              </Card>
            </div>
            {meta.audienceQualityScore != null && (() => {
              const score = meta.audienceQualityScore;
              const label = score >= 70 ? "Likely Authentic" : score >= 40 ? "Mixed Signals" : "Suspicious";
              const color = score >= 70 ? "text-emerald-600" : score >= 40 ? "text-amber-500" : "text-rose-500";
              const bar = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-400" : "bg-rose-500";
              return (
                <Card className="border-none bg-muted/80 shadow-none">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Audience Authenticity</p>
                      <span className={`text-sm font-bold ${color}`}>{score}/100 · {label}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className={`h-2 rounded-full ${bar} transition-all`} style={{ width: `${score}%` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                      <span>Comment-to-like ratio</span>
                      <span>ER vs platform avg</span>
                      <span>View-to-follower ratio</span>
                      <span>Engagement consistency</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </section>

          {/* Audience Snapshot */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2 font-serif">
              <Users className="h-4 w-4" />
              Audience Snapshot
            </h3>
            <Card className="border-none bg-muted/80 shadow-none">
              <CardContent className="p-5 space-y-4">
                {meta.audienceGender && (
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Gender Mix</span>
                    <span className="text-foreground">{meta.audienceGender}</span>
                  </div>
                )}
                {meta.audienceAgeGroup && (
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Core Age Group</span>
                    <span className="text-foreground">{meta.audienceAgeGroup}</span>
                  </div>
                )}
                {meta.audienceQualityScore != null && (
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Real vs Bot Score</span>
                    <span className={`font-bold ${meta.audienceQualityScore >= 70 ? 'text-emerald-600' : meta.audienceQualityScore >= 40 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {meta.audienceQualityScore}/100
                    </span>
                  </div>
                )}
                {topLocationNames.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Top Locations</p>
                    <div className="flex flex-wrap gap-2">
                      {topLocationNames.map(c => <Badge key={c} variant="secondary" className="bg-card text-foreground">{c}</Badge>)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* YouTube-only metrics — watch time, view duration, view %, subs gained */}
          {hasYouTubeOnlyMetrics && (
            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2 font-serif">
                <TrendingUp className="h-4 w-4" />
                YouTube Analytics
              </h3>
              <Card className="border-none bg-muted/80 shadow-none">
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {activeWatchTimeMins != null && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Watch Time</p>
                        <p className="text-base font-bold">{formatWatchTime(activeWatchTimeMins)}</p>
                        <p className="text-[10px] text-muted-foreground">last 90 days</p>
                      </div>
                    )}
                    {activeAvgViewDuration != null && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avg View Duration</p>
                        <p className="text-base font-bold">{formatDuration(activeAvgViewDuration)}</p>
                        <p className="text-[10px] text-muted-foreground">per video</p>
                      </div>
                    )}
                  </div>
                  {activeAvgViewPct != null && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avg View Percentage</p>
                        <span className="text-sm font-bold">{activeAvgViewPct.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div className="h-1.5 rounded-full bg-[#FF0000] transition-all" style={{ width: `${Math.min(100, activeAvgViewPct)}%` }} />
                      </div>
                    </div>
                  )}
                  {activeSubscribersGained != null && (
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-muted-foreground">Subscribers Gained</span>
                      <span className="font-bold text-emerald-600">+{activeSubscribersGained.toLocaleString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {/* Audience Insights — gender, age, top countries — shown for any platform that has data */}
          {hasPlatformInsights && (
            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2 font-serif">
                <TrendingUp className="h-4 w-4" />
                {activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)} Audience Insights
              </h3>

              {/* Gender split */}
              {activeAudienceInsights && (activeAudienceInsights.malePct != null || activeAudienceInsights.femalePct != null) && (
                <Card className="border-none bg-muted/80 shadow-none">
                  <CardContent className="p-5 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Audience Gender</p>
                    <div className="grid grid-cols-2 gap-3">
                      {activeAudienceInsights.femalePct != null && (
                        <div className="rounded-xl border bg-card p-3 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Female</p>
                          <p className="text-lg font-bold text-pink-500">{activeAudienceInsights.femalePct.toFixed(1)}%</p>
                        </div>
                      )}
                      {activeAudienceInsights.malePct != null && (
                        <div className="rounded-xl border bg-card p-3 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Male</p>
                          <p className="text-lg font-bold text-blue-500">{activeAudienceInsights.malePct.toFixed(1)}%</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Age distribution */}
              {activeAudienceInsights?.ageDistribution && Object.keys(activeAudienceInsights.ageDistribution).length > 0 && (
                <Card className="border-none bg-muted/80 shadow-none">
                  <CardContent className="p-5 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Age Distribution</p>
                    <div className="space-y-2">
                      {Object.entries(activeAudienceInsights.ageDistribution)
                        .sort(([, a], [, b]) => b - a)
                        .map(([group, pct]) => (
                          <div key={group} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground font-medium">{group.replace("age", "")}</span>
                              <span className="font-bold">{pct.toFixed(1)}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted">
                              <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top countries with real percentages */}
              {activeTopCountries && activeTopCountries.length > 0 && (
                <Card className="border-none bg-muted/80 shadow-none">
                  <CardContent className="p-5 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Top Countries</p>
                    <div className="space-y-2">
                      {activeTopCountries.map(({ country: countryName, viewPct }) => (
                        <div key={countryName} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-medium">{countryName}</span>
                            <span className="font-bold">{viewPct.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted">
                            <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, viewPct)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </section>
          )}

          {/* Rate Card */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2 font-serif">
              <PlusCircle className="h-4 w-4" />
              Rate Card Estimates
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border bg-card">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Price per Post</p>
                <p className="text-xl font-bold mt-1">{influencer.ratePerPost ? `$${influencer.ratePerPost}` : "—"}</p>
              </div>
              <div className="p-4 rounded-2xl border bg-card">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Estimated CPM</p>
                <p className="text-xl font-bold mt-1">{estimatedCpm ? `$${estimatedCpm}` : "—"}</p>
              </div>
            </div>
            {influencer.rateCardFileUrl && (
              <a
                href={influencer.rateCardFileUrl.startsWith("http")
                  ? influencer.rateCardFileUrl
                  : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${influencer.rateCardFileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
              >
                <FileText className="h-4 w-4 shrink-0" />
                View Full Rate Card
                <ExternalLink className="ml-auto h-3.5 w-3.5" />
              </a>
            )}
          </section>

          {/* Contact — how a brand can reach this influencer.
              Reality check: TikTok/Instagram/YouTube APIs do NOT expose contact emails,
              and the schema has no email/phone/website on InfluencerProfile or
              PlatformAccount. So the only reliable contact points are the connected
              platform handles (linking to the public profile URL when available).
              TODO: add an optional `contactEmail` field to InfluencerProfile (schema
              migration) so influencers can provide a direct email, then surface it here. */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2 font-serif">
              <AtSign className="h-4 w-4" />
              Contact
            </h3>
            {orderedPlatforms.some((p) => influencer.handleByPlatform?.[p]) ? (
              <Card className="border-none bg-muted/80 shadow-none">
                <CardContent className="p-5 space-y-3">
                  {orderedPlatforms.map((platform) => {
                    const handle = influencer.handleByPlatform?.[platform];
                    if (!handle) return null;
                    const profileUrl = influencer.profileUrlByPlatform?.[platform];
                    const label = platform.charAt(0).toUpperCase() + platform.slice(1);
                    const displayHandle = `@${handle.replace(/^@/, "")}`;
                    return (
                      <div key={platform} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground font-medium">
                          <PlatformIcon platform={platform} className="h-4 w-4 shrink-0" />
                          {label}
                        </span>
                        {profileUrl ? (
                          <a
                            href={profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 font-semibold text-primary hover:underline truncate"
                          >
                            {displayHandle}
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="font-semibold text-foreground truncate">{displayHandle}</span>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground">No contact info available.</p>
            )}
          </section>
        </div>

        {(onAddToCampaign || onMessage) && (
          <footer className="sticky bottom-0 border-t bg-background/80 p-6 backdrop-blur-md">
            <div className="flex gap-3">
              {onAddToCampaign && (
                <Button
                  className="flex-1 rounded-xl h-12 text-base font-bold shadow-lg shadow-primary/20"
                  onClick={() => onAddToCampaign(influencer)}
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add to Campaign
                </Button>
              )}
              {onMessage && (
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-12 text-base font-bold"
                  onClick={() => onMessage(influencer)}
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Message
                </Button>
              )}
            </div>
          </footer>
        )}
      </div>
    </aside>
  );
}
