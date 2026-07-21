/**
 * (marketing) route group — public pages carrying the travelogue theme.
 *
 * Route groups don't affect URLs: (marketing)/how-it-works still serves
 * /how-it-works, and (marketing)/page.tsx still serves /. No redirects needed.
 *
 * This layout is a passthrough. The travelogue palette lives in globals.css,
 * scoped to `.tv-scope`, which AppShell puts on the public layout branches —
 * see app-shell.tsx (A4 for these pages, A6 for logged-out /discover, which
 * sits outside this group and so could not rely on a stylesheet imported here).
 */
export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
