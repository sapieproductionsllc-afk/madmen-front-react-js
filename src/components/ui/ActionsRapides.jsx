import { useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";

// Rangée d'actions rapides en pied de carte → ouvre la fiche au bon onglet.
const actions = [
  { icon: "person", label: "Profil", onglet: "Résumé" },
  { icon: "event_available", label: "Présence", onglet: "Présence" },
  { icon: "payments", label: "Paiement", onglet: "Paiements" },
  { icon: "bolt", label: "Activité", onglet: "Activité" },
];

export default function ActionsRapides({ id }) {
  const navigate = useNavigate();
  return (
    <div className="mt-auto grid grid-cols-4 border-t border-border divide-x divide-border">
      {actions.map((a) => (
        <button
          key={a.label}
          title={a.label}
          aria-label={a.label}
          onClick={(ev) => {
            ev.stopPropagation();
            navigate(`/employes/${id}`, { state: { onglet: a.onglet } });
          }}
          className="py-2.5 flex items-center justify-center text-subtle hover:text-or-700 hover:bg-or-50 transition-colors"
        >
          <Icon name={a.icon} className="text-[18px]" />
        </button>
      ))}
    </div>
  );
}
