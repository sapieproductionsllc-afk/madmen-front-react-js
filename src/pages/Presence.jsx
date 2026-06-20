import { useMemo, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import StatTile from "../components/ui/StatTile.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import Table from "../components/ui/Table.jsx";
import Button from "../components/ui/Button.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { pointages } from "../data/datasets.js";

const euro = (n) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const tone = { Présent: "emerald", Retard: "amber", Absent: "rose", Congé: "slate" };

function CelluleRetard({ p }) {
  if (p.retardMin === null) return <span className="text-subtle">—</span>;
  if (p.retardMin === 0) return <span className="text-emerald-600 text-xs font-medium">À l'heure</span>;
  if (p.retardMin <= 5) return <span className="text-muted text-xs">+{p.retardMin} min (toléré)</span>;
  return <span className="text-amber-600 text-xs font-semibold">+{p.retardMin} min</span>;
}

function CelluleJustif({ p }) {
  if (!p.justification) return <span className="text-subtle">—</span>;
  if (p.justification.statut === "À justifier")
    return <StatusPill label="À justifier" tone="rose" dot={false} />;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-texte">
      <Icon name="check_circle" className="text-emerald-500 text-[16px]" filled />
      {p.justification.motif}
      <span className="text-subtle">· {p.justification.via}</span>
    </span>
  );
}

export default function Presence() {
  const { toast } = useUI();
  const [recherche, setRecherche] = useState("");

  const liste = useMemo(
    () =>
      pointages.filter(
        (p) => !recherche || p.name.toLowerCase().includes(recherche.toLowerCase()) || p.agence.toLowerCase().includes(recherche.toLowerCase())
      ),
    [recherche]
  );

  const compte = (s) => pointages.filter((p) => p.status === s).length;
  const totalRetenues = pointages.reduce((s, p) => s + p.retenue, 0);

  const colonnes = [
    {
      key: "name",
      label: "Employé",
      render: (p) => (
        <div className="flex items-center gap-3">
          <Avatar name={p.name} size="w-8 h-8" />
          <div>
            <p className="text-sm font-medium text-ink">{p.name}</p>
            <p className="text-xs text-subtle">{p.agence}</p>
          </div>
        </div>
      ),
    },
    {
      key: "arrivee",
      label: "Arrivée",
      render: (p) => (
        <div>
          <p className="font-mono text-texte">{p.arrivee}</p>
          <p className="text-[11px] text-subtle">prévu {p.prevu}</p>
        </div>
      ),
    },
    { key: "retard", label: "Retard", render: (p) => <CelluleRetard p={p} /> },
    {
      key: "retenue",
      label: "Retenue auto",
      align: "right",
      render: (p) =>
        p.retenue > 0 ? (
          <span className="font-mono font-semibold text-rose-600">- {euro(p.retenue)}</span>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    { key: "status", label: "Statut", render: (p) => <StatusPill label={p.status} tone={tone[p.status]} /> },
    { key: "justif", label: "Justification", render: (p) => <CelluleJustif p={p} /> },
  ];

  return (
    <div>
      <PageHeader title="Présence & Pointage" subtitle="Pointage biométrique ZKTeco (carte + empreinte) — aujourd'hui.">
        <Button variant="secondary" icon="calendar_today">Aujourd'hui</Button>
        <Button icon="download" onClick={() => toast("Feuille de présence exportée")}>Exporter</Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile icon="how_to_reg" label="Présents" value={compte("Présent")} color="emerald" />
        <StatTile icon="schedule" label="Retards" value={compte("Retard")} color="amber" />
        <StatTile icon="person_off" label="Absents" value={compte("Absent")} color="rose" />
        <StatTile icon="account_balance_wallet" label="Retenues du jour" value={euro(totalRetenues)} color="violet" />
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-border">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Icon name="info" className="text-brand-500 text-[18px]" />
            Retard &gt; 5 min → retenue automatique sur salaire (2 €/min).
          </div>
          <SearchInput value={recherche} onChange={setRecherche} placeholder="Rechercher…" className="sm:w-64" />
        </div>
        <Table columns={colonnes} data={liste} rowKey={(p) => p.id} />
      </div>
    </div>
  );
}
