import { useEffect, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import StatTile from "../components/ui/StatTile.jsx";
import AreaChart from "../components/ui/AreaChart.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { apiGet } from "../lib/api.js";

// Podium : or / argent / bronze réels
const medaille = ["text-brand-500", "text-slate-600", "text-amber-600"];

// Échelle sémantique de performance pour les barres de score
const barreScore = {
  emerald: "bg-emerald-500",
  brand: "bg-brand-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};
const tonScore = (p) => (p >= 90 ? "emerald" : p >= 80 ? "brand" : p >= 70 ? "amber" : "rose");

// --- MAPPING local : réponses API -> forme attendue par le JSX (champs identiques aux mocks) ---

// Minutes -> "6h 45m" (format du mock `worked` / des StatTile)
function minutesEnHM(min) {
  const m = Math.max(0, Math.round(Number(min) || 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `${h}h ${String(r).padStart(2, "0")}m`;
}

// Heures décimales (ex. 7.7) -> "7h 42m"
function heuresEnHM(heures) {
  return minutesEnHM((Number(heures) || 0) * 60);
}

// Nombre (ex. 12.4 ou -3) -> "+12,4" / "-3" (format du mock `weeklyGrowth`)
function croissance(n) {
  const v = Number(n) || 0;
  const signe = v >= 0 ? "+" : "";
  return signe + v.toLocaleString("fr-FR");
}

// GET /api/productivite/global -> { value, series, weeklyGrowth } (forme du mock `productivity`)
// + les deux StatTile (temps travaillé moyen / inactivité moyenne).
function mapGlobal(d) {
  const g = d || {};
  return {
    value: Number(g.value) || 0,
    series: Array.isArray(g.series) ? g.series.map((v) => Number(v) || 0) : [],
    weeklyGrowth: croissance(g.weeklyGrowth),
    tempsTravailleMoyen: minutesEnHM(g.tempsTravailleMoyen),
    inactiviteMoyenne: minutesEnHM(g.inactiviteMoyenne),
  };
}

// GET /api/productivite/classement -> [{ rank, name, agence, worked, productivity }] (forme du mock `classement`)
// L'API renvoie { classement: [{ rang, nom, departement, taux_moyen, heures_travaillees, ... }] }.
// Décision actée : `agence` = département.
function mapClassement(d) {
  const rows = Array.isArray(d?.classement) ? d.classement : [];
  return rows.map((r, i) => ({
    rank: r.rang ?? i + 1,
    name: r.nom || "",
    agence: r.departement || "—",
    worked: heuresEnHM(r.heures_travaillees),
    productivity: Math.round(Number(r.taux_moyen) || 0),
  }));
}

export default function Productivite() {
  const { toast } = useUI();
  const [productivity, setProductivity] = useState(null);
  const [classement, setClassement] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  // Données RÉELLES depuis l'API (remplace les mocks de src/data).
  useEffect(() => {
    Promise.all([apiGet("/api/productivite/global"), apiGet("/api/productivite/classement")])
      .then(([global, clt]) => {
        setProductivity(mapGlobal(global));
        setClassement(mapClassement(clt));
      })
      .catch((e) => setErreur(e.message || "Erreur de chargement"))
      .finally(() => setChargement(false));
  }, []);

  return (
    <div>
      <PageHeader title="Productivité" subtitle="Temps réellement travaillé, taux et classement des employés.">
        <Button variant="secondary" icon="download" onClick={() => toast("Export de productivité bientôt disponible", "info")}>
          Exporter
        </Button>
      </PageHeader>

      {chargement ? (
        <div className="card py-16 text-center">
          <Icon name="progress_activity" className="text-faint text-[40px] animate-spin" />
          <p className="mt-2 text-sm text-muted">Chargement de la productivité…</p>
        </div>
      ) : erreur ? (
        <div className="card py-16 text-center">
          <Icon name="error" className="text-rose-500 text-[40px]" />
          <p className="mt-2 text-sm text-muted">{erreur}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            <div className="lg:col-span-2 card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="kicker mb-1">Productivité globale — 12 jours</p>
                  <p className="text-3xl font-semibold text-ink tabular-nums">
                    {productivity.value.toLocaleString("fr-FR", { minimumFractionDigits: 1 })} %
                  </p>
                </div>
                <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700">
                  <Icon name="arrow_upward" className="text-[14px]" />
                  {productivity.weeklyGrowth} %
                </span>
              </div>
              <AreaChart data={productivity.series} height={150} id="prodpage" color="#1f4a3a" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              <StatTile icon="schedule" label="Temps travaillé moyen" value={productivity.tempsTravailleMoyen} color="indigo" />
              <StatTile icon="snooze" label="Inactivité moyenne" value={productivity.inactiviteMoyenne} color="amber" />
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
                      <div className={`h-full rounded-full ${barreScore[tonScore(c.productivity)]}`} style={{ width: `${c.productivity}%` }} />
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-ink w-12 text-right">{c.productivity} %</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
