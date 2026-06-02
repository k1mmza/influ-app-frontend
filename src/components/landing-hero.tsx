"use client";

import { LandingAnimate } from "@/components/landing-motion";
import { Search, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";

const CAROUSEL_IMAGES = [
  { src: "/pictures/image1.png", alt: "Creator collaboration showcase" },
  { src: "/pictures/image2.png", alt: "Influencer campaign workspace" },
  { src: "/pictures/image3.png", alt: "Brand and creator partnership" }
] as const;

function looksLikeSocialUrl(query: string) {
  return /^(https?:\/\/|www\.)/i.test(query) || /(?:instagram|tiktok|youtube|youtu\.be|facebook|x\.com|twitter|lemon8)\./i.test(query);
}

export function LandingHero() {
  const router = useRouter();
  const [profileUrl, setProfileUrl] = useState("");
  const [error, setError] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % CAROUSEL_IMAGES.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = profileUrl.trim();

    if (!query) {
      setError("Please enter a social profile URL.");
      return;
    }

    if (!looksLikeSocialUrl(query)) {
      setError("Enter a valid profile link.");
      return;
    }

    const normalizedUrl = /^https?:\/\//i.test(query) ? query : `https://${query}`;
    setError("");
    router.push(`/discover?url=${encodeURIComponent(normalizedUrl)}`);
  };

  return (
    <section className="relative flex min-h-[600px] w-full flex-col items-center justify-center overflow-hidden rounded-[2.5rem] bg-background px-4 py-20 lg:min-h-[calc(100vh-8rem)]">
      {/* Background Carousel with Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-65">
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
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/25 to-background/95" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
        <LandingAnimate onMount>
          <div className="mb-6 flex justify-center">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 px-4 py-1.5 text-primary-foreground backdrop-blur-sm">
              <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
              The Next Gen Influencer Marketplace
            </Badge>
          </div>
        </LandingAnimate>

        <LandingAnimate onMount delay={100}>
          <h1 className="text-balance text-5xl font-medium tracking-tight text-foreground md:text-7xl font-serif">
            Partner with creators who <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent italic">bring your brand to life.</span>
          </h1>
        </LandingAnimate>

        <LandingAnimate onMount delay={200}>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground md:text-xl font-light">
            Discover quality creators, collaborate seamlessly, and scale your influence globally with our unified workspace.
          </p>
        </LandingAnimate>

        <LandingAnimate onMount delay={300}>
          <form onSubmit={handleSubmit} className="mx-auto mt-12 max-w-2xl">
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="Paste an Instagram, TikTok, or YouTube link..."
                  value={profileUrl}
                  onChange={(e) => {
                    setProfileUrl(e.target.value);
                    if (error) setError("");
                  }}
                  className="h-14 rounded-2xl border-border bg-card/5 pl-12 pr-4 text-foreground placeholder:text-muted-foreground backdrop-blur-md transition-all focus:border-primary/50 focus:ring-primary/20"
                />
              </div>
              <Button type="submit" size="lg" className="h-14 rounded-2xl px-8 text-base font-bold shadow-xl shadow-primary/20">
                Find Creator
              </Button>
            </div>
            {error && <p className="mt-4 text-sm font-medium text-destructive">{error}</p>}
          </form>
        </LandingAnimate>

        <LandingAnimate onMount delay={400}>
          <div className="mt-12 flex flex-wrap justify-center gap-x-10 gap-y-4 opacity-50 grayscale transition-all hover:grayscale-0">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-sm font-semibold tracking-wider uppercase">Instagram</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-secondary" />
              <span className="text-sm font-semibold tracking-wider uppercase">TikTok</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-accent" />
              <span className="text-sm font-semibold tracking-wider uppercase">YouTube</span>
            </div>
          </div>
        </LandingAnimate>
      </div>
    </section>
  );
}
