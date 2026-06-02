"use client";

import { Download, Heart, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { Role } from "@/lib/types";
import {
  buildMediaKitExportPayload,
  parseMediaKitImportFile,
  useMediaKitStore
} from "@/store/useMediaKitStore";
import { useReviewStore } from "@/store/useReviewStore";
import { useUserStore } from "@/store/useUserStore";

function ProfileRatingAvatar({
  src,
  alt,
  imgClassName,
  role
}: {
  src: string;
  alt: string;
  imgClassName: string;
  role: Role;
}) {
  const displayName = useUserStore((s) => s.name);
  const reviews = useReviewStore((s) => s.reviews);
  const avg = useMemo(
    () => useReviewStore.getState().getAverageRatingReceived(role, displayName),
    [reviews, role, displayName]
  );
  return (
    <div className="relative inline-block shrink-0">
      <img src={src} alt={alt} className={imgClassName} />
      <div
        className="pointer-events-none absolute -right-1 -top-1 flex items-center gap-0.5 rounded-full border border-rose-100 bg-white px-1.5 py-0.5 text-[11px] font-bold leading-none text-rose-600 shadow-md"
        title="Average rating from partners on finished campaigns"
      >
        <Heart className="h-3.5 w-3.5 shrink-0 fill-rose-500 text-rose-500" aria-hidden />
        <span>{avg != null ? avg.toFixed(1) : "—"}</span>
      </div>
    </div>
  );
}

function ProfileReviewsSection({ role }: { role: Role }) {
  const displayName = useUserStore((s) => s.name);
  const reviews = useReviewStore((s) => s.reviews);
  const written = useMemo(
    () => useReviewStore.getState().getReviewsWrittenBy(role, displayName),
    [reviews, role, displayName]
  );
  const received = useMemo(
    () => useReviewStore.getState().getReviewsReceivedBy(role, displayName),
    [reviews, role, displayName]
  );

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Partner review ratings</h2>
      <p className="mt-1 text-xs text-slate-500">
        Ratings use your account display name (same as when you submit reviews on a finished campaign).
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Comments you wrote</h3>
          {written.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No reviews yet. Finish a campaign, then rate partners from the campaign page.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              {written.map((r) => (
                <li key={r.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="font-medium text-slate-900">
                    {r.rating}/5 → {r.toName} ({r.toRole}) — {r.campaignName}
                  </p>
                  {r.comment ? <p className="mt-1 text-slate-600">&ldquo;{r.comment}&rdquo;</p> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Comments about you</h3>
          {received.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No partner feedback yet.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              {received.map((r) => (
                <li key={r.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="font-medium text-slate-900">
                    {r.rating}/5 from {r.fromName} ({r.fromRole}) — {r.campaignName}
                  </p>
                  {r.comment ? <p className="mt-1 text-slate-600">&ldquo;{r.comment}&rdquo;</p> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}

const mockBrandProfile = {
  companyName: "GlowLab Co., Ltd.",
  userName: "Sarah Chen",
  position: "Head of Growth",
  email: "sarah.chen@glowlab.mock",
  phone: "+66 2 000 0000",
  companyDetail: "Dermatologist-tested skincare for daily routines. HQ Bangkok; shipping SEA.",
  websiteUrl: "https://www.glowlab.mock",
  socialInstagram: "https://www.instagram.com/glowlab.mock",
  socialFacebook: "https://www.facebook.com/glowlab.mock",
  socialLinkedIn: "https://www.linkedin.com/company/glowlab-mock",
  socialTikTok: "https://www.tiktok.com/@glowlab.mock"
};

const mockAgencyProfile = {
  companyName: "Digital Marketing Agency Co., Ltd.",
  userName: "Sarah Chen",
  position: "Senior Campaign Manager",
  email: "sarah.chen@agency.mock",
  phone: "+66 2 111 2222",
  companyDetail: "Full-service influencer and performance campaigns across SEA. Offices in Bangkok and Singapore.",
  websiteUrl: "https://www.digitalagency.mock",
  socialInstagram: "https://www.instagram.com/digitalagency.mock",
  socialFacebook: "https://www.facebook.com/digitalagency.mock",
  socialLinkedIn: "https://www.linkedin.com/company/digitalagency-mock",
  socialTikTok: ""
};

function BrandProfileView() {
  const { role } = useUserStore();
  const profileRole: Role = role === "agency" ? "agency" : "brand";
  const base = role === "agency" ? mockAgencyProfile : mockBrandProfile;
  const [companyName, setCompanyName] = useState(base.companyName);
  const [userName, setUserName] = useState(base.userName);
  const [position, setPosition] = useState(base.position);
  const [email, setEmail] = useState(base.email);
  const [phone, setPhone] = useState(base.phone);
  const [companyDetail, setCompanyDetail] = useState(base.companyDetail);
  const [websiteUrl, setWebsiteUrl] = useState(base.websiteUrl);
  const [socialInstagram, setSocialInstagram] = useState(base.socialInstagram);
  const [socialFacebook, setSocialFacebook] = useState(base.socialFacebook);
  const [socialLinkedIn, setSocialLinkedIn] = useState(base.socialLinkedIn);
  const [socialTikTok, setSocialTikTok] = useState(base.socialTikTok);
  const avatarUrl = `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(companyName)}`;
  const heading = role === "agency" ? "Agency profile" : "Brand profile";
  const subline =
    role === "agency"
      ? "Agency and account details; add your site and socials so creators know who they are working with."
      : "Company and account details; add your site and socials for creator trust.";

  return (
    <section key={role} className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{heading}</h1>
      <p className="text-slate-600">{subline} Manage your password in Account.</p>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <ProfileRatingAvatar
              src={avatarUrl}
              alt="Company"
              imgClassName="h-24 w-24 rounded-2xl border border-slate-200 object-cover"
              role={profileRole}
            />
            <p className="mt-3 text-sm text-slate-500">Company logo (demo)</p>
            <button type="button" className="mt-2 text-sm font-semibold text-primary hover:underline">
              Change image
            </button>
          </div>
        </article>

        <div className="space-y-4">
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Company &amp; user</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-slate-600">Company name</span>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Your name</span>
                <input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Position</span>
                <input
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="text-slate-600">Telephone</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </label>
            </div>
            <label className="mt-3 block text-sm">
              <span className="text-slate-600">Company details</span>
              <textarea
                value={companyDetail}
                onChange={(e) => setCompanyDetail(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="text-base font-semibold text-slate-900">Website &amp; company socials</h3>
              <p className="mt-1 text-xs text-slate-500">Shown on campaign pages and briefs (demo fields only).</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm sm:col-span-2">
                  <span className="text-slate-600">Company website</span>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">Instagram</span>
                  <input
                    type="url"
                    value={socialInstagram}
                    onChange={(e) => setSocialInstagram(e.target.value)}
                    placeholder="https://www.instagram.com/…"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">Facebook</span>
                  <input
                    type="url"
                    value={socialFacebook}
                    onChange={(e) => setSocialFacebook(e.target.value)}
                    placeholder="https://www.facebook.com/…"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">LinkedIn</span>
                  <input
                    type="url"
                    value={socialLinkedIn}
                    onChange={(e) => setSocialLinkedIn(e.target.value)}
                    placeholder="https://www.linkedin.com/company/…"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">TikTok</span>
                  <input
                    type="url"
                    value={socialTikTok}
                    onChange={(e) => setSocialTikTok(e.target.value)}
                    placeholder="https://www.tiktok.com/@…"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
              </div>
            </div>

            <button type="button" className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
              Save changes (demo)
            </button>
          </article>

          <ProfileReviewsSection role={profileRole} />

          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Account</h2>
            <p className="mt-1 text-sm text-slate-600">Change password and security settings (wireframe).</p>
            <div className="mt-3 grid gap-3 sm:max-w-md">
              <input
                type="password"
                placeholder="Current password"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                type="password"
                placeholder="New password"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <button type="button" className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800">
                Update password
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function InfluencerProfileView() {
  const kit = useMediaKitStore();
  const setKit = useMediaKitStore((s) => s.setKit);
  const setSocialRow = useMediaKitStore((s) => s.setSocialRow);
  const applyImport = useMediaKitStore((s) => s.applyImport);
  const setUploadedPdfFileName = useMediaKitStore((s) => s.setUploadedPdfFileName);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const avatarUrl = `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(kit.displayName)}`;

  const parseListInput = (s: string) =>
    s
      .split(/[,，\n]/g)
      .map((x) => x.trim())
      .filter(Boolean);

  const downloadMediaKitJson = () => {
    const state = useMediaKitStore.getState();
    const payload = buildMediaKitExportPayload(state);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = kit.handle.replace(/^@/, "").replace(/\s+/g, "-") || "creator";
    a.href = url;
    a.download = `media-kit-${slug}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setImportMessage(null);
  };

  const onUploadFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      setUploadedPdfFileName(file.name);
      setImportMessage(`Attached PDF for brands: ${file.name} (stored locally for this demo).`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const partial = parseMediaKitImportFile(text);
      if (partial) {
        applyImport(partial);
        setImportMessage("Media kit JSON imported. Review the form and save your work in the browser (auto-saved).");
      } else {
        setImportMessage("Could not read that file as media kit JSON. Export again from Profile or use the sample shape.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Media kit</h1>
          <p className="mt-1 text-sm text-slate-600">
            Edit the fields brands see in discovery. Download a JSON backup or upload a previously exported JSON; you can also attach a PDF kit
            for your records (demo: file name only).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input ref={uploadRef} type="file" accept=".json,application/json,application/pdf,.pdf" className="hidden" onChange={onUploadFiles} />
          <button
            type="button"
            onClick={() => uploadRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            <Upload className="h-4 w-4" aria-hidden />
            Upload JSON / PDF
          </button>
          <button
            type="button"
            onClick={downloadMediaKitJson}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
          >
            <Download className="h-4 w-4" aria-hidden />
            Download JSON
          </button>
        </div>
      </div>

      {importMessage ? (
        <p className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-primary-foreground" role="status">
          {importMessage}
        </p>
      ) : null}

      {kit.uploadedPdfFileName ? (
        <p className="text-sm text-slate-600">
          PDF on file: <span className="font-semibold text-slate-900">{kit.uploadedPdfFileName}</span>{" "}
          <button
            type="button"
            className="ml-2 text-sm font-semibold text-primary hover:underline"
            onClick={() => {
              setUploadedPdfFileName(null);
              setImportMessage("PDF attachment cleared.");
            }}
          >
            Remove
          </button>
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <ProfileRatingAvatar
              src={avatarUrl}
              alt={`${kit.displayName} profile`}
              imgClassName="h-14 w-14 rounded-full border border-slate-200 object-cover"
              role="influencer"
            />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{kit.displayName}</h2>
              <p className="text-sm text-slate-600">{kit.handle}</p>
            </div>
          </div>
          <label className="mt-4 block text-sm">
            <span className="text-slate-600">Display name</span>
            <input
              value={kit.displayName}
              onChange={(e) => setKit({ displayName: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="mt-3 block text-sm">
            <span className="text-slate-600">Handle</span>
            <input
              value={kit.handle}
              onChange={(e) => setKit({ handle: e.target.value })}
              placeholder="@your.handle"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="mt-3 block text-sm">
            <span className="text-slate-600">Bio / positioning</span>
            <textarea
              value={kit.bio}
              onChange={(e) => setKit({ bio: e.target.value })}
              rows={4}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <div className="mt-3 grid gap-3">
            <label className="block text-sm">
              <span className="text-slate-600">Location</span>
              <input
                value={kit.location}
                onChange={(e) => setKit({ location: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Contact email for brands</span>
              <input
                type="email"
                value={kit.email}
                onChange={(e) => setKit({ email: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 p-3">
            <label className="block text-sm">
              <span className="text-xs font-semibold text-slate-500">Profile completeness (manual % for demo)</span>
              <input
                type="number"
                min={0}
                max={100}
                value={kit.profileCompleteness}
                onChange={(e) => setKit({ profileCompleteness: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
          </div>
        </article>

        <div className="space-y-4">
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Audience snapshot</h2>
            <p className="mt-1 text-xs text-slate-500">Headline numbers brands scan first on a media kit.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block text-sm rounded-xl bg-slate-50 p-3">
                <span className="text-xs text-slate-500">Total followers (all platforms)</span>
                <input
                  type="number"
                  min={0}
                  value={kit.totalFollowers}
                  onChange={(e) => setKit({ totalFollowers: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5"
                />
              </label>
              <label className="block text-sm rounded-xl bg-slate-50 p-3">
                <span className="text-xs text-slate-500">Average views</span>
                <input
                  type="number"
                  min={0}
                  value={kit.averageViews}
                  onChange={(e) => setKit({ averageViews: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5"
                />
              </label>
              <label className="block text-sm rounded-xl bg-slate-50 p-3">
                <span className="text-xs text-slate-500">Engagement rate %</span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={kit.engagementRate}
                  onChange={(e) => setKit({ engagementRate: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5"
                />
              </label>
              <label className="block text-sm rounded-xl bg-slate-50 p-3">
                <span className="text-xs text-slate-500">Growth rate %</span>
                <input
                  type="number"
                  step={0.1}
                  value={kit.growthRate}
                  onChange={(e) => setKit({ growthRate: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5"
                />
              </label>
            </div>
          </article>

          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Platforms &amp; handles</h2>
            <div className="mt-3 space-y-3">
              {kit.socialAccounts.map((account, index) => (
                <div key={`${account.platform}-${index}`} className="rounded-xl border border-slate-200 p-3 text-sm">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs text-slate-500">Platform</span>
                      <input
                        value={account.platform}
                        onChange={(e) => setSocialRow(index, { platform: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-slate-500">Handle</span>
                      <input
                        value={account.username}
                        onChange={(e) => setSocialRow(index, { username: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-slate-500">Followers</span>
                      <input
                        type="number"
                        min={0}
                        value={account.followers}
                        onChange={(e) => setSocialRow(index, { followers: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-slate-500">Avg views</span>
                      <input
                        type="number"
                        min={0}
                        value={account.avgViews}
                        onChange={(e) => setSocialRow(index, { avgViews: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="text-xs text-slate-500">Engagement rate %</span>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={account.engagementRate}
                        onChange={(e) => setSocialRow(index, { engagementRate: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>

      <ProfileReviewsSection role="influencer" />

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Niches &amp; deliverables</h2>
          <label className="mt-3 block text-sm">
            <span className="text-slate-600">Categories (comma or newline separated)</span>
            <textarea
              value={kit.categories.join(", ")}
              onChange={(e) => setKit({ categories: parseListInput(e.target.value) })}
              rows={2}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="mt-3 block text-sm">
            <span className="text-slate-600">Services (comma or newline separated)</span>
            <textarea
              value={kit.services.join(", ")}
              onChange={(e) => setKit({ services: parseListInput(e.target.value) })}
              rows={2}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Audience insights</h2>
          <label className="mt-3 block text-sm">
            <span className="text-slate-600">Gender mix</span>
            <input
              value={kit.audience.gender}
              onChange={(e) => setKit({ audience: { ...kit.audience, gender: e.target.value } })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="mt-3 block text-sm">
            <span className="text-slate-600">Age breakdown</span>
            <input
              value={kit.audience.age}
              onChange={(e) => setKit({ audience: { ...kit.audience, age: e.target.value } })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="mt-3 block text-sm">
            <span className="text-slate-600">Top countries (comma separated)</span>
            <input
              value={kit.audience.topCountries.join(", ")}
              onChange={(e) =>
                setKit({ audience: { ...kit.audience, topCountries: parseListInput(e.target.value) } })
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="mt-3 block text-sm">
            <span className="text-slate-600">Top cities (comma separated)</span>
            <input
              value={kit.audience.topCities.join(", ")}
              onChange={(e) => setKit({ audience: { ...kit.audience, topCities: parseListInput(e.target.value) } })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Rate card (THB)</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="text-slate-600">Post</span>
              <input
                type="number"
                min={0}
                value={kit.pricing.post}
                onChange={(e) => setKit({ pricing: { ...kit.pricing, post: Number(e.target.value) } })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Video</span>
              <input
                type="number"
                min={0}
                value={kit.pricing.video}
                onChange={(e) => setKit({ pricing: { ...kit.pricing, video: Number(e.target.value) } })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm sm:col-span-1">
              <span className="text-slate-600">Bundle</span>
              <input
                type="number"
                min={0}
                value={kit.pricing.bundle}
                onChange={(e) => setKit({ pricing: { ...kit.pricing, bundle: Number(e.target.value) } })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
          </div>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Case highlights &amp; partners</h2>
          <label className="mt-3 block text-sm">
            <span className="text-slate-600">Portfolio lines (one per line)</span>
            <textarea
              value={kit.portfolio.join("\n")}
              onChange={(e) =>
                setKit({
                  portfolio: e.target.value
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean)
                })
              }
              rows={4}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs"
            />
          </label>
          <label className="mt-3 block text-sm">
            <span className="text-slate-600">Past collaborations (one per line)</span>
            <textarea
              value={kit.pastCollaborations.join("\n")}
              onChange={(e) =>
                setKit({
                  pastCollaborations: e.target.value
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean)
                })
              }
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs"
            />
          </label>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Availability</h2>
          <label className="mt-2 block text-sm">
            <span className="text-slate-600">Status</span>
            <input
              value={kit.availability}
              onChange={(e) => setKit({ availability: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={kit.notificationSettings.messageAlerts}
              onChange={(e) =>
                setKit({
                  notificationSettings: { ...kit.notificationSettings, messageAlerts: e.target.checked }
                })
              }
            />
            Message alerts
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={kit.notificationSettings.campaignAlerts}
              onChange={(e) =>
                setKit({
                  notificationSettings: { ...kit.notificationSettings, campaignAlerts: e.target.checked }
                })
              }
            />
            Campaign alerts
          </label>
          <label className="mt-3 block text-sm">
            <span className="text-slate-600">Privacy</span>
            <input
              value={kit.privacy}
              onChange={(e) => setKit({ privacy: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
        </article>
      </div>
    </section>
  );
}

export default function ProfilePage() {
  const { role } = useUserStore();
  if (role === "brand" || role === "agency") return <BrandProfileView />;
  return <InfluencerProfileView />;
}
