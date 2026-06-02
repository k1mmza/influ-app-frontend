"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";
import { Button } from "@/components/ui/button";

const brandLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/campaigns", label: "Campaign" },
  { href: "/discover", label: "Discover" },
  { href: "/smart-plan", label: "Smart Plan" },
  { href: "/messages", label: "Message" },
  { href: "/tracking", label: "Tracking" },
  { href: "/profile", label: "Profile" }
];

const influencerLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/campaigns", label: "Campaign" },
  { href: "/messages", label: "Message" },
  { href: "/profile", label: "Profile" }
];

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, logout } = useUserStore();
  const isLandingPage = pathname === "/";
  const isAuthPage = ["/login", "/register", "/forgot-password"].includes(pathname);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (isAuthPage) {
    return null;
  }

  if (isLandingPage) {
    return (
      <nav className="sticky top-6 z-50 mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-background/80 px-4 py-2.5 shadow-sm backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-foreground transition hover:opacity-80">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-secondary text-sm text-white">
            IA
          </span>
          <span className="font-serif">InfluApp</span>
        </Link>

        <div className="flex flex-wrap items-center gap-1">
          <Button variant="ghost" asChild className="rounded-full">
            <Link href="/discover">Discover</Link>
          </Button>
          <Button variant="ghost" asChild className="rounded-full hidden md:flex">
            <Link href="/#for-teams">Agencies</Link>
          </Button>
          <Button variant="ghost" asChild className="rounded-full hidden md:flex">
            <Link href="/#for-brands">Brands</Link>
          </Button>
          <Button variant="ghost" asChild className="rounded-full hidden md:flex">
            <Link href="/#for-creators">Creators</Link>
          </Button>
          <Button variant="ghost" asChild className="rounded-full">
            <Link href="/#how-it-works">Process</Link>
          </Button>
          <Button variant="ghost" asChild className="rounded-full">
            <Link href="/#pricing">Pricing</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild className="rounded-full">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="rounded-full shadow-md">
            <Link href="/register">Get Started</Link>
          </Button>
        </div>
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-1 rounded-2xl border bg-card p-2 shadow-sm">
      <Link href="/" className="mb-4 flex items-center gap-2 px-3 py-2 transition hover:opacity-80">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-secondary text-sm text-white">
          IA
        </span>
        <span className="text-sm font-bold text-foreground font-serif">InfluApp</span>
      </Link>
      <div className="flex flex-col gap-1">
        {(role === "influencer" ? influencerLinks : brandLinks).map((link) => (
          <Button
            key={link.href}
            variant={isNavActive(pathname, link.href) ? "default" : "ghost"}
            asChild
            className={cn(
              "justify-start rounded-xl px-4 py-2 text-sm font-medium transition",
              !isNavActive(pathname, link.href) && "text-muted-foreground hover:text-foreground"
            )}
          >
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}
      </div>
      <div className="mt-4 border-t border-border px-1 pt-4">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
        >
          Log out
        </Button>
      </div>
    </nav>
  );
}
