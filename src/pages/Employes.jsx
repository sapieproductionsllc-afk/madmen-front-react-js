import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import { FilterSelect } from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import CarteAnnuaire from "../components/ui/CarteAnnuaire.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { apiGet } from "../lib/api.js";
import { mapEmploye } from "../lib/mappers.js";

export default function Employes() {
  const { openAddEmployee } = useUI();
  const [employes, setEmployes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [q, setQ] = useState("");
  const [service, setService] = useState("Tous services");
  const [statut, setStatut] = useState("Tous statuts");

  // Données RÉELLES depuis l'API (remplace les mocks de src/data). Rechargé aussi
  // après la création d'un agent (événement émis par AddEmployeeModal).
  useEffect(() => {
    const charger = () => {
      setChargement(true);
      apiGet("/api/employes")
        .then((data) => setEmployes((Array.isArray(data) ? data : []).map(mapEmploye)))
        .catch((e) => setErreur(e.message || "Erreur de chargement"))
        .finally(() => setChargement(false));
    };
    charger();
    window.addEventListener("madmen:employe-cree", charger);
    return () => window.removeEventListener("madmen:employe-cree", charger);
  }, []);

  const services = useMemo(
    () => ["Tous services", ...Array.from(new Set(employes.map((e) => e.department)))],
    [employes]
  );
  const statuts = useMemo(
    () => ["Tous statuts", ...Array.from(new Set(employes.map((e) => e.status)))],
    [employes]
  );

  const liste = useMemo(() => {
    const t = q.trim().toLowerCase();
    return employes.filter((e) => {
      const okQ = !t || e.name.toLowerCase().includes(t) || e.id.toLowerCase().includes(t) || e.fonction.toLowerCase().includes(t) || e.department.toLowerCase().includes(t);
      const okS = service === "Tous services" || e.department === service;
      const okStat = statut === "Tous statuts" || e.status === statut;
      return okQ && okS && okStat;
    });
  }, [q, service, statut, employes]);

  const filtreCls = "h-11 rounded-xl bg-surface border border-border text-muted pl-3.5 shadow-soft focus:border-or-500 focus:ring-2 focus:ring-or-500/15";

  return (
    <div className="space-y-5 pb-12">
      <PageHeader title="Agents" subtitle="Annuaire du personnel — statut et affectation par agence.">
        <Button icon="person_add" onClick={openAddEmployee}>
          Ajouter un agent
        </Button>
      </PageHeader>

      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher un agent…" className="w-full sm:w-auto sm:flex-1 sm:min-w-[240px]" />
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
      </div>

      {/* Grille annuaire */}
      {chargement ? (
        <div className="card py-16 text-center">
          <Icon name="progress_activity" className="text-faint text-[40px] animate-spin" />
          <p className="mt-2 text-sm text-muted">Chargement des agents…</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {liste.map((e) => (
            <CarteAnnuaire key={e.id} e={e} />
          ))}
        </div>
      )}
    </div>
  );
}
