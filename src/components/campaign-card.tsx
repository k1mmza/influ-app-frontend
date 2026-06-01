import { Campaign } from "@/lib/types";

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">{campaign.title}</h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
          {campaign.status}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">{campaign.objective}</p>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-slate-500">Budget</span>
        <span className="font-semibold text-slate-900">${campaign.budget.toLocaleString()}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-sm">
        <span className="text-slate-500">Applicants</span>
        <span className="font-semibold text-slate-900">{campaign.applicants}</span>
      </div>
    </article>
  );
}
