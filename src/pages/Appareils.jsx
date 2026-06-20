import PageHeader from "../components/ui/PageHeader.jsx";
import StatTile from "../components/ui/StatTile.jsx";
import Table from "../components/ui/Table.jsx";
import Button from "../components/ui/Button.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { appareils } from "../data/datasets.js";

const tone = { "En ligne": "emerald", "Hors ligne": "rose", Maintenance: "amber" };
const iconeType = { Empreinte: "fingerprint", RFID: "badge", "Reconnaissance faciale": "face" };

export default function Appareils() {
  const { toast } = useUI();
  const compte = (s) => appareils.filter((a) => a.status === s).length;

  const colonnes = [
    {
      key: "name",
      label: "Appareil",
      render: (a) => (
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg bg-surface-2 text-muted flex items-center justify-center">
            <Icon name={iconeType[a.type] ?? "sensors"} className="text-[20px]" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink">{a.name}</p>
            <p className="text-xs text-subtle">{a.type}</p>
          </div>
        </div>
      ),
    },
    { key: "agence", label: "Agence", render: (a) => <span className="text-texte">{a.agence}</span> },
    { key: "status", label: "État", render: (a) => <StatusPill label={a.status} tone={tone[a.status]} /> },
    { key: "lastSync", label: "Dernière synchro.", render: (a) => <span className="text-muted">{a.lastSync}</span> },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (a) => (
        <Button variant="ghost" size="sm" icon="sync" onClick={() => toast(`${a.name} synchronisé`)}>
          Synchroniser
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Appareils biométriques" subtitle="Lecteurs d'empreintes, badges RFID et caméras faciales.">
        <Button icon="add" onClick={() => toast("Ajout d'appareil ouvert", "info")}>
          Ajouter un appareil
        </Button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatTile icon="wifi" label="En ligne" value={compte("En ligne")} color="emerald" />
        <StatTile icon="wifi_off" label="Hors ligne" value={compte("Hors ligne")} color="rose" />
        <StatTile icon="build" label="Maintenance" value={compte("Maintenance")} color="amber" />
      </div>

      <div className="card">
        <Table columns={colonnes} data={appareils} rowKey={(a) => a.id} />
      </div>
    </div>
  );
}
