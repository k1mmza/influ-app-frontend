"use client";

import { Download, Heart, Upload, Loader2, CheckCircle2, FileText, Trash2, ExternalLink, Youtube, Unlink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Role } from "@/lib/types";
import { useMediaKitStore } from "@/store/useMediaKitStore";
import { useReviewStore } from "@/store/useReviewStore";
import { useUserStore } from "@/store/useUserStore";
import { apiGetProfile, apiUpdateProfile, apiUploadRateCard, apiDeleteRateCard, apiConnectPlatform, apiDisconnectPlatform, apiGetCompleteness, apiUploadAvatar, apiSetAvatarUrl } from "@/lib/api";
import { SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";
import { Camera } from "lucide-react";
import { AvatarPickerModal } from "@/components/avatar-picker-modal";
import { notifyAvatarUpdated } from "@/lib/use-profile-avatar";
import { MediaKitImportPanel, type MediaKitImportHandle } from "@/components/media-kit-import-panel";

// ─── Shared subcomponents ────────────────────────────────────────────────────

function ProfileRatingAvatar({
  src,
  alt,
  imgClassName,
  role,
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
        className="pointer-events-none absolute -right-1 -top-1 flex items-center gap-0.5 rounded-full border border-rose-100 bg-card px-1.5 py-0.5 text-[11px] font-bold leading-none text-rose-600 shadow-md"
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
    <article className="rounded-2xl bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground font-serif">Partner review ratings</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Ratings use your account display name (same as when you submit reviews on a finished campaign).
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground font-serif">Comments you wrote</h3>
          {written.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No reviews yet.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {written.map((r) => (
                <li key={r.id} className="rounded-lg border border-border bg-muted px-3 py-2">
                  <p className="font-medium text-foreground">
                    {r.rating}/5 → {r.toName} ({r.toRole}) — {r.campaignName}
                  </p>
                  {r.comment ? <p className="mt-1 text-muted-foreground">&ldquo;{r.comment}&rdquo;</p> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground font-serif">Comments about you</h3>
          {received.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No partner feedback yet.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {received.map((r) => (
                <li key={r.id} className="rounded-lg border border-border bg-muted px-3 py-2">
                  <p className="font-medium text-foreground">
                    {r.rating}/5 from {r.fromName} ({r.fromRole}) — {r.campaignName}
                  </p>
                  {r.comment ? <p className="mt-1 text-muted-foreground">&ldquo;{r.comment}&rdquo;</p> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Avatar trigger (opens the picker modal) ─────────────────────────────────

function AvatarTrigger({
  src,
  alt,
  imgClassName,
  onClick,
}: {
  src: string;
  alt: string;
  imgClassName: string;
  onClick: () => void;
}) {
  return (
    <div className="relative inline-block shrink-0 group cursor-pointer" onClick={onClick}>
      <img src={src} alt={alt} className={imgClassName} />
      <div className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
        <Camera className="h-5 w-5 text-white" />
      </div>
    </div>
  );
}

// ─── Brand / Agency profile ───────────────────────────────────────────────────

function BrandProfileView() {
  const { role, token, name: storeUserName, email: storeEmail, setRole } = useUserStore();
  const profileRole: Role = role === "agency" ? "agency" : "brand";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // User fields
  const [userName, setUserName] = useState(storeUserName ?? "");
  const [email] = useState(storeEmail ?? "");

  // Profile fields
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");
  const [phone, setPhone] = useState("");
  const [companyDetail, setCompanyDetail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialLinkedIn, setSocialLinkedIn] = useState("");
  const [socialTikTok, setSocialTikTok] = useState("");

  useEffect(() => {
    if (!token) return;
    apiGetProfile(token)
      .then((data) => {
        if (data.name) setUserName(data.name);
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
        const p = data.profile;
        if (p) {
          setCompanyName(p.companyName ?? "");
          setPosition(p.position ?? "");
          setPhone(p.telephone ?? "");
          setCompanyDetail(p.companyDetail ?? "");
          setWebsiteUrl(p.websiteUrl ?? "");
          const sl = (p.socialLinks as any) ?? {};
          setSocialInstagram(sl.instagram ?? "");
          setSocialFacebook(sl.facebook ?? "");
          setSocialLinkedIn(sl.linkedin ?? "");
          setSocialTikTok(sl.tiktok ?? "");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setSaved(false);
    try {
      await apiUpdateProfile(token, {
        name: userName,
        companyName,
        position,
        telephone: phone,
        companyDetail,
        websiteUrl,
        socialLinks: {
          instagram: socialInstagram,
          facebook: socialFacebook,
          linkedin: socialLinkedIn,
          tiktok: socialTikTok,
        },
      });
      useUserStore.setState({ name: userName });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const fallbackAvatar = `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(companyName || userName)}`;
  const displayAvatar = avatarUrl
    ? (avatarUrl.startsWith("http") ? avatarUrl : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${avatarUrl}`)
    : fallbackAvatar;
  const heading = role === "agency" ? "Agency profile" : "Brand profile";
  const subline =
    role === "agency"
      ? "Agency and account details; add your site and socials so creators know who they are working with."
      : "Company and account details; add your site and socials for creator trust.";

  const avgRating = useMemo(
    () => useReviewStore.getState().getAverageRatingReceived(profileRole, userName),
    [profileRole, userName],
  );

  const inputCls = "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary/70 focus:ring-2 focus:ring-primary/10";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section key={role} className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground font-serif">{heading}</h1>
      <p className="text-muted-foreground">{subline}</p>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <article className="rounded-2xl bg-card p-5 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="relative inline-block">
              <AvatarTrigger
                src={displayAvatar}
                alt="Company"
                imgClassName="h-24 w-24 rounded-2xl border border-border object-cover"
                onClick={() => setShowAvatarPicker(true)}
              />
              <div className="pointer-events-none absolute -right-1 -top-1 flex items-center gap-0.5 rounded-full border border-rose-100 bg-card px-1.5 py-0.5 text-[11px] font-bold leading-none text-rose-600 shadow-md">
                <Heart className="h-3.5 w-3.5 shrink-0 fill-rose-500 text-rose-500" aria-hidden />
                <span>{avgRating?.toFixed(1) ?? "—"}</span>
              </div>
            </div>
            {showAvatarPicker && token && (
              <AvatarPickerModal
                currentUrl={displayAvatar}
                onClose={() => setShowAvatarPicker(false)}
                onSelect={async (url) => {
                  await apiSetAvatarUrl(token, url);
                  setAvatarUrl(url);
                  notifyAvatarUpdated();
                  setShowAvatarPicker(false);
                }}
                onUpload={async (file) => {
                  const { avatarUrl: url } = await apiUploadAvatar(token, file);
                  setAvatarUrl(url);
                  notifyAvatarUpdated();
                }}
                onRemove={async () => {
                  await apiSetAvatarUrl(token, "");
                  setAvatarUrl(null);
                  notifyAvatarUpdated();
                }}
              />
            )}
            <p className="mt-3 font-semibold text-foreground font-serif">{companyName || userName}</p>
            <p className="text-sm text-muted-foreground">{position || "—"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{email}</p>
          </div>
        </article>

        <div className="space-y-4">
          <article className="rounded-2xl bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground font-serif">Company &amp; user</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Company name</span>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Your name</span>
                <input value={userName} onChange={(e) => setUserName(e.target.value)} className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Position</span>
                <input value={position} onChange={(e) => setPosition(e.target.value)} className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email</span>
                <input type="email" value={email} readOnly className={`${inputCls} cursor-default opacity-60`} />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Telephone</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
              </label>
            </div>
            <label className="mt-3 block text-sm">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Company details</span>
              <textarea
                value={companyDetail}
                onChange={(e) => setCompanyDetail(e.target.value)}
                rows={4}
                className={inputCls}
              />
            </label>

            <div className="mt-6 border-t border-border pt-5">
              <h3 className="text-base font-semibold text-foreground font-serif">Website &amp; company socials</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm sm:col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Company website</span>
                  <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://" className={inputCls} />
                </label>
                <label className="block text-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Instagram</span>
                  <input type="url" value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} placeholder="https://www.instagram.com/…" className={inputCls} />
                </label>
                <label className="block text-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Facebook</span>
                  <input type="url" value={socialFacebook} onChange={(e) => setSocialFacebook(e.target.value)} placeholder="https://www.facebook.com/…" className={inputCls} />
                </label>
                <label className="block text-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">LinkedIn</span>
                  <input type="url" value={socialLinkedIn} onChange={(e) => setSocialLinkedIn(e.target.value)} placeholder="https://www.linkedin.com/company/…" className={inputCls} />
                </label>
                <label className="block text-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">TikTok</span>
                  <input type="url" value={socialTikTok} onChange={(e) => setSocialTikTok(e.target.value)} placeholder="https://www.tiktok.com/@…" className={inputCls} />
                </label>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> Saved
                </span>
              )}
            </div>
          </article>

          <ProfileReviewsSection role={profileRole} />
        </div>
      </div>
    </section>
  );
}

// ─── Influencer profile ───────────────────────────────────────────────────────

function InfluencerProfileView() {
  const { token, name: storeUserName, email: storeEmail } = useUserStore();
  const kit = useMediaKitStore();
  const setKit = useMediaKitStore((s) => s.setKit);
  const setSocialRow = useMediaKitStore((s) => s.setSocialRow);
  const setUploadedPdfFileName = useMediaKitStore((s) => s.setUploadedPdfFileName);
  const uploadRef = useRef<HTMLInputElement>(null);
  const mediaKitPanelRef = useRef<MediaKitImportHandle>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [rateCardUrl, setRateCardUrl] = useState<string | null>(null);
  const [rateCardUploading, setRateCardUploading] = useState(false);
  const [rateCardError, setRateCardError] = useState<string | null>(null);
  const rateCardInputRef = useRef<HTMLInputElement>(null);
  const [completenessScore, setCompletenessScore] = useState<number>(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [platformAccounts, setPlatformAccounts] = useState<Array<{
    id: string; platform: string; handle: string; displayName: string | null;
    followers: number; avgViews: number; engagementRate: number; syncedAt: string | null; hasTokens: boolean;
  }>>([]);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [disconnectingPlatform, setDisconnectingPlatform] = useState<string | null>(null);
  const [platformMessage, setPlatformMessage] = useState<{ text: string; error: boolean } | null>(null);

  // Handle OAuth return params (read from URL on mount)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("platform_connect");
    const platform = params.get("platform") ?? "";
    if (status === "success") {
      setPlatformMessage({ text: `${platform.charAt(0).toUpperCase() + platform.slice(1)} account connected successfully.`, error: false });
    } else if (status === "error") {
      const reason = params.get("reason") ?? "unknown";
      setPlatformMessage({ text: `${platform} connection failed: ${reason}`, error: true });
    }
  }, []);

  // Fetch real profile data into the media kit store. Reused after a media-kit import.
  const refreshProfile = () => {
    if (!token) return;
    Promise.all([apiGetProfile(token), apiGetCompleteness(token)])
      .then(([data, score]) => {
        setCompletenessScore(score);
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
        const updates: Partial<typeof kit> = {};
        if (data.name) updates.displayName = data.name;
        if (storeEmail) updates.email = storeEmail;
        const p = data.profile;
        if (p) {
          if (p.bio) updates.bio = p.bio;
          if (p.gender) updates.gender = p.gender;
          if (Array.isArray(p.categories) && p.categories.length > 0) updates.categories = p.categories;
          if (p.availabilityStatus) updates.availability = p.availabilityStatus;
          if (p.country) updates.location = p.country;
          if (Array.isArray(data.platforms) && data.platforms.length > 0) {
            setPlatformAccounts(data.platforms);
            // auto-fill handle from primary connected platform
            const primary = data.platforms.find((pl: any) => pl.hasTokens) ?? data.platforms[0];
            if (primary?.handle) updates.handle = primary.handle;
          }
        }
        if (p?.rateCardFileUrl) setRateCardUrl(p.rateCardFileUrl);
        if (Object.keys(updates).length > 0) setKit(updates as any);
        setProfileLoaded(true);
      })
      .catch(console.error);
  };

  // Load real profile data into the media kit store once
  useEffect(() => {
    if (!token || profileLoaded) return;
    refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setSaved(false);
    try {
      await apiUpdateProfile(token, {
        name: kit.displayName,
        influencerProfile: {
          bio: kit.bio,
          gender: kit.gender || undefined,
          categories: kit.categories,
          availabilityStatus: kit.availability,
          country: kit.location || undefined,
        },
      });
      useUserStore.setState({ name: kit.displayName });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const fallbackInfluencerAvatar = `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(kit.displayName)}`;
  const displayInfluencerAvatar = avatarUrl
    ? (avatarUrl.startsWith("http") ? avatarUrl : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${avatarUrl}`)
    : fallbackInfluencerAvatar;

  const parseListInput = (s: string) =>
    s.split(/[,，\n]/g).map((x) => x.trim()).filter(Boolean);

  // Download a fill-in-the-blanks TEXT template (no JSON knowledge needed),
  // pre-filled with the creator's current basic info so they only edit what's
  // missing. Re-uploading it runs the same review-before-save import.
  const downloadMediaKitTemplate = () => {
    const s = useMediaKitStore.getState();
    const num = (n: number) => (n && n > 0 ? String(n) : "");
    const template = `# Inflique Media Kit — fill in the value after each ":" then upload this file.
# Lines starting with "#" are notes and are ignored. Leave a line blank to skip it.
# (Name and Handle below are just for your reference.)
# Name: ${s.displayName || ""}
# Handle: ${s.handle || ""}

Bio: ${s.bio || ""}
Categories: ${s.categories.join(", ")}
Style tags:
Keywords:
Hashtags:
Availability: ${s.availability || ""}

# Rate card — numbers only, no currency symbol
Price per post: ${num(s.pricing.post)}
Price per video: ${num(s.pricing.video)}
Price per story:
Package price: ${num(s.pricing.bundle)}
Package description:

# Claimed stats — shown to brands as "claimed", NOT used as your verified numbers
Followers:
Average views:
Engagement rate:
`;
    const blob = new Blob([template], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = kit.handle.replace(/^@/, "").replace(/\s+/g, "-") || "creator";
    a.href = url;
    a.download = `media-kit-template-${slug}.txt`;
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
    // Hand the file to the AI media-kit import → review & confirm panel.
    setImportMessage(null);
    void mediaKitPanelRef.current?.analyze(file);
  };

  const inputCls = "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary/70 focus:ring-2 focus:ring-primary/10";

  return (
    <section className="space-y-6">
      {/* Brown gradient header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#92400e] to-[#431407] px-6 py-8 text-white shadow-lg">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-end pr-8 opacity-10 select-none">
          <span className="text-[120px] font-black font-serif leading-none">Profile</span>
        </div>
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[11px] font-bold uppercase tracking-widest">
              Influencer
            </span>
            <h1 className="mt-2 text-2xl font-bold font-serif">Media Kit</h1>
            <p className="mt-1 text-sm text-white/70">
              Edit the fields brands see in discovery. Name, bio, categories and availability sync to the backend.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <input ref={uploadRef} type="file" accept=".txt,text/plain,.pdf,application/pdf,.json,application/json" className="hidden" onChange={onUploadFiles} />
            <button
              type="button"
              onClick={() => uploadRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20"
            >
              <Upload className="h-4 w-4" aria-hidden />
              Upload Text / PDF
            </button>
            <button
              type="button"
              onClick={downloadMediaKitTemplate}
              className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/30"
            >
              <Download className="h-4 w-4" aria-hidden />
              Download Template
            </button>
          </div>
        </div>
      </div>

      {/* AI media-kit import — driven by the header "Upload JSON / PDF" button.
          Renders only after a file is picked; nothing auto-saves. */}
      {token && (
        <MediaKitImportPanel ref={mediaKitPanelRef} token={token} onApplied={refreshProfile} />
      )}

      {/* Connected platforms */}
      <article className="rounded-2xl bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-foreground font-serif">Connected platforms</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Link your accounts so we can auto-refresh your stats whenever your data is scheduled for a sync.
        </p>

        {platformMessage && (
          <p className={`mt-3 text-xs font-medium ${platformMessage.error ? "text-destructive" : "text-emerald-600"}`}>
            {platformMessage.text}
          </p>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {([
            {
              key: "youtube",
              label: "YouTube",
              icon: <Youtube className="h-5 w-5 text-red-600" />,
              bg: "bg-red-100 dark:bg-red-900/30",
              connectBg: "bg-red-600 hover:bg-red-700",
              description: "Subscribers, watch time, and audience analytics via youtube.readonly + yt-analytics.readonly",
            },
            {
              key: "tiktok",
              label: "TikTok",
              icon: (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
                </svg>
              ),
              bg: "bg-slate-100 dark:bg-slate-800",
              connectBg: "bg-slate-900 hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200",
              description: "Followers, avg views, and engagement rate via TikTok Login Kit v2 with PKCE",
            },
            {
              key: "instagram",
              label: "Instagram",
              icon: (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="url(#ig-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <defs>
                    <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F58529" />
                      <stop offset="50%" stopColor="#DD2A7B" />
                      <stop offset="100%" stopColor="#8134AF" />
                    </linearGradient>
                  </defs>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              ),
              bg: "bg-pink-50 dark:bg-pink-900/20",
              connectBg: "",
              description: "Instagram Basic Display API was deprecated by Meta in Dec 2024. Graph API integration coming soon.",
              comingSoon: true,
            },
          ] as const).map(({ key, label, icon, bg, connectBg, description, ...rest }) => {
            const comingSoon = "comingSoon" in rest && rest.comingSoon;
            // "Connected" means we still hold OAuth tokens. Disconnect keeps the
            // PlatformAccount row (preserves historical stats) but nulls the tokens,
            // so presence alone is not enough — must check hasTokens.
            const isConnected = !comingSoon && platformAccounts.some((pa) => pa.platform === key && pa.hasTokens);
            const isConnecting = connectingPlatform === key;
            const isDisconnecting = disconnectingPlatform === key;

            return (
              <div key={key} className={`flex items-start gap-3 rounded-xl border p-4 ${comingSoon ? "border-dashed border-border opacity-70" : "border-border"}`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{label}</span>
                    {comingSoon ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Coming soon
                      </span>
                    ) : isConnected && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{description}</p>
                  <div className="mt-2">
                    {comingSoon ? null : isConnected ? (
                      <button
                        type="button"
                        disabled={isDisconnecting}
                        onClick={async () => {
                          if (!token) return;
                          setDisconnectingPlatform(key);
                          setPlatformMessage(null);
                          try {
                            await apiDisconnectPlatform(token, key);
                            setPlatformAccounts((prev) => prev.map((pa) =>
                              pa.platform === key ? { ...pa, hasTokens: false } : pa
                            ));
                            setPlatformMessage({ text: `${label} account disconnected.`, error: false });
                          } catch (err: any) {
                            setPlatformMessage({ text: `Disconnect failed: ${err.message}`, error: true });
                          } finally {
                            setDisconnectingPlatform(null);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        {isDisconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5" />}
                        Disconnect
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isConnecting}
                        onClick={async () => {
                          if (!token) return;
                          setConnectingPlatform(key);
                          setPlatformMessage(null);
                          try {
                            const { authUrl } = await apiConnectPlatform(token, key);
                            window.location.href = authUrl;
                          } catch (err: any) {
                            setPlatformMessage({ text: `Failed to start ${label} connection: ${err.message}`, error: true });
                            setConnectingPlatform(null);
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-60 ${connectBg}`}
                      >
                        {isConnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
                        Connect {label}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </article>

      {importMessage && (
        <p className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-primary" role="status">
          {importMessage}
        </p>
      )}

      {kit.uploadedPdfFileName && (
        <p className="text-sm text-muted-foreground">
          PDF on file: <span className="font-semibold text-foreground">{kit.uploadedPdfFileName}</span>{" "}
          <button
            type="button"
            className="ml-2 text-sm font-semibold text-primary hover:underline"
            onClick={() => { setUploadedPdfFileName(null); setImportMessage("PDF attachment cleared."); }}
          >
            Remove
          </button>
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <article className="rounded-2xl bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <AvatarTrigger
              src={displayInfluencerAvatar}
              alt={`${kit.displayName} profile`}
              imgClassName="h-14 w-14 rounded-full border border-border object-cover"
              onClick={() => setShowAvatarPicker(true)}
            />
            <div>
              <h2 className="text-lg font-semibold text-foreground font-serif">{kit.displayName}</h2>
              <p className="text-sm text-muted-foreground">{kit.handle}</p>
            </div>
          </div>
          {showAvatarPicker && token && (
            <AvatarPickerModal
              currentUrl={displayInfluencerAvatar}
              onClose={() => setShowAvatarPicker(false)}
              onSelect={async (url) => {
                await apiSetAvatarUrl(token, url);
                setAvatarUrl(url);
                notifyAvatarUpdated();
                setShowAvatarPicker(false);
              }}
              onUpload={async (file) => {
                const { avatarUrl: url } = await apiUploadAvatar(token, file);
                setAvatarUrl(url);
                notifyAvatarUpdated();
              }}
              onRemove={async () => {
                await apiSetAvatarUrl(token, "");
                setAvatarUrl(null);
                notifyAvatarUpdated();
              }}
            />
          )}
          <label className="mt-4 block text-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Display name</span>
            <input value={kit.displayName} onChange={(e) => setKit({ displayName: e.target.value })} className={inputCls} />
          </label>
          <label className="mt-3 block text-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Handle</span>
            <input
              value={kit.handle}
              readOnly
              placeholder="Auto-filled from connected platform"
              title="Handle is pulled from your connected platform account"
              className={`${inputCls} cursor-default opacity-60`}
            />
          </label>
          <label className="mt-3 block text-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bio / positioning</span>
            <textarea value={kit.bio} onChange={(e) => setKit({ bio: e.target.value })} rows={4} className={inputCls} />
          </label>
          <label className="mt-3 block text-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gender</span>
            <select value={kit.gender} onChange={(e) => setKit({ gender: e.target.value as typeof kit.gender })} className={inputCls}>
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="mt-3 block text-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Location</span>
            <input value={kit.location} onChange={(e) => setKit({ location: e.target.value })} className={inputCls} />
          </label>
          <label className="mt-3 block text-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contact email for brands</span>
            <input type="email" value={kit.email} onChange={(e) => setKit({ email: e.target.value })} className={inputCls} />
          </label>
          <div className="mt-4 rounded-xl bg-muted p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Profile completeness</span>
              <span className="text-sm font-bold text-foreground">{completenessScore}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-border overflow-hidden">
              <div
                className="h-2 rounded-full bg-[#92400e] transition-all duration-500"
                style={{ width: `${completenessScore}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save profile
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Saved
              </span>
            )}
          </div>
        </article>

        <div className="space-y-4">
          <article className="rounded-2xl bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground font-serif">Audience snapshot</h2>
            <p className="mt-1 text-xs text-muted-foreground">Headline numbers brands scan first on a media kit.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total followers", key: "totalFollowers" as const },
                { label: "Average views", key: "averageViews" as const },
                { label: "Engagement rate %", key: "engagementRate" as const, step: 0.1 },
                { label: "Growth rate %", key: "growthRate" as const, step: 0.1 },
              ].map(({ label, key, step }) => (
                <label key={key} className="block rounded-xl bg-muted p-3 text-sm">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <input
                    type="number" min={0} step={step ?? 1}
                    value={(kit as any)[key]}
                    onChange={(e) => setKit({ [key]: Number(e.target.value) } as any)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none"
                  />
                </label>
              ))}
            </div>
          </article>

          <article className="rounded-2xl bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground font-serif">Connected platform stats</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Live data from your linked accounts. Connect platforms above to populate.</p>
            {platformAccounts.filter((pa) => pa.hasTokens).length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No connected accounts yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {platformAccounts.filter((pa) => pa.hasTokens).map((pa) => {
                  const PlatformIcon =
                    pa.platform === "youtube" ? SiYoutube
                    : pa.platform === "tiktok" ? SiTiktok
                    : pa.platform === "instagram" ? SiInstagram
                    : null;
                  const iconColor =
                    pa.platform === "youtube" ? "text-red-600"
                    : pa.platform === "tiktok" ? "text-foreground"
                    : pa.platform === "instagram" ? "text-[#E4405F]"
                    : "text-muted-foreground";
                  return (
                    <div key={pa.id} className="flex items-center gap-4 rounded-xl border border-border bg-muted/40 px-4 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background border border-border">
                        {PlatformIcon && <PlatformIcon className={`h-5 w-5 ${iconColor}`} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold capitalize text-foreground">{pa.platform}</p>
                          <span className="truncate text-xs text-muted-foreground">@{pa.handle.replace(/^@/, "")}</span>
                          {pa.hasTokens && (
                            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Live</span>
                          )}
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-3">
                          {[
                            { label: "Reach", value: pa.followers.toLocaleString() },
                            { label: "Avg Views", value: pa.avgViews.toLocaleString() },
                            { label: "Engage", value: `${pa.engagementRate}%` },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                              <p className="text-xs font-bold text-foreground">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {pa.syncedAt && (
                        <p className="hidden shrink-0 text-[10px] text-muted-foreground sm:block">
                          {new Date(pa.syncedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        </div>
      </div>

      <ProfileReviewsSection role="influencer" />

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground font-serif">Niches &amp; deliverables</h2>
          <label className="mt-3 block text-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Categories (comma or newline separated)</span>
            <textarea value={kit.categories.join(", ")} onChange={(e) => setKit({ categories: parseListInput(e.target.value) })} rows={2} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
          </label>
          <label className="mt-3 block text-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Services (comma or newline separated)</span>
            <textarea value={kit.services.join(", ")} onChange={(e) => setKit({ services: parseListInput(e.target.value) })} rows={2} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
          </label>
        </article>

        <article className="rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground font-serif">Audience insights</h2>
          {[
            { label: "Gender mix", field: "gender" as const },
            { label: "Age breakdown", field: "age" as const },
          ].map(({ label, field }) => (
            <label key={field} className="mt-3 block text-sm">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
              <input value={kit.audience[field]} onChange={(e) => setKit({ audience: { ...kit.audience, [field]: e.target.value } })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
            </label>
          ))}
          <label className="mt-3 block text-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Top countries (comma separated)</span>
            <input value={kit.audience.topCountries.join(", ")} onChange={(e) => setKit({ audience: { ...kit.audience, topCountries: parseListInput(e.target.value) } })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
          </label>
          <label className="mt-3 block text-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Top cities (comma separated)</span>
            <input value={kit.audience.topCities.join(", ")} onChange={(e) => setKit({ audience: { ...kit.audience, topCities: parseListInput(e.target.value) } })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
          </label>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground font-serif">Rate card (THB)</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {(["post", "video", "bundle"] as const).map((key) => (
              <label key={key} className="block text-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <input type="number" min={0} value={kit.pricing[key]} onChange={(e) => setKit({ pricing: { ...kit.pricing, [key]: Number(e.target.value) } })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
              </label>
            ))}
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Rate Card Document</p>
            <p className="text-xs text-muted-foreground mb-3">Upload a PDF or image file — agencies and brands will see it on your profile.</p>

            {rateCardUrl ? (
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${rateCardUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-primary flex items-center gap-1"
                  >
                    View Rate Card <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!token) return;
                    setRateCardError(null);
                    try {
                      await apiDeleteRateCard(token);
                      setRateCardUrl(null);
                    } catch (err: any) {
                      setRateCardError(err.message);
                    }
                  }}
                  className="ml-3 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={rateCardUploading}
                onClick={() => rateCardInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 px-4 py-3 text-sm font-semibold text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all disabled:opacity-50"
              >
                {rateCardUploading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
                ) : (
                  <><Upload className="h-4 w-4" /> Upload PDF or image (max 10 MB)</>
                )}
              </button>
            )}

            <input
              ref={rateCardInputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp,.pdf"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file || !token) return;
                setRateCardUploading(true);
                setRateCardError(null);
                try {
                  const result = await apiUploadRateCard(token, file);
                  setRateCardUrl(result.rateCardFileUrl);
                } catch (err: any) {
                  setRateCardError(err.message || "Upload failed");
                } finally {
                  setRateCardUploading(false);
                }
              }}
            />

            {rateCardError && (
              <p className="mt-2 text-xs text-destructive">{rateCardError}</p>
            )}
          </div>
        </article>

        <article className="rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground font-serif">Case highlights &amp; partners</h2>
          <label className="mt-3 block text-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Portfolio lines (one per line)</span>
            <textarea value={kit.portfolio.join("\n")} onChange={(e) => setKit({ portfolio: e.target.value.split("\n").map((l) => l.trim()).filter(Boolean) })} rows={4} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs outline-none" />
          </label>
          <label className="mt-3 block text-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Past collaborations (one per line)</span>
            <textarea value={kit.pastCollaborations.join("\n")} onChange={(e) => setKit({ pastCollaborations: e.target.value.split("\n").map((l) => l.trim()).filter(Boolean) })} rows={3} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs outline-none" />
          </label>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground font-serif">Availability</h2>
          <label className="mt-2 block text-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</span>
            <input value={kit.availability} onChange={(e) => setKit({ availability: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
          </label>
        </article>

        <article className="rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground font-serif">Settings</h2>
          {[
            { label: "Message alerts", key: "messageAlerts" as const },
            { label: "Campaign alerts", key: "campaignAlerts" as const },
          ].map(({ label, key }) => (
            <label key={key} className="mt-2 flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={kit.notificationSettings[key]} onChange={(e) => setKit({ notificationSettings: { ...kit.notificationSettings, [key]: e.target.checked } })} />
              {label}
            </label>
          ))}
          <label className="mt-3 block text-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Privacy</span>
            <input value={kit.privacy} onChange={(e) => setKit({ privacy: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
          </label>
        </article>
      </div>
    </section>
  );
}

// ─── Admin profile ─────────────────────────────────────────────────────────────
// An ADMIN account is provisioned by promoting an existing user, so it may still
// carry an InfluencerProfile (or brand/agency) row underneath — but none of those
// editing surfaces make sense for an admin. This view shows the account itself
// plus links to the admin surfaces, and nothing editable.
function AdminProfileView() {
  const { name, email } = useUserStore();

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground font-serif">Admin profile</h1>
      <p className="text-muted-foreground">
        Your administrator account. There is no public creator or brand profile to edit here.
      </p>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <article className="rounded-2xl bg-card p-5 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-muted">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
            <p className="mt-3 font-semibold text-foreground font-serif">{name || "Administrator"}</p>
            <span className="mt-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
              Administrator
            </span>
            <p className="mt-2 text-xs text-muted-foreground">{email}</p>
          </div>
        </article>

        <div className="space-y-4">
          <article className="rounded-2xl bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground font-serif">Account</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</p>
                <p className="mt-1 text-sm text-foreground">{name || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</p>
                <p className="mt-1 text-sm text-foreground">{email || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Role</p>
                <p className="mt-1 text-sm text-foreground">Administrator</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground font-serif">Admin tools</h2>
            <p className="mt-1 text-sm text-muted-foreground">Platform-wide views available to your account.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary"
              >
                Platform overview
              </Link>
              <Link
                href="/campaigns"
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary"
              >
                All campaigns
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

// ─── Page entry ───────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { role } = useUserStore();
  if (role === "admin") return <AdminProfileView />;
  if (role === "brand" || role === "agency") return <BrandProfileView />;
  return <InfluencerProfileView />;
}
