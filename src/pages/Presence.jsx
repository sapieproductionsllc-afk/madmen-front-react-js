import { useMemo, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import StatTile from "../components/ui/StatTile.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import Table from "../components/ui/Table.jsx";
import Button from "../components/ui/Button.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { presence } from "../data/mockData.js";

const tone = { Présent: "emerald", "En congé": "amber", Absent: "rose" };

export default function Presence() {
  const { toast } = useUI();
  const [recherche, setRecherche] = useState("");

  const liste = useMemo(
    () =>
      presence.filter(
        (e) => !recherche || e.name.toLowerCase().includes(recherche.toLowerCase()) || e.agence.toLowerCase().includes(recherche.toLowerCase())
      ),
    [recherche]
  );

  const colonnes = [
    {
      key: "name",
      label: "Employé",
      render: (e) => (
        <div className="flex items-center gap-3">
          <Avatar src={e.photo} name={e.name} size="w-8 h-8" />
          <div>
            <p className="text-sm font-medium text-slate-800">{e.name}</p>
            <p className="text-xs text-slate-400 font-mono">{e.id}</p>
          </div>
        </div>
      ),
    },
    { key: "agence", label: "Agence", render: (e) => <span className="text-slate-600">{e.agence}</span> },
    { key: "department", label: "Département", render: (e) => <span className="text-slate-600">{e.department}</span> },
    { key: "status", label: "Statut", render: (e) => <StatusPill label={e.status} tone={tone[e.status]} /> },
    { key: "checkIn", label: "Arrivée", render: (e) => <span className="font-mono text-slate-600">{e.checkIn}</span> },
    { key: "workstation", label: "Poste", render: (e) => <span className="font-mono text-slate-500">{e.workstation}</span> },
  ];

  return (
    <div>
      <PageHeader title="Présence & Pointage" subtitle="Suivi des présences biométriques en temps réel.">
        <Button variant="secondary" icon="calendar_today">
          Aujourd'hui
        </Button>
        <Button icon="download" onClick={() => toast("Feuille de présence exportée")}>
          Exporter
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile icon="how_to_reg" label="Présents" value="804" sub="80,4 % de l'effectif" color="emerald" />
        <StatTile icon="person_off" label="Absents" value="196" color="rose" />
        <StatTile icon="beach_access" label="En congé" value="42" color="amber" />
        <StatTile icon="schedule" label="Retards du jour" value="11" color="violet" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">Pointages du jour</h2>
          <SearchInput value={recherche} onChange={setRecherche} placeholder="Rechercher…" className="w-64" />
        </div>
        <Table columns={colonnes} data={liste} rowKey={(e) => e.id} />
      </div>
    </div>
  );
}
