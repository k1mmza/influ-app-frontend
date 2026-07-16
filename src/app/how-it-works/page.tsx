"use client";

import { MessageSquare, Share2, Youtube } from "lucide-react";
import {
  MarketingHero,
  SectionHeading,
  StepLane,
  FeatureGrid,
  ClosingCTA,
  CtaPrimary,
  CtaSecondary,
  type LaneStep,
  type Feature,
} from "@/components/marketing-sections";

const brandSteps: LaneStep[] = [
  {
    title: "Discover creators",
    body: "Search the roster by niche, reach, and audience — or paste a profile link to pull real numbers back.",
  },
  {
    title: "Launch a campaign",
    body: "Write a brief, publish the campaign, and collect applications from creators who fit — no cold outreach.",
  },
  {
    title: "Review & track",
    body: "Shortlist applicants (and share that shortlist for sign-off), approve submitted content, and watch performance land in your dashboard.",
  },
];

const creatorSteps: LaneStep[] = [
  {
    title: "Build a profile",
    body: "Upload a media kit PDF and let AI auto-fill your niche, platforms, and audience stats — no long form to fill in.",
  },
  {
    title: "Apply to campaigns",
    body: "Browse open campaigns from brands and agencies and apply to the ones that match your content.",
  },
  {
    title: "Submit & track",
    body: "Submit your content by URL, move it through the approval flow, and see tracked performance once it's live.",
  },
];

const sharedFeatures: Feature[] = [
  {
    icon: MessageSquare,
    title: "In-app messaging",
    body: "Brands, agencies, and creators talk directly inside a campaign — no scattered email threads.",
  },
  {
    icon: Share2,
    title: "Shareable links",
    body: "Send a public shortlist or campaign page to anyone for review — no account needed to open it.",
  },
  {
    icon: Youtube,
    title: "Connected accounts",
    body: "Creators connect YouTube and TikTok so their content is easy to submit and track.",
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      <MarketingHero
        eyebrow="How Inflique works"
        title="From casting brief"
        highlight="to tracked results."
        subtitle="Inflique is a casting directory for the creator economy. The path depends on who you are — here's how each side moves from first search to measured results."
      >
        <CtaPrimary href="/register">Create a free account</CtaPrimary>
        <CtaSecondary href="/discover">Explore the roster</CtaSecondary>
      </MarketingHero>

      <section className="w-full bg-[var(--lp-paper)] px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Two lanes, one directory"
            title="Pick the path that's yours."
            intro="Brands and agencies cast and manage campaigns; creators build a profile and get cast. Both meet in the same place."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <StepLane
              tag="For brands & agencies"
              color="var(--lp-brand)"
              title="Discover, brief, and track — in one place."
              steps={brandSteps}
              index={0}
            />
            <StepLane
              tag="For creators"
              color="var(--lp-creator)"
              title="Show real numbers, get the right briefs."
              steps={creatorSteps}
              index={1}
            />
          </div>
        </div>
      </section>

      <section className="w-full border-y border-[var(--lp-line)] bg-[var(--lp-surface)] px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="Along the way" title="The parts both sides rely on." />
          <FeatureGrid features={sharedFeatures} />
        </div>
      </section>

      <ClosingCTA
        title="See who's already on the roster."
        subtitle="Free to search. No sales call to get started."
        primaryHref="/register"
        primaryLabel="Create a free account"
        secondaryHref="/discover"
        secondaryLabel="Explore the roster first"
      />
    </div>
  );
}
