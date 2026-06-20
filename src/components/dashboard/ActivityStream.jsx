import { useEffect, useMemo, useState } from "react";
import Icon from "../ui/Icon.jsx";
import Table from "../ui/Table.jsx";
import Tabs from "../ui/Tabs.jsx";
import { activity } from "../../data/mockData.js";

// Barres d'activité clavier/souris — animées pour les postes "Actif".
function BarresActivite({ status }) {
  const [hauteurs, setHauteurs] = useState([14, 22, 10, 18, 8]);

  useEffect(() => {
    if (status !== "Actif") return undefined;
    const id = setInterval(() => {
      setHauteurs(Array.from({ length: 5 }, () => Math.floor(Math.random() * 20) + 4));
    }, 1400);
    return () => clearInterval(id);
  }, [status]);

  const couleur =
    status === "Incident" ? "bg-rose-400" : status === "Inactif" ? "bg-slate-500" : "bg-brand-500";

  if (status === "Inactif") {
    return (
      <div className="flex gap-1 items-end h-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`w-1 h-1 rounded-full ${couleur}`} />
        ))}
      </div>
    );
  }

  if (status === "Incident") {
    return (
      <div className="flex gap-1 items-end h-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`w-1 h-6 rounded-full ${couleur}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1 items-end h-6">
      {hauteurs.map((h, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-700 ${couleur}`}
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

function StatutActivite({ status }) {
  const config = {
    Actif: { color: "text-emerald-500", text: "text-texte", live: true },
    Inactif: { color: "text-amber-500", text: "text-muted", live: false },
    Incident: { color: "text-rose-500", text: "text-rose-400 font-medium", live: false },
  };
  const c = config[status] ?? config.Inactif;
  return (
    <div className="flex items-center gap-2">
      {c.live ? (
        <span className={`live-dot ${c.color}`} />
      ) : (
        <span className={`status-dot ${c.color.replace("text-", "bg-")}`} />
      )}
      <span className={`text-sm ${c.text}`}>{status}</span>
    </div>
  );
}

const onglets = [
  { value: "Tous", label: "Tous" },
  { value: "Actif", label: "Actif" },
  { value: "Inactif", label: "Inactif" },
  { value: "Incident", label: "Incident" },
];

export default function ActivityStream() {
  const [filtre, setFiltre] = useState("Tous");

  const lignes = useMemo(
    () => (filtre === "Tous" ? activity : activity.filter((l) => l.status === filtre)),
    [filtre]
  );

  const columns = [
    {
      key: "name",
      label: "Employé",
      sortAccessor: (l) => l.name,
      render: (l) => <span className="text-sm font-semibold text-texte whitespace-nowrap">{l.name}</span>,
    },
    {
      key: "machine",
      label: "Machine",
      render: (l) => (
        <span className="text-sm font-mono tabular-nums text-subtle whitespace-nowrap">{l.machine}</span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (l) => <StatutActivite status={l.status} />,
    },
    {
      key: "activite",
      label: "Activité",
      sortable: false,
      render: (l) => <BarresActivite status={l.status} />,
    },
    {
      key: "apps",
      label: "Applications",
      sortable: false,
      render: (l) => (
        <div className="flex gap-1.5">
          {l.apps.map((app) => (
            <span
              key={app}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap border ${
                l.status === "Incident"
                  ? "bg-rose-400/10 border-rose-400/30 text-rose-400"
                  : "bg-surface-2 border-border text-muted"
              }`}
            >
              {app}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "worked",
      label: "Temps",
      render: (l) => (
        <span
          className={`text-sm font-mono tabular-nums whitespace-nowrap ${
            l.status === "Incident" ? "text-rose-400 font-semibold" : "text-texte"
          }`}
        >
          {l.worked}
        </span>
      ),
    },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-surface-2 text-muted flex items-center justify-center ring-1 ring-inset ring-black/[0.03]">
            <Icon name="desktop_windows" className="text-[20px]" />
          </span>
          <h2 className="text-[1.0625rem] font-semibold text-ink tracking-tight">Flux d'activité en direct</h2>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-muted">
          <span className="flex items-center gap-1.5">
            <span className="status-dot bg-emerald-500" /> Actif
          </span>
          <span className="flex items-center gap-1.5">
            <span className="status-dot bg-amber-500" /> Inactif
          </span>
          <span className="flex items-center gap-1.5">
            <span className="status-dot bg-rose-500" /> Incident
          </span>
        </div>
      </div>

      {/* Toolbar de filtrage en place */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
        <Tabs tabs={onglets} active={filtre} onChange={setFiltre} />
      </div>

      <Table
        columns={columns}
        data={lignes}
        rowKey={(l) => l.id}
        minWidth={640}
        sortable
        emptyLabel="Aucun poste pour ce filtre."
      />
    </div>
  );
}
