"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { LandingAnimate } from "@/components/landing-motion";
import {
  LandingFeatureList,
  LandingSectionTitle,
  type LandingFeatureItem
} from "@/components/landing-section";

const agencyFeatures: LandingFeatureItem[] = [
  {
    title: "Find the right creators",
    description: "Discover influencers that match your brand, content style, and target audience."
  },
  {
    title: "End-to-end campaign management",
    description: "Manage budgets, timelines, and deliverables with confidence and precision."
  },
  {
    title: "In-depth performance insights",
    description: "Track real-time data and analytics to measure campaign effectiveness."
  }
];

const creatorFeatures: LandingFeatureItem[] = [
  {
    title: "Work with global brands",
    description: "Get opportunities to collaborate with leading hotels and top travel brands worldwide."
  },
  {
    title: "Transparent earnings",
    description: "Reliable payment system with fast payouts after project completion."
  },
  {
    title: "Build a standout profile",
    description: "Showcase your work with reviews and ratings to boost your global credibility."
  }
];

function GuideImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden rounded-2xl sm:aspect-[5/4] lg:aspect-auto lg:min-h-[380px]",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover object-center"
        sizes="(max-width: 1024px) 100vw, (max-width: 1152px) 576px, 576px"
      />
    </div>
  );
}

function GuideSection({
  id,
  title,
  features,
  imageSrc,
  imageAlt,
  imagePosition
}: {
  id: string;
  title: string;
  features: LandingFeatureItem[];
  imageSrc: string;
  imageAlt: string;
  imagePosition: "left" | "right";
}) {
  const imageDirection = imagePosition === "left" ? "left" : "right";

  const image = (
    <LandingAnimate direction={imageDirection}>
      <GuideImage src={imageSrc} alt={imageAlt} />
    </LandingAnimate>
  );

  const content = (
    <div className="flex flex-col justify-center py-4 lg:py-6">
      <LandingSectionTitle>{title}</LandingSectionTitle>
      <LandingFeatureList items={features} />
    </div>
  );

  return (
    <section id={id} className="scroll-mt-8">
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
        {imagePosition === "left" ? (
          <>
            {image}
            {content}
          </>
        ) : (
          <>
            <div className="order-2 lg:order-1">{content}</div>
            <div className="order-1 lg:order-2">{image}</div>
          </>
        )}
      </div>
    </section>
  );
}

export function LandingGuideSections() {
  return (
    <div>
      <div className="mx-auto max-w-6xl space-y-16 px-4 py-14 sm:px-6 sm:py-16 lg:space-y-20 lg:py-20">
        <GuideSection
          id="for-agencies"
          title="For Agencies & Brands"
          features={agencyFeatures}
          imageSrc="/pictures/agency.jpg"
          imageAlt="Agency team collaborating on a campaign around a conference table"
          imagePosition="left"
        />
        <GuideSection
          id="for-creators"
          title="For Creators"
          features={creatorFeatures}
          imageSrc="/pictures/influencer.jpg"
          imageAlt="Influencer recording content outdoors with a smartphone gimbal"
          imagePosition="right"
        />
      </div>
    </div>
  );
}
