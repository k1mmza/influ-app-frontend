// ponytail: draft legal skeleton, NOT reviewed by counsel — do not ship without legal review.
import type { ReactNode } from "react";

export function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div>
      <section className="w-full bg-gradient-to-br from-[#0F172A] via-[#1e3a8a] to-[#7C3AED] px-4 py-32 text-center">
        <h1 className="font-serif text-5xl font-medium text-white md:text-6xl">{title}</h1>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-6 text-sm leading-relaxed text-foreground">
          <p className="font-semibold text-warning">Draft — Not Legal Advice</p>
          <p className="mt-2">
            This page is a first-draft skeleton grounded in Inflique&apos;s current app behavior.
            It has not been reviewed by legal counsel and must not be published or relied upon
            until reviewed and approved by a lawyer.
          </p>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">Last updated: {lastUpdated}</p>

        <div className="mt-10 space-y-10">{children}</div>
      </section>
    </div>
  );
}
