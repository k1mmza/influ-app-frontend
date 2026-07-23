"use client";

import { Download, Heart, Upload, Loader2, CheckCircle2, FileText, Trash2, ExternalLink, Youtube, Unlink, ShieldCheck, X, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Role } from "@/lib/types";
import { useMediaKitStore } from "@/store/useMediaKitStore";
import { useReviewStore } from "@/store/useReviewStore";
import { useUserStore } from "@/store/useUserStore";
import { apiGetProfile, apiUpdateProfile, apiUploadRateCard, apiDeleteRateCard, apiConnectPlatform, apiDisconnectPlatform, apiGetCompleteness, apiUploadAvatar, apiSetAvatarUrl, apiSyncMyPlatforms } from "@/lib/api";
import { SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";
import { Camera } from "lucide-react";
import { AvatarPickerModal } from "@/components/avatar-picker-modal";
import { notifyAvatarUpdated } from "@/lib/use-profile-avatar";
import { MediaKitImportPanel, type MediaKitImportHandle } from "@/components/media-kit-import-panel";

// Canonical niche list — keep in sync with the discover filter `categories`
// (backend CATEGORY_TAGS). Offered as quick-add chips; creators can also type
// their own custom niches.
const NICHE_SUGGESTIONS = [
  "Beauty", "Fashion", "Fitness", "Food", "Gaming", "Travel", "Tech", "Lifestyle",
  "Education", "Entertainment", "Business", "Music", "Sports", "Comedy", "DIY",
  "Cooking", "Health",
];

const AVAILABILITY_OPTIONS = [
  "Available for work",
  "Selectively available",
  "Booked — not available",
];

// ─── Shared subcomponents ────────────────────────────────────────────────────

// Editable tag field: existing tags render as removable olive chips, a free-text
// entry adds custom tags (Enter / comma / blur), and optional preset chips give
// quick one-tap adds. Used for niches & services on the creator profile.
function TagField({
  value,
  onChange,
  suggestions = [],
  placeholder = "Type and press Enter…",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const has = (t: string) => value.some((v) => v.toLowerCase() === t.toLowerCase());
  const add = (raw: string) => {
    const t = raw.trim();
    if (!t || has(t)) return;
    onChange([...value, t]);
  };
  const remove = (t: string) => onChange(value.filter((v) => v !== t));
  const openSuggestions = suggestions.filter((s) => !has(s));

  return (
    <div>
      <div className="mt-1 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 transition-colors focus-within:border-primary">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 rounded-lg border border-secondary/40 bg-secondary/15 px-2.5 py-1 text-xs font-semibold text-secondary"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="cursor-pointer text-secondary/60 transition-colors hover:text-secondary"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
              setDraft("");
            } else if (e.key === "Backspace" && !draft && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          onBlur={() => {
            if (draft.trim()) {
              add(draft);
              setDraft("");
            }
          }}
          placeholder={value.length ? "" : placeholder}
          className="min-w-[10ch] flex-1 border-0 bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      {openSuggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {openSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="cursor-pointer rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition-all duration-150 hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Self-contained "Sync my stats" control for the creator profile — pulls fresh
// platform metrics from the connected accounts (same endpoint as the dashboard).
function ProfileSyncButton() {
  const token = useUserStore((s) => s.token);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const run = async () => {
    if (!token) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await apiSyncMyPlatforms(token);
      setResult(
        r.total === 0
          ? "No connected accounts"
          : `Synced ${r.synced} of ${r.total} account${r.total === 1 ? "" : "s"}`,
      );
    } catch (err: any) {
      setResult(err?.message ?? "Sync failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={run}
        disabled={loading || !token}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        Sync my stats
      </button>
      {result && <span className="text-xs text-muted-foreground">{result}</span>}
    </div>
  );
}

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

  // Journal-underline field (Stitch brand-profile): bottom border only, ink-on-paper.
  const journalCls =
    "w-full border-0 border-b border-border bg-transparent px-0 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-0";
  const labelCls = "mb-1 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground";
  const isAgency = role === "agency";
  const stampCls = isAgency ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground";
  const stampLabel = isAgency ? "Agency" : "Brand";
  const entityWord = isAgency ? "agency" : "company";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section key={role} className="space-y-10">
      {/* Page heading */}
      <div className="space-y-2">
        <h1 className="font-serif text-3xl font-bold text-foreground">{heading}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{subline}</p>
      </div>

      {/* Profile card — stamped identity plaque (travelogue) */}
      <section className="relative flex flex-col items-center gap-8 overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm transition-transform duration-500 md:flex-row lg:-rotate-[0.3deg] lg:hover:rotate-0">
        <span className={`absolute right-6 top-6 flex items-center gap-1 rounded-full px-4 py-1 text-[10px] font-semibold uppercase tracking-widest shadow-sm ${stampCls}`}>
          <ShieldCheck className="h-3 w-3" aria-hidden /> {stampLabel}
        </span>
        <div className="relative shrink-0">
          <AvatarTrigger
            src={displayAvatar}
            alt="Company"
            imgClassName="h-32 w-32 rounded-full border-4 border-muted object-cover"
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
        <div className="text-center md:text-left">
          <h3 className="font-serif text-2xl font-bold text-foreground">{companyName || userName}</h3>
          <p className="mt-1 font-serif italic text-muted-foreground">{position || "—"}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{email}</p>
        </div>
      </section>

      {/* Account information — split header/box (Stitch 12-col) */}
      <section className="grid grid-cols-1 gap-8 md:grid-cols-12">
        <div className="space-y-2 md:col-span-4">
          <h4 className="font-serif text-xl font-semibold text-foreground">Account information</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Keep your {entityWord} details current so creators and contracts reference the right information.
          </p>
        </div>
        <div className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm md:col-span-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>Company name</span>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={journalCls} />
            </label>
            <label className="block">
              <span className={labelCls}>Your name</span>
              <input value={userName} onChange={(e) => setUserName(e.target.value)} className={journalCls} />
            </label>
            <label className="block">
              <span className={labelCls}>Position</span>
              <input value={position} onChange={(e) => setPosition(e.target.value)} className={journalCls} />
            </label>
            <label className="block">
              <span className={labelCls}>Email</span>
              <input type="email" value={email} readOnly className={`${journalCls} cursor-default opacity-60`} />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelCls}>Telephone</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={journalCls} />
            </label>
          </div>
          <label className="block">
            <span className={labelCls}>Company details</span>
            <textarea
              value={companyDetail}
              onChange={(e) => setCompanyDetail(e.target.value)}
              rows={4}
              className={`${journalCls} resize-none`}
            />
          </label>
        </div>
      </section>

      {/* Website & socials — split header/box (Stitch 12-col) */}
      <section className="grid grid-cols-1 gap-8 md:grid-cols-12">
        <div className="space-y-2 md:col-span-4">
          <h4 className="font-serif text-xl font-semibold text-foreground">Website &amp; socials</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Add your site and social profiles so creators know exactly who they are working with.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm md:col-span-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={labelCls}>Company website</span>
              <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://" className={journalCls} />
            </label>
            <label className="block">
              <span className={labelCls}>Instagram</span>
              <input type="url" value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} placeholder="https://www.instagram.com/…" className={journalCls} />
            </label>
            <label className="block">
              <span className={labelCls}>Facebook</span>
              <input type="url" value={socialFacebook} onChange={(e) => setSocialFacebook(e.target.value)} placeholder="https://www.facebook.com/…" className={journalCls} />
            </label>
            <label className="block">
              <span className={labelCls}>LinkedIn</span>
              <input type="url" value={socialLinkedIn} onChange={(e) => setSocialLinkedIn(e.target.value)} placeholder="https://www.linkedin.com/company/…" className={journalCls} />
            </label>
            <label className="block">
              <span className={labelCls}>TikTok</span>
              <input type="url" value={socialTikTok} onChange={(e) => setSocialTikTok(e.target.value)} placeholder="https://www.tiktok.com/@…" className={journalCls} />
            </label>
          </div>
        </div>
      </section>

      {/* Save action */}
      <div className="flex items-center gap-3 border-t border-border pt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-md transition hover:brightness-110 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Save changes
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="h-4 w-4" /> Saved
          </span>
        )}
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
          // Settings — visibility enum ↔ privacy label; notification prefs.
          if (typeof p.visibility === "string") {
            updates.privacy = p.visibility.charAt(0) + p.visibility.slice(1).toLowerCase();
          }
          if (typeof p.messageAlerts === "boolean" || typeof p.campaignAlerts === "boolean") {
            updates.notificationSettings = {
              messageAlerts: p.messageAlerts ?? kit.notificationSettings.messageAlerts,
              campaignAlerts: p.campaignAlerts ?? kit.notificationSettings.campaignAlerts,
            };
          }
          // Self-reported media-kit audience (headline numbers + audience breakdown).
          const mk = p.mediaKitAudience as Record<string, any> | null | undefined;
          if (mk && typeof mk === "object") {
            if (typeof mk.totalFollowers === "number") updates.totalFollowers = mk.totalFollowers;
            if (typeof mk.averageViews === "number") updates.averageViews = mk.averageViews;
            if (typeof mk.engagementRate === "number") updates.engagementRate = mk.engagementRate;
            if (typeof mk.growthRate === "number") updates.growthRate = mk.growthRate;
            updates.audience = {
              gender: mk.gender ?? kit.audience.gender,
              age: mk.age ?? kit.audience.age,
              topCountries: Array.isArray(mk.topCountries) ? mk.topCountries : kit.audience.topCountries,
              topCities: Array.isArray(mk.topCities) ? mk.topCities : kit.audience.topCities,
            };
          }
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
          // Settings → backend: privacy label maps to the ProfileVisibility enum.
          visibility:
            kit.privacy === "Private" ? "PRIVATE" : kit.privacy === "Unlisted" ? "UNLISTED" : "PUBLIC",
          messageAlerts: kit.notificationSettings.messageAlerts,
          campaignAlerts: kit.notificationSettings.campaignAlerts,
          // Self-reported audience — display fallback; synced platform data wins.
          mediaKitAudience: {
            totalFollowers: kit.totalFollowers,
            averageViews: kit.averageViews,
            engagementRate: kit.engagementRate,
            growthRate: kit.growthRate,
            gender: kit.audience.gender || undefined,
            age: kit.audience.age || undefined,
            topCountries: kit.audience.topCountries,
            topCities: kit.audience.topCities,
          },
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

  // Compact number formatter for the journal-style stat cards (1.2M, 24.5K).
  const fmtCompact = (n: number) => {
    if (!n || n <= 0) return "—";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
    return String(n);
  };

  return (
    <section className="space-y-10">
      {/* Editorial hero — postcard profile + journal stats (travelogue) */}
      <div className="grid grid-cols-12 items-start gap-6">
        {/* Postcard */}
        <div className="relative col-span-12 rounded-xl border border-border bg-card p-8 shadow-sm transition-transform duration-500 lg:col-span-7 lg:-rotate-[0.4deg] lg:hover:rotate-0">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
            <AvatarTrigger
              src={displayInfluencerAvatar}
              alt={`${kit.displayName} profile`}
              imgClassName="h-36 w-36 shrink-0 border-4 border-muted object-cover"
              onClick={() => setShowAvatarPicker(true)}
            />
            <div className="flex-1 space-y-3 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                <h1 className="font-serif text-4xl font-bold text-foreground">{kit.displayName || "Your name"}</h1>
                <span className="rounded bg-primary px-4 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary-foreground">Creator</span>
              </div>
              <p className="font-serif text-lg italic text-muted-foreground">{kit.handle || "@handle"}</p>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-foreground md:mx-0">
                {kit.bio || "Add a short bio so brands understand your positioning."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 md:justify-start">
                <input ref={uploadRef} type="file" accept=".txt,text/plain,.pdf,application/pdf,.json,application/json" className="hidden" onChange={onUploadFiles} />
                <button
                  type="button"
                  onClick={() => uploadRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-foreground transition hover:border-primary hover:text-primary"
                >
                  <Upload className="h-4 w-4" aria-hidden /> Import kit
                </button>
                <button
                  type="button"
                  onClick={downloadMediaKitTemplate}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-foreground transition hover:border-primary hover:text-primary"
                >
                  <Download className="h-4 w-4" aria-hidden /> Template
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Journal-style stats + completeness */}
        <div className="col-span-12 grid grid-cols-2 gap-4 lg:col-span-5">
          <div className="space-y-1.5 border-b-2 border-primary bg-muted p-5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Total reach</span>
            <div className="font-serif text-3xl font-bold text-primary">{fmtCompact(kit.totalFollowers)}</div>
          </div>
          <div className="space-y-1.5 border-b-2 border-primary bg-muted p-5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Engagement</span>
            <div className="font-serif text-3xl font-bold text-primary">{kit.engagementRate ? `${kit.engagementRate}%` : "—"}</div>
          </div>
          <div className="col-span-2 space-y-1.5 border-b-2 border-primary bg-muted p-5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Avg. views</span>
            <div className="font-serif text-3xl font-bold text-primary">{fmtCompact(kit.averageViews)}</div>
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
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Profile completeness</span>
                <span className="text-sm font-bold text-foreground">{completenessScore}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                <div className="h-2 rounded-full bg-primary transition-all duration-500" style={{ width: `${completenessScore}%` }} />
              </div>
            </div>
          </article>

          <article className="rounded-2xl bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground font-serif">Connected platform stats</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Live data from your linked accounts. Connect platforms above to populate.</p>
              </div>
              <ProfileSyncButton />
            </div>
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

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground font-serif">Niches &amp; deliverables</h2>
          <div className="mt-3 block text-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Categories — pick or add your own</span>
            <TagField
              value={kit.categories}
              onChange={(next) => setKit({ categories: next })}
              suggestions={NICHE_SUGGESTIONS}
              placeholder="Add a niche (e.g. Skincare) and press Enter…"
            />
          </div>
          <div className="mt-3 block text-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Services you offer</span>
            <TagField
              value={kit.services}
              onChange={(next) => setKit({ services: next })}
              placeholder="Add a service (e.g. UGC video) and press Enter…"
            />
          </div>
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
                    href={rateCardUrl.startsWith("http")
                      ? rateCardUrl
                      : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${rateCardUrl}`}
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
            <select
              value={kit.availability}
              onChange={(e) => setKit({ availability: e.target.value })}
              className="mt-1 w-full cursor-pointer rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            >
              <option value="">Select status…</option>
              {AVAILABILITY_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
              {kit.availability && !AVAILABILITY_OPTIONS.includes(kit.availability) && (
                <option value={kit.availability}>{kit.availability}</option>
              )}
            </select>
          </label>
          <p className="mt-2 text-xs text-muted-foreground">Saved to your profile — brands and agencies see this when they view you.</p>
        </article>

        <article className="rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground font-serif">Settings</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Saved to your account. Alerts control the notifications you receive; privacy controls whether you appear in Discover.</p>
          {[
            { label: "Message alerts", key: "messageAlerts" as const },
            { label: "Campaign alerts", key: "campaignAlerts" as const },
          ].map(({ label, key }) => (
            <label key={key} className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
              <input
                type="checkbox"
                checked={kit.notificationSettings[key]}
                onChange={(e) => setKit({ notificationSettings: { ...kit.notificationSettings, [key]: e.target.checked } })}
                className="h-4 w-4 cursor-pointer accent-primary"
              />
              {label}
            </label>
          ))}
          <label className="mt-4 block text-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Profile privacy</span>
            <select
              value={kit.privacy}
              onChange={(e) => setKit({ privacy: e.target.value })}
              className="mt-1 w-full cursor-pointer rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            >
              {["Public", "Unlisted", "Private"].map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
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
