import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import AreaChart from "../components/ui/AreaChart.jsx";
import { FilterSelect } from "../components/ui/Input.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { apiGet, exportRapport } from "../lib/api.js";
import { mapEmploye } from "../lib/mappers.js";

const photoDe = (id) => `https://i.pravatar.cc/80?u=${encodeURIComponent(id)}`;
const TRACK = "#ece4d3"; // piste des anneaux (sand-soft, palette crème)
const COL = { emerald: "#1f9d63", brand: "#1f4a3a", sky: "#3f7cc4", or: "#b8882a", amber: "#b5651a", rose: "#d9614b" };

const fmtHM = (min) => `${Math.floor(min / 60)}h${String(Math.round(min % 60)).padStart(2, "0")}`;

// --- MAPPING local : réponses API -> forme attendue par le JSX (mêmes champs que les mocks) ---

// GET /api/rapports/synthese -> { presence, donut:{presents,retards,absents,conges}, tendance:[], tempsEcranMoyen }
// produit l'objet `stats` consommé par le JSX (jauges, tendance, donut).
function mapSynthese(d) {
  const s = d || {};
  const g = s.donut || {};
  const serieSrc = Array.isArray(s.tendance) ? s.tendance.map((v) => Math.round(Number(v) || 0)) : [];
  // Le graphe attend 7 points : on complète à gauche par 0 si l'API en renvoie moins.
  const serie = serieSrc.length >= 7 ? serieSrc.slice(-7) : [...Array(7 - serieSrc.length).fill(0), ...serieSrc];

  const pr = Number(g.presents) || 0;
  const re = Number(g.retards) || 0;
  const ab = Number(g.absents) || 0;
  const cg = Number(g.conges) || 0;

  const presence = Math.round(Number(s.presence) || 0);
  const ecranMin = Math.max(0, Math.round(Number(s.tempsEcranMoyen) || 0));
  // « Score moyen » de productivité : non exposé tel quel par l'API -> moyenne de la tendance (sinon 0).
  const valides = serieSrc.length ? serieSrc : [];
  const productivite = valides.length ? Math.round(valides.reduce((a, b) => a + b, 0) / valides.length) : 0;

  return {
    productivite,
    presence,
    // « Temps de travail » brut non fourni par /rapports/synthese (seul le temps écran l'est) -> valeur neutre.
    travailMin: 0,
    ecranMin,
    serie,
    jour: serie[6],
    delta: serie[6] - serie[5],
    repartition: [
      { label: "Présents", value: pr, color: COL.emerald, tone: "text-emerald-600" },
      { label: "Retards", value: re, color: COL.amber, tone: "text-amber-700" },
      { label: "Absents", value: ab, color: COL.rose, tone: "text-rose-600" },
      { label: "Congés", value: cg, color: COL.sky, tone: "text-sky-600" },
    ],
    totalJours: pr + re + ab + cg,
  };
}

// GET /api/productivite/classement -> { classement:[{ matricule, nom, departement, taux_moyen, ... }] }
// -> liste attendue par le JSX : [{ id, name, fonction, score }] (6 premiers).
// L'API classement n'expose pas le poste : `fonction` (sous-titre) = département (valeur disponible).
function mapClassement(d) {
  const rows = Array.isArray(d?.classement) ? d.classement : [];
  return rows
    .map((r, i) => ({
      id: r.matricule || String(r.rang ?? i + 1),
      name: r.nom || "",
      fonction: r.departement || "",
      score: Math.round(Number(r.taux_moyen) || 0),
    }))
    .slice(0, 6);
}

const STATS_VIDE = {
  productivite: 0,
  presence: 0,
  travailMin: 0,
  ecranMin: 0,
  serie: [0, 0, 0, 0, 0, 0, 0],
  jour: 0,
  delta: 0,
  repartition: [
    { label: "Présents", value: 0, color: COL.emerald, tone: "text-emerald-600" },
    { label: "Retards", value: 0, color: COL.amber, tone: "text-amber-700" },
    { label: "Absents", value: 0, color: COL.rose, tone: "text-rose-600" },
    { label: "Congés", value: 0, color: COL.sky, tone: "text-sky-600" },
  ],
  totalJours: 0,
};

// Jauge circulaire (« sphère ») — anneau de progression + valeur centrale.
function Jauge({ icon, label, sub, center, value, max = 100, color }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="card p-5 flex flex-col items-center text-center" role="img" aria-label={`${label} : ${center}`}>
      <div className="relative w-[104px] h-[104px]">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90" aria-hidden="true">
          <circle cx="40" cy="40" r={r} fill="none" stroke={TRACK} strokeWidth="7.5" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7.5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon name={icon} className="text-[15px] opacity-80" style={{ color }} filled />
          <span className="mt-0.5 text-lg font-bold tabular-nums text-ink leading-none">{center}</span>
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold text-ink">{label}</p>
      {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

// Donut multi-segments (répartition) — segments espacés.
function Donut({ segs, total }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="relative w-[120px] h-[120px] shrink-0" role="img" aria-label={`Répartition : ${segs.map((s) => `${s.label} ${s.value}`).join(", ")}`}>
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="40" cy="40" r={r} fill="none" stroke={TRACK} strokeWidth="6" />
        {segs.map((s, i) => {
          const frac = s.value / (total || 1);
          const seg = (
            <circle key={i} cx="40" cy="40" r={r} fill="none" stroke={s.color} strokeWidth="6" strokeDasharray={`${Math.max(0, frac * c - 1.5)} ${c}`} strokeDashoffset={-acc * c} />
          );
          acc += frac;
          return seg;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tabular-nums text-ink leading-none">{total}</span>
        <span className="text-[11px] text-muted">jours</span>
      </div>
    </div>
  );
}

export default function Rapports() {
  const { toast } = useUI();
  const [service, setService] = useState("Tous services");

  const [stats, setStats] = useState(STATS_VIDE);
  const [classement, setClassement] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  // Annuaire léger (départements du menu déroulant « service ») — liste STATIQUE :
  // chargée une seule fois, pas re-fetchée à chaque changement de filtre.
  useEffect(() => {
    apiGet("/api/employes?light=1")
      .then((emp) => setEmployes((Array.isArray(emp) ? emp : []).map(mapEmploye)))
      .catch(() => setEmployes([]));
  }, []);

  // Données RÉELLES depuis l'API (remplace les mocks de src/data).
  // Le filtre « service » est transmis à la synthèse ; on relance au changement.
  useEffect(() => {
    setChargement(true);
    setErreur(null);
    const q = service && service !== "Tous services" ? `?service=${encodeURIComponent(service)}` : "";
    Promise.all([apiGet(`/api/rapports/synthese${q}`), apiGet("/api/productivite/classement")])
      .then(([synthese, clt]) => {
        setStats(mapSynthese(synthese));
        setClassement(mapClassement(clt));
      })
      .catch((e) => setErreur(e.message || "Erreur de chargement"))
      .finally(() => setChargement(false));
  }, [service]);

  // La liste des options du filtre « service » est alimentée par les départements
  // réels des employés (peuple le menu déroulant — design inchangé).
  const services = useMemo(() => ["Tous services", ...Array.from(new Set(employes.map((e) => e.department)))], [employes]);

  // Nombre d'agents affiché dans l'en-tête du classement.
  const nbAgents = useMemo(() => classement.length, [classement]);

  // Export : ouvre la page HTML imprimable de l'API (PDF navigateur), avec le
  // filtre « service » courant. Toast de succès UNIQUEMENT après résolution réelle.
  const [exportEnCours, setExportEnCours] = useState(false);
  async function exporter() {
    if (exportEnCours) return;
    setExportEnCours(true);
    const q = service && service !== "Tous services" ? `?service=${encodeURIComponent(service)}` : "";
    try {
      await exportRapport(q);
      toast("Rapport ouvert — Enregistrer en PDF depuis l'aperçu", "success");
    } catch (e) {
      toast(e?.message || "Export impossible — réessayez.", "error");
    } finally {
      setExportEnCours(false);
    }
  }

  const jauges = [
    { icon: "trending_up", label: "Productivité", sub: "Score moyen", center: `${stats.productivite}%`, value: stats.productivite, color: COL.emerald },
    { icon: "co_present", label: "Taux de présence", sub: "Hors congés", center: `${stats.presence}%`, value: stats.presence, color: COL.brand },
    { icon: "schedule", label: "Temps de travail", sub: "Moy./jour · sur 8h", center: fmtHM(stats.travailMin), value: stats.travailMin, max: 480, color: COL.or },
    { icon: "computer", label: "Temps écran", sub: "Devant l'ordinateur · /8h", center: fmtHM(stats.ecranMin), value: stats.ecranMin, max: 480, color: COL.sky },
  ];

  const filtreCls = "h-9 rounded-lg bg-surface border border-border-strong text-texte pl-2.5 focus:border-or-500 focus:ring-2 focus:ring-or-500/15";

  return (
    <div className="space-y-5 pb-12">
      <PageHeader title="Rapports & Analyses" subtitle="Indicateurs agrégés — 7 derniers jours (12 → 20 juin 2026).">
        <FilterSelect value={service} onChange={(e) => setService(e.target.value)} className={filtreCls} aria-label="Filtrer par service">
          {services.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </FilterSelect>
        <Button icon="download" onClick={exporter} disabled={exportEnCours}>Export</Button>
      </PageHeader>

      {chargement ? (
        <div className="card py-16 text-center">
          <Icon name="progress_activity" className="text-faint text-[40px] animate-spin" />
          <p className="mt-2 text-sm text-muted">Chargement des rapports…</p>
        </div>
      ) : erreur ? (
        <div className="card py-16 text-center">
          <Icon name="error" className="text-rose-500 text-[40px]" />
          <p className="mt-2 text-sm text-muted">{erreur}</p>
        </div>
      ) : (
        <>
          {/* Jauges « sphères » */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {jauges.map((j) => (
              <Jauge key={j.label} {...j} />
            ))}
          </div>

          {/* Tendance + répartition */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Icon name="show_chart" className="text-[18px]" filled />
                  </span>
                  <h3 className="text-sm font-semibold text-ink">Tendance de productivité</h3>
                </div>
                <span className="text-xs text-muted">7 derniers jours</span>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold text-ink tabular-nums leading-none">{stats.jour}<span className="text-base text-muted ml-1">%</span></p>
                <span className={`mb-0.5 inline-flex items-center gap-0.5 text-xs font-semibold ${stats.delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  <Icon name={stats.delta >= 0 ? "arrow_upward" : "arrow_downward"} className="text-[14px]" />
                  {Math.abs(stats.delta)} pts
                </span>
                <span className="mb-1 text-xs text-muted">aujourd'hui · vs hier</span>
              </div>
              <AreaChart data={stats.serie} height={150} id="rapports" color={COL.emerald} dots />
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                  <Icon name="pie_chart" className="text-[18px]" filled />
                </span>
                <h3 className="text-sm font-semibold text-ink">Répartition des pointages</h3>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Donut segs={stats.repartition} total={stats.totalJours} />
                <ul className="space-y-2 min-w-0 flex-1">
                  {stats.repartition.map((s) => (
                    <li key={s.label} className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-muted">{s.label}</span>
                      <span className={`ml-auto font-semibold tabular-nums ${s.tone}`}>{s.value}</span>
                      <span className="text-muted text-xs tabular-nums w-10 text-right">{Math.round((s.value / (stats.totalJours || 1)) * 100)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-4 pt-3 border-t border-border text-xs text-muted">
                Taux de présence global <span className="font-semibold text-ink">{stats.presence}%</span>
              </p>
            </div>
          </div>

          {/* Classement */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-8 h-8 rounded-lg bg-or-100 text-or-700 flex items-center justify-center shrink-0">
                <Icon name="leaderboard" className="text-[18px]" filled />
              </span>
              <h3 className="text-sm font-semibold text-ink">Classement des agents</h3>
              <span className="ml-auto text-xs text-muted">{nbAgents} agents</span>
            </div>
            <ol className="divide-y divide-border">
              {classement.map((a, i) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5">
                  <span className={`w-6 text-center text-sm font-bold tabular-nums ${i < 3 ? "text-or-600" : "text-muted"}`}>{i + 1}</span>
                  <Avatar src={photoDe(a.id)} name={a.name} size="w-9 h-9" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">{a.name}</p>
                    <p className="text-xs text-muted truncate">{a.fonction}</p>
                  </div>
                  <div className="w-28 hidden sm:flex items-center gap-2 shrink-0">
                    <span className="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${a.score}%` }} />
                    </span>
                  </div>
                  <span className="w-12 text-right text-sm font-semibold tabular-nums text-ink">{a.score}%</span>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  );
}
