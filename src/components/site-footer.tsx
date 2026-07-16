import Link from "next/link";

const footerLinks = {
  product: [
    { href: "/discover", label: "Discover" },
    { href: "/register", label: "Start a campaign" },
    { href: "/how-it-works", label: "How it works" },
  ],
  audience: [
    { href: "/agencies", label: "Agencies" },
    { href: "/agencies", label: "Brands" },
    { href: "/creators", label: "Creators" },
  ],
  account: [
    { href: "/login", label: "Log in" },
    { href: "/register", label: "Register" },
  ],
} as const;

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-[var(--lp-line)] bg-[var(--lp-paper)] pb-12 pt-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link
              href="/"
              className="rounded font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[var(--lp-ink)] transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)]"
            >
              Inflique
            </Link>
            <p className="mt-4 max-w-xs font-[family-name:var(--font-grotesk)] text-sm leading-relaxed text-[var(--lp-muted)]">
              A casting directory for the creator economy — search, brief, and track
              creators in one place.
            </p>
          </div>

          {(
            [
              ["Product", footerLinks.product],
              ["Audience", footerLinks.audience],
              ["Account", footerLinks.account],
            ] as const
          ).map(([heading, links]) => (
            <div key={heading} className="space-y-4">
              <h4 className="font-[family-name:var(--font-grotesk)] text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--lp-muted)]">
                {heading}
              </h4>
              <ul className="space-y-3">
                {links.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="rounded font-[family-name:var(--font-grotesk)] text-sm text-[var(--lp-ink-soft)] transition hover:text-[var(--lp-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr className="my-10 border-[var(--lp-line)]" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-[family-name:var(--font-grotesk)] text-xs text-[var(--lp-muted)]">
            © {new Date().getFullYear()} Inflique. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-[family-name:var(--font-grotesk)] text-xs text-[var(--lp-muted)] transition hover:text-[var(--lp-ink)]">
              Privacy Policy
            </Link>
            <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-[family-name:var(--font-grotesk)] text-xs text-[var(--lp-muted)] transition hover:text-[var(--lp-ink)]">
              Terms of Service
            </Link>
            <Link href="/cookies" target="_blank" rel="noopener noreferrer" className="font-[family-name:var(--font-grotesk)] text-xs text-[var(--lp-muted)] transition hover:text-[var(--lp-ink)]">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
