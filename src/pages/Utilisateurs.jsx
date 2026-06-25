import { useEffect, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import Table from "../components/ui/Table.jsx";
import Button from "../components/ui/Button.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { apiGet } from "../lib/api.js";

// Statut API (minuscule) -> libellé attendu par le JSX/StatusPill.
const STATUT_USER = { actif: "Actif", suspendu: "Suspendu", conge: "En congé" };

// Utilisateur API -> forme attendue par le JSX (champs identiques au mock src/data).
function mapUtilisateur(u) {
  return {
    id: u.id, // rowKey
    name: u.name || "",
    email: u.email || "",
    role: u.role || "",
    agence: "—", // absent de l'API -> valeur neutre (le JSX attend `agence`)
    status: STATUT_USER[u.statut] || u.statut || "Actif",
    lastLogin: u.derniere_connexion || "—",
  };
}

// Rôle API ({ role, users }) -> forme attendue par le JSX (champs identiques au mock).
function mapRole(r) {
  return {
    name: r.role || "",
    desc: "", // absent de l'API -> valeur neutre
    users: r.users ?? 0,
    tone: "slate", // absent de l'API -> tonalité neutre valide
  };
}

export default function Utilisateurs({ embedded = false }) {
  const { toast } = useUI();

  const [utilisateurs, setUtilisateurs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  // Données RÉELLES depuis l'API (remplace les mocks de src/data).
  useEffect(() => {
    Promise.all([apiGet("/api/utilisateurs"), apiGet("/api/roles")])
      .then(([dataU, dataR]) => {
        setUtilisateurs((Array.isArray(dataU) ? dataU : []).map(mapUtilisateur));
        setRoles((Array.isArray(dataR) ? dataR : []).map(mapRole));
      })
      .catch((e) => setErreur(e.message || "Erreur de chargement"))
      .finally(() => setChargement(false));
  }, []);

  // Aucune route backend de suspension d'accès n'existe -> action honnête (pas de faux succès).
  const suspendre = (u) =>
    toast(`Suspension d'accès bientôt disponible (${u.name})`, "info");

  const colonnes = [
    {
      key: "name",
      label: "Utilisateur",
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} size="w-8 h-8" />
          <div>
            <p className="text-sm font-medium text-ink">{u.name}</p>
            <p className="text-xs text-subtle">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "role", label: "Rôle", render: (u) => <span className="font-medium text-texte">{u.role}</span> },
    { key: "agence", label: "Agence", render: (u) => <span className="text-texte">{u.agence}</span> },
    { key: "lastLogin", label: "Dernier accès", render: (u) => <span className="text-muted">{u.lastLogin}</span> },
    { key: "status", label: "Statut", render: (u) => <StatusPill label={u.status} tone={u.status === "Actif" ? "emerald" : "rose"} /> },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (u) => (
        <button onClick={() => suspendre(u)} className="text-subtle hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1.5 transition-colors" title="Suspendre l'accès">
          <Icon name="block" className="text-[18px]" />
        </button>
      ),
    },
  ];

  const action = (
    <Button icon="person_add" onClick={() => toast("Invitation d'utilisateur bientôt disponible", "info")}>
      Inviter un utilisateur
    </Button>
  );

  return (
    <div className={embedded ? "space-y-5" : ""}>
      {embedded ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-muted inline-flex items-center gap-2"><Icon name="group" className="text-[16px]" /> {utilisateurs.length} comptes · <span className="text-texte font-medium">{roles.length} rôles</span></p>
          {action}
        </div>
      ) : (
        <PageHeader title="Utilisateurs & Rôles" subtitle="Comptes, permissions et traçabilité des accès.">{action}</PageHeader>
      )}

      {chargement ? (
        <div className="card py-16 text-center">
          <Icon name="progress_activity" className="text-faint text-[40px] animate-spin" />
          <p className="mt-2 text-sm text-muted">Chargement des utilisateurs…</p>
        </div>
      ) : erreur ? (
        <div className="card py-16 text-center">
          <Icon name="error" className="text-rose-500 text-[40px]" />
          <p className="mt-2 text-sm text-muted">{erreur}</p>
        </div>
      ) : (
        <>
          <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 ${embedded ? "" : "mb-6"}`}>
            {roles.map((r) => (
              <div key={r.name} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <StatusPill label={r.name} tone={r.tone} dot={false} />
                  <span className="text-xs text-subtle">{r.users} compte(s)</span>
                </div>
                <p className="text-xs text-muted">{r.desc}</p>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-ink">Comptes utilisateurs</h2>
            </div>
            <Table columns={colonnes} data={utilisateurs} rowKey={(u) => u.id} />
          </div>
        </>
      )}
    </div>
  );
}
