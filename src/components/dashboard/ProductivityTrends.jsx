import Icon from "../ui/Icon.jsx";
import AreaChart from "../ui/AreaChart.jsx";
import useCountUp from "../../hooks/useCountUp.js";
import { productivity } from "../../data/mockData.js";

export default function ProductivityTrends() {
  const anime = useCountUp(productivity.value, { duration: 1400 });

  return (
    <div className="card p-5 flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="kicker mb-2">Productivité globale</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-semibold text-ink tracking-tight tabular-nums leading-none">
              {anime.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              <span className="text-2xl text-faint font-medium"> %</span>
            </span>
            <span className="mb-1 inline-flex items-center gap-0.5 pl-1.5 pr-2 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-emerald-50 text-emerald-600">
              <Icon name="arrow_upward" className="text-[14px]" />
              {productivity.weeklyGrowth} %
            </span>
          </div>
        </div>
        <button
          aria-label="Plus d'options"
          className="text-faint hover:text-muted transition-colors -mr-1 -mt-0.5"
        >
          <Icon name="more_horiz" />
        </button>
      </div>

      {/* Courbe lissée sur 12 jours */}
      <AreaChart data={productivity.series} height={128} id="prod" color="#1f4a3a" />

      <div className="grid grid-cols-2 gap-3 mt-5">
        <div className="rounded-xl bg-surface-2 border border-border p-3.5">
          <p className="kicker mb-1.5">Efficacité max</p>
          <p className="font-mono text-base font-semibold text-texte tabular-nums">{productivity.peakEfficiency}</p>
        </div>
        <div className="rounded-xl bg-surface-2 border border-border p-3.5">
          <p className="kicker mb-1.5">Sur 12 jours</p>
          <p className="font-mono text-base font-semibold text-emerald-600 tabular-nums">{productivity.weeklyGrowth} %</p>
        </div>
      </div>
    </div>
  );
}
