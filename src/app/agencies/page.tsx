import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AgenciesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="w-full bg-gradient-to-br from-[#0F172A] via-[#0369A1] to-[#0F172A] px-4 py-32 text-center">
        <h1 className="font-serif text-5xl font-medium text-white md:text-6xl">
          For Agencies & Brands
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
          Find the right creators, launch campaigns faster, and measure real results — all in one place.
        </p>
        <Button asChild className="mt-10 h-14 rounded-2xl bg-white px-10 text-base font-bold font-serif text-[#0F172A] shadow-xl hover:bg-white/90">
          <Link href="/register">Get Started Free</Link>
        </Button>
      </section>

      {/* Placeholder benefits */}
      <section className="mx-auto max-w-4xl px-4 py-24">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { step: "01", title: "Discover Creators",     description: "Placeholder — search thousands of vetted creators by niche, platform, audience size, engagement rate, and location." },
            { step: "02", title: "Launch Campaigns",      description: "Placeholder — create a campaign brief, set your budget, and invite creators to apply — no back-and-forth emails." },
            { step: "03", title: "Measure Performance",   description: "Placeholder — track submissions, approvals, reach, and ROI from a single dashboard in real time." },
          ].map(({ step, title, description }) => (
            <div key={step} className="rounded-2xl border border-border bg-card p-8">
              <p className="font-serif text-4xl font-bold text-primary/30">{step}</p>
              <h3 className="mt-4 font-serif text-xl font-semibold text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
          <p className="font-serif text-2xl font-medium text-foreground">More content coming soon</p>
          <p className="mt-3 text-sm text-muted-foreground">This page is a placeholder — full content will be added in a future session.</p>
          <Button asChild className="mt-8 rounded-full font-serif font-semibold">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
