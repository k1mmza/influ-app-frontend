import { getMainFollowerPlatform, getShowcaseDemoEmbed, getTopAvgViewsPlatform } from "@/lib/influencer-platforms";
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
  FileText
} from "lucide-react";
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
  qualityScore: number;
  responseRate: number;
  bio?: string | null;
}

interface InfluencerDetailPanelProps {
  influencer: Influencer;
  meta: InfluencerMeta;
  onClose: () => void;
  onAddToCampaign?: (influencer: Influencer) => void;
  onMessage?: (influencer: Influencer) => void;
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

export function InfluencerDetailPanel({ influencer, meta, onClose, onAddToCampaign, onMessage }: InfluencerDetailPanelProps) {
  const topCountries = meta.country ? getTopCountries(meta.country) : [];
  const topCities = meta.city ? getTopCities(meta.city) : [];
  const engagementAuthenticity = (meta.qualityScore != null && influencer.performanceScore != null)
    ? Math.min(99, Math.round((meta.qualityScore + influencer.performanceScore) / 2))
    : null;
  const consistencyScore = Math.min(100, Math.round((meta.growthRate * 6 + influencer.engagementRate * 5) / 2));
  const estimatedCpm = influencer.ratePerPost
    ? Math.max(1, Math.round((influencer.ratePerPost / Math.max(meta.averageViews, 1)) * 1000))
    : null;
  const estimatedCostPerEngagement = influencer.ratePerPost
    ? (influencer.ratePerPost / Math.max(meta.averageViews * (influencer.engagementRate / 100), 1)).toFixed(2)
    : null;
  const avatarUrl = influencer.avatarUrl ?? `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(influencer.name)}`;
  const allPlatforms = [...(influencer.platforms ?? []), ...(meta.extraPlatforms ?? [])];
  const mainFollowers = getMainFollowerPlatform(influencer);
  const topByViews = getTopAvgViewsPlatform(influencer);
  const showcaseEmbed = getShowcaseDemoEmbed(topByViews.platform, influencer.id);
  const headlineAvgViews = topByViews.avgViews > 0 ? topByViews.avgViews : meta.averageViews;
  const realVideo = influencer.spotlightVideo;

  return (
    <aside className="fixed right-0 top-0 z-50 h-screen w-full max-w-xl border-l bg-background shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-4">
            <img src={avatarUrl} alt="" className="h-12 w-12 rounded-full border bg-muted" />
            <div>
              <h2 className="text-xl font-bold tracking-tight font-serif">{influencer.name}</h2>
              {(meta.city || meta.country) && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <MapPin className="h-3 w-3" />
                  {[meta.city, meta.country].filter(Boolean).join(", ")}
                </div>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
            <X className="h-5 w-5 text-muted-foreground" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Top Performance Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reach</p>
              <p className="text-lg font-bold">{influencer.followers.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Engagement</p>
              <p className="text-lg font-bold text-primary">{influencer.engagementRate}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quality</p>
              <p className="text-lg font-bold text-emerald-600">{meta.qualityScore != null ? `${meta.qualityScore}%` : "—"}</p>
            </div>
          </div>

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
              <Badge variant="outline" className="font-bold text-[10px]">{topByViews.platform}</Badge>
            </div>
            {realVideo ? (
              <>
                <Card className="overflow-hidden border-none bg-slate-950 shadow-lg">
                  <div className="relative aspect-video w-full">
                    <iframe
                      title={realVideo.title}
                      src={`https://www.youtube.com/embed/${realVideo.id}?rel=0`}
                      className="absolute inset-0 h-full w-full border-0"
                      allowFullScreen
                    />
                  </div>
                </Card>
                <a
                  href={`https://www.youtube.com/watch?v=${realVideo.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate">{realVideo.title}</span>
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
                  View Portfolio on {topByViews.platform}
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
                  <p className="text-base font-bold">{meta.averageViews.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="border-none bg-muted/80 shadow-none">
                <CardContent className="p-4 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Growth Rate</p>
                  <p className="text-base font-bold text-emerald-600">+{meta.growthRate}%</p>
                </CardContent>
              </Card>
            </div>
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
                {engagementAuthenticity != null && (
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Audience Authentic</span>
                    <span className="text-emerald-600 font-bold">{engagementAuthenticity}%</span>
                  </div>
                )}
                {topCountries.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Top Locations</p>
                    <div className="flex flex-wrap gap-2">
                      {topCountries.map(c => <Badge key={c} variant="secondary" className="bg-card text-foreground">{c}</Badge>)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

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
          </section>
        </div>

        <footer className="sticky bottom-0 border-t bg-background/80 p-6 backdrop-blur-md">
          <div className="flex gap-3">
            <Button
              className="flex-1 rounded-xl h-12 text-base font-bold shadow-lg shadow-primary/20"
              onClick={() => onAddToCampaign?.(influencer)}
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Add to Campaign
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-xl h-12 text-base font-bold"
              onClick={() => onMessage?.(influencer)}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Message
            </Button>
          </div>
        </footer>
      </div>
    </aside>
  );
}
