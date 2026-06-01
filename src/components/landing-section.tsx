"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { LandingAnimate } from "@/components/landing-motion";

export type LandingFeatureItem = {
  title: string;
  description: string;
};

export function LandingSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <LandingAnimate>
      <h2 className="text-3xl font-bold leading-tight text-primary sm:text-4xl">{children}</h2>
    </LandingAnimate>
  );
}

export function LandingSectionIntro({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <LandingAnimate delay={100}>
      <p className={cn("mt-4 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base", className)}>
        {children}
      </p>
    </LandingAnimate>
  );
}

export function LandingFeatureList({
  items,
  className
}: {
  items: LandingFeatureItem[];
  className?: string;
}) {
  return (
    <ul className={cn("mt-8 space-y-7", className)}>
      {items.map(({ title, description }, index) => (
        <LandingAnimate key={title} as="li" delay={150 + index * 80} className="flex gap-4">
          <div
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#d4af37] text-[#d4af37]"
            aria-hidden
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500 sm:text-base">{description}</p>
          </div>
        </LandingAnimate>
      ))}
    </ul>
  );
}
