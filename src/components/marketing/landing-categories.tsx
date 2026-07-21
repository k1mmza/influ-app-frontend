"use client";

import Link from "next/link";
import { LandingAnimate } from "@/components/marketing/landing-motion";

// A quiet directory index on ink — the one dark, gallery-like moment on the page.
const CATEGORY_ITEMS: { name: string; href: string }[] = [
  { name: "Beauty", href: "/discover?category=Beauty" },
  { name: "Fashion", href: "/discover?category=Fashion" },
  { name: "Fitness", href: "/discover?category=Fitness" },
  { name: "Food & Drink", href: "/discover?category=Food" },
  { name: "Travel", href: "/discover?category=Travel" },
  { name: "Tech", href: "/discover?category=Tech" },
  { name: "Lifestyle", href: "/discover?category=Lifestyle" },
  { name: "Gaming", href: "/discover?category=Gaming" },
];

export function LandingCategories() {
  return (
    <section className="w-full bg-[var(--lp-ink)] px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <LandingAnimate>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--lp-paper)] md:text-5xl">
              Browse the index
            </h2>
            <p className="max-w-xs font-[family-name:var(--font-grotesk)] text-sm text-[var(--lp-paper)]/55">
              Every creator is filed by the content they actually make — so a search
              returns a fit, not a follower count.
            </p>
          </div>
        </LandingAnimate>

        <div className="mt-12 grid grid-cols-1 border-t border-[var(--lp-paper)]/15 sm:grid-cols-2">
          {CATEGORY_ITEMS.map((item, index) => (
            <LandingAnimate key={item.name} delay={index * 45} direction="none">
              <Link
                href={item.href}
                className="group flex items-baseline gap-5 border-b border-[var(--lp-paper)]/15 py-6 transition-colors hover:bg-[var(--lp-paper)]/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--lp-accent)] sm:px-2"
              >
                <span className="w-8 font-[family-name:var(--font-grotesk)] text-sm tabular-nums text-[var(--lp-paper)]/40">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--lp-paper)] transition-colors group-hover:text-[var(--lp-accent)] md:text-3xl">
                  {item.name}
                </span>
                <span className="font-[family-name:var(--font-grotesk)] text-sm text-white/0 transition-colors group-hover:text-[var(--lp-accent)]">
                  View →
                </span>
              </Link>
            </LandingAnimate>
          ))}
        </div>
      </div>
    </section>
  );
}
