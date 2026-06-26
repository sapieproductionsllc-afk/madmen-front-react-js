import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import { FilterSelect } from "../components/ui/Input.jsx";
import CarteAgent from "../components/ui/CarteAgent.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import Table from "../components/ui/Table.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { apiGet } from "../lib/api.js";
import { mapEmploye } from "../lib/mappers.js";

// Constantes de design (reprises des anciens mocks `datasets.js`, ce ne sont pas des données) :
// statut live -> tonalité de badge, et ordre d'affichage des statuts.
const toneLive = { "En activité": "emerald", "En pause": "amber", Absent: "rose", Congé: "sky" };
const ordreLive = { "En activité": 0, "En pause": 1, Absent: 2, Congé: 3 };

// API statut (present/retard/pause/absent/conge/parti) -> statut live attendu par le JSX.
// 'pause' = ressorti pendant la pause déjeuner (calculé par DashboardController::presence).
const STATUT_LIVE = { present: "En activité", retard: "En activité", pause: "En pause", absent: "Absent", conge: "Congé", parti: "Parti" };

// Construit l'employé (forme attendue par le JSX / CarteAgent) + son temps réel
// à partir d'un agent renvoyé par /api/dashboard/presence (agents[]).
// On réutilise mapEmploye en remettant l'agent à la forme qu'il attend (`today`).
function mapAgentDashboard(a) {
  const e = mapEmploye({
    id: a.id,
    matricule: a.matricule,
    name: a.name,
    departement_nom: a.departement_nom,
    poste_libelle: a.poste_libelle,
    statut: a.statut === "conge" ? "conge" : "actif",
    today: { statut: a.statut, arrivee: a.arrivee, retard_minutes: a.retard_minutes },
  });
  const live = STATUT_LIVE[a.statut] ?? "Absent";
  return {
    ...e,
    // `tr` consommé par CarteAgent : { live, detail, depuis }
    tr: { live, detail: e.fonction || "", depuis: "—" },
  };
}

const statuts = ["Tous les statuts", "En activité", "En pause", "Parti", "Absent", "Congé"];

const tonesPastille = {
  brand: "bg-brand-50 text-brand-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  sky: "bg-sky-50 text-sky-600",
};
const tonesBord = {
  brand: "border-t-brand-500",
  emerald: "border-t-emerald-500",
  amber: "border-t-amber-500",
  rose: "border-t-rose-500",
  sky: "border-t-sky-500",
};

function KPI({ value, label, sub, icon, tone }) {
  return (
    <div className={`card p-4 border-t-[3px] ${tonesBord[tone]}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[1.75rem] font-semibold text-ink tabular-nums leading-none">{value}</p>
        <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tonesPastille[tone]}`}>
          <Icon name={icon} className="text-[20px]" filled />
        </span>
      </div>
      <p className="mt-3 text-sm font-medium text-texte">{label}</p>
      <p className="text-xs text-subtle mt-0.5 truncate">{sub}</p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [service, setService] = useState("Tous les services");
  const [statut, setStatut] = useState("Tous les statuts");
  const [vue, setVue] = useState("grille");
  const [tri, setTri] = useState("arrivee");

  const [employes, setEmployes] = useState([]);
  const [paie, setPaie] = useState([]); // pas exposé par ces endpoints -> neutre []
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const { dataVersion } = useUI(); // rafraîchit la vue après une synchro K40
  useEffect(() => {
    if (!employes.length) setChargement(true); // spinner seulement au 1er chargement ; refresh = silencieux
    setErreur(null);
    // Présence (compteurs + agents[]) — seule source consommée par cette vue.
    apiGet("/api/dashboard/presence")
      .then((presence) => {
        setEmployes((presence?.agents ?? []).map(mapAgentDashboard));
      })
      .catch((e) => setErreur(e?.message || "Erreur de chargement"))
      .finally(() => setChargement(false));
  }, [dataVersion]);

  // Index temps réel { matricule -> { live, detail, depuis } } (consommé par les cartes).
  const tempsReel = useMemo(() => Object.fromEntries(employes.map((e) => [e.id, e.tr])), [employes]);

  const services = useMemo(() => ["Tous les services", ...Array.from(new Set(employes.map((e) => e.department)))], [employes]);

  const liveDe = (e) => tempsReel[e.id]?.live ?? "Absent";
  const compte = (k) => employes.filter((e) => liveDe(e) === k).length;
  const presents = compte("En activité") + compte("En pause");
  const paiementsAttente = paie.filter((p) => p.status === "En attente").length;

  const kpis = [
    { value: employes.length, label: "Total agents", sub: "Tous les services", icon: "groups", tone: "brand" },
    { value: presents, label: "Présents", sub: `${employes.length ? Math.round((presents / employes.length) * 100) : 0} % de l'effectif`, icon: "check_circle", tone: "emerald" },
    { value: compte("En pause"), label: "En pause", sub: "Pause café / déjeuner", icon: "pause_circle", tone: "amber" },
    { value: compte("Absent"), label: "Absents", sub: "À justifier", icon: "person_off", tone: "rose" },
    { value: compte("Congé"), label: "En congé", sub: "Congé approuvé", icon: "flight", tone: "sky" },
    { value: paiementsAttente, label: "Paiements en attente", sub: "À valider", icon: "account_balance_wallet", tone: "brand" },
  ];

  const liste = useMemo(() => {
    const t = q.trim().toLowerCase();
    const arr = employes.filter((e) => {
      const live = liveDe(e);
      const okQ =
        !t || e.name.toLowerCase().includes(t) || e.id.toLowerCase().includes(t) || e.fonction.toLowerCase().includes(t) || e.department.toLowerCase().includes(t);
      const okS = service === "Tous les services" || e.department === service;
      const okStat = statut === "Tous les statuts" || live === statut;
      return okQ && okS && okStat;
    });
    arr.sort((a, b) => {
      if (tri === "nom") return a.name.localeCompare(b.name, "fr");
      if (tri === "statut") return (ordreLive[liveDe(a)] ?? 9) - (ordreLive[liveDe(b)] ?? 9);
      const va = a.today.arrivee === "--:--" ? "99:99" : a.today.arrivee;
      const vb = b.today.arrivee === "--:--" ? "99:99" : b.today.arrivee;
      return va.localeCompare(vb);
    });
    return arr;
  }, [q, service, statut, tri, employes, tempsReel]);

  const filtreCls = "h-9 rounded-lg bg-surface border border-border-strong text-texte pl-2.5 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15";

  const colonnes = [
    {
      key: "name",
      label: "Agent",
      render: (e) => (
        <div className="flex items-center gap-3">
          <Avatar name={e.name} size="w-9 h-9" />
          <div>
            <p className="text-sm font-medium text-ink">{e.name}</p>
            <p className="text-xs font-mono text-subtle">{e.id}</p>
          </div>
        </div>
      ),
    },
    { key: "fonction", label: "Fonction", render: (e) => <span className="text-texte">{e.fonction}</span> },
    { key: "department", label: "Service", render: (e) => <span className="text-texte">{e.department}</span> },
    { key: "statut", label: "Statut", render: (e) => <StatusPill label={liveDe(e)} tone={toneLive[liveDe(e)] ?? "slate"} /> },
    {
      key: "arrivee",
      label: "Arrivée",
      render: (e) => <span className="font-mono tabular-nums text-texte">{e.today.arrivee !== "--:--" ? e.today.arrivee : "—"}</span>,
    },
    { key: "actions", label: "", align: "right", render: () => <Icon name="chevron_right" className="text-subtle text-[20px]" /> },
  ];

  return (
    <div className="space-y-5 pb-12">
      {/* Eyebrow + titre */}
      <header className="reveal">
        <p className="kicker mb-2 text-brand-600">Aperçu aujourd'hui</p>
        <h1 className="text-2xl md:text-[1.75rem] font-semibold text-ink tracking-tight">Agents présents aujourd'hui</h1>
      </header>

      {/* 6 KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <KPI key={k.label} {...k} />
        ))}
      </div>

      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput value={q} onChange={setQ} placeholder="Filtrer par nom, service, poste…" className="w-full sm:w-auto sm:flex-1 sm:min-w-[220px]" />
        <FilterSelect value={service} onChange={(e) => setService(e.target.value)} className={filtreCls} aria-label="Filtrer par service">
          {services.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </FilterSelect>
        <FilterSelect value={statut} onChange={(e) => setStatut(e.target.value)} className={filtreCls} aria-label="Filtrer par statut">
          {statuts.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </FilterSelect>
        <div className="inline-flex rounded-lg border border-border-strong overflow-hidden">
          <button
            onClick={() => setVue("grille")}
            className={`w-9 h-9 flex items-center justify-center transition-colors ${vue === "grille" ? "bg-brand-600 text-canvas" : "bg-surface text-muted hover:text-texte"}`}
            aria-label="Vue grille"
            aria-pressed={vue === "grille"}
          >
            <Icon name="grid_view" className="text-[18px]" />
          </button>
          <button
            onClick={() => setVue("liste")}
            className={`w-9 h-9 flex items-center justify-center transition-colors border-l border-border-strong ${vue === "liste" ? "bg-brand-600 text-canvas" : "bg-surface text-muted hover:text-texte"}`}
            aria-label="Vue liste"
            aria-pressed={vue === "liste"}
          >
            <Icon name="view_list" className="text-[18px]" />
          </button>
        </div>
        <FilterSelect value={tri} onChange={(e) => setTri(e.target.value)} className={filtreCls} aria-label="Trier par">
          <option value="arrivee">Tri : Heure d'arrivée</option>
          <option value="nom">Tri : Nom</option>
          <option value="statut">Tri : Statut</option>
        </FilterSelect>
      </div>

      {/* Grille ou liste — pleine largeur */}
      {chargement ? (
        <div className="card py-16 text-center">
          <Icon name="progress_activity" className="text-faint text-[40px] animate-spin" />
          <p className="mt-2 text-sm text-muted">Chargement des agents…</p>
        </div>
      ) : erreur ? (
        <div className="card py-16 text-center">
          <Icon name="error" className="text-faint text-[40px]" />
          <p className="mt-2 text-sm text-muted">{erreur}</p>
        </div>
      ) : liste.length === 0 ? (
        <div className="card py-16 text-center">
          <Icon name="search_off" className="text-faint text-[40px]" />
          <p className="mt-2 text-sm text-muted">Aucun agent ne correspond.</p>
        </div>
      ) : vue === "grille" ? (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {liste.map((e) => (
            <CarteAgent key={e.id} e={e} tr={tempsReel[e.id]} />
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <Table columns={colonnes} data={liste} rowKey={(e) => e.id} onRowClick={(e) => navigate(`/employes/${e.id}`)} minWidth={680} />
        </div>
      )}
    </div>
  );
}
