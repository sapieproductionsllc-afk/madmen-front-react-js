import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "../ui/Icon.jsx";
import Avatar from "../ui/Avatar.jsx";
import { useUI } from "../ui/UIProvider.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { apiGet, apiPost } from "../../lib/api.js";
import { mapEmploye } from "../../lib/mappers.js";
import logo from "../../assets/logo.png";

// Photo de l'admin connecté (déterministe par matricule — cohérente avec la page profil).
const photoAdmin = (u) => `https://i.pravatar.cc/120?u=${encodeURIComponent(u?.matricule || u?.name || "admin")}`;

const iconeAlerte = { Critique: "gpp_bad", Moyen: "warning", Faible: "info" };
const couleurAlerte = {
  Critique: "bg-rose-50 text-rose-600",
  Moyen: "bg-amber-50 text-amber-600",
  Faible: "bg-slate-50 text-slate-600",
};

// Normalise la sévérité de l'API vers les clés attendues par le JSX (Critique/Moyen/Faible).
function normSeverite(s) {
  const v = String(s ?? "").toLowerCase();
  if (v.startsWith("crit") || v === "haute" || v === "high" || v === "élevé" || v === "eleve") return "Critique";
  if (v.startsWith("moy") || v === "medium" || v === "warning") return "Moyen";
  return "Faible";
}

// Extrait un HH:MM affichable depuis l'horodatage API (ISO, "HH:MM:SS", timestamp…).
function heureAlerte(h) {
  if (!h) return "00:00";
  const m = String(h).match(/(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "00:00";
}

// Mapping API (GET /api/alertes) -> forme exacte attendue par le JSX (mêmes champs que l'ancien mock).
function mapAlerte(a) {
  return {
    id: a.id,
    type: a.type || "Alerte",
    severity: normSeverite(a.severite),
    agence: a.agence || "—", // absent de l'API -> neutre (pas de champ agence renvoyé)
    time: heureAlerte(a.horodatage),
    message: a.message || "",
    read: Boolean(a.lu),
  };
}

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
  const { toast, refreshData, dataVersion } = useUI();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(null); // "notif" | "profil" | "actions" | "agence"
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Données RÉELLES depuis l'API (remplacent les mocks de src/data) : cloche + recherche globale.
  const [alertes, setAlertes] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [sync, setSync] = useState(false);
  const [autoSync, setAutoSync] = useState(true); // auto-synchro K40 toutes les 10 s
  const [lastSync, setLastSync] = useState(null);
  const [compteur, setCompteur] = useState(10); // décompte (s) avant la prochaine synchro
  const [etatSync, setEtatSync] = useState(null); // 'ok' | 'echec' : résultat de la dernière synchro
  const syncingRef = useRef(false); // garde anti-chevauchement (manuel + auto)
  const tickRef = useRef(10);

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

  // Chargement des alertes (cloche + compteur de non-lus) et des employés (recherche globale).
  useEffect(() => {
    Promise.all([apiGet("/api/alertes"), apiGet("/api/employes")])
      .then(([al, emp]) => {
        setAlertes((Array.isArray(al) ? al : []).map(mapAlerte));
        setEmployes((Array.isArray(emp) ? emp : []).map(mapEmploye));
      })
      .catch(() => {
        // Silencieux : la barre de navigation reste fonctionnelle, sans badge ni résultats.
        setAlertes([]);
        setEmployes([]);
      });
  }, [dataVersion]);

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
  const aResultats = resEmployes.length > 0;

  // Cœur de la synchro K40. silent=true => synchro de FOND (auto). Dans les DEUX cas on
  // rafraîchit la VUE via refreshData() (bump dataVersion) au lieu de recharger la page :
  // les nouvelles données apparaissent direct dans l'app, sans navigation ni reload.
  // Renvoie true (succès) / false (échec) / null (ignoré : déjà en cours) — pilote la pastille.
  const runSync = async ({ silent }) => {
    if (syncingRef.current) return null; // déjà en cours -> ne change pas l'état
    syncingRef.current = true;
    if (!silent) {
      setSync(true);
      toast("Synchronisation en cours…", "info");
    }
    let ok = false;
    try {
      const r = await apiPost("/api/k40/sync", {});
      setLastSync(new Date());
      ok = true;
      const nouveaux = Number(r?.traites ?? 0);
      if (!silent) {
        refreshData(); // rafraîchit les vues ouvertes, sans reload
        toast(nouveaux > 0 ? `Synchronisé — ${nouveaux} pointage(s) à jour` : "Déjà à jour", "success");
        setSync(false);
      } else if (nouveaux > 0) {
        refreshData(); // auto : on ne rafraîchit la vue QUE s'il y a du nouveau
        toast(`${nouveaux} nouveau(x) pointage(s) synchronisé(s)`, "success");
      }
    } catch (e) {
      ok = false;
      // En auto : échec silencieux (le K40 bufferise, on réessaiera au prochain tick).
      if (!silent) {
        toast(e?.message || "Échec de la synchronisation (K40 joignable ?)", "error");
        setSync(false);
      }
    }
    syncingRef.current = false;
    return ok;
  };

  // Décompte de 10 s : chaque seconde décrémente ; à 0 -> synchro K40 puis re-décompte.
  // Le résultat (ok/échec) colore la pastille en vert/rouge. Verrou anti-chevauchement.
  useEffect(() => {
    if (!autoSync) return undefined;
    tickRef.current = 10;
    setCompteur(10);
    const id = setInterval(() => {
      const next = tickRef.current - 1;
      if (next <= 0) {
        tickRef.current = 10;
        setCompteur(10);
        runSync({ silent: true }).then((ok) => { if (ok != null) setEtatSync(ok ? "ok" : "echec"); });
      } else {
        tickRef.current = next;
        setCompteur(next);
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSync]);

  const actions = [
    { label: "Payer les employés", icon: "payments", onClick: () => { fermer(); navigate("/finance"); } },
    { label: "Ajouter un employé", icon: "fingerprint", onClick: () => { fermer(); navigate("/enrolement"); } },
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
              placeholder="Rechercher un employé…"
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
            </div>
          )}
        </div>
      </div>

      {/* Droite : auto-synchro + notif + profil */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Auto-synchro K40 : décompte 10 s, vert si la dernière a réussi / rouge si échec */}
        <button
          onClick={() => setAutoSync((a) => !a)}
          aria-pressed={autoSync}
          title={`Auto-synchro K40 ${autoSync ? "activée (toutes les 10 s)" : "désactivée — cliquer pour activer"}${lastSync ? ` · dernière : ${lastSync.toLocaleTimeString("fr-FR")}` : ""}`}
          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-medium transition-colors min-w-[82px] justify-center ${
            !autoSync
              ? "border-border-strong bg-surface text-muted hover:bg-surface-2"
              : etatSync === "echec"
              ? "border-rose-300 bg-rose-50 text-rose-600"
              : etatSync === "ok"
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-border-strong bg-surface text-muted"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              !autoSync ? "bg-slate-400" : etatSync === "echec" ? "bg-rose-500" : etatSync === "ok" ? "bg-emerald-500" : "bg-slate-400"
            } ${autoSync && sync ? "animate-pulse" : ""}`}
          />
          <span className="tabular-nums whitespace-nowrap">
            {!autoSync ? "Auto off" : sync ? "Sync…" : `Auto ${compteur}s`}
          </span>
        </button>

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
                      <p className="text-[11px] text-subtle mt-0.5">{a.time}</p>
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
