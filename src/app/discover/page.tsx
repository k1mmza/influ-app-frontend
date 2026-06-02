"use client";

import { InfluencerCard } from "@/components/influencer-card";
import { InfluencerDetailPanel } from "@/components/influencer-detail-panel";
import { getMainFollowerPlatform } from "@/lib/influencer-platforms";
import { Influencer } from "@/lib/types";
import { influencers } from "@/mock/influencers";
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
  Layers
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

const categories = ["All", "Beauty", "Fashion", "Fitness", "Food", "Travel", "Tech", "Lifestyle"];
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

const influencerMeta: Record<string, InfluencerMeta> = {
  "inf-1": {
    country: "Thailand",
    city: "Bangkok",
    extraPlatforms: ["Facebook"],
    audienceCountryPercent: 76,
    averageViews: 95_000,
    growthRate: 7.1,
    keywords: ["beauty", "skincare", "makeup"],
    intents: ["Awareness", "Engagement", "UGC / content production"],
    audienceGender: "Female",
    audienceAgeGroup: "25-34",
    qualityScore: 89,
    responseRate: 78
  },
  "inf-2": {
    country: "Thailand",
    city: "Chiang Mai",
    extraPlatforms: ["X"],
    audienceCountryPercent: 64,
    averageViews: 130_000,
    growthRate: 4.8,
    keywords: ["fitness", "workout", "lifestyle"],
    intents: ["Conversion", "Engagement"],
    audienceGender: "Male",
    audienceAgeGroup: "25-34",
    qualityScore: 83,
    responseRate: 70
  },
  "inf-3": {
    country: "Vietnam",
    city: "Ho Chi Minh City",
    extraPlatforms: ["Lemon8"],
    audienceCountryPercent: 58,
    averageViews: 82_000,
    growthRate: 8.3,
    keywords: ["fashion", "style", "ootd"],
    intents: ["Awareness", "UGC / content production"],
    audienceGender: "Mixed",
    audienceAgeGroup: "18-24",
    qualityScore: 92,
    responseRate: 84
  },
  "inf-4": {
    country: "Singapore",
    city: "Singapore",
    extraPlatforms: ["Facebook"],
    audienceCountryPercent: 61,
    averageViews: 148_000,
    growthRate: 5.5,
    keywords: ["travel", "hotel", "city guide"],
    intents: ["Awareness", "Conversion"],
    audienceGender: "Female",
    audienceAgeGroup: "25-34",
    qualityScore: 88,
    responseRate: 73
  },
  "inf-5": {
    country: "Thailand",
    city: "Phuket",
    extraPlatforms: ["X"],
    audienceCountryPercent: 55,
    averageViews: 220_000,
    growthRate: 3.9,
    keywords: ["tech", "gadgets", "reviews"],
    intents: ["Conversion", "Engagement"],
    audienceGender: "Male",
    audienceAgeGroup: "35-44",
    qualityScore: 80,
    responseRate: 68
  },
  "inf-6": {
    country: "Malaysia",
    city: "Kuala Lumpur",
    extraPlatforms: ["Lemon8"],
    audienceCountryPercent: 72,
    averageViews: 76_000,
    growthRate: 8.9,
    keywords: ["food", "recipe", "street food"],
    intents: ["Engagement", "UGC / content production"],
    audienceGender: "Mixed",
    audienceAgeGroup: "18-24",
    qualityScore: 91,
    responseRate: 86
  }
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
  const [smartQuery, setSmartQuery] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [country, setCountry] = useState("All");
  const [city, setCity] = useState("All");
  const [audienceThreshold, setAudienceThreshold] = useState(0);
  const [category, setCategory] = useState("All");
  const [followerRange, setFollowerRange] = useState<FollowerRange>("All");
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
  const [minResponseRate, setMinResponseRate] = useState(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [mainPlatformFilter, setMainPlatformFilter] = useState<string>("All");
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string | null>(null);
  const [unifiedSearchInput, setUnifiedSearchInput] = useState("");
  const [urlSearchError, setUrlSearchError] = useState("");
  const [generatedInfluencer, setGeneratedInfluencer] = useState<Influencer | null>(null);
  const [generatedInfluencerMeta, setGeneratedInfluencerMeta] = useState<InfluencerMeta | null>(null);

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
    setCategory("All");
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
    setMinResponseRate(0);
    setMainPlatformFilter("All");
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
      setCategory(detectedCategory);
    }

    const detectedCountry = countries.find(
      (item) => item !== "All" && normalized.includes(item.toLowerCase())
    );
    if (detectedCountry) {
      setCountry(detectedCountry);
      const detectedCity = cities.find((item) => item !== "All" && normalized.includes(item.toLowerCase()));
      setCity(detectedCity ?? "All");
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

  const buildInfluencerFromSocialUrl = (input: string) => {
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

    const segments = parsed.pathname.split("/").filter(Boolean);
    const handle = segments[segments.length - 1] ?? "creator";
    const cleanedHandle = handle.replace(/^@/, "").replace(/[^a-zA-Z0-9._-]/g, "");
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
    setUrlSearchError("");
  };

  const handleUnifiedSearch = () => {
    const query = unifiedSearchInput.trim();
    if (!query) {
      setUrlSearchError("Please enter a social URL or smart search query.");
      return;
    }

    const looksLikeUrl = /^(https?:\/\/|www\.)/i.test(query) || /(?:instagram|tiktok|youtube|youtu\.be|facebook|x\.com|twitter|lemon8)\./i.test(query);
    if (looksLikeUrl) {
      const normalizedUrl = /^https?:\/\//i.test(query) ? query : `https://${query}`;
      buildInfluencerFromSocialUrl(normalizedUrl);
      return;
    }

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
    buildInfluencerFromSocialUrl(normalizedUrl);
  }, [urlFromQuery]);

  const countries = useMemo(
    () => ["All", ...new Set(Object.values(influencerMeta).map((meta) => meta.country))],
    []
  );

  const cities = useMemo(() => {
    const cityOptions = Object.values(influencerMeta)
      .filter((meta) => country === "All" || meta.country === country)
      .map((meta) => meta.city);
    return ["All", ...new Set(cityOptions)];
  }, [country]);

  const filtered = useMemo(
    () =>
      influencers.filter((item) => {
        const meta = influencerMeta[item.id];
        if (!meta) return false;
        const allPlatforms = [...item.platforms, ...meta.extraPlatforms];

        const passPlatform =
          selectedPlatforms.length === 0 ||
          selectedPlatforms.some((selectedPlatform) => allPlatforms.includes(selectedPlatform));
        const passCountry = country === "All" || meta.country === country;
        const passCity = city === "All" || meta.city === city;
        const passAudienceThreshold = meta.audienceCountryPercent >= audienceThreshold;
        const passCategory = category === "All" || item.category === category;
        const passFollowerRange =
          followerRange === "All"
            ? true
            : item.followers >= followerRanges[followerRange].min &&
              (followerRanges[followerRange].max ? item.followers <= followerRanges[followerRange].max : true);
        const passAverageViews = meta.averageViews >= minAverageViews;
        const passEngagement = item.engagementRate >= minEngagementRate;
        const passGrowth = meta.growthRate >= minGrowthRate;
        const passKeyword =
          keyword.trim().length === 0 ||
          meta.keywords.some((value) => value.toLowerCase().includes(keyword.trim().toLowerCase()));
        const passCampaignIntent =
          selectedCampaignIntents.length === 0 ||
          selectedCampaignIntents.some((selectedIntent) => meta.intents.includes(selectedIntent));
        const passAudienceGender = audienceGender === "All" || meta.audienceGender === audienceGender;
        const passAudienceAgeGroup = audienceAgeGroup === "All" || meta.audienceAgeGroup === audienceAgeGroup;
        const passStylePresent = stylePresent === "All" || item.stylePresent.includes(stylePresent);
        const passQualityScore = meta.qualityScore >= minQualityScore;
        const passPerformanceScore = item.performanceScore >= minPerformanceScore;
        const passPricing = maxRatePerPost <= 0 || item.ratePerPost <= maxRatePerPost;
        const passResponseRate = meta.responseRate >= minResponseRate;
        const mainPlatform = getMainFollowerPlatform(item).platform;
        const passMainPlatform = mainPlatformFilter === "All" || mainPlatform === mainPlatformFilter;

        return (
          passPlatform &&
          passCountry &&
          passCity &&
          passAudienceThreshold &&
          passCategory &&
          passFollowerRange &&
          passAverageViews &&
          passEngagement &&
          passGrowth &&
          passKeyword &&
          passCampaignIntent &&
          passAudienceGender &&
          passAudienceAgeGroup &&
          passStylePresent &&
          passQualityScore &&
          passPerformanceScore &&
          passPricing &&
          passResponseRate &&
          passMainPlatform
        );
      }),
    [
      audienceAgeGroup,
      audienceGender,
      audienceThreshold,
      category,
      city,
      country,
      followerRange,
      keyword,
      maxRatePerPost,
      minAverageViews,
      minEngagementRate,
      minGrowthRate,
      minPerformanceScore,
      minQualityScore,
      minResponseRate,
      mainPlatformFilter,
      selectedCampaignIntents,
      selectedPlatforms,
      stylePresent
    ]
  );

  const activeChips = [
    selectedPlatforms.length ? `${selectedPlatforms.length} platforms` : "",
    selectedCampaignIntents.length ? `${selectedCampaignIntents.length} intents` : "",
    country !== "All" ? country : "",
    city !== "All" ? city : "",
    category !== "All" ? category : "",
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
    return influencerMeta[selectedInfluencer.id] ?? null;
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
              <h1 className="text-3xl font-extrabold tracking-tight">Discover Influencers</h1>
              <p className="mt-2 text-primary-foreground/80 font-medium">Find campaign-fit creators with smart filters and audience signals.</p>
            </div>
            <Badge variant="outline" className="w-fit border-white/30 bg-white/10 text-white font-bold px-4 py-1.5 backdrop-blur-sm">
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

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Main Platform</Label>
                  <select
                    value={mainPlatformFilter}
                    onChange={(e) => setMainPlatformFilter(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="All">Any platform</option>
                    {platforms.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
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
                  <div className="pt-2 space-y-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Location</Label>
                      <div className="grid gap-2">
                        <select
                          value={country}
                          onChange={(e) => { setCountry(e.target.value); setCity("All"); }}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
                        >
                          {countries.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
                        >
                          {cities.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Follower Range</Label>
                        <Badge variant="secondary" className="text-[10px] h-4">{followerRange}</Badge>
                      </div>
                      <select
                        value={followerRange}
                        onChange={(e) => setFollowerRange(e.target.value as FollowerRange)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
                      >
                        <option value="All">All Ranges</option>
                        <option value="Nano">Nano (1K - 10K)</option>
                        <option value="Micro">Micro (10K - 100K)</option>
                        <option value="Mid">Mid (100K - 500K)</option>
                        <option value="Macro">Macro (500K - 1M)</option>
                        <option value="Mega">Mega (1M+)</option>
                      </select>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Min Quality Score</Label>
                        <span className="text-xs font-bold text-primary">{minQualityScore}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={minQualityScore}
                        onChange={(e) => updateQualityScore(Number(e.target.value))}
                        className="w-full accent-primary h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                      />
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
              <Button onClick={handleUnifiedSearch} className="h-12 rounded-none px-8 font-bold text-sm shadow-none">
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mr-2">Active:</span>
            {activeChips.map((chip) => (
              <Badge key={chip} variant="secondary" className="rounded-full bg-slate-100 text-slate-700 font-semibold px-3 py-1 border-none">
                {chip}
              </Badge>
            ))}
          </div>
        )}

        {urlSearchError && (
          <Badge variant="destructive" className="bg-rose-50 text-rose-600 border-rose-100 font-medium px-4 py-1">
            {urlSearchError}
          </Badge>
        )}

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
            <Card className="col-span-full border-2 border-dashed bg-slate-50/50 py-20 text-center">
              <CardContent>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <RotateCcw className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-bold">No results found</h3>
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
