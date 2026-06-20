import PageHeader from "../components/ui/PageHeader.jsx";
import StatTile from "../components/ui/StatTile.jsx";
import Table from "../components/ui/Table.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { activity } from "../data/mockData.js";

const statut = {
  Actif: { tone: "text-emerald-400", label: "text-texte" },
  Inactif: { tone: "text-amber-400", label: "text-texte" },
  Incident: { tone: "text-rose-400", label: "text-rose-400 font-medium" },
};

export default function Activite() {
  const { toast } = useUI();

  const colonnes = [
    { key: "name", label: "Employé", render: (l) => <span className="font-medium text-ink">{l.name}</span> },
    { key: "machine", label: "Machine", render: (l) => <span className="font-mono text-muted">{l.machine}</span> },
    { key: "agence", label: "Agence", render: (l) => <span className="text-texte">{l.agence}</span> },
    {
      key: "status",
      label: "Statut",
      render: (l) => {
        const s = statut[l.status] ?? statut.Inactif;
        return (
          <span className={`inline-flex items-center gap-2 ${s.label}`}>
            <span className={`material-symbols-rounded text-[10px] ${s.tone}`} style={{ fontVariationSettings: "'FILL' 1" }}>circle</span>
            {l.status}
          </span>
        );
      },
    },
    {
      key: "apps",
      label: "Applications",
      render: (l) => (
        <div className="flex gap-1.5">
          {l.apps.map((a) => (
            <span key={a} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-2 border border-border text-texte">
              {a}
            </span>
          ))}
        </div>
      ),
    },
    { key: "worked", label: "Temps travaillé", align: "right", render: (l) => <span className="font-mono font-medium text-texte">{l.worked}</span> },
  ];

  return (
    <div>
      <PageHeader title="Activité des postes" subtitle="Surveillance de l'activité et détection d'inactivité (seuil 5 min).">
        <Button variant="secondary" icon="refresh" onClick={() => toast("Données actualisées", "info")}>
          Actualiser
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile icon="bolt" label="Postes actifs" value="612" color="emerald" />
        <StatTile icon="snooze" label="Inactifs" value="192" color="amber" />
        <StatTile icon="lock" label="Verrouillés" value="37" color="violet" />
        <StatTile icon="report" label="Incidents" value="3" color="rose" />
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-ink">Flux d'activité en direct</h2>
        </div>
        <Table columns={colonnes} data={activity} rowKey={(l) => l.id} />
      </div>
    </div>
  );
}
