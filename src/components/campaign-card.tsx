import { Campaign } from "@/lib/types";

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  return (
    <article className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground font-serif">{campaign.title}</h3>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold capitalize text-foreground">
          {campaign.status}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{campaign.objective}</p>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Budget</span>
        <span className="font-semibold text-foreground">${campaign.budget.toLocaleString()}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Applicants</span>
        <span className="font-semibold text-foreground">{campaign.applicants}</span>
      </div>
    </article>
  );
}
