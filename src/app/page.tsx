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

const capabilityItems: LandingFeatureItem[] = [
  {
    title: "Discovery that keeps up with you",
    description:
      "Slice by niche, audience size, and engagement so you are not manually combing feeds."
  },
  {
    title: "Signals you can trust",
    description:
      "Surface quality cues beyond vanity metrics—so fake followers and hollow reach are easier to spot."
  },
  {
    title: "Recommendations, not noise",
    description:
      "Ranked suggestions highlight strong fits when you do not have time to compare every profile."
  },
  {
    title: "One deal thread",
    description:
      "Negotiate, align on deliverables, and keep context in chat instead of scattered email."
  },
  {
    title: "Reporting-ready tracking",
    description:
      "Live status, applicants, and performance snapshots you can export when the client asks."
  },
  {
    title: "Transparent expectations",
    description:
      "Creators see clear briefs; brands see structured deliverables—fewer surprises for everyone."
  }
];

const pricingItems: LandingFeatureItem[] = [
  {
    title: "MVP — Free",
    description: "Core discovery, chat, campaign tracking, and profile essentials."
  },
  {
    title: "Teams — Coming next",
    description:
      "Advanced filters, bulk shortlisting, richer performance dashboards, and exportable reports for client reviews."
  }
];

export default function HomePage() {
  return (
    <>
      <LandingHero />
      <LandingGuideSections />

      <div className="mx-auto max-w-6xl space-y-16 px-4 pb-10 pt-12 sm:px-6 lg:space-y-20">
        <section className="scroll-mt-8">
          <LandingSectionTitle>Capabilities mapped to real workflows</LandingSectionTitle>
          <LandingSectionIntro>
            Every feature answers a recurring pain point: slow discovery, fuzzy metrics, scattered comms, and late
            reporting.
          </LandingSectionIntro>
          <LandingFeatureList
            items={capabilityItems}
            className="sm:grid sm:grid-cols-2 sm:gap-x-10 sm:gap-y-7 sm:space-y-0"
          />
        </section>

        <section id="pricing" className="scroll-mt-8">
          <LandingSectionTitle>Pricing</LandingSectionTitle>
          <LandingSectionIntro>
            Start on the free MVP tier to validate workflows with your team. When you are ready for deeper analytics,
            bulk actions, and client-ready exports, upgrade to unlock advanced reporting and automation.
          </LandingSectionIntro>
          <LandingFeatureList items={pricingItems} />
        </section>

        <LandingAnimate>
          <section className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-10 text-white sm:px-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">Ready to replace the busywork?</h2>
                <p className="mt-2 max-w-xl text-sm text-slate-300">
                  Join agencies scaling partnerships, brands launching with confidence, and creators who want steady,
                  transparent work—all in one workspace.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Register free
                </Link>
                <Link
                  href="/discover"
                  className="inline-flex items-center justify-center rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Preview discovery
                </Link>
              </div>
            </div>
          </section>
        </LandingAnimate>
      </div>
    </>
  );
}
