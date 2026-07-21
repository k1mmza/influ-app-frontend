// ponytail: draft legal skeleton, NOT reviewed by counsel — do not ship without legal review.
import type { Metadata } from "next";
import { LegalPageLayout, LegalSection as Section } from "@/components/marketing/legal-page-layout";

export const metadata: Metadata = {
  title: "Terms & Conditions | Inflique",
  description: "Inflique's Terms & Conditions.",
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms & Conditions"
      subtitle="How Inflique may be used by brands, agencies, and creators — the rules that apply to every account."
      lastUpdated="2026-07-15"
    >
      <Section n={1} title="Who This Applies To">
        <p>
          These Terms govern use of Inflique by all account holders: <strong>Brands</strong> (companies
          running influencer campaigns), <strong>Agencies</strong> (who manage campaigns and client
          brands on behalf of others), and <strong>Influencers</strong> (creators who apply to and
          fulfill campaigns). By creating an account, you agree to these Terms for whichever role you
          register under.
        </p>
      </Section>

      <Section n={2} title="Account Eligibility &amp; Registration">
        <p>
          You must provide accurate registration information and select a role (Brand, Agency, or
          Influencer) during sign-up. Accounts may be created by email/password or via Google OAuth.
          You are responsible for keeping your login credentials secure and for all activity under
          your account.
        </p>
      </Section>

      <Section n={3} title="Platform Role">
        <p>
          Inflique is a matchmaking and workflow tool that connects Brands/Agencies with Influencers,
          and provides tools for briefing, messaging, tracking, and campaign collaboration. Inflique
          does not create, review, or guarantee the quality of campaign content, and is not a party to
          any agreement between a Brand/Agency and an Influencer.
        </p>
        <p>
          Payments between parties are confirmed manually, off-platform: the paying party uploads
          proof of a payment made outside Inflique, and the receiving party confirms receipt within
          the app. Inflique does not process, hold, or guarantee payments, and is not a payment
          processor or escrow service. Payment disputes are between the parties involved.
        </p>
      </Section>

      <Section n={4} title="Content Ownership &amp; Licensing">
        <p>
          Content submitted through the platform (briefs, drafts, media-kit files, deliverables)
          remains owned by the party who uploaded it. Uploading content grants Inflique a limited
          license to store, display, and transmit it as needed to operate the platform (e.g. showing a
          draft to the Brand that requested it).
        </p>
      </Section>

      <Section n={5} title="Prohibited Conduct">
        <p>
          Users may not: misrepresent identity or metrics, use the platform to harass or defraud
          another user, scrape or misuse other users&apos; data, attempt to circumvent the platform to
          avoid fees or accountability, or upload unlawful or infringing content.
        </p>
      </Section>

      <Section n={6} title="Third-Party Platform Connections">
        <p>
          Influencers may connect TikTok, Instagram, or YouTube accounts via those platforms&apos;
          official OAuth login flows, so Inflique can read basic profile and performance data. Use of
          any connected platform remains subject to that platform&apos;s own terms of service, in
          addition to these Terms.
        </p>
      </Section>

      <Section n={7} title="AI Features">
        <p>
          Inflique uses an AI model to power features like Smart Search (turning a text search into
          filters) and Smart Plan (drafting a campaign brief from your input), and to help analyze
          influencer profiles. AI-generated output is a starting point, not a guarantee of accuracy —
          review it before relying on it.
        </p>
      </Section>

      <Section n={8} title="Termination">
        <p>
          Inflique may suspend or terminate accounts that violate these Terms. Users may close their
          account at any time; open campaigns, conversations, and payment confirmations tied to the
          account may still need to be resolved with the other party first.
        </p>
      </Section>

      <Section n={9} title="Disclaimers &amp; Limitation of Liability">
        <p>
          The platform is provided &quot;as is.&quot; Inflique is not liable for disputes, losses, or
          damages arising from off-platform payments, content quality, or interactions between users,
          to the fullest extent permitted by law.
        </p>
      </Section>

      <Section n={10} title="Changes to These Terms">
        <p>
          These Terms may be updated from time to time. Continued use of Inflique after an update
          constitutes acceptance of the revised Terms.
        </p>
      </Section>

      <Section n={11} title="Contact">
        <p>Questions about these Terms can be sent to the Inflique support team.</p>
      </Section>
    </LegalPageLayout>
  );
}
