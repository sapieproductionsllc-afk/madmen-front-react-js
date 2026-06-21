import { useMemo, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import CartePerformance from "../components/ui/CartePerformance.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { employes } from "../data/datasets.js";
import { historiquePresence, productiviteEmploye } from "../data/profil.js";

const services = ["Tous services", ...Array.from(new Set(employes.map((e) => e.department)))];

// Métriques agrégées par agent (pour le tri).
const metric = (e) => {
  const p = historiquePresence(e.id);
  const jours = p.length || 1;
  return {
    productivite: productiviteEmploye(e.id).score,
    presence: Math.round((p.filter((x) => x.statut === "Présent" || x.statut === "Retard").length / jours) * 100),
    retards: p.filter((x) => x.statut === "Retard").length,
  };
};

export default function Rapports() {
  const { toast } = useUI();
  const [q, setQ] = useState("");
  const [service, setService] = useState("Tous services");
  const [tri, setTri] = useState("productivite");

  const liste = useMemo(() => {
    const t = q.trim().toLowerCase();
    return employes
      .filter((e) => {
        const okQ = !t || e.name.toLowerCase().includes(t) || e.id.toLowerCase().includes(t) || e.fonction.toLowerCase().includes(t);
        const okS = service === "Tous services" || e.department === service;
        return okQ && okS;
      })
      .sort((a, b) => {
        if (tri === "nom") return a.name.localeCompare(b.name, "fr");
        const ma = metric(a);
        const mb = metric(b);
        if (tri === "retards") return mb.retards - ma.retards;
        if (tri === "presence") return mb.presence - ma.presence;
        return mb.productivite - ma.productivite;
      });
  }, [q, service, tri]);

  const selectCls =
    "h-9 rounded-lg bg-surface border border-border-strong text-sm text-texte px-2.5 pr-7 outline-none focus:border-or-500 focus:ring-2 focus:ring-or-500/15 cursor-pointer";

  return (
    <div className="space-y-5 pb-12">
      <PageHeader title="Rapports & Analyses" subtitle="Vue d'ensemble par agent — 01/05/2026 au 31/05/2026.">
        <Button icon="download" onClick={() => toast("Rapport exporté (PDF)", "info")}>
          Export
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher un agent…" className="w-full sm:w-auto sm:flex-1 sm:min-w-[220px]" />
        <select value={service} onChange={(e) => setService(e.target.value)} className={selectCls} aria-label="Filtrer par service">
          {services.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={tri} onChange={(e) => setTri(e.target.value)} className={selectCls} aria-label="Trier par">
          <option value="productivite">Tri : Productivité</option>
          <option value="presence">Tri : Présence</option>
          <option value="retards">Tri : Retards</option>
          <option value="nom">Tri : Nom</option>
        </select>
      </div>

      {liste.length === 0 ? (
        <div className="card py-16 text-center">
          <Icon name="search_off" className="text-faint text-[40px]" />
          <p className="mt-2 text-sm text-muted">Aucun agent ne correspond.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
          {liste.map((e) => (
            <CartePerformance key={e.id} e={e} />
          ))}
        </div>
      )}
    </div>
  );
}
