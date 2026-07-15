import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  product: [
    { href: "/discover",           label: "Discover" },
    { href: "/register",           label: "Start a Campaign" },
    { href: "/how-it-works",       label: "How it Works" },
  ],
  audience: [
    { href: "/agencies",           label: "Agencies" },
    { href: "/agencies",           label: "Brands" },
    { href: "/creators",           label: "Creators" },
  ],
  account: [
    { href: "/login",              label: "Log in" },
    { href: "/register",           label: "Register" },
  ],
} as const;

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t bg-background pt-16 pb-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link href="/" className="text-xl font-bold font-serif text-foreground transition hover:opacity-80">
              Inflique
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Discovery, campaigns, and collaboration in one unified workspace for the creator economy.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-muted-foreground transition hover:text-primary">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">Audience</h4>
            <ul className="space-y-3">
              {footerLinks.audience.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-muted-foreground transition hover:text-primary">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">Account</h4>
            <ul className="space-y-3">
              {footerLinks.account.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-muted-foreground transition hover:text-primary">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-10" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Inflique. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">Privacy Policy</Link>
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
