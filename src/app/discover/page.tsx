"use client";

import { InfluencerCard } from "@/components/influencer-card";
import { InfluencerDetailPanel } from "@/components/influencer-detail-panel";
import { getMainFollowerPlatform } from "@/lib/influencer-platforms";
import { Influencer } from "@/lib/types";
import { apiGetInfluencers } from "@/lib/influencers";
import * as api from "@/lib/api";
import { apiLookupInfluencerByUrl } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Globe,
  Users,
  Target,
  Sparkles,
  Layers,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FollowerRange = "All" | "Nano" | "Micro" | "Mid" | "Macro" | "Mega";
type InfluencerMeta = {
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
};

const categories = ["All", "Beauty", "Fashion", "Fitness", "Food", "Gaming", "Travel", "Tech", "Lifestyle"];
const platforms = ["TikTok", "Instagram", "YouTube", "Facebook", "X", "Lemon8", "LinkedIn", "Red Note (Xiaohongshu)"];
const campaignIntents = ["Awareness", "Engagement", "Conversion", "UGC / content production"];
const ageGroups = ["All", "18-24", "25-34", "35-44", "45+"];
const audienceGenders = ["All", "Female", "Male", "Mixed"];
const stylePresentOptions = ["All", "Short Story", "Storytelling", "Experiment", "Tutorial", "Review", "Vlog"];

const followerRanges: Record<Exclude<FollowerRange, "All">, { min: number; max?: number }> = {
  Nano: { min: 1_000, max: 10_000 },
  Micro: { min: 10_000, max: 100_000 },
  Mid: { min: 100_000, max: 500_000 },
  Macro: { min: 500_000, max: 1_000_000 },
  Mega: { min: 1_000_000 }
};

export default function DiscoverPage() {
  return (
    <Suspense fallback={<DiscoverPageFallback />}>
      <DiscoverPageContent />
    </Suspense>
  );
}

function DiscoverPageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground animate-pulse font-medium">
      <Layers className="mr-2 h-4 w-4 animate-bounce" />
      Syncing discovery engine...
    </div>
  );
}

function DiscoverPageContent() {
  const searchParams = useSearchParams();
  const urlFromQuery = searchParams.get("url");
  const processedUrlRef = useRef<string | null>(null);
  const [sidebarSlot, setSidebarSlot] = useState<HTMLElement | null>(null);
  
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);

  const [smartQuery, setSmartQuery] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [country, setCountry] = useState("All");
  const [city, setCity] = useState("All");
  const [audienceThreshold, setAudienceThreshold] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [followerRange, setFollowerRange] = useState<FollowerRange>("All");

  const categoryFromUrl = searchParams.get("category");
  useEffect(() => {
    if (categoryFromUrl && categories.includes(categoryFromUrl)) {
      setSelectedCategories([categoryFromUrl]);
    }
  }, [categoryFromUrl]);
  const [minAverageViews, setMinAverageViews] = useState(0);
  const [minEngagementRate, setMinEngagementRate] = useState(0);
  const [minGrowthRate, setMinGrowthRate] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [selectedCampaignIntents, setSelectedCampaignIntents] = useState<string[]>([]);
  const [audienceGender, setAudienceGender] = useState("All");
  const [audienceAgeGroup, setAudienceAgeGroup] = useState("All");
  const [stylePresent, setStylePresent] = useState("All");
  const [minQualityScore, setMinQualityScore] = useState(0);
  const [minPerformanceScore, setMinPerformanceScore] = useState(0);
  const [maxRatePerPost, setMaxRatePerPost] = useState(0);
  const [minRatePerPost, setMinRatePerPost] = useState(0);
  const [minFollowers, setMinFollowers] = useState(0);
  const [minResponseRate, setMinResponseRate] = useState(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState("All");
  const [mainPlatformFilter, setMainPlatformFilter] = useState<string>("All");
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string | null>(null);
  const [unifiedSearchInput, setUnifiedSearchInput] = useState("");
  const [urlSearchError, setUrlSearchError] = useState("");
  const [isUrlSearching, setIsUrlSearching] = useState(false);
  const [urlLookupStatus, setUrlLookupStatus] = useState<"found" | "live" | "not-found" | null>(null);
  const [generatedInfluencer, setGeneratedInfluencer] = useState<Influencer | null>(null);
  const [generatedInfluencerMeta, setGeneratedInfluencerMeta] = useState<InfluencerMeta | null>(null);

  useEffect(() => {
    const fetchInfluencers = async () => {
      setLoading(true);
      try {
        const params: any = {
          categories: selectedCategories.length > 0 ? selectedCategories.join(",") : undefined,
          platform: selectedPlatforms[0] || "All",
          followerRange,
          minEngagementRate: minEngagementRate > 0 ? minEngagementRate : undefined,
          keyword,
          minQualityScore: minQualityScore > 0 ? minQualityScore : undefined,
          minPerformanceScore: minPerformanceScore > 0 ? minPerformanceScore : undefined,
          minGrowthRate: minGrowthRate > 0 ? minGrowthRate : undefined,
          minAverageViews: minAverageViews > 0 ? minAverageViews : undefined,
          minResponseRate: minResponseRate > 0 ? minResponseRate : undefined,
          maxRatePerPost: maxRatePerPost > 0 ? maxRatePerPost : undefined,
          minRatePerPost: minRatePerPost > 0 ? minRatePerPost : undefined,
          minFollowers: minFollowers > 0 ? minFollowers : undefined,
          stylePresent: stylePresent !== "All" ? stylePresent : undefined,
          audienceGender: audienceGender !== "All" ? audienceGender : undefined,
          audienceAgeGroup: audienceAgeGroup !== "All" ? audienceAgeGroup : undefined,
          availabilityStatus: availabilityStatus !== "All" ? availabilityStatus : undefined,
        };
        const data = await apiGetInfluencers(params);
        setInfluencers(data);
      } catch (err) {
        console.error("Failed to fetch influencers:", err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchInfluencers, 500);
    return () => clearTimeout(debounce);
  }, [
    selectedCategories, selectedPlatforms, followerRange, minEngagementRate, keyword,
    minQualityScore, minPerformanceScore, minGrowthRate, minAverageViews,
    minResponseRate, maxRatePerPost, minRatePerPost, minFollowers, stylePresent, audienceGender, audienceAgeGroup, availabilityStatus,
  ]);

  const updateAudienceThreshold = (value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setAudienceThreshold(clamped);
  };
  const updateQualityScore = (value: number) => setMinQualityScore(Math.max(0, Math.min(100, value)));
  const updatePerformanceScore = (value: number) => setMinPerformanceScore(Math.max(0, Math.min(100, value)));
  const updateResponseRate = (value: number) => setMinResponseRate(Math.max(0, Math.min(100, value)));
  const resetFilters = () => {
    setSmartQuery("");
    setSelectedPlatforms([]);
    setCountry("All");
    setCity("All");
    setAudienceThreshold(0);
    setSelectedCategories([]);
    setFollowerRange("All");
    setMinAverageViews(0);
    setMinEngagementRate(0);
    setMinGrowthRate(0);
    setKeyword("");
    setSelectedCampaignIntents([]);
    setAudienceGender("All");
    setAudienceAgeGroup("All");
    setStylePresent("All");
    setMinQualityScore(0);
    setMinPerformanceScore(0);
    setMaxRatePerPost(0);
    setMinRatePerPost(0);
    setMinFollowers(0);
    setMinResponseRate(0);
    setMainPlatformFilter("All");
    setAvailabilityStatus("All");
  };
  const applySmartQuery = (query?: string) => {
    const normalized = (query ?? smartQuery).toLowerCase();
    if (!normalized.trim()) return;

    const detectedPlatforms = platforms.filter((item) => normalized.includes(item.toLowerCase()));
    if (detectedPlatforms.length > 0) {
      setSelectedPlatforms(detectedPlatforms);
    }

    const detectedCategory = categories.find(
      (item) => item !== "All" && normalized.includes(item.toLowerCase())
    );
    if (detectedCategory) {
      setSelectedCategories((prev) =>
        prev.includes(detectedCategory) ? prev : [...prev, detectedCategory]
      );
    }

    if (normalized.includes("nano")) setFollowerRange("Nano");
    if (normalized.includes("micro")) setFollowerRange("Micro");
    if (normalized.includes("mid")) setFollowerRange("Mid");
    if (normalized.includes("macro")) setFollowerRange("Macro");
    if (normalized.includes("mega")) setFollowerRange("Mega");

    const intentMatches = campaignIntents.filter((intent) => normalized.includes(intent.toLowerCase()));
    if (intentMatches.length > 0) {
      setSelectedCampaignIntents(intentMatches);
    }

    if (normalized.includes("female")) setAudienceGender("Female");
    if (normalized.includes("male")) setAudienceGender("Male");
    if (normalized.includes("mixed")) setAudienceGender("Mixed");

    const matchedAgeGroup = ageGroups.find((item) => item !== "All" && normalized.includes(item.toLowerCase()));
    if (matchedAgeGroup) {
      setAudienceAgeGroup(matchedAgeGroup);
    }
    const matchedStylePresent = stylePresentOptions.find(
      (item) => item !== "All" && normalized.includes(item.toLowerCase())
    );
    if (matchedStylePresent) {
      setStylePresent(matchedStylePresent);
    }

    const extractNumber = (regex: RegExp) => {
      const match = normalized.match(regex);
      if (!match || !match[1]) return null;
      return Number(match[1]);
    };

    const avgViews = extractNumber(/(?:avg|average)\s*views?\s*(?:>|>=|above|over)?\s*(\d+)/);
    if (avgViews !== null && !Number.isNaN(avgViews)) setMinAverageViews(avgViews);

    const engagementRate = extractNumber(/engagement\s*(?:rate)?\s*(?:>|>=|above|over)?\s*(\d+(?:\.\d+)?)/);
    if (engagementRate !== null && !Number.isNaN(engagementRate)) setMinEngagementRate(engagementRate);

    const growthRate = extractNumber(/growth\s*(?:rate)?\s*(?:>|>=|above|over)?\s*(\d+(?:\.\d+)?)/);
    if (growthRate !== null && !Number.isNaN(growthRate)) setMinGrowthRate(growthRate);

    const audiencePct = extractNumber(/audience\s*%?\s*(?:threshold)?\s*(?:>|>=|above|over)?\s*(\d+)/);
    if (audiencePct !== null && !Number.isNaN(audiencePct)) updateAudienceThreshold(audiencePct);

    const quality = extractNumber(/quality\s*(?:score)?\s*(?:>|>=|above|over)?\s*(\d+)/);
    if (quality !== null && !Number.isNaN(quality)) updateQualityScore(quality);

    const performance = extractNumber(/performance\s*(?:score)?\s*(?:>|>=|above|over)?\s*(\d+)/);
    if (performance !== null && !Number.isNaN(performance)) updatePerformanceScore(performance);

    const maxPrice = extractNumber(/(?:max|under|below|budget)\s*\$?\s*(\d+)/);
    if (maxPrice !== null && !Number.isNaN(maxPrice)) setMaxRatePerPost(maxPrice);

    const responseRate = extractNumber(/(?:response|availability)\s*(?:rate)?\s*(?:>|>=|above|over)?\s*(\d+)/);
    if (responseRate !== null && !Number.isNaN(responseRate)) updateResponseRate(responseRate);

    const matchedKeyword = normalized.match(/(?:keyword|hashtags?|tag)\s*[:=]?\s*([a-z0-9#\s,-]+)/);
    if (matchedKeyword && matchedKeyword[1]) {
      setKeyword(matchedKeyword[1].trim().replace(/^#/, ""));
    }
  };

  const getPlatformFromUrl = (hostname: string) => {
    if (hostname.includes("tiktok")) return "TikTok";
    if (hostname.includes("instagram")) return "Instagram";
    if (hostname.includes("youtube") || hostname.includes("youtu.be")) return "YouTube";
    if (hostname.includes("facebook")) return "Facebook";
    if (hostname.includes("x.com") || hostname.includes("twitter")) return "X";
    if (hostname.includes("lemon8")) return "Lemon8";
    return null;
  };

  const makeNumberFromSeed = (seed: string, min: number, max: number) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const normalized = Math.abs(hash) / 2147483647;
    return Math.round(min + normalized * (max - min));
  };

  const extractHandle = (platform: string, pathname: string): string => {
    const segments = pathname.split("/").filter(Boolean);
    if (platform === "YouTube") {
      // /channel/UCxxx | /@handle | /c/name | /user/name
      const atHandle = segments.find((s) => s.startsWith("@"));
      if (atHandle) return atHandle.replace(/^@/, "");
      const idx = segments.findIndex((s) => ["channel", "c", "user"].includes(s));
      return idx !== -1 ? segments[idx + 1] ?? segments[0] ?? "creator" : segments[0] ?? "creator";
    }
    // TikTok, Instagram, X, Facebook, Lemon8 — handle is always last or first segment
    const raw = segments.find((s) => s.startsWith("@")) ?? segments[segments.length - 1] ?? "creator";
    return raw.replace(/^@/, "");
  };

  const buildInfluencerFromSocialUrl = async (input: string) => {
    if (!input.trim()) {
      setUrlSearchError("Please enter a social profile URL.");
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(input.trim());
    } catch {
      setUrlSearchError("Invalid URL format. Please provide a valid social profile link.");
      return;
    }

    const platform = getPlatformFromUrl(parsed.hostname.toLowerCase());
    if (!platform) {
      setUrlSearchError("Unsupported platform. Use TikTok, Instagram, YouTube, Facebook, X, or Lemon8 URLs.");
      return;
    }

    const cleanedHandle = extractHandle(platform, parsed.pathname).replace(/[^a-zA-Z0-9._-]/g, "");
    setIsUrlSearching(true);
    setUrlSearchError("");
    setUrlLookupStatus(null);

    // ── DB / live API lookup ─────────────────────────────────────────────────
    try {
      const result = await apiLookupInfluencerByUrl(platform, cleanedHandle);
      if (result.found && result.influencer) {
        setGeneratedInfluencer(result.influencer);
        setGeneratedInfluencerMeta(result.influencer.meta ?? null);
        setSelectedInfluencerId(result.influencer.id);
        setUrlLookupStatus(result.source === "api" ? "live" : "found");
        setIsUrlSearching(false);
        return;
      }
    } catch {
      // API unavailable — fall through to synthetic
    }

    // ── Synthetic fallback ───────────────────────────────────────────────────
    const displayName = cleanedHandle
      ? cleanedHandle
          .replace(/[._-]+/g, " ")
          .trim()
          .replace(/\b\w/g, (char) => char.toUpperCase())
      : "New Creator";
    const seed = `${platform}-${cleanedHandle || "creator"}-${parsed.hostname}`;
    const followers = makeNumberFromSeed(seed, 20000, 950000);
    const engagementRate = Number((makeNumberFromSeed(seed + "er", 2, 12) + Math.random() * 0.4).toFixed(1));
    const ratePerPost = makeNumberFromSeed(seed + "rate", 250, 3200);
    const performanceScore = makeNumberFromSeed(seed + "score", 70, 96);
    const averageViews = makeNumberFromSeed(seed + "views", 15000, 280000);
    const growthRate = Number((makeNumberFromSeed(seed + "growth", 1, 10) + Math.random() * 0.5).toFixed(1));
    const qualityScore = makeNumberFromSeed(seed + "quality", 72, 95);
    const responseRate = makeNumberFromSeed(seed + "response", 62, 92);

    const inferredCategory =
      displayName.toLowerCase().includes("tech")
        ? "Tech"
        : displayName.toLowerCase().includes("fit")
          ? "Fitness"
          : displayName.toLowerCase().includes("travel")
            ? "Travel"
            : "Lifestyle";

    const nextInfluencer: Influencer = {
      id: `url-derived-${Date.now()}`,
      name: displayName,
      platforms: [platform],
      followers,
      followersByPlatform: { [platform]: followers },
      avgViewsByPlatform: { [platform]: averageViews },
      engagementRate,
      category: inferredCategory,
      performanceScore,
      ratePerPost,
      stylePresent: ["Storytelling", "Review"]
    };

    const nextMeta: InfluencerMeta = {
      country: "Thailand",
      city: "Bangkok",
      extraPlatforms: [],
      audienceCountryPercent: makeNumberFromSeed(seed + "audpct", 45, 85),
      averageViews,
      growthRate,
      keywords: [inferredCategory.toLowerCase(), platform.toLowerCase(), "creator"],
      intents: ["Awareness", "Engagement"],
      audienceGender: "Mixed",
      audienceAgeGroup: "25-34",
      qualityScore,
      responseRate
    };

    setGeneratedInfluencer(nextInfluencer);
    setGeneratedInfluencerMeta(nextMeta);
    setSelectedInfluencerId(nextInfluencer.id);
    setUrlLookupStatus("not-found");
    setUrlSearchError("");
    setIsUrlSearching(false);
  };

  const handleUnifiedSearch = async () => {
    const query = unifiedSearchInput.trim();
    if (!query) {
      setUrlSearchError("Please enter a social URL or smart search query.");
      return;
    }

    const looksLikeUrl = /^(https?:\/\/|www\.)/i.test(query) || /(?:instagram|tiktok|youtube|youtu\.be|facebook|x\.com|twitter|lemon8)\./i.test(query);
    if (looksLikeUrl) {
      const normalizedUrl = /^https?:\/\//i.test(query) ? query : `https://${query}`;
      await buildInfluencerFromSocialUrl(normalizedUrl);
      return;
    }

    setUrlLookupStatus(null);
    setSmartQuery(query);
    applySmartQuery(query);
    setUrlSearchError("");
  };

  useEffect(() => {
    if (!urlFromQuery || processedUrlRef.current === urlFromQuery) return;
    processedUrlRef.current = urlFromQuery;
    const decoded = decodeURIComponent(urlFromQuery);
    setUnifiedSearchInput(decoded);
    const normalizedUrl = /^https?:\/\//i.test(decoded.trim()) ? decoded.trim() : `https://${decoded.trim()}`;
    void buildInfluencerFromSocialUrl(normalizedUrl);
  }, [urlFromQuery]);

  const filtered = useMemo(() => {
    // We already fetch filtered data from backend, 
    // but we can still apply minor local refinements or just use the state.
    // Let's use the fetched influencers state.
    return influencers;
  }, [influencers]);

  const activeChips = [
    selectedPlatforms.length ? `${selectedPlatforms.length} platforms` : "",
    selectedCampaignIntents.length ? `${selectedCampaignIntents.length} intents` : "",
    country !== "All" ? country : "",
    city !== "All" ? city : "",
    selectedCategories.length > 0 ? selectedCategories.join(", ") : "",
    followerRange !== "All" ? followerRange : "",
    stylePresent !== "All" ? stylePresent : "",
    minEngagementRate > 0 ? `ER >= ${minEngagementRate}%` : "",
    mainPlatformFilter !== "All" ? `Main audience: ${mainPlatformFilter}` : ""
  ].filter(Boolean);

  const discoverCards = useMemo(() => {
    if (!generatedInfluencer) return filtered;
    return [generatedInfluencer, ...filtered];
  }, [filtered, generatedInfluencer]);

  const selectedInfluencer = useMemo(
    () => discoverCards.find((item) => item.id === selectedInfluencerId) ?? null,
    [discoverCards, selectedInfluencerId]
  );

  const selectedInfluencerMeta = useMemo(() => {
    if (!selectedInfluencer) return null;
    if (generatedInfluencer && generatedInfluencerMeta && selectedInfluencer.id === generatedInfluencer.id) {
      return generatedInfluencerMeta;
    }
    // In real app, we might need another API call to get full meta, 
    // but here influencers from API already include meta in our backend implementation.
    return (selectedInfluencer as any).meta || null;
  }, [generatedInfluencer, generatedInfluencerMeta, selectedInfluencer]);

  useEffect(() => {
    setSidebarSlot(document.getElementById("app-sidebar-slot"));
  }, []);

  useEffect(() => {
    if (!selectedInfluencerId) return;
    if (!discoverCards.some((item) => item.id === selectedInfluencerId)) {
      setSelectedInfluencerId(null);
    }
  }, [discoverCards, selectedInfluencerId]);

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-gradient-to-r from-primary to-secondary text-white overflow-hidden">
        <CardContent className="p-8 relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Globe className="h-32 w-32" />
          </div>
          <div className="relative z-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight font-serif">Discover Influencers</h1>
              <p className="mt-2 text-primary-foreground/80 font-medium">Find campaign-fit creators with smart filters and audience signals.</p>
            </div>
            <Badge variant="outline" className="w-fit border-white/30 bg-card/10 text-white font-bold px-4 py-1.5 backdrop-blur-sm">
              {filtered.length} matches found
            </Badge>
          </div>
        </CardContent>
      </Card>

      {sidebarSlot
        ? createPortal(
            <Card className="border-none shadow-sm bg-background">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 px-2 text-xs font-bold text-primary">
                    <RotateCcw className="mr-1.5 h-3 w-3" />
                    Reset
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Platform */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Platform</Label>
                  <div className="space-y-2">
                    {platforms.slice(0, 5).map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`p-${item}`}
                          checked={selectedPlatforms.includes(item)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedPlatforms(p => [...p, item]);
                            else setSelectedPlatforms(p => p.filter(v => v !== item));
                          }}
                          className="h-4 w-4 rounded border-input bg-background"
                        />
                        <Label htmlFor={`p-${item}`} className="text-xs font-medium cursor-pointer">{item}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category</Label>
                  <div className="space-y-2">
                    {categories.filter((c) => c !== "All").map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`cat-${item}`}
                          checked={selectedCategories.includes(item)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedCategories((p) => [...p, item]);
                            else setSelectedCategories((p) => p.filter((v) => v !== item));
                          }}
                          className="h-4 w-4 rounded border-input bg-background"
                        />
                        <Label htmlFor={`cat-${item}`} className="text-xs font-medium cursor-pointer">{item}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Min Engagement Rate — primary filter, always visible */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Min Engagement Rate</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={minEngagementRate || ""}
                      onChange={(e) => setMinEngagementRate(Number(e.target.value))}
                      placeholder="Any"
                      className="h-8 text-xs pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="w-full justify-between rounded-xl font-bold text-xs"
                >
                  Advanced Filters
                  {showAdvancedFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>

                {showAdvancedFilters && (
                  <div className="space-y-6">

                    {/* ── FOLLOWER SIZE ── */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black uppercase tracking-widest text-primary/60">Follower Size</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Range</Label>
                      <select
                        value={followerRange}
                        onChange={(e) => setFollowerRange(e.target.value as FollowerRange)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
                      >
                        <option value="All">All Ranges</option>
                        <option value="Nano">Nano (1K – 10K)</option>
                        <option value="Micro">Micro (10K – 100K)</option>
                        <option value="Mid">Mid (100K – 500K)</option>
                        <option value="Macro">Macro (500K – 1M)</option>
                        <option value="Mega">Mega (1M+)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Min Followers (custom)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={1000}
                        value={minFollowers || ""}
                        onChange={(e) => setMinFollowers(Number(e.target.value))}
                        placeholder="e.g. 50000"
                        className="h-8 text-xs"
                      />
                    </div>

                    {/* ── AUDIENCE ── */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black uppercase tracking-widest text-primary/60">Audience</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gender</Label>
                      <select
                        value={audienceGender}
                        onChange={(e) => setAudienceGender(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
                      >
                        {audienceGenders.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Age Group</Label>
                      <select
                        value={audienceAgeGroup}
                        onChange={(e) => setAudienceAgeGroup(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
                      >
                        {ageGroups.map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>

                    {/* ── PERFORMANCE ── */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black uppercase tracking-widest text-primary/60">Performance</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Min Growth Rate</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          value={minGrowthRate || ""}
                          onChange={(e) => setMinGrowthRate(Number(e.target.value))}
                          placeholder="Any"
                          className="h-8 text-xs pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Min Avg Views</Label>
                      <Input
                        type="number"
                        min={0}
                        step={1000}
                        value={minAverageViews || ""}
                        onChange={(e) => setMinAverageViews(Number(e.target.value))}
                        placeholder="Any"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Content Quality Score</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={minQualityScore || ""}
                          onChange={(e) => updateQualityScore(Number(e.target.value))}
                          placeholder="Any"
                          className="h-8 text-xs pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Campaign Performance Score</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={minPerformanceScore || ""}
                          onChange={(e) => updatePerformanceScore(Number(e.target.value))}
                          placeholder="Any"
                          className="h-8 text-xs pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                      </div>
                    </div>

                    {/* ── CREATOR PROFILE ── */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black uppercase tracking-widest text-primary/60">Creator Profile</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Content Style</Label>
                      <select
                        value={stylePresent}
                        onChange={(e) => setStylePresent(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
                      >
                        {stylePresentOptions.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Availability</Label>
                      <select
                        value={availabilityStatus}
                        onChange={(e) => setAvailabilityStatus(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
                      >
                        <option value="All">All</option>
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Min Response Rate</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={minResponseRate || ""}
                          onChange={(e) => updateResponseRate(Number(e.target.value))}
                          placeholder="Any"
                          className="h-8 text-xs pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Campaign Intent</Label>
                      <div className="space-y-2">
                        {campaignIntents.map((intent) => (
                          <div key={intent} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`i-${intent}`}
                              checked={selectedCampaignIntents.includes(intent)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedCampaignIntents(p => [...p, intent]);
                                else setSelectedCampaignIntents(p => p.filter(v => v !== intent));
                              }}
                              className="h-4 w-4 rounded border-input bg-background"
                            />
                            <Label htmlFor={`i-${intent}`} className="text-xs font-medium cursor-pointer">{intent}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── BUDGET ── */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black uppercase tracking-widest text-primary/60">Budget</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Min Rate / Post</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                        <Input
                          type="number"
                          min={0}
                          step={50}
                          value={minRatePerPost || ""}
                          onChange={(e) => setMinRatePerPost(Number(e.target.value))}
                          placeholder="Any"
                          className="h-8 text-xs pl-6"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Max Rate / Post</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                        <Input
                          type="number"
                          min={0}
                          step={50}
                          value={maxRatePerPost || ""}
                          onChange={(e) => setMaxRatePerPost(Number(e.target.value))}
                          placeholder="Any"
                          className="h-8 text-xs pl-6"
                        />
                      </div>
                    </div>

                  </div>
                )}
              </CardContent>
            </Card>,
            sidebarSlot
          )
        : null}

      <div className="space-y-6">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-1">
            <div className="flex flex-col gap-1 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={unifiedSearchInput}
                  onChange={(e) => setUnifiedSearchInput(e.target.value)}
                  placeholder="Enter creator URL or type keywords for Smart Search..."
                  className="h-12 border-none shadow-none pl-11 pr-4 focus-visible:ring-0 text-sm"
                />
              </div>
              <Button
                onClick={handleUnifiedSearch}
                disabled={isUrlSearching}
                className="h-12 rounded-none px-8 font-bold text-sm shadow-none"
              >
                {isUrlSearching
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : "Search"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mr-2">Active:</span>
            {activeChips.map((chip) => (
              <Badge key={chip} variant="secondary" className="rounded-full bg-muted text-foreground font-semibold px-3 py-1 border-none">
                {chip}
              </Badge>
            ))}
          </div>
        )}

        {urlLookupStatus === "found" && (
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Found in our network — showing real profile data
          </div>
        )}

        {urlLookupStatus === "live" && (
          <div className="flex items-center gap-2 text-sm font-semibold text-sky-600">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Live data from YouTube — not yet registered on InfluApp
          </div>
        )}

        {urlLookupStatus === "not-found" && (
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Not registered — showing estimated data only
          </div>
        )}

        {urlSearchError && (
          <Badge variant="destructive" className="bg-rose-50 text-rose-600 border-rose-100 font-medium px-4 py-1">
            {urlSearchError}
          </Badge>
        )}

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {discoverCards.map((influencer) => (
              <InfluencerCard
                key={influencer.id}
                influencer={influencer}
                isActive={selectedInfluencerId === influencer.id}
                onSelect={(selected) => setSelectedInfluencerId(selected.id)}
              />
            ))}
            
            {discoverCards.length === 0 && (
              <Card className="col-span-full border-2 border-dashed bg-muted/50 py-20 text-center">
                <CardContent>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <RotateCcw className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold font-serif">No results found</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
                    Try adjusting your filters or search terms to find more creators.
                  </p>
                  <Button variant="outline" onClick={resetFilters} className="mt-6 rounded-xl font-bold">
                    Clear all filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {selectedInfluencer && selectedInfluencerMeta && (
        <InfluencerDetailPanel
          influencer={selectedInfluencer}
          meta={selectedInfluencerMeta}
          onClose={() => setSelectedInfluencerId(null)}
        />
      )}
    </div>
  );
}
