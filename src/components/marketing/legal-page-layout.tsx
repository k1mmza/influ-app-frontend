// ponytail: draft legal skeleton, NOT reviewed by counsel — do not ship without legal review.
import type { ReactNode } from "react";
import { MarketingHero } from "@/components/marketing/marketing-sections";

export function LegalPageLayout({
  title,
  eyebrow = "Legal",
  subtitle = "The plain-language version of how Inflique works, grounded in the app's actual behavior.",
  lastUpdated,
  children,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div>
      <MarketingHero eyebrow={eyebrow} title={title} subtitle={subtitle} />

      <section className="w-full bg-[var(--lp-paper)] px-4 pb-28">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-[var(--lp-line)] bg-[var(--lp-surface)] p-6">
            <p className="flex items-center gap-2 font-[family-name:var(--font-grotesk)] text-sm font-semibold text-amber-600">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
              Draft — Not Legal Advice
            </p>
            <p className="mt-2 font-[family-name:var(--font-grotesk)] text-sm leading-relaxed text-[var(--lp-ink-soft)]">
              This page is a first-draft skeleton grounded in Inflique&apos;s current app behavior.
              It has not been reviewed by legal counsel and must not be published or relied upon
              until reviewed and approved by a lawyer.
            </p>
          </div>

          <p className="mt-6 font-[family-name:var(--font-grotesk)] text-xs text-[var(--lp-muted)]">
            Last updated: {lastUpdated}
          </p>

          <div className="mt-12 space-y-8">{children}</div>
        </div>
      </section>
    </div>
  );
}

export function LegalSection({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="scroll-mt-24 border-t border-[var(--lp-line)] pt-8 first:border-t-0 first:pt-0">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--lp-ink)]">
        <span className="text-[var(--lp-muted)]">{n}.</span> {title}
      </h2>
      <div className="mt-3 space-y-3 font-[family-name:var(--font-grotesk)] text-[15px] leading-relaxed text-[var(--lp-ink-soft)] [&_a]:text-[var(--lp-accent)] [&_a]:underline [&_strong]:font-semibold [&_strong]:text-[var(--lp-ink)] [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
