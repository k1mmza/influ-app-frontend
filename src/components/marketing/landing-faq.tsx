"use client";

import { LandingAnimate } from "@/components/marketing/landing-motion";

/**
 * "Common Inquiries" — FAQ from the Stitch landing.
 *
 * Native <details>/<summary> rather than a JS accordion: it is keyboard and
 * screen-reader correct for free, works without hydration, and needs no state.
 *
 * ⚠️ The mockup's answer to "How do I get started?" promised "1-on-1
 * walk-throughs for premium accounts". There is no onboarding team and no
 * premium tier — that answer is rewritten below to describe the real
 * register → role-select flow. Don't restore the mockup copy.
 */

const FAQS = [
  {
    q: "Who is this for?",
    a: "Brands casting creators for a campaign, agencies running rosters on behalf of clients, and creators who want to be found by both. You pick which of the three you are when you register.",
  },
  {
    q: "How do I get started?",
    a: "Create an account, choose your role — brand, agency, or creator — and you land in the right workspace. Searching the directory is free and doesn't need an account at all.",
  },
  {
    q: "Do I need an account to search?",
    a: "No. Discover is open — search by niche and reach, or paste a profile link, without signing up. You'll need an account to shortlist creators, send a brief, or start a campaign.",
  },
  {
    q: "Where do the numbers come from?",
    a: "Creators connect their YouTube or TikTok account, and we sync follower and engagement figures from the platform directly. Profiles that aren't connected show what the creator entered themselves.",
  },
];

export function LandingFaq() {
  return (
    <section className="w-full border-t border-tv-outline-variant bg-tv-surface-container-low px-4 py-tv-section-gap">
      <div className="mx-auto w-full max-w-3xl">
        <LandingAnimate>
          <h2 className="text-center font-tv-serif text-3xl font-bold tracking-tight text-tv-on-surface sm:text-tv-headline-lg">
            Common Inquiries
          </h2>
        </LandingAnimate>

        <div className="mt-12 divide-y divide-tv-outline-variant border-y border-tv-outline-variant">
          {FAQS.map((item, i) => (
            <LandingAnimate key={item.q} delay={i * 60} direction="none">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 font-tv-serif text-tv-headline-md text-tv-on-surface transition-colors hover:text-tv-primary [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    aria-hidden
                    className="relative h-4 w-4 shrink-0 text-tv-primary before:absolute before:left-0 before:top-1/2 before:h-px before:w-4 before:-translate-y-1/2 before:bg-current after:absolute after:left-1/2 after:top-0 after:h-4 after:w-px after:-translate-x-1/2 after:bg-current after:transition-transform group-open:after:scale-y-0"
                  />
                </summary>
                <p className="pb-6 font-tv-body text-tv-body-md text-tv-on-surface-variant">
                  {item.a}
                </p>
              </details>
            </LandingAnimate>
          ))}
        </div>
      </div>
    </section>
  );
}
