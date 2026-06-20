import PageHeader from "../components/ui/PageHeader.jsx";
import StatTile from "../components/ui/StatTile.jsx";
import AreaChart from "../components/ui/AreaChart.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { productivity } from "../data/mockData.js";
import { classement } from "../data/datasets.js";

const medaille = ["text-amber-500", "text-subtle", "text-amber-700"];

export default function Productivite() {
  const { toast } = useUI();

  return (
    <div>
      <PageHeader title="Productivité" subtitle="Temps réellement travaillé, taux et classement des employés.">
        <Button variant="secondary" icon="download" onClick={() => toast("Rapport de productivité exporté")}>
          Exporter
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="kicker mb-1">Productivité globale — 12 jours</p>
              <p className="text-3xl font-semibold text-ink tabular-nums">
                {productivity.value.toLocaleString("fr-FR", { minimumFractionDigits: 1 })} %
              </p>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400">
              <Icon name="arrow_upward" className="text-[14px]" />
              {productivity.weeklyGrowth} %
            </span>
          </div>
          <AreaChart data={productivity.series} height={150} id="prodpage" color="#4f46e5" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          <StatTile icon="schedule" label="Temps travaillé moyen" value="6h 45m" color="indigo" />
          <StatTile icon="snooze" label="Inactivité moyenne" value="1h 15m" color="amber" />
        </div>
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-ink">Classement des employés</h2>
        </div>
        <div className="divide-y divide-border">
          {classement.map((c, i) => (
            <div key={c.name} className="flex items-center gap-4 px-5 py-3">
              <span className={`w-7 text-center font-semibold ${i < 3 ? medaille[i] : "text-subtle"}`}>
                {i < 3 ? <Icon name="emoji_events" className="text-[20px]" filled /> : c.rank}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink">{c.name}</p>
                <p className="text-xs text-subtle">{c.agence} · {c.worked}</p>
              </div>
              <div className="w-32 hidden sm:block">
                <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${c.productivity}%` }} />
                </div>
              </div>
              <span className="font-mono font-semibold text-ink w-12 text-right">{c.productivity} %</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
