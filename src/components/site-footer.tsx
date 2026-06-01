import Link from "next/link";

const footerLinks = {
  product: [
    { href: "/discover", label: "Discover" },
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#pricing", label: "Pricing" }
  ],
  audience: [
    { href: "/#for-teams", label: "Agencies" },
    { href: "/#for-brands", label: "Brands" },
    { href: "/#for-creators", label: "Creators" }
  ],
  account: [
    { href: "/login", label: "Log in" },
    { href: "/register", label: "Register" }
  ]
} as const;

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white pt-10 pb-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-sm text-white">
                IA
              </span>
              InfluApp
            </Link>
            <p className="mt-3 text-sm text-slate-600">
              Discovery, campaigns, and chat in one workspace for agencies, brands, and creators.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Product</p>
            <ul className="mt-3 space-y-2">
              {footerLinks.product.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-slate-700 transition hover:text-indigo-600">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Audience</p>
            <ul className="mt-3 space-y-2">
              {footerLinks.audience.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-slate-700 transition hover:text-indigo-600">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account</p>
            <ul className="mt-3 space-y-2">
              {footerLinks.account.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-slate-700 transition hover:text-indigo-600">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-slate-100 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} InfluApp. All rights reserved.</p>
          <p className="text-xs text-slate-500">MVP demo — features and availability may change.</p>
        </div>
      </div>
    </footer>
  );
}
