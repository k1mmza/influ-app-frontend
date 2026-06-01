"use client";

import { LandingAnimate } from "@/components/landing-motion";
import { Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

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
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % CAROUSEL_IMAGES.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [activeSlide]);

  const goToSlide = (index: number) => {
    setActiveSlide(index);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = profileUrl.trim();

    if (!query) {
      setError("Please enter a social profile URL.");
      return;
    }

    if (!looksLikeSocialUrl(query)) {
      setError("Enter a valid profile link (e.g. instagram.com/username or tiktok.com/@handle).");
      return;
    }

    const normalizedUrl = /^https?:\/\//i.test(query) ? query : `https://${query}`;
    setError("");
    router.push(`/discover?url=${encodeURIComponent(normalizedUrl)}`);
  };

  return (
    <section className="relative flex w-full min-h-[420px] flex-col justify-center overflow-hidden text-white lg:min-h-[calc(100svh-5.5rem)]">
      <div className="absolute inset-0" aria-hidden>
        {CAROUSEL_IMAGES.map((image, index) => (
          <div
            key={image.src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === activeSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={image.src}
              alt=""
              fill
              priority={index === 0}
              className="object-cover"
              sizes="100vw"
            />
          </div>
        ))}
      </div>

      {hasMounted ? (
        <div
          role="tablist"
          aria-label="Background slides"
          className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2"
        >
          {CAROUSEL_IMAGES.map((image, index) => {
            const isActive = index === activeSlide;
            return (
              <button
                key={image.src}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Show slide ${index + 1} of ${CAROUSEL_IMAGES.length}`}
                onClick={() => goToSlide(index)}
                suppressHydrationWarning
                className={`h-2 rounded-full transition-all ${
                  isActive ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/70"
                }`}
              >
                <span className="sr-only">{`Slide ${index + 1}`}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto w-full max-w-6xl">
          <LandingAnimate
            onMount
            className="mx-auto flex w-full items-center justify-center overflow-x-auto px-2 py-2 sm:px-3 sm:py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <h1 className="mx-auto max-w-4xl text-3xl font-bold leading-snug text-slate-500 sm:text-4xl md:text-5xl">
              Partner with creators who bring your destination to life.
            </h1>
          </LandingAnimate>
          <LandingAnimate onMount delay={120}>
            <p className="mt-4 text-lg leading-relaxed text-slate-600 sm:text-xl">
              Discover creators • Collaborate seamlessly • Grow globally
            </p>
          </LandingAnimate>

          <LandingAnimate onMount delay={240}>
            <form
              onSubmit={handleSubmit}
              className="mt-8"
              autoComplete="off"
              data-lpignore="true"
              data-form-type="other"
              suppressHydrationWarning
            >
              <label htmlFor="landing-profile-url" className="sr-only">
                Creator profile URL
              </label>
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
              <div className="relative flex-1 sm:max-w-xl">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  id="landing-profile-url"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  data-lpignore="true"
                  data-1p-ignore
                  value={profileUrl}
                  onChange={(event) => {
                    setProfileUrl(event.target.value);
                    if (error) setError("");
                  }}
                  className="w-full rounded-xl border border-white/20 bg-white/95 py-4 pl-12 pr-4 text-lg text-slate-900 shadow-sm focus:border-white focus:outline-none focus:ring-2 focus:ring-white/40"
                  suppressHydrationWarning
                />
              </div>
              <button
                type="submit"
                data-lpignore="true"
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-8 py-4 text-lg font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                suppressHydrationWarning
              >
                Find influencer
              </button>
            </div>
              {error ? <p className="mt-3 text-base text-rose-200">{error}</p> : null}
            </form>
          </LandingAnimate>
        </div>
      </div>
    </section>
  );
}