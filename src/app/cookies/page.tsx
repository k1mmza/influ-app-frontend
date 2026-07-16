// ponytail: draft legal skeleton, NOT reviewed by counsel — do not ship without legal review.
import type { Metadata } from "next";
import { LegalPageLayout, LegalSection as Section } from "@/components/legal-page-layout";

export const metadata: Metadata = {
  title: "Cookie Policy | Inflique",
  description: "Inflique's Cookie Policy.",
};

export default function CookiesPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      subtitle="Inflique keeps your session in local storage — not tracking cookies. Here's the full picture."
      lastUpdated="2026-07-15"
    >
      <Section n={1} title="Inflique Does Not Use Tracking Cookies">
        <p>
          Unlike many websites, Inflique does not set cookies to track you, and does not use
          advertising or analytics cookies. Your login session is kept using your browser&apos;s local
          storage instead of a cookie — see below.
        </p>
      </Section>

      <Section n={2} title="Local Storage Usage">
        <p>
          When you log in, Inflique stores your session (access token, refresh token, and basic
          account info) in your browser&apos;s local storage so you stay logged in between visits. We
          also use local storage for functional, non-tracking purposes: your in-progress media kit
          draft, shortlisted influencers, campaign collaboration state, and UI preferences like a
          collapsed sidebar. None of this is shared with advertisers or used to track you across other
          sites.
        </p>
      </Section>

      <Section n={3} title="Third-Party Cookies">
        <p>
          When you sign in with Google, or connect a TikTok, Instagram, or YouTube account, you are
          briefly redirected to that provider&apos;s own login page. That provider may set its own
          cookies during that process, under its own cookie/privacy policy — Inflique does not control
          or receive those cookies.
        </p>
      </Section>

      <Section n={4} title="Future Analytics">
        <p>
          Inflique does not currently run any analytics or advertising scripts. Product analytics
          (e.g. to understand feature usage) is on the roadmap and, if added, this policy will be
          updated before any such tool goes live.
        </p>
      </Section>

      <Section n={5} title="Managing Local Storage">
        <p>
          You can clear Inflique&apos;s local storage at any time from your browser&apos;s settings, or
          by logging out, which removes your session data automatically.
        </p>
      </Section>

      <Section n={6} title="Changes to This Policy">
        <p>
          This policy may be updated as the platform evolves. Material changes will be reflected here
          with an updated date.
        </p>
      </Section>

      <Section n={7} title="Contact">
        <p>Questions about this Cookie Policy can be sent to the Inflique support team.</p>
      </Section>
    </LegalPageLayout>
  );
}
