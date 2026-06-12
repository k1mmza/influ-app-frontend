"use client";

import { Download, Heart, Upload, Loader2, CheckCircle2, Link2, FileText, Trash2, ExternalLink, Youtube, Unlink } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Role } from "@/lib/types";
import {
  buildMediaKitExportPayload,
  parseMediaKitImportFile,
  useMediaKitStore,
} from "@/store/useMediaKitStore";
import { useReviewStore } from "@/store/useReviewStore";
import { useUserStore } from "@/store/useUserStore";
import { apiGetProfile, apiUpdateProfile, apiUploadRateCard, apiDeleteRateCard, apiConnectPlatform, apiDisconnectPlatform } from "@/lib/api";

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

// ─── Brand / Agency profile ───────────────────────────────────────────────────

function BrandProfileView() {
  const { role, token, name: storeUserName, email: storeEmail, setRole } = useUserStore();
  const profileRole: Role = role === "agency" ? "agency" : "brand";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  const avatarUrl = `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(companyName || userName)}`;
  const heading = role === "agency" ? "Agency profile" : "Brand profile";
  const subline =
    role === "agency"
      ? "Agency and account details; add your site and socials so creators know who they are working with."
      : "Company and account details; add your site and socials for creator trust.";

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
            <ProfileRatingAvatar
              src={avatarUrl}
              alt="Company"
              imgClassName="h-24 w-24 rounded-2xl border border-border object-cover"
              role={profileRole}
            />
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
  const applyImport = useMediaKitStore((s) => s.applyImport);
  const setUploadedPdfFileName = useMediaKitStore((s) => s.setUploadedPdfFileName);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [profileUrl, setProfileUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [rateCardUrl, setRateCardUrl] = useState<string | null>(null);
  const [rateCardUploading, setRateCardUploading] = useState(false);
  const [rateCardError, setRateCardError] = useState<string | null>(null);
  const rateCardInputRef = useRef<HTMLInputElement>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<string>>(new Set());
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [disconnectingPlatform, setDisconnectingPlatform] = useState<string | null>(null);
  const [platformMessage, setPlatformMessage] = useState<{ text: string; error: boolean } | null>(null);

  // Handle OAuth return params (read from URL on mount)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("platform_connect");
    const platform = params.get("platform") ?? "";
    if (status === "success") {
      setConnectedPlatforms((prev) => new Set([...prev, platform]));
      setPlatformMessage({ text: `${platform.charAt(0).toUpperCase() + platform.slice(1)} account connected.`, error: false });
    } else if (status === "error") {
      const reason = params.get("reason") ?? "unknown";
      setPlatformMessage({ text: `${platform} connection failed: ${reason}`, error: true });
    }
  }, []);

  // Load real profile data into the media kit store once
  useEffect(() => {
    if (!token || profileLoaded) return;
    apiGetProfile(token)
      .then((data) => {
        const updates: Partial<typeof kit> = {};
        if (data.name) updates.displayName = data.name;
        if (storeEmail) updates.email = storeEmail;
        const p = data.profile;
        if (p) {
          if (p.bio) updates.bio = p.bio;
          if (Array.isArray(p.categories) && p.categories.length > 0) updates.categories = p.categories;
          if (p.availabilityStatus) updates.availability = p.availabilityStatus;
          if (Array.isArray(data.platforms)) {
            const linked = data.platforms
              .filter((pl: any) => pl.hasTokens)
              .map((pl: any) => pl.platform as string);
            if (linked.length) setConnectedPlatforms(new Set(linked));
          }
        }
        if (p?.rateCardFileUrl) setRateCardUrl(p.rateCardFileUrl);
        if (Object.keys(updates).length > 0) setKit(updates as any);
        setProfileLoaded(true);
      })
      .catch(console.error);
  }, [token]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setSaved(false);
    try {
      await apiUpdateProfile(token, {
        name: kit.displayName,
        bio: kit.bio,
        categories: kit.categories,
        availabilityStatus: kit.availability,
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

  const avatarUrl = `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(kit.displayName)}`;

  const parseListInput = (s: string) =>
    s.split(/[,，\n]/g).map((x) => x.trim()).filter(Boolean);

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
        setImportMessage("Media kit JSON imported.");
      } else {
        setImportMessage("Could not read that file as media kit JSON.");
      }
    };
    reader.readAsText(file);
  };

  const inputCls = "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary/70 focus:ring-2 focus:ring-primary/10";

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">Media kit</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit the fields brands see in discovery. Name, bio, categories and availability sync to the backend.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input ref={uploadRef} type="file" accept=".json,application/json,application/pdf,.pdf" className="hidden" onChange={onUploadFiles} />
          <button
            type="button"
            onClick={() => uploadRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
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

      {/* Social URL import — future feature */}
      <div className="rounded-2xl border border-dashed border-border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Link2 className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Import from social profile URL</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Coming soon
            </span>
          </div>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Paste an Instagram, TikTok, or YouTube profile link and we'll automatically pull your follower count, engagement rate, and bio.
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={profileUrl}
            onChange={(e) => setProfileUrl(e.target.value)}
            placeholder="https://www.instagram.com/yourhandle"
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary/70 focus:ring-2 focus:ring-primary/10"
          />
          <button
            type="button"
            disabled
            title="Coming soon"
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground opacity-60"
          >
            Pull Data
          </button>
        </div>
      </div>

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
              description: "Followers, avg views, and engagement rate via TikTok Login Kit",
            },
          ] as const).map(({ key, label, icon, bg, connectBg, description }) => {
            const isConnected = connectedPlatforms.has(key);
            const isConnecting = connectingPlatform === key;
            const isDisconnecting = disconnectingPlatform === key;

            return (
              <div key={key} className="flex items-start gap-3 rounded-xl border border-border p-4">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{label}</span>
                    {isConnected && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{description}</p>
                  <div className="mt-2">
                    {isConnected ? (
                      <button
                        type="button"
                        disabled={isDisconnecting}
                        onClick={async () => {
                          if (!token) return;
                          setDisconnectingPlatform(key);
                          setPlatformMessage(null);
                          try {
                            await apiDisconnectPlatform(token, key);
                            setConnectedPlatforms((prev) => { const n = new Set(prev); n.delete(key); return n; });
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
            <ProfileRatingAvatar
              src={avatarUrl}
              alt={`${kit.displayName} profile`}
              imgClassName="h-14 w-14 rounded-full border border-border object-cover"
              role="influencer"
            />
            <div>
              <h2 className="text-lg font-semibold text-foreground font-serif">{kit.displayName}</h2>
              <p className="text-sm text-muted-foreground">{kit.handle}</p>
            </div>
          </div>
          <label className="mt-4 block text-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Display name</span>
            <input value={kit.displayName} onChange={(e) => setKit({ displayName: e.target.value })} className={inputCls} />
          </label>
          <label className="mt-3 block text-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Handle</span>
            <input value={kit.handle} onChange={(e) => setKit({ handle: e.target.value })} placeholder="@your.handle" className={inputCls} />
          </label>
          <label className="mt-3 block text-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bio / positioning</span>
            <textarea value={kit.bio} onChange={(e) => setKit({ bio: e.target.value })} rows={4} className={inputCls} />
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
            <label className="block text-sm">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Profile completeness %</span>
              <input
                type="number" min={0} max={100}
                value={kit.profileCompleteness}
                onChange={(e) => setKit({ profileCompleteness: Number(e.target.value) })}
                className={inputCls}
              />
            </label>
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
            <h2 className="text-lg font-semibold text-foreground font-serif">Platforms &amp; handles</h2>
            <div className="mt-3 space-y-3">
              {kit.socialAccounts.map((account, index) => (
                <div key={`${account.platform}-${index}`} className="rounded-xl border border-border p-3 text-sm">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      { label: "Platform", field: "platform" as const, type: "text" },
                      { label: "Handle", field: "username" as const, type: "text" },
                      { label: "Followers", field: "followers" as const, type: "number" },
                      { label: "Avg views", field: "avgViews" as const, type: "number" },
                    ].map(({ label, field, type }) => (
                      <label key={field} className="block">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <input
                          type={type}
                          value={account[field] as any}
                          onChange={(e) => setSocialRow(index, { [field]: type === "number" ? Number(e.target.value) : e.target.value })}
                          className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none"
                        />
                      </label>
                    ))}
                    <label className="block sm:col-span-2">
                      <span className="text-xs text-muted-foreground">Engagement rate %</span>
                      <input
                        type="number" min={0} step={0.1}
                        value={account.engagementRate}
                        onChange={(e) => setSocialRow(index, { engagementRate: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none"
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

// ─── Page entry ───────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { role } = useUserStore();
  if (role === "brand" || role === "agency") return <BrandProfileView />;
  return <InfluencerProfileView />;
}
