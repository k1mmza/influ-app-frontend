"use client";

import { LandingHero } from "@/components/landing-hero";
import { LandingFeatured } from "@/components/landing-featured";
import { LandingCategories } from "@/components/landing-categories";
import { LandingAnimate } from "@/components/landing-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <LandingHero />

      {/* Trust Strip */}
      <section className="bg-card w-full py-14 px-4 border-y border-border/50">
        <LandingAnimate>
          <div className="mx-auto max-w-4xl grid grid-cols-3 gap-8 text-center">
            {[
              { value: "16k+", label: "Creators" },
              { value: "8",    label: "Platforms" },
              { value: "500+", label: "Brands" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-4xl font-bold text-foreground font-serif">{value}</p>
                <p className="mt-1 text-sm font-medium text-muted-foreground uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </div>
        </LandingAnimate>
      </section>

      <LandingFeatured />
      <LandingCategories />

      {/* CTA */}
      <section className="relative overflow-hidden w-full py-24 px-4 bg-gradient-to-r from-primary to-secondary">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />
        <LandingAnimate>
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-white">
              Ready to find your perfect creator?
            </h2>
            <p className="mt-4 text-white/75 text-lg font-light max-w-xl mx-auto">
              Join brands and agencies already scaling with Inflique.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Button
                asChild
                className="h-14 rounded-2xl bg-white text-primary px-10 text-base font-bold shadow-xl hover:bg-white/90 cursor-pointer transition-all"
              >
                <Link href="/register">Register Free</Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="h-14 rounded-2xl border-white/30 bg-white/10 px-10 text-base font-bold text-white backdrop-blur-sm hover:bg-white/20 hover:border-white/50 cursor-pointer transition-all"
              >
                <Link href="/discover">Explore Creators</Link>
              </Button>
            </div>
          </div>
        </LandingAnimate>
      </section>
    </div>
  );
}
