import Icon from "./Icon.jsx";

const chips = {
  indigo: "bg-brand-50 text-brand-600",
  emerald: "bg-emerald-50 text-emerald-600",
  violet: "bg-violet-50 text-violet-600",
  rose: "bg-rose-50 text-rose-600",
  amber: "bg-amber-50 text-amber-600",
  sky: "bg-sky-50 text-sky-600",
  slate: "bg-slate-100 text-slate-500",
};

// Petite tuile de statistique (haut de page).
export default function StatTile({ icon, label, value, sub, color = "indigo" }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${chips[color] ?? chips.indigo}`}>
          <Icon name={icon} className="text-[22px]" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-slate-400">{label}</p>
          <p className="text-xl font-semibold text-slate-900 tabular-nums leading-tight">{value}</p>
        </div>
      </div>
      {sub && <p className="text-xs text-slate-400 mt-2">{sub}</p>}
    </div>
  );
}
