"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";

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
      <nav className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white/90 px-4 py-3 shadow-sm">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-sm text-white">
            IA
          </span>
          <span>InfluApp</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/discover" className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            Discover
          </Link>
          <Link href="/#for-teams" className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            Agencies
          </Link>
          <Link href="/#for-brands" className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            Brands
          </Link>
          <Link href="/#for-creators" className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            Creators
          </Link>
          <Link href="/#how-it-works" className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            How it works
          </Link>
          <Link href="/#pricing" className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            Pricing
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Login
          </Link>
          <Link href="/register" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
            Register
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="rounded-2xl bg-white p-3 shadow-sm">
      <Link href="/" className="mb-3 flex items-center gap-2 px-2 transition hover:opacity-80">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-sm text-white">
          IA
        </span>
        <span className="text-sm font-bold text-slate-900">InfluApp</span>
      </Link>
      <div className="flex flex-col gap-2">
        {(role === "influencer" ? influencerLinks : brandLinks).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition",
              isNavActive(pathname, link.href) ? "bg-primary text-white" : "text-slate-700 hover:bg-slate-100"
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="mt-4 border-t border-slate-100 px-2 pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-xl bg-slate-100 px-4 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-200"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
