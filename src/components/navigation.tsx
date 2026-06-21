"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

const pageAccentColors: Record<string, string> = {
  "/dashboard":  "#334155",
  "/campaigns":  "#b45309",
  "/discover":   "#0284c7",
  "/shortlist":  "#be185d",
  "/smart-plan": "#c2410c",
  "/messages":   "#0f766e",
  "/tracking":   "#166534",
  "/profile":    "#92400e",
};

const roleAccentColors: Record<string, string> = {
  brand:      "#1e3a8a",
  agency:     "#059669",
  influencer: "#dc2626",
};

const brandLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/campaigns", label: "Campaign" },
  { href: "/discover", label: "Discover" },
  { href: "/shortlist", label: "Shortlist" },
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
  const { role, logout, isLoggedIn, name } = useUserStore();
  const isLandingPage = pathname === "/";
  const isPublicPage = isLandingPage || pathname === "/how-it-works" || pathname === "/creators" || pathname === "/agencies" || (pathname === "/discover" && !isLoggedIn);
  const isAuthPage = ["/login", "/register", "/forgot-password"].includes(pathname);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (isAuthPage) {
    return null;
  }

  const publicNavLinks = [
    { href: "/discover",      label: "Discover",         tip: "Search and filter creators"    },
    { href: "/how-it-works",  label: "How it Works",     tip: "See how InfluApp works"         },
    { href: "/creators",      label: "Creators",         tip: "Join as a creator"              },
    { href: "/agencies",      label: "Agencies & Brands", tip: "Start running campaigns"       },
  ];

  if (isPublicPage) {
    return (
      <nav className="sticky top-6 z-50 mb-8 flex items-center justify-between gap-6 rounded-2xl border bg-background/80 px-6 py-3 shadow-sm backdrop-blur-md sm:px-8">
        {/* Left: name + links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold font-serif text-foreground transition hover:opacity-80 shrink-0">
            InfluApp
          </Link>
          <div className="hidden md:flex items-center gap-1 ml-6">
            {publicNavLinks.map(({ href, label, tip }) => {
              const active = pathname === href;
              return (
                <div key={href} className="group relative">
                  <Link
                    href={href}
                    className={cn(
                      "inline-flex items-center rounded-full px-5 py-2 text-base font-semibold font-serif tracking-wide transition-all",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {label}
                  </Link>
                  {/* Hover tooltip bubble */}
                  <div className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-border bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-md opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    {tip}
                    <div className="absolute -top-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-l border-t border-border bg-popover" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: auth + theme */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isLoggedIn ? (
            <Link href="/dashboard" className="cursor-pointer">
              <Avatar className="h-9 w-9 ring-2 ring-primary/20 transition hover:ring-primary/60">
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
                  {name ? name.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <>
              <Button variant="ghost" asChild className="rounded-full font-medium font-serif tracking-wide">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="rounded-full shadow-md font-semibold font-serif tracking-wide">
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    );
  }

  const roleColor = role ? (roleAccentColors[role] ?? "#334155") : "#334155";

  return (
    <nav className="flex flex-col gap-1 rounded-2xl border bg-card p-2 shadow-sm">
      <div className="mb-3 flex items-center justify-between px-3 pt-2">
        <Link href="/" className="transition hover:opacity-80">
          <span className="text-base font-bold text-foreground font-serif">InfluApp</span>
        </Link>
        {role && (
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: roleColor }}
          >
            {role}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        {(role === "influencer" ? influencerLinks : brandLinks).map((link) => {
          const active = isNavActive(pathname, link.href);
          const accentColor = pageAccentColors[link.href] ?? "#334155";
          return (
            <Button
              key={link.href}
              variant="ghost"
              asChild
              style={active ? { backgroundColor: accentColor, color: "white" } : undefined}
              className={cn(
                "justify-start rounded-xl px-4 py-2 text-sm font-medium transition",
                !active && "text-muted-foreground hover:text-foreground"
              )}
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border px-1 pt-4">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="flex-1 justify-start rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
        >
          Log out
        </Button>
        <ThemeToggle />
      </div>
    </nav>
  );
}
