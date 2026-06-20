import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../ui/Icon.jsx";
import Avatar from "../ui/Avatar.jsx";
import Table from "../ui/Table.jsx";
import Tabs from "../ui/Tabs.jsx";
import SearchInput from "../ui/SearchInput.jsx";
import StatusPill from "../ui/StatusPill.jsx";
import { presence } from "../../data/mockData.js";

// Convention canonique des statuts (StatusPill : fond couleur/10, texte couleur-700).
const tonsStatut = {
  Présent: "emerald",
  Retard: "amber",
  Congé: "slate",
  Absent: "rose",
};

const onglets = [
  { value: "Tous", label: "Tous" },
  { value: "Présent", label: "Présent" },
  { value: "Retard", label: "Retard" },
  { value: "Absent", label: "Absent" },
];

export default function PresenceTable() {
  const navigate = useNavigate();
  const [filtre, setFiltre] = useState("Tous");
  const [recherche, setRecherche] = useState("");
  const [agence, setAgence] = useState("Toutes");

  const agences = useMemo(() => ["Toutes", ...new Set(presence.map((p) => p.agence))], []);

  const lignes = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return presence.filter((emp) => {
      if (filtre !== "Tous" && emp.status !== filtre) return false;
      if (agence !== "Toutes" && emp.agence !== agence) return false;
      if (q && !emp.name.toLowerCase().includes(q) && !emp.id.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [filtre, recherche, agence]);

  const columns = [
    {
      key: "name",
      label: "Employé",
      sortAccessor: (emp) => emp.name,
      render: (emp) => (
        <div className="flex items-center gap-3">
          <Avatar src={emp.photo} name={emp.name} size="w-8 h-8" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-texte whitespace-nowrap">{emp.name}</p>
            <p className="text-xs text-subtle font-mono">{emp.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "agence",
      label: "Agence",
      render: (emp) => <span className="text-sm text-muted whitespace-nowrap">{emp.agence}</span>,
    },
    {
      key: "status",
      label: "Statut",
      render: (emp) => <StatusPill label={emp.status} tone={tonsStatut[emp.status] ?? "slate"} />,
    },
    {
      key: "checkIn",
      label: "Arrivée",
      render: (emp) => <span className="text-sm font-mono tabular-nums text-muted">{emp.checkIn}</span>,
    },
    {
      key: "workstation",
      label: "Poste",
      render: (emp) => (
        <span className="text-sm font-mono tabular-nums text-subtle whitespace-nowrap">{emp.workstation}</span>
      ),
    },
  ];

  return (
    <div className="card overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-surface-2 text-muted flex items-center justify-center ring-1 ring-inset ring-black/[0.03]">
            <Icon name="co_present" className="text-[20px]" />
          </span>
          <h2 className="text-[1.0625rem] font-semibold text-ink tracking-tight">Présence en temps réel</h2>
        </div>
        <button
          onClick={() => navigate("/presence")}
          className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 rounded-lg px-1 -mx-1"
        >
          Tout voir
          <Icon name="arrow_forward" className="text-[18px]" />
        </button>
      </div>

      {/* Toolbar de filtrage en place */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-5 py-3 border-b border-border">
        <SearchInput
          value={recherche}
          onChange={setRecherche}
          placeholder="Rechercher un employé…"
          className="sm:w-64"
        />
        <Tabs tabs={onglets} active={filtre} onChange={setFiltre} />
        <select
          value={agence}
          onChange={(e) => setAgence(e.target.value)}
          aria-label="Filtrer par agence"
          className="rounded-lg bg-canvas border border-border px-3 py-2 text-sm text-texte outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 sm:ml-auto"
        >
          {agences.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </div>

      <Table
        columns={columns}
        data={lignes}
        rowKey={(emp) => emp.id}
        minWidth={560}
        sortable
        emptyLabel="Aucun employé pour ce filtre."
      />
    </div>
  );
}
