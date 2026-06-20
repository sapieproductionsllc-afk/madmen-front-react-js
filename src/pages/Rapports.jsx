import { useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import StatTile from "../components/ui/StatTile.jsx";
import Tabs from "../components/ui/Tabs.jsx";
import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";
import Icon from "../components/ui/Icon.jsx";
import AreaChart from "../components/ui/AreaChart.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { agences } from "../data/mockData.js";
import { pointages, classement, rapports } from "../data/datasets.js";

const formats = [
  { id: "pdf", label: "PDF", icon: "picture_as_pdf" },
  { id: "excel", label: "Excel", icon: "table_view" },
  { id: "csv", label: "CSV", icon: "description" },
];

const pct1 = (n) => `${n.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

// Composition du jour : RÉELLE (depuis la source unique)
const compoJour = {
  Présents: pointages.filter((p) => p.status === "Présent").length,
  Retards: pointages.filter((p) => p.status === "Retard").length,
  Absents: pointages.filter((p) => p.status === "Absent").length,
  Congés: pointages.filter((p) => p.status === "Congé").length,
};

// Données par période (le sélecteur les fait varier réellement)
const PERIODES = {
  jour: { range: "Aujourd'hui", compo: compoJour, retenues: "122 €", retards: compoJour.Retards, prodTrend: "+2,1 %", serie: [86, 88, 85, 89, 91, 88, 92, 90, 93, 91], xLabels: ["08h", "10h", "12h", "14h", "16h", "18h"] },
  semaine: { range: "Cette semaine", compo: { Présents: 48, Retards: 6, Absents: 4, Congés: 2 }, retenues: "480 €", retards: 6, prodTrend: "+3,4 %", serie: [84, 85, 86, 88, 87, 90, 89], xLabels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] },
  mois: { range: "Juin 2026", compo: { Présents: 210, Retards: 28, Absents: 16, Congés: 10 }, retenues: "740 €", retards: 28, prodTrend: "+3,1 %", serie: [86, 87, 88, 89, 88, 90, 89, 91, 90, 92, 91, 93], xLabels: ["S1", "S2", "S3", "S4"] },
  trimestre: { range: "T2 2026", compo: { Présents: 640, Retards: 75, Absents: 47, Congés: 30 }, retenues: "2 180 €", retards: 75, prodTrend: "+4,2 %", serie: [83, 84, 86, 85, 88, 89, 90, 88, 91, 92, 91, 93], xLabels: ["Avr", "Mai", "Juin"] },
};

const couleursCompo = { Présents: "bg-emerald-500", Retards: "bg-amber-500", Absents: "bg-rose-500", Congés: "bg-slate-400" };

function Barre({ label, value, max, suffix = "", color = "bg-brand-500", sub }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-texte">{label}</span>
        <span className="font-medium text-ink tabular-nums">
          {value}
          {suffix} {sub && <span className="text-subtle font-normal">· {sub}</span>}
        </span>
      </div>
      <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Rapports() {
  const { toast } = useUI();
  const [exportCible, setExportCible] = useState(null);
  const [periode, setPeriode] = useState("mois");

  const d = PERIODES[periode];
  const compoEntries = Object.entries(d.compo);
  const totalCompo = compoEntries.reduce((s, [, v]) => s + v, 0);
  const tauxPresence = ((d.compo.Présents + d.compo.Retards) / totalCompo) * 100;
  const absenteisme = (d.compo.Absents / totalCompo) * 100;
  const serieMax = Math.max(...d.serie);
  const serieMin = Math.min(...d.serie);
  const serieMid = Math.round((serieMax + serieMin) / 2);
  const serieMoy = Math.round((d.serie.reduce((s, v) => s + v, 0) / d.serie.length) * 10) / 10;

  return (
    <div>
      <PageHeader title="Rapports & Analyses" subtitle={`Vue analytique de l'organisation — ${d.range}.`}>
        <Tabs
          tabs={[
            { label: "Jour", value: "jour" },
            { label: "Semaine", value: "semaine" },
            { label: "Mois", value: "mois" },
            { label: "Trimestre", value: "trimestre" },
          ]}
          active={periode}
          onChange={setPeriode}
        />
        <Button variant="secondary" icon="download" onClick={() => setExportCible({ title: `Rapport global — ${d.range}` })}>
          Exporter
        </Button>
      </PageHeader>

      {/* Indicateurs (dérivés de la composition → cohérents) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile icon="how_to_reg" label="Taux de présence" value={pct1(tauxPresence)} sub={`Présents + retards · ${d.range}`} color="emerald" />
        <StatTile icon="schedule" label="Retards (retenues)" value={d.retenues} sub={`${d.retards} retards`} color="amber" />
        <StatTile icon="trending_up" label="Productivité moyenne" value={pct1(serieMoy)} sub={`${d.prodTrend} sur la période`} color="violet" />
        <StatTile icon="person_off" label="Absentéisme" value={pct1(absenteisme)} sub={`${d.compo.Absents} absence(s)`} color="rose" />
      </div>

      {/* Courbe lisible + composition */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-ink">Évolution de la productivité</h2>
              <p className="text-xs text-subtle">{d.range}</p>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-600">
              <Icon name="arrow_upward" className="text-[14px]" />
              {d.prodTrend}
            </span>
          </div>

          <div className="flex gap-3">
            {/* Axe des valeurs */}
            <div className="flex flex-col justify-between text-[10px] text-subtle h-[150px] py-1 shrink-0 tabular-nums">
              <span>{serieMax} %</span>
              <span>{serieMid} %</span>
              <span>{serieMin} %</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="relative">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="border-t border-border" />
                  <div className="border-t border-border" />
                  <div className="border-t border-border" />
                </div>
                <AreaChart data={d.serie} height={150} color="#1a535c" id={`rapport-${periode}`} dots />
              </div>
              <div className="flex justify-between text-[10px] text-subtle mt-2">
                {d.xLabels.map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-semibold text-ink mb-1">Répartition de la présence</h2>
          <p className="text-xs text-subtle mb-4">{d.range} · {totalCompo} pointages</p>
          <div className="space-y-4">
            {compoEntries.map(([label, value]) => (
              <Barre key={label} label={label} value={value} max={totalCompo} color={couleursCompo[label]} sub={`${Math.round((value / totalCompo) * 100)} %`} />
            ))}
          </div>
        </div>
      </div>

      {/* Comparatif agences + top employés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="apartment" className="text-brand-600 text-[20px]" />
            <h2 className="text-base font-semibold text-ink">Productivité par agence</h2>
          </div>
          <div className="space-y-4">
            {agences.map((a) => (
              <Barre key={a.id} label={a.name} value={a.productivity} max={100} suffix=" %" color="bg-brand-500" sub={`${a.employees} emp.`} />
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="emoji_events" className="text-amber-500 text-[20px]" filled />
            <h2 className="text-base font-semibold text-ink">Top employés · productivité</h2>
          </div>
          <div className="divide-y divide-border">
            {classement.slice(0, 5).map((c, i) => (
              <div key={c.name} className="flex items-center gap-3 py-2.5">
                <span className={`w-6 text-center font-semibold text-sm ${i < 3 ? "text-amber-500" : "text-subtle"}`}>{c.rank}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{c.name}</p>
                  <p className="text-xs text-subtle">{c.agence}</p>
                </div>
                <div className="w-24 hidden sm:block">
                  <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${c.productivity}%` }} />
                  </div>
                </div>
                <span className="font-mono font-semibold text-ink text-sm w-12 text-right">{c.productivity} %</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Catalogue de rapports */}
      <div className="flex items-center gap-2.5 mb-4">
        <Icon name="assessment" className="text-brand-600 text-[22px]" />
        <h2 className="text-lg font-semibold text-ink tracking-tight">Rapports à générer</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {rapports.map((r) => (
          <div key={r.title} className="card card-hover p-4 flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Icon name={r.icon} className="text-[22px]" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{r.title}</p>
              <p className="text-xs text-subtle truncate">{r.desc}</p>
            </div>
            <button onClick={() => setExportCible(r)} className="shrink-0 text-subtle hover:text-brand-600 hover:bg-brand-50 rounded-lg p-2 transition-colors" title="Exporter">
              <Icon name="download" className="text-[20px]" />
            </button>
          </div>
        ))}
      </div>

      <Modal open={!!exportCible} onClose={() => setExportCible(null)} title="Exporter le rapport" subtitle={exportCible?.title} icon="download">
        <p className="text-sm text-texte mb-4">Choisissez le format d'export :</p>
        <div className="grid grid-cols-3 gap-3">
          {formats.map((f) => (
            <button
              key={f.id}
              onClick={() => { toast(`${exportCible.title} exporté en ${f.label}`); setExportCible(null); }}
              className="card card-hover p-4 flex flex-col items-center gap-2 text-texte hover:text-brand-600"
            >
              <Icon name={f.icon} className="text-[28px]" />
              <span className="text-sm font-medium">{f.label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
