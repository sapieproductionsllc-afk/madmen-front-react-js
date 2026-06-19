import PageHeader from "../components/ui/PageHeader.jsx";
import Table from "../components/ui/Table.jsx";
import Button from "../components/ui/Button.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { utilisateurs, roles } from "../data/datasets.js";

export default function Utilisateurs() {
  const { confirm, toast } = useUI();

  const suspendre = (u) =>
    confirm({
      title: "Suspendre cet accès ?",
      message: `${u.name} ne pourra plus se connecter à la plateforme jusqu'à réactivation.`,
      confirmLabel: "Suspendre l'accès",
      danger: true,
      onConfirm: () => toast(`Accès de ${u.name} suspendu`, "info"),
    });

  const colonnes = [
    {
      key: "name",
      label: "Utilisateur",
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} size="w-8 h-8" />
          <div>
            <p className="text-sm font-medium text-slate-800">{u.name}</p>
            <p className="text-xs text-slate-400">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "role", label: "Rôle", render: (u) => <span className="font-medium text-slate-700">{u.role}</span> },
    { key: "agence", label: "Agence", render: (u) => <span className="text-slate-600">{u.agence}</span> },
    { key: "lastLogin", label: "Dernier accès", render: (u) => <span className="text-slate-500">{u.lastLogin}</span> },
    { key: "status", label: "Statut", render: (u) => <StatusPill label={u.status} tone={u.status === "Actif" ? "emerald" : "rose"} /> },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (u) => (
        <button onClick={() => suspendre(u)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg p-1.5 transition-colors" title="Suspendre l'accès">
          <Icon name="block" className="text-[18px]" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Utilisateurs & Rôles" subtitle="Comptes, permissions et traçabilité des accès.">
        <Button icon="person_add" onClick={() => toast("Invitation d'utilisateur ouverte", "info")}>
          Inviter un utilisateur
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {roles.map((r) => (
          <div key={r.name} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <StatusPill label={r.name} tone={r.tone} dot={false} />
              <span className="text-xs text-slate-400">{r.users} compte(s)</span>
            </div>
            <p className="text-xs text-slate-500">{r.desc}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">Comptes utilisateurs</h2>
        </div>
        <Table columns={colonnes} data={utilisateurs} rowKey={(u) => u.id} />
      </div>
    </div>
  );
}
