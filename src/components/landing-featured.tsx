"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingAnimate } from "@/components/landing-motion";
import { apiGetInfluencers } from "@/lib/influencers";
import { Influencer } from "@/lib/types";

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getAvatarUrl(influencer: Influencer): string | null {
  return (
    influencer.avatarUrl ??
    Object.values(influencer.avatarByPlatform ?? {}).find(Boolean) ??
    null
  );
}

/** Influencer picture with a graceful initials fallback if it's missing or fails to load. */
function RosterAvatar({ influencer }: { influencer: Influencer }) {
  const url = getAvatarUrl(influencer);
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[var(--lp-line)] bg-[var(--lp-surface)] font-[family-name:var(--font-display)] text-base font-semibold text-[var(--lp-ink)] transition-colors group-hover:border-[var(--lp-accent-line)]">
        {getInitials(influencer.name)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- avatars are arbitrary remote hosts; plain img avoids next/image domain config
    <img
      src={url}
      alt={influencer.name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-14 w-14 shrink-0 rounded-xl border border-[var(--lp-line)] bg-[var(--lp-surface-2)] object-cover transition-colors group-hover:border-[var(--lp-accent-line)]"
    />
  );
}

export function LandingFeatured() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Public endpoint — backend sorts by performanceScore desc, so the first
    // page is effectively the "featured" set. `total` is the real platform count.
    apiGetInfluencers({ limit: 8 })
      .then((res) => {
        if (!cancelled) {
          setInfluencers(res.data);
          setTotal(res.total);
        }
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
    <section className="w-full border-y border-[var(--lp-line)] bg-[var(--lp-surface)] px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <LandingAnimate>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-[family-name:var(--font-grotesk)] text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--lp-muted)]">
                Live roster
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--lp-ink)]">
                On the platform right now
              </h2>
            </div>
            <Link
              href="/discover"
              className="inline-flex items-center gap-1.5 font-[family-name:var(--font-grotesk)] text-sm font-semibold text-[var(--lp-ink)] transition hover:text-[var(--lp-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--lp-surface)]"
            >
              {total !== null ? `Browse all ${total.toLocaleString()}` : "Browse all creators"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </LandingAnimate>

        <LandingAnimate delay={100}>
          <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4">
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="h-[184px] w-[248px] shrink-0 animate-pulse snap-start rounded-2xl border border-[var(--lp-line)] bg-[var(--lp-paper)]"
                />
              ))}
            {!loading &&
              influencers.map((influencer, index) => (
                <LandingAnimate key={influencer.id} delay={index * 60} direction="none">
                  <Link href="/discover" className="block">
                    <div className="group w-[248px] shrink-0 snap-start rounded-2xl border border-[var(--lp-line)] bg-[var(--lp-paper)] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--lp-accent-line)]">
                      <div className="flex items-center gap-3">
                        <RosterAvatar influencer={influencer} />
                        <div className="min-w-0">
                          <h3 className="truncate font-[family-name:var(--font-grotesk)] text-sm font-semibold text-[var(--lp-ink)]">
                            {influencer.name}
                          </h3>
                          <p className="mt-0.5 font-[family-name:var(--font-grotesk)] text-xs text-[var(--lp-muted)]">
                            {influencer.category}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-1">
                        {influencer.platforms.slice(0, 3).map((p) => (
                          <span
                            key={p}
                            className="rounded-md bg-[var(--lp-surface-2)] px-2 py-0.5 font-[family-name:var(--font-grotesk)] text-[10px] font-medium uppercase tracking-wide text-[var(--lp-muted)]"
                          >
                            {p}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 flex items-end justify-between border-t border-[var(--lp-line)] pt-3">
                        <div>
                          <p className="font-[family-name:var(--font-grotesk)] text-[10px] uppercase tracking-widest text-[var(--lp-muted)]">
                            Followers
                          </p>
                          <p className="font-[family-name:var(--font-grotesk)] text-lg font-semibold text-[var(--lp-ink)]">
                            {formatFollowers(influencer.followers)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-[family-name:var(--font-grotesk)] text-[10px] uppercase tracking-widest text-[var(--lp-muted)]">
                            Engaged
                          </p>
                          <p className="font-[family-name:var(--font-grotesk)] text-lg font-semibold text-[var(--lp-accent)]">
                            {influencer.engagementRate}%
                          </p>
                        </div>
                      </div>
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
