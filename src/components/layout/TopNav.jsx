import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "../ui/Icon.jsx";
import Avatar from "../ui/Avatar.jsx";
import { useUI } from "../ui/UIProvider.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { alertes } from "../../data/datasets.js";

const iconeAlerte = { Critique: "gpp_bad", Moyen: "warning", Faible: "info", default: "notifications" };
const couleurAlerte = { Critique: "bg-rose-50 text-rose-600", Moyen: "bg-amber-50 text-amber-600", Faible: "bg-slate-100 text-slate-500" };

function ItemMenu({ icon, label, onClick, to, danger }) {
  const classe = `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
    danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-600 hover:bg-slate-100"
  }`;
  const contenu = (
    <>
      <Icon name={icon} className="text-[20px]" />
      {label}
    </>
  );
  if (to)
    return (
      <Link to={to} onClick={onClick} className={classe}>
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
  const { openAddEmployee } = useUI();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(null); // "profil" | "notif" | null

  const nonLues = alertes.filter((a) => !a.read).length;
  const fermer = () => setMenu(null);
  const basculer = (m) => setMenu((cur) => (cur === m ? null : m));

  const seDeconnecter = () => {
    fermer();
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="flex justify-between items-center h-16 w-full px-4 md:px-6 sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center gap-3 md:gap-5">
        <button onClick={onMenuClick} className="lg:hidden text-slate-500 hover:text-slate-900 transition-colors" aria-label="Ouvrir le menu">
          <Icon name="menu" />
        </button>

        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <Icon name="fingerprint" className="text-white text-[18px]" filled />
          </span>
          <span className="text-lg font-bold text-slate-900 tracking-tight">MADMEN</span>
        </div>

        <div className="hidden md:flex items-center bg-slate-100 rounded-lg px-3 py-2 w-56 lg:w-72 focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:bg-white transition">
          <Icon name="search" className="text-slate-400 text-[18px] mr-2" />
          <input className="bg-transparent border-none outline-none text-sm w-full text-slate-700" placeholder="Rechercher un employé, une agence…" type="text" />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={openAddEmployee}
          className="bg-brand-600 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Icon name="add" className="text-[18px]" />
          <span className="hidden sm:inline">Ajouter un employé</span>
        </button>

        {/* Overlay de fermeture */}
        {menu && <div className="fixed inset-0 z-40" onClick={fermer} />}

        {/* Notifications */}
        <div className="relative hidden sm:block z-50">
          <button
            onClick={() => basculer("notif")}
            className="relative w-9 h-9 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center"
            aria-label="Notifications"
          >
            <Icon name="notifications" />
            {nonLues > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold flex items-center justify-center ring-2 ring-white">
                {nonLues}
              </span>
            )}
          </button>

          {menu === "notif" && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-xl shadow-lift overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-800">Notifications</span>
                <span className="text-xs text-rose-600 font-medium">{nonLues} non lues</span>
              </div>
              <div className="max-h-80 overflow-y-auto scroll-thin">
                {alertes.slice(0, 4).map((a) => (
                  <Link
                    key={a.id}
                    to="/alertes"
                    onClick={fermer}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${couleurAlerte[a.severity] ?? couleurAlerte.Faible}`}>
                      <Icon name={iconeAlerte[a.severity] ?? iconeAlerte.default} className="text-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{a.type}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{a.message}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{a.time} · {a.agence}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <Link to="/alertes" onClick={fermer} className="block text-center py-2.5 text-sm font-medium text-brand-600 hover:bg-slate-50 border-t border-slate-100">
                Voir toutes les alertes
              </Link>
            </div>
          )}
        </div>

        {/* Profil */}
        <div className="relative z-50">
          <button onClick={() => basculer("profil")} className="flex items-center gap-2 rounded-lg hover:bg-slate-100 p-1 transition-colors" aria-label="Mon compte">
            <Avatar name={user?.name || "Utilisateur"} size="w-9 h-9" />
            <Icon name="expand_more" className="text-slate-400 text-[18px] hidden sm:inline" />
          </button>

          {menu === "profil" && (
            <div className="absolute right-0 top-12 w-60 bg-white border border-slate-200 rounded-xl shadow-lift p-1.5">
              <div className="px-3 py-2.5 mb-1 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-400">{user?.role}</p>
              </div>
              <ItemMenu icon="person" label="Mon profil" onClick={fermer} />
              <ItemMenu icon="settings" label="Paramètres" to="/parametres" onClick={fermer} />
              <ItemMenu icon="help" label="Aide & support" onClick={fermer} />
              <div className="border-t border-slate-100 my-1" />
              <ItemMenu icon="logout" label="Déconnexion" onClick={seDeconnecter} danger />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
