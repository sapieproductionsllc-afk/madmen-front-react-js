import { NavLink } from "react-router-dom";
import Icon from "../ui/Icon.jsx";
import { alertesNonLues } from "../../data/datasets.js";

// Navigation regroupée par pôle métier (chaque page a un rôle unique).
const navGroups = [
  {
    title: "Pilotage",
    items: [
      { label: "Tableau de bord", icon: "space_dashboard", to: "/" },
      { label: "Rapports & Analyses", icon: "monitoring", to: "/rapports" },
      { label: "Alertes", icon: "notifications", to: "/alertes", badge: alertesNonLues ? String(alertesNonLues) : null },
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
        `group relative flex items-center gap-3 pl-3 pr-2.5 py-2 rounded-lg text-sm transition-all duration-150 ease-out ${
          isActive
            ? "bg-brand-50 text-brand-700 font-medium"
            : "text-muted hover:bg-surface-2 hover:text-texte"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Barre d'accent indigo à gauche (état actif) */}
          <span
            aria-hidden="true"
            className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-brand-600 transition-opacity duration-150 ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          />
          <Icon
            name={item.icon}
            className={`text-[20px] transition-colors ${isActive ? "text-brand-600" : "text-subtle group-hover:text-muted"}`}
            filled={isActive}
          />
          <span className="truncate">{item.label}</span>
          {item.badge && (
            <span className="ml-auto bg-rose-400/10 text-rose-400 text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full">
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
          className="fixed inset-0 bg-canvas/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 z-50 lg:z-30 flex flex-col h-full w-[264px] py-5 px-3 bg-surface border-r border-border overflow-y-auto scroll-thin transform transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Marque (mobile : avec bouton fermer) */}
        <div className="px-2 mb-6 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-soft">
              <Icon name="fingerprint" className="text-canvas text-[18px]" filled />
            </span>
            <span className="text-base font-bold text-ink tracking-tight">MADMEN</span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 -mr-1 flex items-center justify-center rounded-lg text-subtle hover:text-texte hover:bg-surface-2 transition-colors"
            aria-label="Fermer le menu"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Pôles */}
        <nav className="flex-1 space-y-6">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="kicker px-3 mb-2">{group.title}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <LienNav key={item.to} item={item} onNavigate={onClose} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bloc d'aide / scan rapide */}
        <div className="px-1 pt-5">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-4 text-canvas shadow-glow">
            {/* Halo décoratif discret */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-10 -right-8 w-28 h-28 rounded-full bg-white/10 blur-2xl"
            />
            <div className="relative">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center ring-1 ring-white/10">
                  <Icon name="qr_code_scanner" className="text-[18px]" />
                </span>
                <span className="text-sm font-semibold tracking-tight">Scan rapide</span>
              </div>
              <p className="text-xs text-canvas/70 leading-relaxed mb-3.5">
                Pointez un employé via son badge ou son empreinte.
              </p>
              <button className="w-full bg-canvas/15 hover:bg-canvas/25 active:translate-y-px text-canvas text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                <Icon name="bolt" className="text-[16px]" filled />
                Lancer un scan
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
