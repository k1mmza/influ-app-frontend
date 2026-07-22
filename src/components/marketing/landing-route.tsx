"use client";

import { useState } from "react";
import {
  Search,
  Mail,
  Navigation2,
  ClipboardCheck,
  UserPlus,
  Eye,
  MessagesSquare,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { LandingAnimate } from "@/components/marketing/landing-motion";

/**
 * "The Route to Success" — the itinerary section from the Stitch landing.
 *
 * A role switcher toggles between two four-stop itineraries, each with a
 * passport-stamp badge and connected by a dotted route line.
 *
 * Copy is checked against what the app actually does. Notably the mockup's
 * creator step 4 ("Grow — get paid securely") is softened: there is no
 * payments/wallet feature in the codebase, so it must not promise one. Keep
 * every claim here truthful — see the same discipline in landing-features.tsx.
 */

type Stop = { icon: LucideIcon; title: string; body: string; stamp: string };
type Role = "brands" | "creators";

const ROUTES: Record<Role, Stop[]> = {
  brands: [
    {
      icon: Search,
      title: "Discover",
      body: "Search creators by niche, reach, and audience — or paste a profile link to pull their real numbers.",
      stamp: "Stamped",
    },
    {
      icon: Mail,
      title: "Invite / Apply",
      body: "Send a brief straight to a creator, or open the campaign and let creators apply to you.",
      stamp: "Waypoint",
    },
    {
      icon: Navigation2,
      title: "Run campaign",
      body: "Keep briefs, submitted content, and the conversation with each creator in one place.",
      stamp: "Pinned",
    },
    {
      icon: ClipboardCheck,
      title: "Track results",
      body: "Measure what shipped, then share a live report link with anyone — no account needed to read it.",
      stamp: "Certified",
    },
  ],
  creators: [
    {
      icon: UserPlus,
      title: "Build profile",
      body: "Connect your socials so your real reach and engagement show — not a number you typed in.",
      stamp: "Listed",
    },
    {
      icon: Eye,
      title: "Get found",
      body: "Show up when brands and agencies search the directory by niche, reach, and audience.",
      stamp: "Visited",
    },
    {
      icon: MessagesSquare,
      title: "Collaborate",
      body: "Message brands and manage campaign briefs directly in the app, all in one thread.",
      stamp: "Active",
    },
    {
      icon: TrendingUp,
      title: "Grow",
      body: "Track how each campaign performed and build a record that brings the next one in.",
      stamp: "Upgraded",
    },
  ],
};

const ROLE_LABELS: { role: Role; label: string }[] = [
  { role: "brands", label: "Agencies & Brands" },
  { role: "creators", label: "Creators" },
];

export function LandingRoute() {
  const [role, setRole] = useState<Role>("brands");
  const stops = ROUTES[role];

  return (
    <section className="w-full bg-tv-background px-4 py-tv-section-gap">
      <div className="mx-auto w-full max-w-7xl md:px-tv-margin-safe">
        <LandingAnimate>
          <p className="font-tv-body text-tv-label-caps uppercase text-tv-muted-text">
            The itinerary
          </p>
          <h2 className="mt-2 font-tv-serif text-3xl font-bold tracking-tight text-tv-on-surface sm:text-tv-headline-lg">
            The Route to Success
          </h2>

          {/* Role switcher — the same route, seen from either side of the deal. */}
          <div
            role="tablist"
            aria-label="Choose whose route to view"
            className="mt-8 inline-flex rounded-tv-full border border-tv-outline-variant bg-tv-surface-container p-1"
          >
            {ROLE_LABELS.map(({ role: r, label }) => {
              const active = r === role;
              return (
                <button
                  key={r}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setRole(r)}
                  className={`cursor-pointer rounded-tv-full px-5 py-2 font-tv-body text-tv-label-caps uppercase transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tv-primary focus-visible:ring-offset-2 ${
                    active
                      ? "bg-tv-primary text-tv-on-primary"
                      : "text-tv-on-surface-variant hover:text-tv-on-surface"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </LandingAnimate>

        {/* Keyed by role so switching remounts the list and re-runs the
            staggered fade — the stops animate back in on every toggle. */}
        <ol
          key={role}
          className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-tv-gutter"
        >
          {/* Dotted route line connecting the stops — the design brief's
              "dotted route" device. Desktop only; on mobile the stops stack and
              the line would run through the copy. */}
          <span
            aria-hidden
            className="absolute left-0 right-0 top-7 hidden border-t border-dashed border-tv-outline-variant md:block"
          />
          {stops.map((stop, i) => (
            <li key={stop.title} className="relative">
              <LandingAnimate delay={i * 90} direction="none">
                <span className="relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-tv-full border border-tv-outline-variant bg-tv-surface-container-lowest text-tv-primary">
                  <stop.icon className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <p className="mt-6 font-tv-body text-tv-label-caps uppercase text-tv-muted-text">
                  {String(i + 1).padStart(2, "0")} · {stop.stamp}
                </p>
                <h3 className="mt-2 font-tv-serif text-tv-headline-md text-tv-on-surface">
                  {stop.title}
                </h3>
                <p className="mt-2 font-tv-body text-tv-body-md text-tv-on-surface-variant">
                  {stop.body}
                </p>
              </LandingAnimate>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
