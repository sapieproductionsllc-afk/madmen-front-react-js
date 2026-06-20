import Icon from "../ui/Icon.jsx";
import useCountUp from "../../hooks/useCountUp.js";

// Pastille d'icône colorée selon le thème de la carte
const chips = {
  indigo: "bg-brand-50 text-brand-600",
  emerald: "bg-emerald-50 text-emerald-700",
  violet: "bg-brand-50 text-brand-600",
  rose: "bg-rose-50 text-rose-700",
  amber: "bg-amber-50 text-amber-700",
  sky: "bg-sky-50 text-sky-700",
};

function formatNombre(n, decimals) {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function StatCard({ icon, label, count, decimals = 0, suffix = "", sub, trend, color = "indigo" }) {
  const anime = useCountUp(count, { duration: 1300 });

  return (
    <div className="card card-hover p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <span
          className={`w-11 h-11 rounded-xl flex items-center justify-center ring-1 ring-inset ring-black/5 ${
            chips[color] ?? chips.indigo
          }`}
        >
          <Icon name={icon} className="text-[22px]" />
        </span>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 pl-1.5 pr-2 py-1 rounded-full text-xs font-semibold tabular-nums ${
              trend.dir === "up" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            }`}
          >
            <Icon name={trend.dir === "up" ? "arrow_upward" : "arrow_downward"} className="text-[14px]" />
            {trend.value}
          </span>
        )}
      </div>

      <p className="text-[2rem] md:text-[2.25rem] font-semibold tracking-tight tabular-nums text-ink leading-none">
        {formatNombre(anime, decimals)}
        {suffix && <span className="text-2xl text-faint font-medium">{suffix}</span>}
      </p>
      <p className="mt-2.5 text-sm font-semibold text-texte">{label}</p>
      {sub && <p className="text-xs text-subtle mt-1">{sub}</p>}
    </div>
  );
}
