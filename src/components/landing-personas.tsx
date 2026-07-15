"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LandingAnimate } from "@/components/landing-motion";

// The one place the app's persona identity colours appear on the marketing page —
// as a restrained tick + label only, never as a fill or the page palette.
const LANES = [
  {
    tag: "For brands",
    color: "var(--lp-brand)",
    title: "Brief creators, not agencies.",
    body: "Search by audience and reach, shortlist in a click, and send a brief without a middleman markup.",
    href: "/agencies",
    cta: "Start a campaign",
  },
  {
    tag: "For agencies",
    color: "var(--lp-agency)",
    title: "Run every client roster in one place.",
    body: "Manage discovery, outreach, and reporting across all your brands from a single workspace.",
    href: "/agencies",
    cta: "Book a walkthrough",
  },
  {
    tag: "For creators",
    color: "var(--lp-creator)",
    title: "Get found by brands that fit.",
    body: "Claim your profile, show real numbers, and let the right campaigns come to you.",
    href: "/creators",
    cta: "Claim your profile",
  },
] as const;

export function LandingPersonas() {
  return (
    <section className="w-full bg-[var(--lp-paper)] px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <LandingAnimate>
          <h2 className="max-w-2xl font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight tracking-tight text-[var(--lp-ink)] md:text-5xl">
            One directory, three seats at the table.
          </h2>
        </LandingAnimate>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-[var(--lp-line)] bg-[var(--lp-line)] md:grid-cols-3">
          {LANES.map((lane, i) => (
            <LandingAnimate key={lane.tag} delay={i * 90} direction="none">
              <Link
                href={lane.href}
                className="group flex h-full flex-col bg-[var(--lp-surface)] p-8 transition hover:bg-[var(--lp-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--lp-accent)] md:p-10"
              >
                <span className="inline-flex items-center gap-2 font-[family-name:var(--font-grotesk)] text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--lp-muted)]">
                  <span className="h-3 w-[3px] rounded-full" style={{ backgroundColor: lane.color }} />
                  {lane.tag}
                </span>

                <h3 className="mt-6 font-[family-name:var(--font-display)] text-2xl font-semibold leading-snug tracking-tight text-[var(--lp-ink)]">
                  {lane.title}
                </h3>

                <p className="mt-3 flex-1 font-[family-name:var(--font-grotesk)] text-[15px] leading-relaxed text-[var(--lp-ink-soft)]">
                  {lane.body}
                </p>

                <span className="mt-8 inline-flex items-center gap-1.5 font-[family-name:var(--font-grotesk)] text-sm font-semibold text-[var(--lp-ink)]">
                  {lane.cta}
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            </LandingAnimate>
          ))}
        </div>
      </div>
    </section>
  );
}
