import { useMemo, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import CarteAgent from "../components/ui/CarteAgent.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { employes, tempsReel, ordreLive } from "../data/datasets.js";

const PAGE_SIZE = 8;

const services = ["Tous services", ...Array.from(new Set(employes.map((e) => e.department)))];
const statuts = ["Tous statuts", "En activité", "En pause", "Absent", "Congé"];

export default function Employes() {
  const { openAddEmployee } = useUI();
  const [q, setQ] = useState("");
  const [service, setService] = useState("Tous services");
  const [statut, setStatut] = useState("Tous statuts");
  const [page, setPage] = useState(0);

  const liveDe = (e) => tempsReel[e.id]?.live ?? "Absent";

  const liste = useMemo(() => {
    const t = q.trim().toLowerCase();
    return employes
      .filter((e) => {
        const okQ = !t || e.name.toLowerCase().includes(t) || e.id.toLowerCase().includes(t) || e.fonction.toLowerCase().includes(t) || e.department.toLowerCase().includes(t);
        const okS = service === "Tous services" || e.department === service;
        const okStat = statut === "Tous statuts" || liveDe(e) === statut;
        return okQ && okS && okStat;
      })
      .sort((a, b) => (ordreLive[liveDe(a)] ?? 9) - (ordreLive[liveDe(b)] ?? 9));
  }, [q, service, statut]);

  const totalPages = Math.max(1, Math.ceil(liste.length / PAGE_SIZE));
  const pageClamped = Math.min(page, totalPages - 1);
  const pageData = liste.slice(pageClamped * PAGE_SIZE, pageClamped * PAGE_SIZE + PAGE_SIZE);

  const selectCls =
    "h-9 rounded-lg bg-surface border border-border-strong text-sm text-texte px-2.5 pr-7 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 cursor-pointer";

  const reset = (setter) => (e) => {
    setter(e.target.value);
    setPage(0);
  };

  return (
    <div className="space-y-5 pb-12">
      <PageHeader title="Agents" subtitle="Tous vos employés.">
        <Button icon="person_add" onClick={openAddEmployee}>
          Ajouter un agent
        </Button>
      </PageHeader>

      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(0); }} placeholder="Rechercher un agent…" className="w-full sm:w-auto sm:flex-1 sm:min-w-[220px]" />
        <select value={service} onChange={reset(setService)} className={selectCls} aria-label="Filtrer par service">
          {services.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={statut} onChange={reset(setStatut)} className={selectCls} aria-label="Filtrer par statut">
          {statuts.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Grille de cartes (identiques au tableau de bord) */}
      {pageData.length === 0 ? (
        <div className="card py-16 text-center">
          <Icon name="search_off" className="text-faint text-[40px]" />
          <p className="mt-2 text-sm text-muted">Aucun agent ne correspond.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
          {pageData.map((e) => (
            <CarteAgent key={e.id} e={e} tr={tempsReel[e.id]} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={pageClamped === 0}
            className="w-9 h-9 rounded-lg border border-border-strong text-muted hover:text-texte hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            aria-label="Page précédente"
          >
            <Icon name="chevron_left" className="text-[18px]" />
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              aria-current={i === pageClamped}
              className={`w-9 h-9 rounded-lg text-sm font-medium tabular-nums transition-colors ${
                i === pageClamped ? "bg-brand-600 text-canvas" : "border border-border-strong text-muted hover:text-texte hover:bg-surface-2"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={pageClamped >= totalPages - 1}
            className="w-9 h-9 rounded-lg border border-border-strong text-muted hover:text-texte hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            aria-label="Page suivante"
          >
            <Icon name="chevron_right" className="text-[18px]" />
          </button>
        </div>
      )}
    </div>
  );
}
