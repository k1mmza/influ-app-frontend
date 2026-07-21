"use client";

import { Sparkles, Compass, Link2, Upload, Activity, MessageSquare } from "lucide-react";
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
    icon: Sparkles,
    title: "Build a profile in minutes",
    body: "Upload your media kit as a PDF and AI auto-fills your niche, platforms, and audience stats. No long form — your real numbers do the talking.",
  },
  {
    icon: Compass,
    title: "Find campaigns that fit",
    body: "Browse open campaigns from brands and agencies and apply to the ones that match your content, instead of pitching into DMs and hoping for a reply.",
  },
  {
    icon: Link2,
    title: "Connect YouTube & TikTok",
    body: "Link your accounts so your content is easy to submit and your numbers come from the source — not a screenshot.",
  },
  {
    icon: Upload,
    title: "Submit content by URL",
    body: "Drop in a video link and move it through a clear draft-to-submitted approval flow, so both sides know exactly where a deliverable stands.",
  },
  {
    icon: Activity,
    title: "Prove your performance",
    body: "Get tracked performance data on what you post (YouTube today), so your results are on record for the next brief instead of lost in your notifications.",
  },
  {
    icon: MessageSquare,
    title: "Talk to brands directly",
    body: "Message brands and agencies inside the campaign — the conversation stays attached to the work, not buried in a comment section.",
  },
];

export default function CreatorsPage() {
  return (
    <div>
      <MarketingHero
        eyebrow="For creators"
        title="Get cast by brands"
        highlight="that actually fit."
        subtitle="Build a profile from your real numbers, apply to campaigns that match your content, and keep a track record brands can trust — more than a DM can carry."
      >
        <CtaPrimary href="/register">Join as a creator</CtaPrimary>
        <CtaSecondary href="/discover">See the roster</CtaSecondary>
      </MarketingHero>

      <section className="w-full bg-[var(--lp-paper)] px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="What you get today"
            title="More than a link in your bio."
            intro="Every one of these works right now — set up a profile and you can start applying to real campaigns."
          />
          <FeatureGrid features={features} />
        </div>
      </section>

      <ClosingCTA
        title="Let the right campaigns find you."
        subtitle="Free to join. Build your profile and start applying."
        primaryHref="/register"
        primaryLabel="Join as a creator"
        secondaryHref="/how-it-works"
        secondaryLabel="See how it works"
      />
    </div>
  );
}
