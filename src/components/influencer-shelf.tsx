"use client";

import { InfluencerCard } from "@/components/influencer-card";
import { Influencer } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface InfluencerShelfProps {
  title: string;
  subtitle?: string;
  influencers: Influencer[];
  selectedId?: string | null;
  onSelect?: (influencer: Influencer) => void;
  onAddToCampaign?: (influencer: Influencer) => void;
  showRank?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function InfluencerShelf({
  title,
  subtitle,
  influencers,
  selectedId = null,
  onSelect,
  onAddToCampaign,
  showRank = false,
  emptyMessage = "No creators in this row yet.",
  className,
}: InfluencerShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => updateScrollButtons();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateScrollButtons);

    const observer = new ResizeObserver(updateScrollButtons);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateScrollButtons);
      observer.disconnect();
    };
  }, [influencers, updateScrollButtons]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.72, 280);
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section
      className={cn("group/shelf relative", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="mb-3 flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-lg font-bold font-serif text-foreground">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{subtitle}</p>}
        </div>
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            type="button"
            aria-label={`Scroll ${title} left`}
            onClick={() => scroll("left")}
            className={cn(
              "absolute left-0 top-1/2 z-30 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/95 text-foreground shadow-lg ring-1 ring-border transition",
              "hover:bg-card hover:scale-105",
              isHovered ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
        )}

        {canScrollRight && (
          <button
            type="button"
            aria-label={`Scroll ${title} right`}
            onClick={() => scroll("right")}
            className={cn(
              "absolute right-0 top-1/2 z-30 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/95 text-foreground shadow-lg ring-1 ring-border transition",
              "hover:bg-card hover:scale-105",
              isHovered ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        )}

        {influencers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/70 px-6 py-10 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className={cn(
              "flex gap-3 overflow-x-auto pb-4 pt-2 sm:gap-4",
              "scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              showRank && "pl-1"
            )}
          >
            {influencers.map((influencer, index) => (
              <div
                key={influencer.id}
                className={cn(
                  "group/shelf-item flex shrink-0 items-end gap-1 sm:gap-2",
                  showRank && "pl-1 sm:pl-2"
                )}
              >
                {showRank && (
                  <span
                    aria-hidden
                    className="pointer-events-none -mb-2 -mr-1 select-none text-[3.5rem] font-black leading-none tracking-tighter text-transparent sm:-mb-3 sm:-mr-2 sm:text-[4.5rem] lg:text-[5.5rem]"
                    style={{ WebkitTextStroke: "2px rgb(148 163 184)" }}
                  >
                    {index + 1}
                  </span>
                )}
                <div
                  className={cn(
                    "w-[18rem] origin-bottom transition duration-300 ease-out lg:w-[20rem] xl:w-[22rem]",
                    "group-hover/shelf-item:z-20 group-hover/shelf-item:scale-[1.03]"
                  )}
                >
                  <InfluencerCard
                    influencer={influencer}
                    isActive={selectedId === influencer.id}
                    onSelect={onSelect}
                    onAddToCampaign={onAddToCampaign}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
