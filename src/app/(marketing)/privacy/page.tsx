// ponytail: draft legal skeleton, NOT reviewed by counsel — do not ship without legal review.
import type { Metadata } from "next";
import { LegalPageLayout, LegalSection as Section } from "@/components/marketing/legal-page-layout";

export const metadata: Metadata = {
  title: "Privacy Policy | Inflique",
  description: "Inflique's Privacy Policy.",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="What Inflique collects, how your session is stored, and the services your data is shared with."
      lastUpdated="2026-07-15"
    >
      <Section n={1} title="Information We Collect">
        <p>
          <strong>Account data</strong>: name, email, password (hashed) or OAuth identifier, and your
          selected role. <strong>Brand/Agency profile data</strong>: company name, position, phone
          number, company details, website, and social links. <strong>Influencer profile data</strong>:
          bio, gender, content categories, style tags, country, and (for connected or scraped
          accounts) follower counts, engagement, and other performance metrics. <strong>Campaign
          data</strong>: briefs, messages, drafts, and uploaded files exchanged through the platform.
        </p>
      </Section>

      <Section n={2} title="How Your Session Is Stored">
        <p>
          When you log in, Inflique issues a short-lived access token and a refresh token, both stored
          in your browser&apos;s local storage — not in cookies. These tokens authenticate your
          requests via an Authorization header. You can end a session at any time by logging out,
          which invalidates it on our servers.
        </p>
      </Section>

      <Section n={3} title="Third-Party Services We Share Data With">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Google</strong> — for account sign-in (name, email, profile picture).</li>
          <li>
            <strong>YouTube, TikTok, and Instagram</strong> — if you connect a creator account, we
            read basic profile and performance data (e.g. follower/subscriber counts, recent videos or
            posts, analytics) via those platforms&apos; official APIs, using the access you grant
            during connection.
          </li>
          <li>
            <strong>Apify</strong> — for public influencer profiles that haven&apos;t connected an
            account, we may use this service to fetch publicly available profile stats (followers,
            posts, average views) from TikTok/Instagram, so the profile can appear in Discover.
          </li>
          <li>
            <strong>Anthropic</strong> (AI provider) — campaign brief text, influencer profile or
            media-kit content, and search queries are sent to Anthropic&apos;s API to power Smart Plan,
            Smart Search, and AI profile analysis.
          </li>
        </ul>
      </Section>

      <Section n={4} title="File &amp; Media Storage">
        <p>
          Files are stored with Supabase Storage in one of two places. Avatars, campaign cover images,
          and brief images go in a public bucket and are accessible via a direct URL. Rate cards,
          payment proofs, draft/deliverable files, and chat attachments go in a private bucket and are
          only accessible via time-limited signed links generated for the people involved.
        </p>
      </Section>

      <Section n={5} title="Payment-Related Data">
        <p>
          Payments happen off-platform. Inflique stores a record of the payment status and any proof
          file (e.g. a bank transfer screenshot) uploaded to confirm it — Inflique does not process
          card or bank details itself.
        </p>
      </Section>

      <Section n={6} title="Data Retention">
        <p>
          We retain account and campaign data for as long as your account is active, and as needed to
          resolve disputes or meet legal obligations after account closure.
        </p>
      </Section>

      <Section n={7} title="Your Rights &amp; Choices">
        <p>
          You can review and update most profile information from your account settings, disconnect a
          connected platform at any time, and request account deletion by contacting support.
        </p>
      </Section>

      <Section n={8} title="Data Security">
        <p>
          We use industry-standard measures to protect stored data, including hashed passwords, signed
          URLs for private files, and short-lived access tokens with server-side revocation.
        </p>
      </Section>

      <Section n={9} title="Children&apos;s Privacy">
        <p>Inflique is not directed at children and is not knowingly used by anyone under 18.</p>
      </Section>

      <Section n={10} title="Changes to This Policy">
        <p>
          This policy may be updated as the platform evolves. Material changes will be reflected here
          with an updated date.
        </p>
      </Section>

      <Section n={11} title="Contact">
        <p>Questions about this Privacy Policy can be sent to the Inflique support team.</p>
      </Section>
    </LegalPageLayout>
  );
}
