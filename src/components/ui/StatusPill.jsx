const map = {
  emerald: ["bg-emerald-50 text-emerald-700", "bg-emerald-500"],
  amber: ["bg-amber-50 text-amber-700", "bg-amber-500"],
  rose: ["bg-rose-50 text-rose-700", "bg-rose-500"],
  slate: ["bg-slate-100 text-slate-600", "bg-slate-400"],
  indigo: ["bg-brand-50 text-brand-700", "bg-brand-500"],
  sky: ["bg-sky-50 text-sky-700", "bg-sky-500"],
  violet: ["bg-violet-50 text-violet-700", "bg-violet-500"],
};

export default function StatusPill({ label, tone = "slate", dot = true }) {
  const [cls, dotCls] = map[tone] ?? map.slate;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />}
      {label}
    </span>
  );
}
