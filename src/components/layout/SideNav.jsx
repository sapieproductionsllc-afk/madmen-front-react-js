import { NavLink } from "react-router-dom";
import Icon from "../ui/Icon.jsx";
import logo from "../../assets/logo.png";

// Tracé « ECG » du moniteur K40 : un battement relatif (dx total = 100, revient à la ligne),
// répété deux fois pour un défilement sans couture (translateX -50%).
const BEAT = "h10 q4,-5 8,0 h6 l2,2 l3,-16 l3,22 l3,-8 h8 q6,-6 12,0 h45";
const ECG = `M0,20 ${BEAT} ${BEAT}`;
const K40_CONNECTE = true; // état de la pointeuse K40 (à brancher au backend)

// Navigation regroupée par pôle métier (chaque page a un rôle unique).
// NB : Alertes → accessible via la cloche du header ; Enrôlement → via la page Employés.
const navGroups = [
  {
    title: "Pilotage",
    items: [
      { label: "Tableau de bord", icon: "space_dashboard", to: "/" },
      { label: "Rapports & Analyses", icon: "monitoring", to: "/rapports" },
    ],
  },
  {
    title: "Gestion",
    items: [
      { label: "Agents", icon: "groups", to: "/employes" },
      { label: "Postes", icon: "desktop_windows", to: "/postes" },
      { label: "Finance & Paie", icon: "payments", to: "/finance" },
      // Objectifs masqué du menu (page et route conservées : /objectifs).
      { label: "Communication", icon: "forum", to: "/communication" },
    ],
  },
  {
    title: "Système",
    items: [{ label: "Administration", icon: "admin_panel_settings", to: "/administration" }],
  },
];

function LienNav({ item, onNavigate }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 pl-3.5 pr-3 py-2.5 rounded-lg text-sm transition-all duration-150 ease-out ${
          isActive
            ? "bg-white/[0.12] text-white font-medium"
            : "text-white/65 hover:bg-white/[0.07] hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Barre d'accent taupe à gauche (état actif) */}
          <span
            aria-hidden="true"
            className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-or-400 transition-opacity duration-150 ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          />
          <Icon
            name={item.icon}
            className={`text-[20px] transition-colors ${isActive ? "text-or-300" : "text-white/55 group-hover:text-white/85"}`}
            filled={isActive}
          />
          <span className="truncate">{item.label}</span>
          {item.badge && (
            <span className="ml-auto bg-rose-500 text-white text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full">
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
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 z-50 lg:z-30 flex flex-col h-full w-72 py-6 px-4 bg-sidebar border-r border-black/20 overflow-y-auto scroll-thin transform transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Marque (mobile : avec bouton fermer) */}
        <div className="px-2 mb-6 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-sand flex items-center justify-center shadow-soft p-1">
              <img src={logo} alt="MADMEN" className="w-full h-full object-contain" />
            </span>
            <span className="text-base font-bold text-white tracking-tight">MADMEN</span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 -mr-1 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fermer le menu"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Pôles */}
        <nav className="flex-1 space-y-7">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="kicker px-3.5 mb-3 !text-white/40">{group.title}</p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <LienNav key={item.to} item={item} onNavigate={onClose} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bloc d'aide / scan rapide — encart taupe (accent chaud sur le rail canard) */}
        <div className="px-1 pt-5">
          <div className="relative overflow-hidden rounded-2xl bg-sand p-4 text-ink shadow-card">
            <div className="relative">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
                    <Icon name="fingerprint" className="text-canvas text-[18px]" filled />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold tracking-tight leading-none">K40</p>
                    <p className="text-[11px] text-ink/60 mt-1">Pointeuse biométrique</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${K40_CONNECTE ? "text-emerald-600" : "text-rose-600"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${K40_CONNECTE ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                  {K40_CONNECTE ? "Connecté" : "Hors ligne"}
                </span>
              </div>
              <div className="relative h-12 rounded-lg overflow-hidden bg-[#08160f] ecg-grid ring-1 ring-black/30">
                <svg viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true" className={`absolute inset-y-0 h-full ${K40_CONNECTE ? "ecg-scroll" : ""}`} style={{ width: K40_CONNECTE ? "200%" : "100%", filter: `drop-shadow(0 0 2.5px ${K40_CONNECTE ? "rgba(52,211,153,.85)" : "rgba(240,113,106,.7)"})` }}>
                  <path d={K40_CONNECTE ? ECG : "M0,20 H200"} fill="none" stroke={K40_CONNECTE ? "#34d399" : "#f0716a"} strokeWidth="1.7" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
                <div className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-[#08160f] to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-[#08160f] to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
