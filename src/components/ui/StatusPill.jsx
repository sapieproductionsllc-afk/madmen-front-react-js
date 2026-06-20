const map = {
  emerald: ["bg-emerald-400/10 text-emerald-400", "bg-emerald-500"],
  amber: ["bg-amber-400/10 text-amber-400", "bg-amber-500"],
  rose: ["bg-rose-400/10 text-rose-400", "bg-rose-500"],
  slate: ["bg-slate-400/10 text-slate-400", "bg-slate-400"],
  indigo: ["bg-brand-500/10 text-brand-400", "bg-brand-500"],
  sky: ["bg-sky-400/10 text-sky-400", "bg-sky-500"],
  violet: ["bg-violet-400/10 text-violet-400", "bg-violet-500"],
};

export default function StatusPill({ label, tone = "slate", dot = true }) {
  const [cls, dotCls] = map[tone] ?? map.slate;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium tabular-nums ${cls}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />}
      {label}
    </span>
  );
}
