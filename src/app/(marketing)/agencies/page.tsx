"use client";

import { Compass, Heart, Share2, Megaphone, Activity, MessageSquare } from "lucide-react";
import {
  MarketingHero,
  SectionHeading,
  FeatureGrid,
  ClosingCTA,
  CtaPrimary,
  CtaSecondary,
  type Feature,
} from "@/components/marketing/marketing-sections";

const features: Feature[] = [
  {
    icon: Compass,
    title: "Discover the right creators",
    body: "Search the roster by niche, reach, and audience, or paste a profile link to pull real numbers. Filter down to a fit instead of scrolling feeds.",
  },
  {
    icon: Megaphone,
    title: "Run campaigns end to end",
    body: "Create, edit, and manage campaign briefs, then collect applications from creators in one place — the whole brief-to-shortlist loop, off email.",
  },
  {
    icon: Heart,
    title: "Shortlist applicants",
    body: "Star the applicants worth a second look and keep every campaign's shortlist organized, instead of a spreadsheet tab per client.",
  },
  {
    icon: Share2,
    title: "Share for client sign-off",
    body: "Send a public shortlist or campaign page by link. Clients open it in the browser and review — no account, no login, no PDF export.",
  },
  {
    icon: Activity,
    title: "Track what went live",
    body: "Approved content flows into performance tracking and reporting (YouTube today, with manual sync) so results sit next to the campaign that drove them.",
  },
  {
    icon: MessageSquare,
    title: "Message creators in-app",
    body: "Talk to applicants and confirmed creators inside the campaign — context stays attached instead of scattered across inboxes.",
  },
];

export default function AgenciesPage() {
  return (
    <div>
      <MarketingHero
        eyebrow="For agencies & brands"
        title="Run creator campaigns"
        highlight="without the spreadsheet."
        subtitle="Discover creators, brief a campaign, shortlist applicants, and track what went live — the workflow you're stitching together across sheets and email, in one directory."
        image={{
          src: "/pictures/stitch-agencies-brands.jpg",
          alt: "A campaign manager working at a laptop in a warm, terracotta-toned office.",
          // Anchored left on purpose. The laptop on the right of this frame shows
          // a FABRICATED dashboard — invented brand names ("AURA / LUNA / VERVE")
          // and made-up metrics that are not this product's UI. Pulling the crop
          // left keeps the subject and pushes that screen out of frame. Do not
          // recentre this without replacing the asset.
          objectPosition: "22% center",
        }}
      >
        <CtaPrimary href="/register">Get started free</CtaPrimary>
        <CtaSecondary href="/discover">Explore the roster</CtaSecondary>
      </MarketingHero>

      <section className="w-full border-y border-tv-outline-variant bg-tv-surface-container-low px-4 py-tv-section-gap">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="What you can do today"
            title="Everything from first search to sign-off."
            intro="These are working features, not a roadmap — set up an account and you can run a real campaign through them now."
          />
          <FeatureGrid features={features} />
        </div>
      </section>

      <ClosingCTA
        title="Replace the sheet-and-email scramble."
        subtitle="Free to search the roster. Set up a campaign when you're ready."
        primaryHref="/register"
        primaryLabel="Get started free"
        secondaryHref="/how-it-works"
        secondaryLabel="See how it works"
      />
    </div>
  );
}
