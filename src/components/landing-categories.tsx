"use client";

import Link from "next/link";
import { LandingAnimate } from "@/components/landing-motion";
import { Sparkles, Shirt, Zap, UtensilsCrossed, MapPin, Cpu, Heart, Gamepad2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CATEGORY_ITEMS: { name: string; href: string; Icon: LucideIcon }[] = [
  { name: "Beauty",    href: "/discover?category=Beauty",    Icon: Sparkles },
  { name: "Fashion",   href: "/discover?category=Fashion",   Icon: Shirt },
  { name: "Fitness",   href: "/discover?category=Fitness",   Icon: Zap },
  { name: "Food",      href: "/discover?category=Food",      Icon: UtensilsCrossed },
  { name: "Travel",    href: "/discover?category=Travel",    Icon: MapPin },
  { name: "Tech",      href: "/discover?category=Tech",      Icon: Cpu },
  { name: "Lifestyle", href: "/discover?category=Lifestyle", Icon: Heart },
  { name: "Gaming",    href: "/discover?category=Gaming",    Icon: Gamepad2 },
];

export function LandingCategories() {
  return (
    <section className="bg-[#0F172A] w-full py-36 px-4">
      <div className="mx-auto max-w-6xl">
        <LandingAnimate>
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl font-medium text-white">
              Browse by Category
            </h2>
            <p className="mt-3 text-white/60 font-sans text-base">
              Find creators by the content they know best.
            </p>
          </div>
        </LandingAnimate>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-4">
          {CATEGORY_ITEMS.map((item, index) => (
            <LandingAnimate key={item.name} delay={index * 60}>
              <Link href={item.href} className="block">
                <div className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all p-6 flex flex-col items-center text-center gap-3 cursor-pointer">
                  <div className="h-12 w-12 rounded-xl bg-white/10 group-hover:bg-white/15 transition-all flex items-center justify-center">
                    <item.Icon className="h-6 w-6 text-white/80 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">
                    {item.name}
                  </span>
                </div>
              </Link>
            </LandingAnimate>
          ))}
        </div>
      </div>
    </section>
  );
}
