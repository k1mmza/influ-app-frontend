"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LandingAnimate } from "@/components/landing-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiGetInfluencers } from "@/lib/influencers";
import { Influencer } from "@/lib/types";
import { cn } from "@/lib/utils";

const CATEGORY_GRADIENT: Record<string, string> = {
  Beauty:  "from-rose-400 to-pink-500",
  Fitness: "from-emerald-400 to-green-500",
  Fashion: "from-violet-400 to-purple-500",
  Travel:  "from-sky-400 to-blue-500",
  Tech:    "from-slate-400 to-indigo-500",
  Food:    "from-orange-400 to-amber-500",
};

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("");
}

export function LandingFeatured() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Public endpoint — backend sorts by performanceScore desc, so the first
    // page is effectively the "featured" set.
    apiGetInfluencers({ limit: 8 })
      .then((res) => {
        if (!cancelled) setInfluencers(res.data);
      })
      .catch(() => {
        if (!cancelled) setInfluencers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Hide the whole section when there's nothing real to show.
  if (!loading && influencers.length === 0) return null;

  return (
    <section className="bg-background w-full py-20 px-4">
      <div className="mx-auto max-w-6xl">
        <LandingAnimate>
          <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
            <h2 className="font-serif text-4xl font-medium text-foreground">
              Featured Creators
            </h2>
            <Button variant="outline" asChild className="rounded-full font-semibold text-sm cursor-pointer">
              <Link href="/discover">View all creators</Link>
            </Button>
          </div>
        </LandingAnimate>

        <LandingAnimate delay={100}>
          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory -mx-4 px-4">
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="snap-start shrink-0 w-[260px] h-[260px] rounded-2xl border border-border bg-card shadow-sm animate-pulse"
                />
              ))}
            {!loading && influencers.map((influencer, index) => (
              <LandingAnimate key={influencer.id} delay={index * 75} direction="none">
                <Link href="/discover" className="block">
                  <div className="snap-start shrink-0 w-[260px] rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all p-5 cursor-pointer">
                    {/* Avatar */}
                    <div
                      className={cn(
                        "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-xl font-serif shadow-md",
                        CATEGORY_GRADIENT[influencer.category] ?? "from-slate-400 to-slate-500"
                      )}
                    >
                      {getInitials(influencer.name)}
                    </div>

                    {/* Name + category */}
                    <h3 className="mt-4 font-serif font-semibold text-base text-foreground leading-tight">
                      {influencer.name}
                    </h3>
                    <Badge className="mt-1 text-[10px] font-bold border-0 bg-primary/10 text-primary hover:bg-primary/10">
                      {influencer.category}
                    </Badge>

                    {/* Platforms */}
                    <div className="mt-3 flex gap-1 flex-wrap">
                      {influencer.platforms.map((p) => (
                        <span
                          key={p}
                          className="text-[10px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground rounded-full px-2 py-0.5"
                        >
                          {p}
                        </span>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-muted/60 p-2">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                          Engagement
                        </p>
                        <p className="text-sm font-bold text-foreground">{influencer.engagementRate}%</p>
                      </div>
                      <div className="rounded-xl bg-muted/60 p-2">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                          Score
                        </p>
                        <p className="text-sm font-bold text-foreground">{influencer.performanceScore}</p>
                      </div>
                    </div>

                    {/* Followers */}
                    <p className="mt-3 text-xs font-medium text-muted-foreground">
                      {formatFollowers(influencer.followers)} followers
                    </p>
                  </div>
                </Link>
              </LandingAnimate>
            ))}
          </div>
        </LandingAnimate>
      </div>
    </section>
  );
}
