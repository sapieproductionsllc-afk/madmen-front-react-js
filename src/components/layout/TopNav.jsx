import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "../ui/Icon.jsx";
import Avatar from "../ui/Avatar.jsx";
import { useUI } from "../ui/UIProvider.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { alertes, employes, agencesList } from "../../data/datasets.js";
import logo from "../../assets/logo.png";

// Photo de l'admin connecté (déterministe par matricule — cohérente avec la page profil).
const photoAdmin = (u) => `https://i.pravatar.cc/120?u=${encodeURIComponent(u?.matricule || u?.name || "admin")}`;

const iconeAlerte = { Critique: "gpp_bad", Moyen: "warning", Faible: "info" };
const couleurAlerte = {
  Critique: "bg-rose-50 text-rose-600",
  Moyen: "bg-amber-50 text-amber-600",
  Faible: "bg-slate-50 text-slate-600",
};

function ItemMenu({ icon, label, onClick, to, state, danger }) {
  const classe = `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
    danger ? "text-rose-600 hover:bg-rose-50" : "text-muted hover:bg-surface-2 hover:text-texte"
  }`;
  const contenu = (
    <>
      <Icon name={icon} className="text-[20px]" />
      {label}
    </>
  );
  if (to)
    return (
      <Link to={to} state={state} onClick={onClick} className={classe}>
        {contenu}
      </Link>
    );
  return (
    <button onClick={onClick} className={classe}>
      {contenu}
    </button>
  );
}

export default function TopNav({ onMenuClick }) {
  const { openAddEmployee, agence, setAgence, toast } = useUI();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(null); // "notif" | "profil" | "actions" | "agence"
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Raccourci Ctrl/⌘ + K
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const nonLues = alertes.filter((a) => !a.read).length;
  const fermer = () => setMenu(null);
  const basculer = (m) => setMenu((c) => (c === m ? null : m));
  const seDeconnecter = () => {
    fermer();
    logout();
    navigate("/login", { replace: true });
  };

  // Recherche
  const q = query.trim().toLowerCase();
  const resEmployes = q
    ? employes.filter((e) => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.fonction.toLowerCase().includes(q)).slice(0, 5)
    : [];
  const resAgences = q ? agencesList.filter((a) => a.toLowerCase().includes(q)).slice(0, 3) : [];
  const aResultats = resEmployes.length + resAgences.length > 0;

  const choisirAgence = (a) => {
    setAgence(a);
    fermer();
    toast(`Vue filtrée sur : ${a}`, "info");
  };

  const actions = [
    { label: "Payer les employés", icon: "payments", onClick: () => { fermer(); navigate("/finance"); } },
    { label: "Ajouter un employé", icon: "person_add", onClick: () => { fermer(); openAddEmployee(); } },
    { label: "Enrôler (biométrie)", icon: "fingerprint", onClick: () => { fermer(); navigate("/enrolement"); } },
  ];

  const anyOpen = menu || (searchOpen && q);

  return (
    <header className="flex items-center gap-3 h-16 w-full px-4 md:px-6 sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border">
      {/* Overlay de fermeture */}
      {anyOpen && (
        <div className="fixed inset-0 z-40" onClick={() => { fermer(); setSearchOpen(false); }} />
      )}

      {/* Gauche : menu + logo */}
      <div className="flex items-center gap-3 md:gap-4 shrink-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 -ml-1.5 flex items-center justify-center rounded-lg text-muted hover:text-texte hover:bg-surface-2 transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Icon name="menu" />
        </button>
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="MADMEN" className="w-9 h-9 object-contain" />
          <span className="text-lg font-bold text-ink tracking-tight hidden sm:inline">MADMEN</span>
        </div>
      </div>

      {/* Centre : recherche fonctionnelle */}
      <div className="flex-1 flex justify-center px-2">
        <div className="relative w-full max-w-xl hidden md:block z-50">
          <div className="flex items-center bg-surface-2 border border-transparent rounded-lg px-3.5 py-2.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/15 focus-within:bg-surface transition">
            <Icon name="search" className="text-subtle text-[20px] mr-2.5" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              className="bg-transparent border-none outline-none text-sm w-full text-texte placeholder:text-subtle"
              placeholder="Rechercher un employé ou une agence…"
              type="text"
            />
            <span className="ml-2 text-[10px] font-medium text-subtle bg-surface border border-border rounded-md px-1.5 py-0.5 shrink-0">Ctrl K</span>
          </div>

          {searchOpen && q && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-surface border border-border rounded-2xl shadow-pop overflow-hidden max-h-96 overflow-y-auto scroll-thin modal-in">
              {!aResultats && <p className="px-4 py-6 text-sm text-subtle text-center">Aucun résultat pour « {query} ».</p>}
              {resEmployes.length > 0 && (
                <div className="py-1.5">
                  <p className="kicker px-4 py-1">Employés</p>
                  {resEmployes.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => { setQuery(""); setSearchOpen(false); navigate("/employes"); }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-2 text-left transition-colors"
                    >
                      <Avatar name={e.name} size="w-7 h-7" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-texte truncate">{e.name}</p>
                        <p className="text-xs text-subtle">{e.fonction} · {e.id}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {resAgences.length > 0 && (
                <div className="py-1.5 border-t border-border">
                  <p className="kicker px-4 py-1">Agences</p>
                  {resAgences.map((a) => (
                    <button
                      key={a}
                      onClick={() => { setQuery(""); setSearchOpen(false); choisirAgence(a); navigate("/"); }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-2 text-left transition-colors"
                    >
                      <span className="w-7 h-7 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                        <Icon name="apartment" className="text-[16px]" />
                      </span>
                      <span className="text-sm text-texte">{a}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Droite : agence + actions + notif + profil */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Sélecteur d'agence (visible aussi sur mobile : pilotage central, libellé masqué en compact) */}
        <div className="relative block z-50">
          <button
            onClick={() => basculer("agence")}
            className="flex items-center gap-2 px-2.5 lg:px-3 py-2 rounded-lg border border-border-strong bg-surface hover:bg-surface-2 text-sm text-texte transition-colors max-w-[180px]"
            aria-haspopup="listbox"
            aria-expanded={menu === "agence"}
            aria-label={`Filtrer par agence (actuel : ${agence})`}
          >
            <Icon name="apartment" className="text-subtle text-[18px]" />
            <span className="truncate hidden lg:inline">{agence}</span>
            <Icon name="expand_more" className={`text-subtle text-[18px] transition-transform duration-150 ${menu === "agence" ? "rotate-180" : ""}`} />
          </button>
          {menu === "agence" && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-2xl shadow-pop p-1.5 modal-in">
              {["Toutes les agences", ...agencesList].map((a) => (
                <button
                  key={a}
                  onClick={() => choisirAgence(a)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    agence === a ? "bg-brand-50 text-brand-700 font-medium" : "text-muted hover:bg-surface-2 hover:text-texte"
                  }`}
                >
                  {a}
                  {agence === a && <Icon name="check" className="text-brand-600 text-[18px]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions rapides */}
        <div className="relative z-50">
          <button
            onClick={() => basculer("actions")}
            className="bg-brand-600 text-canvas px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 active:translate-y-px transition-colors flex items-center gap-1.5 shadow-soft"
            aria-haspopup="menu"
            aria-expanded={menu === "actions"}
          >
            <Icon name="add" className="text-[18px]" />
            <span className="hidden sm:inline">Actions</span>
            <Icon name="expand_more" className={`text-[18px] -ml-0.5 transition-transform duration-150 ${menu === "actions" ? "rotate-180" : ""}`} />
          </button>
          {menu === "actions" && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-2xl shadow-pop p-1.5 modal-in">
              {actions.map((a) => (
                <ItemMenu key={a.label} icon={a.icon} label={a.label} onClick={a.onClick} />
              ))}
            </div>
          )}
        </div>

        {/* Notifications (accessible aussi sur mobile : badge non-lues critique) */}
        <div className="relative block z-50">
          <button
            onClick={() => basculer("notif")}
            className="relative w-9 h-9 rounded-lg hover:bg-surface-2 text-muted hover:text-texte transition-colors flex items-center justify-center"
            aria-label={`Notifications${nonLues > 0 ? ` (${nonLues} non lues)` : ""}`}
            aria-haspopup="menu"
            aria-expanded={menu === "notif"}
          >
            <Icon name="notifications" />
            {nonLues > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold tabular-nums flex items-center justify-center ring-2 ring-surface">
                {nonLues}
              </span>
            )}
          </button>
          {menu === "notif" && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-2xl shadow-pop overflow-hidden modal-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-semibold text-ink tracking-tight">Notifications</span>
                {nonLues > 0 && (
                  <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 tabular-nums px-2 py-0.5 rounded-full">{nonLues} non lues</span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto scroll-thin">
                {alertes.slice(0, 4).map((a) => (
                  <Link key={a.id} to="/alertes" onClick={fermer} className="flex items-start gap-3 px-4 py-3 hover:bg-surface-2 border-b border-border last:border-0 transition-colors">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${couleurAlerte[a.severity] ?? couleurAlerte.Faible}`}>
                      <Icon name={iconeAlerte[a.severity] ?? "notifications"} className="text-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-texte truncate">{a.type}</p>
                      <p className="text-xs text-muted line-clamp-1">{a.message}</p>
                      <p className="text-[11px] text-subtle mt-0.5">{a.time} · {a.agence}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <Link to="/alertes" onClick={fermer} className="block text-center py-2.5 text-sm font-medium text-brand-600 hover:bg-surface-2 border-t border-border transition-colors">
                Voir toutes les alertes
              </Link>
            </div>
          )}
        </div>

        {/* Profil */}
        <div className="relative z-50">
          <button
            onClick={() => basculer("profil")}
            className="flex items-center gap-2 rounded-lg hover:bg-surface-2 p-1 transition-colors"
            aria-label="Mon compte"
            aria-haspopup="menu"
            aria-expanded={menu === "profil"}
          >
            <Avatar src={photoAdmin(user)} name={user?.name || "Utilisateur"} size="w-9 h-9" />
            <Icon name="expand_more" className={`text-subtle text-[18px] hidden sm:inline transition-transform duration-150 ${menu === "profil" ? "rotate-180" : ""}`} />
          </button>
          {menu === "profil" && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-surface border border-border rounded-2xl shadow-pop p-1.5 modal-in">
              <div className="flex items-center gap-3 px-2.5 py-2.5 mb-1 border-b border-border">
                <Avatar src={photoAdmin(user)} name={user?.name || "Utilisateur"} size="w-9 h-9" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{user?.name}</p>
                  <p className="text-xs text-subtle truncate">{user?.role}</p>
                </div>
              </div>
              <ItemMenu icon="person" label="Mon profil" to="/profil" onClick={fermer} />
              <ItemMenu icon="settings" label="Paramètres" to="/administration" state={{ section: "parametres" }} onClick={fermer} />
              <ItemMenu icon="help" label="Aide & support" to="/aide" onClick={fermer} />
              <div className="border-t border-border my-1" />
              <ItemMenu icon="logout" label="Déconnexion" onClick={seDeconnecter} danger />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
