"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { apiCreateCampaign, apiUpdateCampaign, CampaignVisibility } from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const objectives = ["Awareness", "Engagement", "Conversion", "UGC / content production"];

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

export default function CreateCampaignPage() {
  const router = useRouter();
  const { role, token } = useUserStore();
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
  const [platforms, setPlatforms] = useState("");
  const [locations, setLocations] = useState("");
  const [categories, setCategories] = useState("");
  const [contentType, setContentType] = useState("");
  const [minFollowers, setMinFollowers] = useState("");
  const [minEngagementRate, setMinEngagementRate] = useState("");
  const [minAvgViews, setMinAvgViews] = useState("");
  const [submitting, setSubmitting] = useState<"draft" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (role !== "brand" && role !== "agency") {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground font-serif">Create campaign</h1>
        <p className="text-muted-foreground">Only brand and agency accounts can create campaigns.</p>
        <Link href="/campaigns" className="text-primary hover:underline">
          Back to campaigns
        </Link>
      </section>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>, publish: boolean) => {
    event.preventDefault();
    if (!token) {
      setError("Please log in again before creating a campaign.");
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

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/campaigns" className="text-sm font-medium text-primary hover:underline">
          Back to campaigns
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground font-serif">Create campaign</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Save as draft for internal setup, or publish to make eligible public campaigns visible to influencers.
        </p>
      </div>

      <form className="space-y-6" onSubmit={(event) => handleSubmit(event, false)}>
        <Card className="border-none shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 rounded-xl"
                placeholder="e.g. Spring collection launch"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="objective">Objective</Label>
                <select
                  id="objective"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                >
                  {objectives.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="budget">Budget (THB)</Label>
                <Input
                  id="budget"
                  type="number"
                  min={0}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>

            {role === "agency" ? (
              <div>
                <Label htmlFor="clientBrandId">Client brand ID</Label>
                <Input
                  id="clientBrandId"
                  value={clientBrandId}
                  onChange={(e) => setClientBrandId(e.target.value)}
                  required
                  className="mt-1 rounded-xl"
                  placeholder="Required for agency campaign creation"
                />
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <select
                  id="visibility"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as CampaignVisibility)}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                >
                  <option value="PUBLIC">Public marketplace</option>
                  <option value="PRIVATE">Private invite only</option>
                </select>
              </div>
              <div>
                <Label htmlFor="paymentType">Payment type</Label>
                <Input
                  id="paymentType"
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="mt-1 rounded-xl"
                  placeholder="Per post, package, affiliate"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="keyMessage">Key message</Label>
              <textarea
                id="keyMessage"
                value={keyMessage}
                onChange={(e) => setKeyMessage(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
              />
            </div>

            <div>
              <Label htmlFor="deliverables">Deliverables</Label>
              <textarea
                id="deliverables"
                value={deliverables}
                onChange={(e) => setDeliverables(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                placeholder="Posts, format, volume, usage rights"
              />
            </div>

            <div>
              <Label htmlFor="doAndDont">Do and don't</Label>
              <textarea
                id="doAndDont"
                value={doAndDont}
                onChange={(e) => setDoAndDont(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-base font-semibold text-foreground font-serif">Timeline</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="applyDeadline">Apply deadline</Label>
                <Input id="applyDeadline" type="date" value={applyDeadline} onChange={(e) => setApplyDeadline(e.target.value)} className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="submissionDate">Submission date</Label>
                <Input id="submissionDate" type="date" value={submissionDate} onChange={(e) => setSubmissionDate(e.target.value)} className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="reviewDate">Review date</Label>
                <Input id="reviewDate" type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="paymentDate">Payment date</Label>
                <Input id="paymentDate" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="mt-1 rounded-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-base font-semibold text-foreground font-serif">Creator requirements</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="minFollowers">Min followers</Label>
                <Input id="minFollowers" type="number" min={0} value={minFollowers} onChange={(e) => setMinFollowers(e.target.value)} className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="minEngagementRate">Min engagement %</Label>
                <Input id="minEngagementRate" type="number" min={0} step="0.1" value={minEngagementRate} onChange={(e) => setMinEngagementRate(e.target.value)} className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="minAvgViews">Min avg views</Label>
                <Input id="minAvgViews" type="number" min={0} value={minAvgViews} onChange={(e) => setMinAvgViews(e.target.value)} className="mt-1 rounded-xl" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="platforms">Platforms</Label>
                <Input id="platforms" value={platforms} onChange={(e) => setPlatforms(e.target.value)} className="mt-1 rounded-xl" placeholder="TikTok, Instagram" />
              </div>
              <div>
                <Label htmlFor="contentType">Content type</Label>
                <Input id="contentType" value={contentType} onChange={(e) => setContentType(e.target.value)} className="mt-1 rounded-xl" placeholder="Video, Story, Reel" />
              </div>
              <div>
                <Label htmlFor="locations">Locations</Label>
                <Input id="locations" value={locations} onChange={(e) => setLocations(e.target.value)} className="mt-1 rounded-xl" placeholder="Thailand, Bangkok" />
              </div>
              <div>
                <Label htmlFor="categories">Categories</Label>
                <Input id="categories" value={categories} onChange={(e) => setCategories(e.target.value)} className="mt-1 rounded-xl" placeholder="Beauty, Lifestyle" />
              </div>
            </div>
          </CardContent>
        </Card>

        {error ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={submitting != null} className="rounded-xl">
            {submitting === "draft" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save draft
          </Button>
          <Button
            type="button"
            disabled={submitting != null}
            className="rounded-xl"
            onClick={(event) => handleSubmit(event as unknown as FormEvent<HTMLFormElement>, true)}
          >
            {submitting === "publish" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Publish campaign
          </Button>
          <Button type="button" variant="outline" asChild className="rounded-xl">
            <Link href="/campaigns">Cancel</Link>
          </Button>
        </div>
      </form>
    </section>
  );
}
