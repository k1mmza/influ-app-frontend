"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { LandingAnimate } from "@/components/marketing/landing-motion";
import { Card, CardContent } from "@/components/ui/card";

export type LandingFeatureItem = {
  title: string;
  description: string;
  icon?: React.ReactNode;
};

export function LandingSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <LandingAnimate>
      <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl font-serif">{children}</h2>
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
  className,
  accent = false
}: {
  items: LandingFeatureItem[];
  className?: string;
  accent?: boolean;
}) {
  return (
    <div className={cn("mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map(({ title, description, icon }, index) => (
        <LandingAnimate key={title} delay={200 + index * 50}>
          <Card className={cn(
            "h-full shadow-none transition-all hover:shadow-md",
            accent
              ? "border border-border/60 bg-card hover:border-primary/30"
              : "border-none bg-muted/50 hover:bg-muted"
          )}>
            <CardContent className="p-8">
              <div className={cn(
                "mb-6 flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm",
                accent ? "bg-primary/10" : "bg-card"
              )}>
                {icon || <Check className="h-6 w-6 text-primary" />}
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-foreground font-serif">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        </LandingAnimate>
      ))}
    </div>
  );
}
