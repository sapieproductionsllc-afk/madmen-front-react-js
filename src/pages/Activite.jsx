import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import CarteActivite from "../components/ui/CarteActivite.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { apiGet } from "../lib/api.js";
import { mapEmploye } from "../lib/mappers.js";
import { ordreLive } from "../data/datasets.js";

// MAPPING local : réponse API /api/presence/temps-reel -> forme attendue par le JSX.
// L'API renvoie [{ employe_id, matricule, name, live, detail, depuis }].
// On en dérive deux choses, comme dans les mocks :
//  - `employes` : objets agent (via mapEmploye, champs identiques au mock)
//  - `tempsReel` : index matricule -> { live, detail, depuis }
function mapTempsReel(data) {
  const rows = Array.isArray(data) ? data : [];
  const employes = rows.map((r) =>
    // mapEmploye attend la forme API employé ; on lui passe ce que l'endpoint fournit.
    // Les champs absents (poste, département, fonction) tombent sur des valeurs neutres.
    mapEmploye({ id: r.employe_id, matricule: r.matricule, name: r.name })
  );
  const tempsReel = {};
  for (const r of rows) {
    // indexé par matricule (= e.id côté front)
    tempsReel[r.matricule] = {
      live: r.live ?? "Absent",
      detail: r.detail ?? "",
      depuis: r.depuis ?? "—",
    };
  }
  return { employes, tempsReel };
}

export default function Activite() {
  const { toast } = useUI();
  const [employes, setEmployes] = useState([]);
  const [tempsReel, setTempsReel] = useState({});
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [actualisation, setActualisation] = useState(false); // re-fetch manuel via « Actualiser »
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Tous");

  // Re-fetch RÉEL de l'activité temps réel. Renvoie une promesse pour que le bouton
  // « Actualiser » ne toaste le succès qu'APRÈS résolution (et l'erreur sur échec).
  const charger = useCallback(() => {
    setErreur(null);
    return apiGet("/api/presence/temps-reel")
      .then((data) => {
        const { employes, tempsReel } = mapTempsReel(data);
        setEmployes(employes);
        setTempsReel(tempsReel);
      })
      .catch((e) => {
        setErreur(e.message || "Erreur de chargement");
        throw e;
      })
      .finally(() => setChargement(false));
  }, []);

  // Données RÉELLES depuis l'API (remplace les mocks de src/data).
  useEffect(() => {
    charger().catch(() => {});
  }, [charger]);

  const actualiser = async () => {
    if (actualisation) return;
    setActualisation(true);
    try {
      await charger();
      toast("Activité actualisée", "success");
    } catch {
      toast("Échec de l'actualisation de l'activité", "error");
    } finally {
      setActualisation(false);
    }
  };

  const liveDe = (e) => tempsReel[e.id]?.live ?? "Absent";

  const cats = [
    { key: "Tous", test: () => true },
    { key: "Actifs", test: (e) => liveDe(e) === "En activité" },
    { key: "En pause", test: (e) => liveDe(e) === "En pause" },
    { key: "Hors ligne", test: (e) => ["Absent", "Congé"].includes(liveDe(e)) },
  ];

  const compte = (k) => employes.filter(cats.find((c) => c.key === k).test).length;

  const liste = useMemo(() => {
    const t = q.trim().toLowerCase();
    const test = cats.find((c) => c.key === cat).test;
    return employes
      .filter((e) => test(e) && (!t || e.name.toLowerCase().includes(t) || e.id.toLowerCase().includes(t) || e.fonction.toLowerCase().includes(t) || e.department.toLowerCase().includes(t)))
      .sort((a, b) => (ordreLive[liveDe(a)] ?? 9) - (ordreLive[liveDe(b)] ?? 9));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, cat, employes, tempsReel]);

  return (
    <div className="space-y-5 pb-12">
      <PageHeader title="Activité" subtitle="Activité des postes en temps réel.">
        <Button variant="secondary" icon="refresh" onClick={actualiser} disabled={actualisation}>
          {actualisation ? "Actualisation…" : "Actualiser"}
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
              {c.key}
              <span className={`text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded-full ${cat === c.key ? "bg-canvas/20 text-canvas" : "bg-surface-2 text-texte"}`}>{compte(c.key)}</span>
            </button>
          ))}
        </div>
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher un agent…" className="sm:ml-auto sm:w-72" />
      </div>

      {chargement ? (
        <div className="card py-16 text-center">
          <Icon name="progress_activity" className="text-faint text-[40px] animate-spin" />
          <p className="mt-2 text-sm text-muted">Chargement de l'activité…</p>
        </div>
      ) : erreur ? (
        <div className="card py-16 text-center">
          <Icon name="error" className="text-rose-500 text-[40px]" />
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
            <CarteActivite key={e.id} e={e} tr={tempsReel[e.id]} />
          ))}
        </div>
      )}
    </div>
  );
}
