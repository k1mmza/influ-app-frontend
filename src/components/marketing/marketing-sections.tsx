"use client";

// Shared marketing primitives for the public info pages (/how-it-works,
// /agencies, /creators) and, via legal-page-layout, /terms /privacy /cookies.
//
// Composition ported from stitch-export/{how-it-works,creators,agencies-brands}:
// pill eyebrow badge, italic-serif highlight clause, squared "paper edge" cards,
// and a 7/5 split hero when a photo is supplied. Colours use the tv-* namespace
// from tailwind.config.ts; token values and rationale live in /design-tokens.md.
//
// NOTE: MarketingHero is also rendered by the legal pages, which pass no image.
// The centred, image-less path is load-bearing — don't make `image` required.
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { LandingAnimate } from "@/components/marketing/landing-motion";

export function CtaPrimary({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-tv-full bg-tv-primary px-8 font-tv-body text-tv-label-caps uppercase text-tv-on-primary transition-all hover:bg-tv-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tv-primary focus-visible:ring-offset-2 active:scale-95"
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
      className="inline-flex h-12 items-center justify-center rounded-tv-full border border-tv-outline-variant bg-tv-surface-container-lowest px-8 font-tv-body text-tv-label-caps uppercase text-tv-on-surface transition hover:border-tv-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tv-primary focus-visible:ring-offset-2"
    >
      {children}
    </Link>
  );
}

/** Pill eyebrow badge — the Stitch "FOR CREATORS" / "FOR AGENCIES" chip. */
function EyebrowBadge({ label }: { label: string }) {
  return (
    // Two corrections to the Stitch spec, both because its own tokens collide:
    //
    // border: outline-variant, not secondary-fixed — the latter is the same hex
    //   as the badge fill in light mode, so it delineated nothing, and the pale
    //   fill is only 1.23:1 against the page.
    // text: on-surface, not on-secondary-fixed-variant — in the DARK palette
    //   that token and secondary-container are both #474746, which would render
    //   this label invisible. on-surface clears AA in both modes (13.23 light /
    //   7.22 dark) where the alternatives sat at 1.00 dark or ~4.55 both.
    <span className="inline-flex items-center gap-2 rounded-tv-full border border-tv-outline-variant bg-tv-secondary-container px-3 py-1 text-tv-on-surface">
      <span className="h-2 w-2 rounded-tv-full bg-tv-primary motion-safe:animate-pulse" />
      <span className="font-tv-body text-tv-label-caps uppercase tracking-widest">{label}</span>
    </span>
  );
}

export function MarketingHero({
  eyebrow,
  title,
  highlight,
  subtitle,
  image,
  children,
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  subtitle: string;
  /** Optional hero photo. Omitted by the legal pages, which render centred. */
  image?: { src: string; alt: string; objectPosition?: string };
  children?: React.ReactNode;
}) {
  const copy = (
    <>
      <LandingAnimate onMount>
        <EyebrowBadge label={eyebrow} />
      </LandingAnimate>

      <LandingAnimate onMount delay={120}>
        <h1
          className={`mt-8 font-tv-serif text-4xl font-bold leading-[1.1] text-tv-on-surface sm:text-5xl md:text-tv-display-lg ${image ? "" : "mx-auto max-w-4xl"}`}
        >
          {title}
          {highlight ? (
            <>
              <br />
              <span className="font-normal italic text-tv-primary">{highlight}</span>
            </>
          ) : null}
        </h1>
      </LandingAnimate>

      <LandingAnimate onMount delay={230}>
        <p
          className={`mt-8 font-tv-body text-tv-body-lg leading-relaxed text-tv-on-surface-variant ${image ? "max-w-xl" : "mx-auto max-w-2xl"}`}
        >
          {subtitle}
        </p>
      </LandingAnimate>

      {children ? (
        <LandingAnimate onMount delay={340}>
          <div
            className={`mt-12 flex flex-col gap-3 sm:flex-row ${image ? "flex-wrap" : "items-center justify-center"}`}
          >
            {children}
          </div>
        </LandingAnimate>
      ) : null}
    </>
  );

  // No photo (how-it-works, legal pages): centred single column.
  if (!image) {
    return (
      <section className="relative w-full overflow-hidden bg-tv-surface px-4 py-tv-section-gap">
        <div className="relative z-10 mx-auto w-full max-w-5xl text-center">{copy}</div>
      </section>
    );
  }

  // With a photo: the Stitch 7/5 split.
  return (
    <section className="relative w-full overflow-hidden bg-tv-surface px-4 py-tv-section-gap">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-tv-gutter md:px-tv-margin-safe lg:grid-cols-12">
        <div className="z-10 lg:col-span-7">{copy}</div>
        <LandingAnimate onMount delay={200} className="w-full lg:col-span-5">
          <div className="relative aspect-[4/5] w-full -rotate-2 overflow-hidden border border-tv-outline-variant bg-tv-surface-container">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
              style={{ objectPosition: image.objectPosition ?? "center" }}
            />
          </div>
        </LandingAnimate>
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
    <div className="mb-14 max-w-2xl">
      <LandingAnimate>
        {eyebrow ? (
          <p className="font-tv-body text-tv-label-caps uppercase text-tv-muted-text">{eyebrow}</p>
        ) : null}
        <h2 className="mt-2 font-tv-serif text-3xl font-bold tracking-tight text-tv-on-surface sm:text-tv-headline-lg">
          {title}
        </h2>
        {intro ? (
          <p className="mt-4 font-tv-body text-tv-body-md leading-relaxed text-tv-on-surface-variant">
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
      <div className="group flex h-full flex-col border border-tv-outline-variant bg-tv-surface-container-lowest p-7 transition-colors hover:border-tv-primary">
        <span className="inline-flex h-11 w-11 items-center justify-center border border-tv-outline-variant text-tv-primary transition-colors group-hover:border-tv-primary">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <h3 className="mt-6 font-tv-serif text-tv-headline-md text-tv-on-surface">{title}</h3>
        <p className="mt-2 flex-1 font-tv-body text-tv-body-md text-tv-on-surface-variant">{body}</p>
      </div>
    </LandingAnimate>
  );
}

export function FeatureGrid({ features }: { features: Feature[] }) {
  return (
    <div className="grid gap-tv-gutter sm:grid-cols-2 lg:grid-cols-3">
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
      <div className="flex h-full flex-col border border-tv-outline-variant bg-tv-surface-container-lowest p-8 md:p-10">
        <span className="inline-flex items-center gap-2 font-tv-body text-tv-label-caps uppercase text-tv-muted-text">
          <span className="h-3 w-[3px] rounded-tv-full" style={{ backgroundColor: color }} />
          {tag}
        </span>
        <h3 className="mt-5 font-tv-serif text-2xl leading-snug text-tv-on-surface">{title}</h3>
        <ol className="mt-8 space-y-6">
          {steps.map((s, i) => (
            <li key={s.title} className="relative flex gap-4">
              {/* Dotted route connector — the itinerary line between stops.
                  Skipped on the last step so the lane terminates. */}
              {i < steps.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute left-[13px] top-7 h-[calc(100%+1.5rem-1.75rem)] w-0 border-l border-dashed border-tv-outline-variant"
                />
              ) : null}
              <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-tv-full border border-tv-outline-variant bg-tv-surface font-tv-body text-xs font-semibold text-tv-on-surface">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="font-tv-body text-tv-body-md font-semibold text-tv-on-surface">
                  {s.title}
                </p>
                <p className="mt-1 font-tv-body text-sm leading-relaxed text-tv-on-surface-variant">
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
    // Returns to the page tone. The section rhythm across all three Stitch
    // pages is: hero on surface → content stepped to surface-container-low with
    // hairline borders → CTA back on surface. The tonal step IS the separator,
    // so this section carries no border of its own.
    <section className="w-full bg-tv-surface px-4 py-tv-section-gap">
      <LandingAnimate>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-tv-serif text-3xl font-bold leading-tight tracking-tight text-tv-on-surface sm:text-tv-headline-lg md:text-tv-display-lg">
            {title}
          </h2>
          <p className="mx-auto mt-5 max-w-md font-tv-body text-tv-body-lg text-tv-on-surface-variant">
            {subtitle}
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CtaPrimary href={primaryHref}>{primaryLabel}</CtaPrimary>
            {secondaryHref && secondaryLabel ? (
              <CtaSecondary href={secondaryHref}>{secondaryLabel}</CtaSecondary>
            ) : null}
          </div>
        </div>
      </LandingAnimate>
    </section>
  );
}

export { ArrowUpRight };
