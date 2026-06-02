"use client";

import { cn } from "@/lib/utils";
import { LandingGuideSections } from "@/components/landing-guide-sections";
import { LandingHero } from "@/components/landing-hero";
import { LandingAnimate } from "@/components/landing-motion";
import {
  LandingFeatureList,
  LandingSectionIntro,
  LandingSectionTitle,
  type LandingFeatureItem
} from "@/components/landing-section";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Users, ShieldCheck, Zap, MessageSquare, BarChart3, Target } from "lucide-react";

const capabilityItems: LandingFeatureItem[] = [
  {
    title: "Smarter Discovery",
    description: "Slice by niche, audience size, and engagement so you're not manually combing feeds.",
    icon: <Search className="h-6 w-6 text-primary" />
  },
  {
    title: "Quality Signals",
    description: "Surface quality cues beyond vanity metrics—spot fake followers and hollow reach instantly.",
    icon: <ShieldCheck className="h-6 w-6 text-primary" />
  },
  {
    title: "Smart Recommendations",
    description: "Ranked suggestions highlight strong fits when you don't have time to compare every profile.",
    icon: <Zap className="h-6 w-6 text-primary" />
  },
  {
    title: "Unified Threads",
    description: "Negotiate, align on deliverables, and keep context in chat instead of scattered emails.",
    icon: <MessageSquare className="h-6 w-6 text-primary" />
  },
  {
    title: "Live Tracking",
    description: "Live status, applicants, and performance snapshots you can export in seconds.",
    icon: <BarChart3 className="h-6 w-6 text-primary" />
  },
  {
    title: "Transparent Briefs",
    description: "Creators see clear briefs; brands see structured deliverables—fewer surprises.",
    icon: <Target className="h-6 w-6 text-primary" />
  }
];

const pricingItems: LandingFeatureItem[] = [
  {
    title: "MVP — Free",
    description: "Core discovery, chat, campaign tracking, and profile essentials."
  },
  {
    title: "Teams — Coming soon",
    description: "Advanced filters, bulk shortlisting, richer dashboards, and exportable reports."
  }
];

import { Search } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-24 pb-20">
      <LandingHero />
      <LandingGuideSections />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="scroll-mt-20">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <LandingSectionTitle>Capabilities mapped to real workflows</LandingSectionTitle>
            <LandingSectionIntro className="mx-auto">
              Every feature answers a recurring pain point: slow discovery, fuzzy metrics, scattered comms, and late reporting.
            </LandingSectionIntro>
          </div>
          <LandingFeatureList
            items={capabilityItems}
          />
        </section>

        <section id="pricing" className="mt-32 scroll-mt-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr]">
            <div className="flex flex-col justify-center">
              <Badge className="w-fit mb-4">Pricing</Badge>
              <LandingSectionTitle>Start building today</LandingSectionTitle>
              <LandingSectionIntro>
                Start on the free MVP tier to validate workflows with your team. When you're ready for deeper analytics, upgrade to unlock advanced reporting.
              </LandingSectionIntro>
              <div className="mt-10">
                <Button size="lg" asChild className="rounded-xl px-8 shadow-lg shadow-primary/20">
                  <Link href="/register">Get Started for Free</Link>
                </Button>
              </div>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2">
              {pricingItems.map((item, idx) => (
                <Card key={item.title} className={cn("border-2 transition-all", idx === 0 ? "border-primary bg-primary/5 shadow-xl shadow-primary/5" : "border-border")}>
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-semibold tracking-tight font-serif">{item.title}</h3>
                    <p className="mt-4 text-muted-foreground leading-relaxed">{item.description}</p>
                    <ul className="mt-8 space-y-3">
                      {["Core Discovery", "Unified Chat", "Campaign Tracking", "Basic Analytics"].map(feat => (
                        <li key={feat} className="flex items-center gap-3 text-sm font-medium">
                          <Check className="h-4 w-4 text-primary" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <LandingAnimate delay={400}>
          <section className="dark mt-32 relative overflow-hidden rounded-[2.5rem] bg-background px-8 py-16 text-center text-foreground sm:px-12">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl font-medium tracking-tight sm:text-5xl font-serif">Ready to replace the busywork?</h2>
              <p className="mt-6 text-lg text-muted-foreground font-light">
                Join agencies scaling partnerships, brands launching with confidence, and creators who want steady, transparent work—all in one workspace.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" asChild className="h-14 rounded-2xl px-10 text-lg font-bold shadow-xl shadow-primary/40">
                  <Link href="/register">Register Free</Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="h-14 rounded-2xl border-border bg-white/5 px-10 text-lg font-bold text-foreground backdrop-blur-sm hover:bg-white/10">
                  <Link href="/discover">Preview Discovery</Link>
                </Button>
              </div>
            </div>
          </section>
        </LandingAnimate>
      </div>
    </div>
  );
}
