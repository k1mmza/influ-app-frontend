import type { CSSProperties } from "react";
import { Fira_Sans } from "next/font/google";
import "./marketing.css";

/**
 * (marketing) route group — public pages carrying the travelogue theme.
 *
 * Route groups don't affect URLs: (marketing)/how-it-works still serves
 * /how-it-works, and (marketing)/page.tsx still serves /. No redirects needed.
 *
 * Importing marketing.css here means the tv-* utilities are only shipped on
 * these routes; authenticated pages never load them.
 */

// Playfair Display is already loaded at the root layout as --font-serif, so we
// alias rather than pull it twice. Fira Sans is new and loaded here.
const firaSans = Fira_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-tv-body",
  display: "swap",
});

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // `contents` — the wrapper generates no box, so AppShell's flex layout is
    // untouched, but the custom properties still cascade to children.
    // `tv-scope` is the hook marketing.css rebinds the --lp-* tokens under.
    <div
      className={`${firaSans.variable} tv-scope contents`}
      style={{ "--font-tv-serif": "var(--font-serif)" } as CSSProperties}
    >
      {children}
    </div>
  );
}
