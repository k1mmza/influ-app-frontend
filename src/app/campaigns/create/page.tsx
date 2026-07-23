/*
 * ─────────────────────────────────────────────────────────────────────────────
 * Create Campaign — travelogue redesign (Stitch: "Create Campaign | Inflique")
 * ─────────────────────────────────────────────────────────────────────────────
 * Colours/fonts are inherited from the `.app-tv` scope on the authed <main>:
 * persimmon primary, porcelain background, Playfair (font-serif) headings, Fira
 * Sans body (the scope's base font — plain text needs no font class).
 *
 * Layout — a numbered "brief" the brand writes in three chapters. Each section
 * is a persimmon step stamp (01/02/03) beside a hairline rule and a paper card.
 * Fields are journal underlines that ink to persimmon on focus; objective and
 * visibility are rounded-full pill toggles. All form state and handlers are
 * unchanged from the previous version — this is a restyle only.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Check,
  Loader2,
  Plus,
  Search,
  Stamp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  apiCreateCampaign,
  apiUpdateCampaign,
  apiGetClientBrands,
  apiCreateManagedBrand,
  CampaignVisibility,
  ClientBrandResponse,
} from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ── Constants ────────────────────────────────────────────────────────────── */

const objectives = ["Awareness", "Engagement", "Conversion", "UGC / content production"];

const PLATFORM_OPTIONS = ["TikTok", "Instagram", "YouTube", "Facebook"];
const CONTENT_TYPE_OPTIONS = ["Video", "Story", "Reel", "Post", "Live", "Short"];

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function numberOrUndefined(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value.trim() !== "" ? parsed : undefined;
}

function listOrUndefined(value: string) {
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

/**
 * Pill-based multi-select for predefined option sets.
 * State remains a comma-separated string — no API changes.
 */
function TagInput({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (val: string) => void;
}) {
  const selected = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt).join(", "));
    } else {
      onChange([...selected, opt].join(", "));
    }
  };

  return (
    <div className="mt-2 flex min-h-[40px] flex-wrap items-center gap-2">
      {/* Selected — olive "packed" luggage tags */}
      {selected.map((tag) => (
        <span
          key={tag}
          className="inline-flex cursor-default items-center gap-1.5 rounded-lg border border-secondary/40 bg-secondary/15 px-3 py-1 text-xs font-semibold text-secondary"
        >
          {tag}
          <button
            type="button"
            onClick={() => toggle(tag)}
            className="cursor-pointer text-secondary/60 transition-colors duration-100 hover:text-secondary"
            aria-label={`Remove ${tag}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {/* Available — hollow tags to add */}
      {options
        .filter((opt) => !selected.includes(opt))
        .map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={cn(
              "cursor-pointer rounded-lg border border-border px-3 py-1 text-xs text-muted-foreground",
              "transition-all duration-150 hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
            )}
          >
            + {opt}
          </button>
        ))}
    </div>
  );
}

/** Date input with a calendar icon overlay. */
function DateInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-2 border-b border-border py-2.5 transition-colors focus-within:border-primary">
      <input
        id={id}
        type="date"
        value={value}
        onChange={onChange}
        className={cn(
          "w-full border-0 bg-transparent p-0 text-base text-foreground outline-none",
          "focus:ring-0 [&::-webkit-calendar-picker-indicator]:opacity-0",
        )}
      />
      <Calendar className="pointer-events-none h-4 w-4 shrink-0 text-muted-foreground" />
    </div>
  );
}

/** Number input with prefix/suffix rendered inside the input (absolute overlay). */
function MetricInput({
  id,
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
  step,
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  step?: string;
}) {
  return (
    <div className="mt-2 flex items-center gap-2 border-b border-border py-2 transition-colors focus-within:border-primary">
      {prefix ? (
        <span className="select-none text-base text-muted-foreground">{prefix}</span>
      ) : null}
      <input
        id={id}
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "w-full border-0 bg-transparent p-0 text-base text-foreground outline-none",
          "placeholder:text-muted-foreground/40 focus:ring-0",
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          suffix ? "text-right" : "",
        )}
      />
      {suffix ? (
        <span className="select-none text-base text-muted-foreground">{suffix}</span>
      ) : null}
    </div>
  );
}

/** Section header — step circle + label + horizontal rule. */
function StepHeader({
  number,
  label,
  description,
  isLast = false,
}: {
  number: string;
  label: string;
  description: string;
  isLast?: boolean;
}) {
  return (
    <div className={cn("mb-3", !isLast && "")}>
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {number}
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
          {label}
        </span>
        <div className="flex-1 border-t border-dashed border-border" />
      </div>
      <p className="ml-10 mt-0.5 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

/* ── Shared style tokens ─────────────────────────────────────────────────── */

// Journal fields: uppercase Fira label over a hairline underline that inks to
// persimmon on focus — the travelogue "filled-in itinerary" look. Colors come
// from the .app-tv scope; we only override the shadcn Input box shape here.
const labelCls = "block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground";

const inputCls = cn(
  "mt-2 h-auto w-full rounded-none border-0 border-b border-border bg-transparent px-0 py-2.5 shadow-none",
  "text-base text-foreground outline-none transition-colors",
  "placeholder:text-muted-foreground/40",
  "focus:border-primary focus-visible:ring-0",
);

const textareaCls = cn(
  "mt-2 w-full resize-none rounded-lg border border-border bg-muted/30 p-4",
  "text-sm leading-relaxed text-foreground shadow-inner outline-none transition-colors",
  "placeholder:text-muted-foreground/50",
  "focus:border-primary focus:ring-1 focus:ring-primary/15",
);

/* ── Page component ──────────────────────────────────────────────────────── */

export default function CreateCampaignPage() {
  const router = useRouter();
  const { role, token } = useUserStore();

  /* ── State (unchanged) ─────────────────────────────────────────────────── */
  const [name, setName] = useState("");
  const [objective, setObjective] = useState(objectives[0]);
  const [budget, setBudget] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [keyMessage, setKeyMessage] = useState("");
  const [doAndDont, setDoAndDont] = useState("");
  const [paymentType, setPaymentType] = useState("Per post");
  const [visibility, setVisibility] = useState<CampaignVisibility>("PUBLIC");
  const [applyDeadline, setApplyDeadline] = useState("");
  const [submissionDate, setSubmissionDate] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [clientBrandId, setClientBrandId] = useState("");
  const [clientBrands, setClientBrands] = useState<ClientBrandResponse[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [brandsError, setBrandsError] = useState<string | null>(null);
  // Combobox (agency brand picker) local UI state.
  const [brandQuery, setBrandQuery] = useState("");
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [creatingBrand, setCreatingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandEmail, setNewBrandEmail] = useState("");
  const [newBrandLogo, setNewBrandLogo] = useState("");
  const [brandCreateSubmitting, setBrandCreateSubmitting] = useState(false);
  const [brandCreateError, setBrandCreateError] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState("");
  const [locations, setLocations] = useState("");
  const [categories, setCategories] = useState("");
  const [contentType, setContentType] = useState("");
  const [minFollowers, setMinFollowers] = useState("");
  const [minEngagementRate, setMinEngagementRate] = useState("");
  const [minAvgViews, setMinAvgViews] = useState("");
  const [submitting, setSubmitting] = useState<"draft" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ── Load client brands for agency picker ──────────────────────────────── */
  useEffect(() => {
    if (role !== "agency" || !token) return;
    let cancelled = false;
    setBrandsLoading(true);
    setBrandsError(null);
    apiGetClientBrands(token)
      .then((brands) => {
        if (cancelled) return;
        setClientBrands(brands);
        // Auto-select when the agency manages exactly one brand.
        if (brands.length === 1) setClientBrandId(brands[0].id);
      })
      .catch((err) => {
        if (cancelled) return;
        setBrandsError(err instanceof Error ? err.message : "Failed to load client brands");
      })
      .finally(() => {
        if (!cancelled) setBrandsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role, token]);

  /* ── Access guard ──────────────────────────────────────────────────────── */
  if (role !== "brand" && role !== "agency") {
    return (
      <section className="space-y-4">
        <h1 className="font-serif text-2xl font-bold text-foreground">Create campaign</h1>
        <p className="text-muted-foreground">Only brand and agency accounts can create campaigns.</p>
        <Link href="/campaigns" className="text-primary hover:underline">
          Back to campaigns
        </Link>
      </section>
    );
  }

  /* ── Brand combobox helpers ────────────────────────────────────────────── */
  const selectedBrand = clientBrands.find((b) => b.id === clientBrandId) ?? null;
  const filteredBrands = clientBrands.filter((b) =>
    b.brandName.toLowerCase().includes(brandQuery.trim().toLowerCase()),
  );
  const queryMatchesExisting = clientBrands.some(
    (b) => b.brandName.trim().toLowerCase() === brandQuery.trim().toLowerCase(),
  );

  const selectBrand = (brand: ClientBrandResponse) => {
    setClientBrandId(brand.id);
    setBrandMenuOpen(false);
    setBrandQuery("");
    setError(null);
  };

  const clearBrand = () => {
    setClientBrandId("");
    setBrandQuery("");
    setBrandMenuOpen(true);
  };

  const openCreateBrand = () => {
    setNewBrandName(brandQuery.trim());
    setNewBrandEmail("");
    setNewBrandLogo("");
    setBrandCreateError(null);
    setCreatingBrand(true);
    setBrandMenuOpen(false);
  };

  const handleCreateBrand = async () => {
    if (!token) return;
    if (!newBrandName.trim()) {
      setBrandCreateError("Brand name is required.");
      return;
    }
    setBrandCreateSubmitting(true);
    setBrandCreateError(null);
    try {
      // Blank email must be omitted, not sent as "" — the backend @IsEmail would reject "".
      const created = await apiCreateManagedBrand(token, {
        brandName: newBrandName.trim(),
        brandEmail: newBrandEmail.trim() || undefined,
        logoUrl: newBrandLogo.trim() || undefined,
      });
      setClientBrands((prev) => [...prev, created]);
      setClientBrandId(created.id);
      setCreatingBrand(false);
      setBrandQuery("");
      setError(null);
    } catch (err) {
      setBrandCreateError(err instanceof Error ? err.message : "Failed to create brand");
    } finally {
      setBrandCreateSubmitting(false);
    }
  };

  /* ── Submit handler (unchanged) ────────────────────────────────────────── */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>, publish: boolean) => {
    event.preventDefault();
    if (!token) {
      setError("Please log in again before creating a campaign.");
      return;
    }
    if (role === "agency" && !clientBrandId) {
      setError("Please select or create a client brand for this campaign.");
      return;
    }

    setSubmitting(publish ? "publish" : "draft");
    setError(null);

    try {
      const requirement = {
        minFollowers: numberOrUndefined(minFollowers),
        minEngagementRate: numberOrUndefined(minEngagementRate),
        minAvgViews: numberOrUndefined(minAvgViews),
        platforms: listOrUndefined(platforms),
        locations: listOrUndefined(locations),
        categories: listOrUndefined(categories),
        contentType: contentType.trim() || undefined,
      };
      const hasRequirement = Object.values(requirement).some((value) => value != null);
      const created = await apiCreateCampaign(token, {
        name: name.trim(),
        objective,
        budget: numberOrUndefined(budget),
        visibility,
        paymentType: paymentType.trim() || undefined,
        keyMessage: keyMessage.trim() || undefined,
        doAndDont: doAndDont.trim() || undefined,
        deliverables: deliverables.trim() || undefined,
        applyDeadline: applyDeadline || undefined,
        submissionDate: submissionDate || undefined,
        reviewDate: reviewDate || undefined,
        paymentDate: paymentDate || undefined,
        clientBrandId: role === "agency" ? clientBrandId.trim() || undefined : undefined,
        requirements: hasRequirement ? [requirement] : undefined,
      });

      if (publish) {
        await apiUpdateCampaign(token, created.id, { status: "ACTIVE" });
      }

      router.push(`/campaigns/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setSubmitting(null);
    }
  };

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <section className="mx-auto max-w-5xl">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="mb-10">
        <Link
          href="/campaigns"
          className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors duration-150 hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to campaigns
        </Link>

        <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Create Campaign
        </h1>
        <p className="mt-2 max-w-2xl font-serif text-lg italic text-muted-foreground">
          Set the details, timeline, and creator fit for your curated journey.
        </p>
      </div>

      <form onSubmit={(event) => handleSubmit(event, false)}>

        {/* ── STEP SPINE: numbered "stamps" mark each chapter of the brief ── */}
        <div className="space-y-12">

          {/* ────────────────────────────────────────────────────────────────
              SECTION 01 — Campaign Details
          ──────────────────────────────────────────────────────────────── */}
          <section className="relative pl-14">
            {/* Step "stamp" */}
            <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary font-serif text-sm font-bold text-primary-foreground shadow-sm">
              01
            </div>
            {/* Section label */}
            <div className="mb-5 flex items-center gap-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                Campaign Details
              </h2>
              <div className="h-px flex-1 bg-border" />
            </div>
            <p className="mb-5 text-sm italic text-muted-foreground">
              Name your campaign and define its core objective, budget, and messaging.
            </p>

              <Card className="relative overflow-hidden border border-border shadow-sm">
                {/* Decorative dashed "postage token" stamp */}
                <span className="pointer-events-none absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-border/60 text-border">
                  <Stamp className="h-5 w-5 opacity-40" />
                </span>
                <CardContent className="space-y-8 p-6 sm:p-8">

                  {/* Name */}
                  <div>
                    <Label htmlFor="name" className={labelCls}>Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className={cn(inputCls, "text-lg italic placeholder:not-italic")}
                      placeholder="e.g. Spring collection launch"
                    />
                  </div>

                  {/* Objective — button group (state unchanged) */}
                  <div>
                    <Label className={labelCls}>Objective</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {objectives.map((obj) => (
                        <button
                          key={obj}
                          type="button"
                          onClick={() => setObjective(obj)}
                          className={cn(
                            "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-5 py-2 text-[11px] font-semibold uppercase tracking-widest",
                            "transition-all duration-150",
                            objective === obj
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border text-muted-foreground hover:bg-muted hover:text-primary",
                          )}
                        >
                          {objective === obj ? <Check className="h-3.5 w-3.5" /> : null}
                          {obj}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Budget + Payment type */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="budget" className={labelCls}>Budget (THB)</Label>
                      <MetricInput
                        id="budget"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        prefix="฿"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="paymentType" className={labelCls}>Payment type</Label>
                      <Input
                        id="paymentType"
                        value={paymentType}
                        onChange={(e) => setPaymentType(e.target.value)}
                        className={inputCls}
                        placeholder="Per post, package, affiliate"
                      />
                    </div>
                  </div>

                  {/* Agency: client brand picker (searchable combobox + inline create) */}
                  {role === "agency" ? (
                    <div>
                      <Label htmlFor="brandQuery" className={labelCls}>Client brand</Label>
                      {brandsLoading ? (
                        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading client brands…
                        </p>
                      ) : brandsError ? (
                        <p className="mt-1 text-sm text-destructive">{brandsError}</p>
                      ) : selectedBrand ? (
                        // Selected state — chip with a "Change" affordance.
                        <div className="mt-1 flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
                          <span className="flex items-center gap-2 text-sm text-foreground">
                            {selectedBrand.brandName}
                            {selectedBrand.origin === "AGENCY_MANAGED" ? (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                Managed
                              </span>
                            ) : null}
                          </span>
                          <button
                            type="button"
                            onClick={clearBrand}
                            className="cursor-pointer text-xs font-medium text-primary hover:underline"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <div className="relative mt-1">
                          {/* Backdrop closes the menu on outside click. */}
                          {brandMenuOpen ? (
                            <button
                              type="button"
                              aria-hidden
                              tabIndex={-1}
                              className="fixed inset-0 z-40 cursor-default"
                              onClick={() => setBrandMenuOpen(false)}
                            />
                          ) : null}
                          <div className="relative z-50">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                              id="brandQuery"
                              value={brandQuery}
                              onChange={(e) => {
                                setBrandQuery(e.target.value);
                                setBrandMenuOpen(true);
                              }}
                              onFocus={() => setBrandMenuOpen(true)}
                              placeholder={
                                clientBrands.length === 0
                                  ? "Type a name to add your first brand…"
                                  : "Search brands or type to create…"
                              }
                              className={cn(inputCls, "mt-0 pl-9")}
                              autoComplete="off"
                            />
                            {brandMenuOpen ? (
                              <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-64 overflow-auto rounded-lg border border-border bg-card p-1 shadow-lg">
                                {filteredBrands.map((brand) => (
                                  <button
                                    key={brand.id}
                                    type="button"
                                    onClick={() => selectBrand(brand)}
                                    className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors duration-150 hover:bg-muted"
                                  >
                                    <span>{brand.brandName}</span>
                                    {brand.origin === "AGENCY_MANAGED" ? (
                                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                        Managed
                                      </span>
                                    ) : null}
                                  </button>
                                ))}
                                {filteredBrands.length === 0 ? (
                                  <p className="px-3 py-2 text-sm text-muted-foreground">
                                    {brandQuery.trim() ? "No matching brands." : "No brands yet."}
                                  </p>
                                ) : null}
                                {brandQuery.trim() && !queryMatchesExisting ? (
                                  <button
                                    type="button"
                                    onClick={openCreateBrand}
                                    className="flex w-full cursor-pointer items-center gap-2 rounded-md border-t border-border px-3 py-2 text-left text-sm font-medium text-primary transition-colors duration-150 hover:bg-muted"
                                  >
                                    <Plus className="h-4 w-4" /> Create &ldquo;{brandQuery.trim()}&rdquo;
                                  </button>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}

                      {/* Inline "create managed brand" form */}
                      {creatingBrand ? (
                        <div className="mt-3 space-y-3 rounded-lg border border-border bg-muted/40 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">New brand</span>
                            <button
                              type="button"
                              onClick={() => setCreatingBrand(false)}
                              className="cursor-pointer text-muted-foreground hover:text-foreground"
                              aria-label="Cancel new brand"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div>
                            <Label htmlFor="newBrandName" className={labelCls}>Brand name *</Label>
                            <Input
                              id="newBrandName"
                              value={newBrandName}
                              onChange={(e) => setNewBrandName(e.target.value)}
                              className={inputCls}
                              placeholder="e.g. Acme Cosmetics"
                            />
                          </div>
                          <div>
                            <Label htmlFor="newBrandEmail" className={labelCls}>Contact email (optional)</Label>
                            <Input
                              id="newBrandEmail"
                              type="email"
                              value={newBrandEmail}
                              onChange={(e) => setNewBrandEmail(e.target.value)}
                              className={inputCls}
                              placeholder="contact@brand.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="newBrandLogo" className={labelCls}>Logo URL (optional)</Label>
                            <Input
                              id="newBrandLogo"
                              value={newBrandLogo}
                              onChange={(e) => setNewBrandLogo(e.target.value)}
                              className={inputCls}
                              placeholder="https://…"
                            />
                          </div>
                          {brandCreateError ? (
                            <p className="text-sm text-destructive">{brandCreateError}</p>
                          ) : null}
                          <Button
                            type="button"
                            onClick={handleCreateBrand}
                            disabled={brandCreateSubmitting}
                            className="cursor-pointer"
                          >
                            {brandCreateSubmitting ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</>
                            ) : (
                              <><Check className="mr-2 h-4 w-4" /> Create &amp; select</>
                            )}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Visibility — toggle (state unchanged) */}
                  <div>
                    <Label className={labelCls}>Visibility</Label>
                    <div className="mt-2 inline-flex rounded-full border border-border bg-muted p-1">
                      {(["PUBLIC", "PRIVATE"] as CampaignVisibility[]).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setVisibility(v)}
                          className={cn(
                            "cursor-pointer rounded-full px-5 py-2 text-[11px] font-semibold uppercase tracking-widest transition-all duration-150",
                            visibility === v
                              ? "bg-card text-primary shadow-sm"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {v === "PUBLIC" ? "Public marketplace" : "Private invite only"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Key message */}
                  <div>
                    <Label htmlFor="keyMessage" className={labelCls}>Key message</Label>
                    <textarea
                      id="keyMessage"
                      value={keyMessage}
                      onChange={(e) => setKeyMessage(e.target.value)}
                      className={cn(textareaCls, "min-h-[120px]")}
                      placeholder="What's the core message you want creators to convey?"
                    />
                  </div>

                  {/* Deliverables */}
                  <div>
                    <Label htmlFor="deliverables" className={labelCls}>Deliverables</Label>
                    <textarea
                      id="deliverables"
                      value={deliverables}
                      onChange={(e) => setDeliverables(e.target.value)}
                      className={cn(textareaCls, "min-h-[140px]")}
                      placeholder="Posts, format, volume, usage rights"
                    />
                  </div>

                  {/* Do and don't */}
                  <div>
                    <Label htmlFor="doAndDont" className={labelCls}>Do and don&apos;t</Label>
                    <textarea
                      id="doAndDont"
                      value={doAndDont}
                      onChange={(e) => setDoAndDont(e.target.value)}
                      className={cn(textareaCls, "min-h-[120px]")}
                      placeholder="e.g. Do: show the product in context — Don't: use competitor branding"
                    />
                  </div>

                </CardContent>
              </Card>
          </section>

          {/* ────────────────────────────────────────────────────────────────
              SECTION 02 — Timeline
          ──────────────────────────────────────────────────────────────── */}
          <section className="relative pl-14">
            <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary font-serif text-sm font-bold text-primary-foreground shadow-sm">
              02
            </div>
            <div className="mb-5 flex items-center gap-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                Timeline
              </h2>
              <div className="h-px flex-1 bg-border" />
            </div>
            <p className="mb-5 text-sm italic text-muted-foreground">
              Set key milestone dates for applications, submissions, review, and payment.
            </p>

              <Card className="border border-border shadow-sm">
                <CardContent className="p-6 sm:p-8">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="applyDeadline" className={labelCls}>Apply deadline</Label>
                      <DateInput
                        id="applyDeadline"
                        value={applyDeadline}
                        onChange={(e) => setApplyDeadline(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="submissionDate" className={labelCls}>Submission date</Label>
                      <DateInput
                        id="submissionDate"
                        value={submissionDate}
                        onChange={(e) => setSubmissionDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reviewDate" className={labelCls}>Review date</Label>
                      <DateInput
                        id="reviewDate"
                        value={reviewDate}
                        onChange={(e) => setReviewDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="paymentDate" className={labelCls}>Payment date</Label>
                      <DateInput
                        id="paymentDate"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
          </section>

          {/* ────────────────────────────────────────────────────────────────
              SECTION 03 — Creator Requirements
          ──────────────────────────────────────────────────────────────── */}
          <section className="relative pl-14">
            <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary font-serif text-sm font-bold text-primary-foreground shadow-sm">
              03
            </div>
            <div className="mb-5 flex items-center gap-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                Creator Requirements
              </h2>
              <div className="h-px flex-1 bg-border" />
            </div>
            <p className="mb-5 text-sm italic text-muted-foreground">
              Define the minimum reach, platform presence, and content type for eligible creators.
            </p>

              <Card className="border border-border shadow-sm">
                <CardContent className="space-y-8 p-6 sm:p-8">

                  {/* Reach metrics */}
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Reach minimums
                    </p>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <Label htmlFor="minFollowers" className={labelCls}>Followers</Label>
                        <MetricInput
                          id="minFollowers"
                          value={minFollowers}
                          onChange={(e) => setMinFollowers(e.target.value)}
                          prefix="≥"
                          placeholder="10,000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="minEngagementRate" className={labelCls}>Engagement</Label>
                        <MetricInput
                          id="minEngagementRate"
                          value={minEngagementRate}
                          onChange={(e) => setMinEngagementRate(e.target.value)}
                          suffix="%"
                          placeholder="2.5"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="minAvgViews" className={labelCls}>Avg views</Label>
                        <MetricInput
                          id="minAvgViews"
                          value={minAvgViews}
                          onChange={(e) => setMinAvgViews(e.target.value)}
                          prefix="≥"
                          placeholder="5,000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Platforms + Content type — tag inputs */}
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Platforms &amp; content
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label className={labelCls}>Platforms</Label>
                        <TagInput
                          options={PLATFORM_OPTIONS}
                          value={platforms}
                          onChange={setPlatforms}
                        />
                      </div>
                      <div>
                        <Label className={labelCls}>Content type</Label>
                        <TagInput
                          options={CONTENT_TYPE_OPTIONS}
                          value={contentType}
                          onChange={setContentType}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Locations + Categories — free text */}
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Audience targeting
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="locations" className={labelCls}>Locations</Label>
                        <Input
                          id="locations"
                          value={locations}
                          onChange={(e) => setLocations(e.target.value)}
                          className={inputCls}
                          placeholder="Thailand, Bangkok"
                        />
                      </div>
                      <div>
                        <Label htmlFor="categories" className={labelCls}>Categories</Label>
                        <Input
                          id="categories"
                          value={categories}
                          onChange={(e) => setCategories(e.target.value)}
                          className={inputCls}
                          placeholder="Beauty, Lifestyle"
                        />
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>
          </section>

        </div>{/* end step spine */}

        {/* ── Error banner ─────────────────────────────────────────────────── */}
        {error ? (
          <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {/* ── Action buttons — centered "stamp & send" row ──────────────── */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 border-t border-border/60 pt-10 pb-24">

          {/* Primary: Publish */}
          <Button
            type="button"
            disabled={submitting != null}
            onClick={(event) =>
              handleSubmit(event as unknown as FormEvent<HTMLFormElement>, true)
            }
            className={cn(
              "h-auto cursor-pointer rounded-full bg-primary px-10 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-primary-foreground",
              "shadow-sm transition-all duration-150 hover:bg-primary/90 hover:shadow-xl active:scale-95",
              "focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {submitting === "publish" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Publish campaign
          </Button>

          {/* Secondary: Save draft */}
          <Button
            type="submit"
            disabled={submitting != null}
            variant="outline"
            className={cn(
              "h-auto cursor-pointer rounded-full border-border px-9 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground",
              "transition-all duration-150 hover:border-primary hover:bg-transparent hover:text-primary active:scale-95",
              "focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {submitting === "draft" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save draft
          </Button>

          {/* Ghost: Cancel */}
          <Button
            type="button"
            variant="ghost"
            asChild
            className="h-auto cursor-pointer px-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground underline decoration-border underline-offset-8 transition-all duration-150 hover:bg-transparent hover:text-destructive"
          >
            <Link href="/campaigns">Cancel</Link>
          </Button>

        </div>

      </form>

      {/*
        SIGNATURE ELEMENT NOTE
        ─────────────────────────────────────────────────────────────────────
        The numbered vertical step spine (01 → 02 → 03) is the page's defining
        element. A dashed line connects each section from the circle downward,
        running the full height of its card content before leading the eye to
        the next circle. The dashed (not solid) treatment is intentional: it
        signals that the form is open and in-progress, not a completed workflow.

        This works for Inflique specifically because campaign creation is a
        production workflow — brands are writing an influencer brief, not just
        filling in a database record. The spine turns the page into a structured
        document with numbered chapters (like a production schedule or creative
        brief), which is the mental model marketing managers already use. It
        gives the form hierarchy without adding tabs, modals, or multi-page
        steps — the whole form stays visible and linear, but reads as deliberate
        and constructed.
        ─────────────────────────────────────────────────────────────────────
      */}
    </section>
  );
}
