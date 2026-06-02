interface StatsCardProps {
  label: string;
  value: string;
  hint: string;
}

export function StatsCard({ label, value, hint }: StatsCardProps) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900 font-serif">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </article>
  );
}
