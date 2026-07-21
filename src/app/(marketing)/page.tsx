"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingHero } from "@/components/marketing/landing-hero";
import { LandingFeatured } from "@/components/marketing/landing-featured";
import { LandingPersonas } from "@/components/marketing/landing-personas";
import { LandingRoute } from "@/components/marketing/landing-route";
import { LandingFeatures } from "@/components/marketing/landing-features";
import { LandingFaq } from "@/components/marketing/landing-faq";
import { LandingAnimate } from "@/components/marketing/landing-motion";

/**
 * Landing page — composition ported from stitch-export/landing-page/.
 *
 * Section order follows the Stitch mockup, with one deliberate addition:
 * LandingFeatured has no counterpart in the mockup, but it is the only section
 * on this page rendering live backend data (apiGetInfluencers). It is kept and
 * slotted after the persona cards rather than dropped.
 */
export default function HomePage() {
  return (
    <div className="bg-tv-surface">
      <LandingHero />
      <LandingPersonas />
      <LandingFeatured />
      <LandingRoute />
      <LandingFeatures />

      {/* Closing call — quiet, no gradient. A single accent CTA on paper. */}
      <section className="w-full bg-tv-background px-4 py-tv-section-gap">
        <LandingAnimate>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-tv-serif text-3xl font-bold leading-tight tracking-tight text-tv-on-surface sm:text-tv-headline-lg md:text-tv-display-lg">
              Your next creator is already in here.
            </h2>
            <p className="mx-auto mt-5 max-w-md font-tv-body text-tv-body-lg text-tv-on-surface-variant">
              Free to search. No sales call to see the roster.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-tv-full bg-tv-primary px-8 font-tv-body text-tv-label-caps uppercase text-tv-on-primary transition-all hover:bg-tv-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tv-primary focus-visible:ring-offset-2 active:scale-95"
              >
                Create a free account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/discover"
                className="inline-flex h-12 items-center justify-center rounded-tv-full border border-tv-outline-variant bg-tv-surface-container-lowest px-8 font-tv-body text-tv-label-caps uppercase text-tv-on-surface transition hover:border-tv-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tv-primary focus-visible:ring-offset-2"
              >
                Explore the roster first
              </Link>
            </div>
          </div>
        </LandingAnimate>
      </section>

      <LandingFaq />
    </div>
  );
}
