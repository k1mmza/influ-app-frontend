interface StatsCardProps {
  label: string;
  value: string;
  hint: string;
}

export function StatsCard({ label, value, hint }: StatsCardProps) {
  return (
    <article className="rounded-2xl bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground font-serif">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </article>
  );
}
