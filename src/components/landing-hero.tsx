"use client";

import { LandingAnimate } from "@/components/landing-motion";
import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const CAROUSEL_IMAGES = [
  { src: "/pictures/image1.png", alt: "Creator collaboration showcase" },
  { src: "/pictures/image2.png", alt: "Influencer campaign workspace" },
  { src: "/pictures/image3.png", alt: "Brand and creator partnership" }
] as const;

const CATEGORIES = ["All", "Beauty", "Fashion", "Fitness", "Food", "Travel", "Tech", "Gaming"] as const;

function looksLikeSocialUrl(query: string) {
  return /^(https?:\/\/|www\.)/i.test(query) || /(?:instagram|tiktok|youtube|youtu\.be|facebook|x\.com|twitter|lemon8)\./i.test(query);
}

export function LandingHero() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % CAROUSEL_IMAGES.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      router.push("/discover");
      return;
    }
    if (looksLikeSocialUrl(query)) {
      const url = /^https?:\/\//i.test(query) ? query : `https://${query}`;
      router.push(`/discover?url=${encodeURIComponent(url)}`);
    } else {
      router.push(`/discover?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <section className="relative flex min-h-[90vh] w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1e3a8a] to-[#7C3AED] px-4 py-24">
      {/* Background carousel */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-15">
        {CAROUSEL_IMAGES.map((image, index) => (
          <Image
            key={image.src}
            src={image.src}
            alt=""
            fill
            priority={index === 0}
            className={cn(
              "object-cover transition-opacity duration-1000",
              index === activeSlide ? "opacity-100" : "opacity-0"
            )}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/60 via-transparent to-[#0F172A]/60" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
        <LandingAnimate onMount>
          <h1 className="text-balance text-5xl font-medium tracking-tight text-white md:text-7xl font-serif leading-tight">
            Find creators who{" "}
            <span className="italic bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
              move your audience.
            </span>
          </h1>
        </LandingAnimate>

        <LandingAnimate onMount delay={150}>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/70 md:text-xl font-light">
            Discover, connect, and collaborate with the right creators — instantly.
          </p>
        </LandingAnimate>

        <LandingAnimate onMount delay={300}>
          <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-2xl">
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <Input
                  type="text"
                  placeholder="Search by name, niche, keyword or paste a profile link..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 rounded-2xl border border-white/20 bg-white/10 pl-12 pr-4 text-white placeholder:text-white/50 backdrop-blur-md focus-visible:ring-white/30 focus:border-white/40"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-14 rounded-2xl bg-white px-8 text-base font-bold text-[#0F172A] shadow-xl hover:bg-white/90 cursor-pointer transition-all"
              >
                Search
              </Button>
            </div>
          </form>
        </LandingAnimate>

        <LandingAnimate onMount delay={450}>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={cat === "All" ? "/discover" : `/discover?category=${cat}`}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/80 hover:bg-white/20 hover:text-white backdrop-blur-sm cursor-pointer transition-all"
              >
                {cat}
              </Link>
            ))}
          </div>
        </LandingAnimate>

        <LandingAnimate onMount delay={550}>
          <div className="mt-8 flex justify-center gap-2">
            {CAROUSEL_IMAGES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveSlide(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                  i === activeSlide ? "w-6 bg-white" : "w-1.5 bg-white/30 hover:bg-white/50"
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </LandingAnimate>
      </div>
    </section>
  );
}
