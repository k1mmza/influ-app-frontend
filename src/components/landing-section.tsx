"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { LandingAnimate } from "@/components/landing-motion";
import { Card, CardContent } from "@/components/ui/card";

export type LandingFeatureItem = {
  title: string;
  description: string;
  icon?: React.ReactNode;
};

export function LandingSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <LandingAnimate>
      <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl font-serif">{children}</h2>
    </LandingAnimate>
  );
}

export function LandingSectionIntro({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <LandingAnimate delay={100}>
      <p className={cn("mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground", className)}>
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
    <div className={cn("mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map(({ title, description, icon }, index) => (
        <LandingAnimate key={title} delay={200 + index * 50}>
          <Card className="h-full border-none bg-slate-50/50 shadow-none transition-all hover:bg-slate-50">
            <CardContent className="p-8">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                {icon || <Check className="h-6 w-6 text-primary" />}
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground font-serif">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        </LandingAnimate>
      ))}
    </div>
  );
}
