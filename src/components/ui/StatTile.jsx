import Icon from "./Icon.jsx";

const chips = {
  indigo: "bg-brand-500/15 text-brand-400",
  emerald: "bg-emerald-500/15 text-emerald-400",
  violet: "bg-violet-500/15 text-violet-400",
  rose: "bg-rose-500/15 text-rose-400",
  amber: "bg-amber-500/15 text-amber-400",
  sky: "bg-sky-500/15 text-sky-400",
  slate: "bg-slate-500/15 text-slate-400",
};

// Petite tuile de statistique (haut de page).
export default function StatTile({ icon, label, value, sub, color = "indigo" }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${chips[color] ?? chips.indigo}`}>
          <Icon name={icon} className="text-[22px]" />
        </span>
        <div className="min-w-0">
          <p className="kicker">{label}</p>
          <p className="text-2xl font-semibold text-ink tabular-nums tracking-tight leading-tight mt-0.5">{value}</p>
        </div>
      </div>
      {sub && <p className="text-xs text-subtle mt-3">{sub}</p>}
    </div>
  );
}
