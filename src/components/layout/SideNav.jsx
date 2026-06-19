import { NavLink } from "react-router-dom";
import Icon from "../ui/Icon.jsx";

// Navigation regroupée par pôle métier (chaque page a un rôle unique).
const navGroups = [
  {
    title: "Pilotage",
    items: [
      { label: "Tableau de bord", icon: "space_dashboard", to: "/" },
      { label: "Rapports & Analyses", icon: "monitoring", to: "/rapports" },
      { label: "Alertes", icon: "notifications", to: "/alertes", badge: "8" },
    ],
  },
  {
    title: "Personnel",
    items: [
      { label: "Employés", icon: "groups", to: "/employes" },
      { label: "Enrôlement", icon: "fingerprint", to: "/enrolement" },
      { label: "Organisation", icon: "apartment", to: "/organisation" },
    ],
  },
  {
    title: "Temps & Activité",
    items: [
      { label: "Présence & Pointage", icon: "co_present", to: "/presence" },
      { label: "Activité des postes", icon: "desktop_windows", to: "/activite" },
      { label: "Productivité", icon: "trending_up", to: "/productivite" },
    ],
  },
  {
    title: "Finance & Paie",
    items: [{ label: "Finance & Paie", icon: "payments", to: "/finance" }],
  },
  {
    title: "Administration",
    items: [
      { label: "Appareils biométriques", icon: "sensors", to: "/appareils" },
      { label: "Utilisateurs & Rôles", icon: "admin_panel_settings", to: "/utilisateurs" },
      { label: "Paramètres", icon: "settings", to: "/parametres" },
    ],
  },
];

function LienNav({ item, onNavigate }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? "bg-brand-50 text-brand-700 font-medium"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon name={item.icon} className="text-[20px]" filled={isActive} />
          <span>{item.label}</span>
          {item.badge && (
            <span className="ml-auto bg-rose-100 text-rose-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export default function SideNav({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 z-50 lg:z-30 flex flex-col h-full w-64 py-5 px-3 bg-white border-r border-slate-200 overflow-y-auto scroll-thin transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Marque (mobile : avec bouton fermer) */}
        <div className="px-2 mb-6 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <Icon name="fingerprint" className="text-white text-[18px]" filled />
            </span>
            <span className="text-base font-bold text-slate-900">MADMEN</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Fermer">
            <Icon name="close" />
          </button>
        </div>

        {/* Pôles */}
        <nav className="flex-1 space-y-5">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="kicker px-3 mb-1.5">{group.title}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <LienNav key={item.to} item={item} onNavigate={onClose} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bloc d'aide / scan rapide */}
        <div className="px-1 pt-4">
          <div className="rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 p-4 text-white">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name="qr_code_scanner" className="text-[20px]" />
              <span className="text-sm font-semibold">Scan rapide</span>
            </div>
            <p className="text-xs text-white/75 mb-3">Pointez un employé via son badge ou son empreinte.</p>
            <button className="w-full bg-white/15 hover:bg-white/25 text-white text-xs font-medium py-2 rounded-lg transition-colors">
              Lancer un scan
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
