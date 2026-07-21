"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingHero } from "@/components/marketing/landing-hero";
import { LandingFeatured } from "@/components/marketing/landing-featured";
import { LandingPersonas } from "@/components/marketing/landing-personas";
import { LandingAnimate } from "@/components/marketing/landing-motion";

export default function HomePage() {
  return (
    <div className="bg-[var(--lp-paper)]">
      <LandingHero />
      <LandingFeatured />
      <LandingPersonas />

      {/* Closing call — quiet, no gradient. A single accent CTA on paper. */}
      <section className="w-full bg-[var(--lp-paper)] px-4 py-28">
        <LandingAnimate>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight tracking-tight text-[var(--lp-ink)] md:text-6xl">
              Your next creator is already in here.
            </h2>
            <p className="mx-auto mt-5 max-w-md font-[family-name:var(--font-grotesk)] text-base text-[var(--lp-ink-soft)]">
              Free to search. No sales call to see the roster.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--lp-accent)] px-7 font-[family-name:var(--font-grotesk)] text-sm font-semibold text-[var(--lp-accent-ink)] transition hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--lp-paper)] active:scale-[0.99]"
              >
                Create a free account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/discover"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[var(--lp-line)] bg-[var(--lp-surface)] px-7 font-[family-name:var(--font-grotesk)] text-sm font-semibold text-[var(--lp-ink)] transition hover:border-[var(--lp-accent-line)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--lp-paper)]"
              >
                Explore the roster first
              </Link>
            </div>
          </div>
        </LandingAnimate>
      </section>
    </div>
  );
}
