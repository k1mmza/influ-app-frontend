import type { Metadata } from "next";
import { Montserrat, Playfair_Display, Space_Grotesk, DM_Sans, Bricolage_Grotesque, Fira_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/app-shell";
import { CookieNotice } from "@/components/cookie-notice";
import { READABLE_MODE_SCRIPT } from "@/components/readable-mode";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
});

// Landing-only display face. Scoped via font-[family-name:var(--font-display)]
// on the marketing surface; deliberately not the app's serif/body faces.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});

// Travelogue body face for the (marketing) route group. Declared at the root
// rather than in the marketing layout because AppShell applies the .tv-scope
// class — which rebinds --font-grotesk to this variable — ABOVE the route
// group, so the variable has to be in scope at the <html> level to reach the
// marketing nav and footer. Costs nothing on other routes: next/font only
// serves the files when something actually renders in the face.
const firaSans = Fira_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-tv-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Inflique MVP",
  description: "Influencer marketplace platform demo"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${playfair.variable} ${spaceGrotesk.variable} ${dmSans.variable} ${bricolage.variable} ${firaSans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: READABLE_MODE_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
          <CookieNotice />
        </Providers>
      </body>
    </html>
  );
}
