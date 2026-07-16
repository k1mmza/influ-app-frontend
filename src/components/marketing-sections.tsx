"use client";

// Shared marketing primitives for the public info pages (/how-it-works,
// /agencies, /creators). Built on the landing redesign's --lp-* token system
// (porcelain/graphite/persimmon) + Bricolage display / Space Grotesk body, so
// these secondary pages read as one system with the landing page rather than
// inventing new layout language. Reveal-on-scroll reuses LandingAnimate.
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { LandingAnimate } from "@/components/landing-motion";

// Barely-there "catalog" index grid — the landing hero's signature texture,
// reused subtly so the info-page heroes feel of a piece with it.
const INDEX_GRID_STYLE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(var(--lp-line) 1px, transparent 1px), linear-gradient(90deg, var(--lp-line) 1px, transparent 1px)",
  backgroundSize: "80px 80px",
  maskImage: "radial-gradient(ellipse 90% 70% at 50% 30%, #000 30%, transparent 72%)",
  WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 50% 30%, #000 30%, transparent 72%)",
};

export function CtaPrimary({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--lp-accent)] px-7 font-[family-name:var(--font-grotesk)] text-sm font-semibold text-[var(--lp-accent-ink)] transition hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--lp-paper)] active:scale-[0.99]"
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export function CtaSecondary({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-xl border border-[var(--lp-line)] bg-[var(--lp-surface)] px-7 font-[family-name:var(--font-grotesk)] text-sm font-semibold text-[var(--lp-ink)] transition hover:border-[var(--lp-accent-line)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--lp-paper)]"
    >
      {children}
    </Link>
  );
}

export function MarketingHero({
  eyebrow,
  title,
  highlight,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative w-full overflow-hidden bg-[var(--lp-paper)] px-4 pb-20 pt-14 sm:pt-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.5]" style={INDEX_GRID_STYLE} />
      <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
        <LandingAnimate onMount>
          <p className="mb-6 inline-flex items-center gap-2 font-[family-name:var(--font-grotesk)] text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--lp-muted)]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--lp-accent)]" />
            {eyebrow}
          </p>
        </LandingAnimate>
        <LandingAnimate onMount delay={120}>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.02] tracking-tight text-[var(--lp-ink)] sm:text-5xl md:text-6xl">
            {title}
            {highlight ? (
              <>
                <br />
                <span className="text-[var(--lp-muted)]">{highlight}</span>
              </>
            ) : null}
          </h1>
        </LandingAnimate>
        <LandingAnimate onMount delay={230}>
          <p className="mx-auto mt-6 max-w-xl font-[family-name:var(--font-grotesk)] text-base leading-relaxed text-[var(--lp-ink-soft)] sm:text-lg">
            {subtitle}
          </p>
        </LandingAnimate>
        {children ? (
          <LandingAnimate onMount delay={340}>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">{children}</div>
          </LandingAnimate>
        ) : null}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="mb-12 max-w-2xl">
      <LandingAnimate>
        {eyebrow ? (
          <p className="font-[family-name:var(--font-grotesk)] text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--lp-muted)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--lp-ink)] sm:text-4xl">
          {title}
        </h2>
        {intro ? (
          <p className="mt-4 font-[family-name:var(--font-grotesk)] text-base leading-relaxed text-[var(--lp-ink-soft)]">
            {intro}
          </p>
        ) : null}
      </LandingAnimate>
    </div>
  );
}

export type Feature = { icon: LucideIcon; title: string; body: string };

export function FeatureCard({ icon: Icon, title, body, index = 0 }: Feature & { index?: number }) {
  return (
    <LandingAnimate delay={index * 60} direction="none">
      <div className="group flex h-full flex-col rounded-2xl border border-[var(--lp-line)] bg-[var(--lp-surface)] p-7 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--lp-accent-line)]">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--lp-line)] bg-[var(--lp-paper)] text-[var(--lp-accent)] transition-colors group-hover:border-[var(--lp-accent-line)]">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[var(--lp-ink)]">
          {title}
        </h3>
        <p className="mt-2.5 flex-1 font-[family-name:var(--font-grotesk)] text-[15px] leading-relaxed text-[var(--lp-ink-soft)]">
          {body}
        </p>
      </div>
    </LandingAnimate>
  );
}

export function FeatureGrid({ features }: { features: Feature[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((f, i) => (
        <FeatureCard key={f.title} {...f} index={i} />
      ))}
    </div>
  );
}

export type LaneStep = { title: string; body: string };

export function StepLane({
  tag,
  color,
  title,
  steps,
  index = 0,
}: {
  tag: string;
  color: string;
  title: string;
  steps: LaneStep[];
  index?: number;
}) {
  return (
    <LandingAnimate delay={index * 90} direction="none">
      <div className="flex h-full flex-col rounded-2xl border border-[var(--lp-line)] bg-[var(--lp-surface)] p-8 md:p-10">
        <span className="inline-flex items-center gap-2 font-[family-name:var(--font-grotesk)] text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--lp-muted)]">
          <span className="h-3 w-[3px] rounded-full" style={{ backgroundColor: color }} />
          {tag}
        </span>
        <h3 className="mt-5 font-[family-name:var(--font-display)] text-2xl font-semibold leading-snug tracking-tight text-[var(--lp-ink)]">
          {title}
        </h3>
        <ol className="mt-7 space-y-6">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--lp-line)] bg-[var(--lp-paper)] font-[family-name:var(--font-grotesk)] text-xs font-semibold text-[var(--lp-ink)]">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="font-[family-name:var(--font-grotesk)] text-[15px] font-semibold text-[var(--lp-ink)]">
                  {s.title}
                </p>
                <p className="mt-1 font-[family-name:var(--font-grotesk)] text-sm leading-relaxed text-[var(--lp-ink-soft)]">
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </LandingAnimate>
  );
}

export function ClosingCTA({
  title,
  subtitle,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  subtitle: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="w-full border-t border-[var(--lp-line)] bg-[var(--lp-paper)] px-4 py-28">
      <LandingAnimate>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight tracking-tight text-[var(--lp-ink)] md:text-5xl">
            {title}
          </h2>
          <p className="mx-auto mt-5 max-w-md font-[family-name:var(--font-grotesk)] text-base text-[var(--lp-ink-soft)]">
            {subtitle}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CtaPrimary href={primaryHref}>{primaryLabel}</CtaPrimary>
            {secondaryHref && secondaryLabel ? <CtaSecondary href={secondaryHref}>{secondaryLabel}</CtaSecondary> : null}
          </div>
        </div>
      </LandingAnimate>
    </section>
  );
}
