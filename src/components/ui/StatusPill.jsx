const map = {
  emerald: ["bg-emerald-50 text-emerald-600", "bg-emerald-500"],
  amber: ["bg-amber-50 text-amber-600", "bg-amber-500"],
  rose: ["bg-rose-50 text-rose-600", "bg-rose-500"],
  slate: ["bg-slate-50 text-slate-600", "bg-slate-400"],
  indigo: ["bg-brand-50 text-brand-600", "bg-brand-500"],
  sky: ["bg-sky-50 text-sky-600", "bg-sky-500"],
  violet: ["bg-brand-50 text-brand-600", "bg-brand-500"],
  brand: ["bg-brand-50 text-brand-600", "bg-brand-500"],
  or: ["bg-or-100 text-or-700", "bg-or-500"],
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
