"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type Direction = "up" | "left" | "right" | "none";

const hiddenByDirection: Record<Direction, string> = {
  up: "translate-y-8 opacity-0",
  left: "-translate-x-8 opacity-0",
  right: "translate-x-8 opacity-0",
  none: "opacity-0"
};

export function LandingAnimate({
  children,
  className,
  delay = 0,
  direction = "up",
  onMount = false,
  as: Component = "div"
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: Direction;
  onMount?: boolean;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }

    if (onMount) {
      const timer = window.setTimeout(() => setVisible(true), 50);
      return () => window.clearTimeout(timer);
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [onMount]);

  return (
    <Component
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform",
        visible ? "translate-x-0 translate-y-0 opacity-100" : hiddenByDirection[direction],
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Component>
  );
}
