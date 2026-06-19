import { useMemo, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import StatTile from "../components/ui/StatTile.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import Tabs from "../components/ui/Tabs.jsx";
import Table from "../components/ui/Table.jsx";
import Button from "../components/ui/Button.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import Modal from "../components/ui/Modal.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { employes } from "../data/datasets.js";

const tonePourStatut = { Actif: "emerald", Congé: "amber", Suspendu: "rose" };

function LigneDetail({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <Icon name={icon} className="text-slate-400 text-[20px]" />
      <span className="text-sm text-slate-500 w-32 shrink-0">{label}</span>
      <span className="text-sm text-slate-800 font-medium">{value}</span>
    </div>
  );
}

export default function Employes() {
  const { openAddEmployee, confirm, toast } = useUI();
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("Tous");
  const [detail, setDetail] = useState(null);

  const liste = useMemo(() => {
    return employes.filter((e) => {
      const okStatut = filtre === "Tous" || e.status === filtre;
      const okRecherche =
        !recherche ||
        e.name.toLowerCase().includes(recherche.toLowerCase()) ||
        e.id.toLowerCase().includes(recherche.toLowerCase()) ||
        e.fonction.toLowerCase().includes(recherche.toLowerCase());
      return okStatut && okRecherche;
    });
  }, [recherche, filtre]);

  const compte = (s) => employes.filter((e) => e.status === s).length;

  const suspendre = (emp) =>
    confirm({
      title: "Suspendre cet employé ?",
      message: `Le compte de ${emp.name} sera suspendu et son accès aux postes bloqué. Cette action est réversible.`,
      confirmLabel: "Suspendre",
      danger: true,
      onConfirm: () => toast(`${emp.name} a été suspendu`, "info"),
    });

  const colonnes = [
    {
      key: "name",
      label: "Employé",
      render: (e) => (
        <div className="flex items-center gap-3">
          <Avatar name={e.name} size="w-8 h-8" />
          <div>
            <p className="text-sm font-medium text-slate-800">{e.name}</p>
            <p className="text-xs text-slate-400 font-mono">{e.id}</p>
          </div>
        </div>
      ),
    },
    { key: "fonction", label: "Fonction", render: (e) => <span className="text-slate-600">{e.fonction}</span> },
    { key: "agence", label: "Agence", render: (e) => <span className="text-slate-600">{e.agence}</span> },
    { key: "status", label: "Statut", render: (e) => <StatusPill label={e.status} tone={tonePourStatut[e.status]} /> },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (e) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => setDetail(e)}>
            Voir
          </Button>
          <button
            onClick={() => suspendre(e)}
            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg p-1.5 transition-colors"
            title="Suspendre"
          >
            <Icon name="block" className="text-[18px]" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Employés" subtitle={`${employes.length} employés enregistrés`}>
        <Button variant="secondary" icon="download">
          Exporter
        </Button>
        <Button icon="person_add" onClick={openAddEmployee}>
          Ajouter un employé
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile icon="groups" label="Total" value={employes.length} color="indigo" />
        <StatTile icon="how_to_reg" label="Actifs" value={compte("Actif")} color="emerald" />
        <StatTile icon="beach_access" label="En congé" value={compte("Congé")} color="amber" />
        <StatTile icon="block" label="Suspendus" value={compte("Suspendu")} color="rose" />
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <Tabs
            tabs={[
              { label: "Tous", value: "Tous" },
              { label: "Actifs", value: "Actif" },
              { label: "Congé", value: "Congé" },
              { label: "Suspendus", value: "Suspendu" },
            ]}
            active={filtre}
            onChange={setFiltre}
          />
          <SearchInput value={recherche} onChange={setRecherche} placeholder="Rechercher un employé…" className="sm:w-72" />
        </div>
        <Table columns={colonnes} data={liste} rowKey={(e) => e.id} emptyLabel="Aucun employé ne correspond." />
      </div>

      {/* Modale de détail */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name}
        subtitle={detail?.fonction}
        icon="badge"
        footer={
          <Button variant="secondary" onClick={() => setDetail(null)}>
            Fermer
          </Button>
        }
      >
        {detail && (
          <div>
            <div className="flex items-center gap-4 mb-5">
              <Avatar name={detail.name} size="w-16 h-16" />
              <div>
                <p className="text-lg font-semibold text-slate-900">{detail.name}</p>
                <StatusPill label={detail.status} tone={tonePourStatut[detail.status]} />
              </div>
            </div>
            <LigneDetail icon="badge" label="Matricule" value={detail.id} />
            <LigneDetail icon="work" label="Fonction" value={detail.fonction} />
            <LigneDetail icon="domain" label="Département" value={detail.department} />
            <LigneDetail icon="apartment" label="Agence" value={detail.agence} />
            <LigneDetail icon="call" label="Téléphone" value={detail.phone} />
            <LigneDetail icon="mail" label="Email" value={detail.email} />
          </div>
        )}
      </Modal>
    </div>
  );
}
