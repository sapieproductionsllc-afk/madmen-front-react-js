import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import CartePresence from "../components/ui/CartePresence.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { apiGet } from "../lib/api.js";
import { mapEmploye } from "../lib/mappers.js";

// Ordre d'affichage des statuts live (repris de l'ancien mock `ordreLive`).
const ordreLive = { "En activité": 0, "En pause": 1, Absent: 2, Congé: 3 };

// API statut (present/retard/absent/conge) -> statut live attendu par le JSX.
// L'API n'expose pas de notion de « pause » : aucun agent ne tombera dans "En pause".
const STATUT_LIVE = { present: "En activité", retard: "En activité", absent: "Absent", conge: "Congé" };

// Construit l'objet attendu par les cartes/filtres à partir d'un agent de l'API.
// On réutilise mapEmploye en remettant l'agent à la forme qu'il attend (`today`),
// puis on enrichit avec le statut live + l'info temps réel utilisée par la carte.
function mapAgentPresence(a) {
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
    live,
    // `tr` consommé par CartePresence : { live, detail, depuis }
    tr: { live, detail: e.fonction || "", depuis: "—" },
  };
}

const present = (e) => ["En activité", "En pause"].includes(e.live);
const enRetard = (e) => present(e) && (e.today?.retardMin ?? 0) > 0;

const cats = [
  { key: "Tous", test: () => true },
  { key: "Présents", test: present },
  { key: "En pause", test: (e) => e.live === "En pause" },
  { key: "Retards", test: enRetard },
  { key: "Congé", label: "En congé", test: (e) => e.live === "Congé" },
];

export default function Presence() {
  const { toast } = useUI();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Tous");
  const [employes, setEmployes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    setChargement(true);
    setErreur(null);
    apiGet("/api/dashboard/presence")
      .then((data) => setEmployes((data?.agents ?? []).map(mapAgentPresence)))
      .catch((e) => setErreur(e?.message || "Erreur de chargement"))
      .finally(() => setChargement(false));
  }, []);

  const compte = (k) => employes.filter(cats.find((c) => c.key === k).test).length;

  const liste = useMemo(() => {
    const t = q.trim().toLowerCase();
    const test = cats.find((c) => c.key === cat).test;
    return employes
      .filter((e) => test(e) && (!t || e.name.toLowerCase().includes(t) || e.id.toLowerCase().includes(t) || e.fonction.toLowerCase().includes(t) || e.department.toLowerCase().includes(t)))
      .sort((a, b) => (ordreLive[a.live] ?? 9) - (ordreLive[b.live] ?? 9));
  }, [q, cat, employes]);

  return (
    <div className="space-y-5 pb-12">
      <PageHeader title="Présence" subtitle="Suivi des présences en temps réel.">
        <Button variant="secondary" icon="refresh" onClick={() => toast("Présences actualisées", "success")}>
          Actualiser
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 overflow-x-auto scroll-thin pb-1 sm:pb-0">
          {cats.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={`shrink-0 inline-flex items-center gap-2 pl-3 pr-2 h-9 rounded-full text-sm whitespace-nowrap border transition-colors ${
                cat === c.key ? "bg-brand-600 text-canvas border-brand-600" : "bg-surface text-muted border-border hover:border-border-strong hover:text-texte"
              }`}
            >
              {c.label ?? c.key}
              <span className={`text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded-full ${cat === c.key ? "bg-canvas/20 text-canvas" : "bg-surface-2 text-texte"}`}>{compte(c.key)}</span>
            </button>
          ))}
        </div>
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher un agent…" className="sm:ml-auto sm:w-72" />
      </div>

      {chargement ? (
        <div className="card py-16 text-center">
          <Icon name="progress_activity" className="text-faint text-[40px] animate-spin" />
          <p className="mt-2 text-sm text-muted">Chargement des présences…</p>
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
          {liste.map((e) => (
            <CartePresence key={e.id} e={e} tr={e.tr} />
          ))}
        </div>
      )}
    </div>
  );
}
