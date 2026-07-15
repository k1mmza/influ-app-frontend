import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HowItWorksPage() {
  return (
    <div>
      {/* Hero */}
      <section className="w-full bg-gradient-to-br from-[#0F172A] via-[#1e3a8a] to-[#7C3AED] px-4 py-32 text-center">
        <h1 className="font-serif text-5xl font-medium text-white md:text-6xl">
          How Inflique Works
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
          Everything you need to run influencer campaigns — from discovery to results.
        </p>
      </section>

      {/* Placeholder steps */}
      <section className="mx-auto max-w-4xl px-4 py-24">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { step: "01", title: "Discover Creators", description: "Placeholder — search and filter thousands of creators by niche, platform, engagement, and more." },
            { step: "02", title: "Launch a Campaign", description: "Placeholder — brief your campaign, set goals, and invite creators to apply in minutes." },
            { step: "03", title: "Track Results", description: "Placeholder — monitor performance, content submissions, and ROI in one dashboard." },
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
