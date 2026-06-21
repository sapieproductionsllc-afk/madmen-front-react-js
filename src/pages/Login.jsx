import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import AreaChart from "../components/ui/AreaChart.jsx";
import { champClass } from "../components/ui/Input.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// Champ : recette canonique partagée (Input.jsx) + place pour l'icône de droite.
const champ = `${champClass} pr-11`;

// Lignes ondulées réutilisables (texture)
function Vagues({ color, opacity }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 600" preserveAspectRatio="none" fill="none">
      {Array.from({ length: 12 }).map((_, i) => {
        const y = -20 + i * 58;
        return (
          <path
            key={i}
            d={`M -50,${y} C 250,${y - 55} 520,${y + 55} 1050,${y - 25}`}
            stroke={color}
            strokeOpacity={opacity}
            strokeWidth="1.5"
            fill="none"
          />
        );
      })}
    </svg>
  );
}

export default function Login() {
  const { login } = useAuth();
  const { toast } = useUI();
  const navigate = useNavigate();
  const [matricule, setMatricule] = useState("AUR-8821");
  const [pin, setPin] = useState("1234");
  const [showPin, setShowPin] = useState(false);
  const [souvenir, setSouvenir] = useState(() => {
    try {
      return localStorage.getItem("madmen_remember") === "1";
    } catch {
      return false;
    }
  });
  const [mode, setMode] = useState(null); // null | "pin" | "empreinte"
  const [erreur, setErreur] = useState("");

  const isLoading = mode !== null;

  // Connexion par PIN/empreinte avec retour visuel (chargement) et gestion d'erreur.
  const lancerConnexion = (methode) => {
    if (isLoading) return;
    setErreur("");

    if (methode === "pin" && (!matricule.trim() || !pin.trim())) {
      setErreur("Renseignez votre matricule et votre code PIN.");
      return;
    }

    try {
      localStorage.setItem("madmen_remember", souvenir ? "1" : "0");
    } catch {
      /* ignore */
    }

    setMode(methode);
    // Petite latence pour matérialiser l'état de connexion (logique inchangée).
    setTimeout(() => {
      login();
      navigate("/", { replace: true });
    }, 650);
  };

  const seConnecter = (e) => {
    e.preventDefault();
    lancerConnexion("pin");
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6 bg-canvas">
      {/* Halo & texture de fond (profondeur discrète autour de la carte) */}
      <div className="absolute -top-32 -left-24 w-[34rem] h-[34rem] rounded-full bg-brand-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-24 w-[34rem] h-[34rem] rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
      <Vagues color="#1f4a3a" opacity="0.05" />

      <div className="reveal relative w-full max-w-5xl grid md:grid-cols-2 rounded-2xl overflow-hidden shadow-pop border border-[var(--border)] bg-surface md:min-h-[580px]">
        {/* ---------- Colonne formulaire ---------- */}
        <div className="relative z-10 flex flex-col p-7 sm:p-11">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm shadow-brand-600/25">
              <Icon name="fingerprint" className="text-canvas text-[22px]" filled />
            </span>
            <span className="text-lg font-semibold text-ink tracking-tight">MADMEN</span>
          </div>

          <div className="flex-1 flex flex-col justify-center py-10 max-w-sm w-full mx-auto">
            <p className="kicker mb-3">Espace personnel</p>
            <h1 className="text-[1.75rem] sm:text-[2rem] font-semibold text-ink tracking-tight leading-tight mb-2">
              Bienvenue.
            </h1>
            <p className="text-muted text-sm mb-8 leading-relaxed">
              Première connexion ?{" "}
              <span className="text-brand-600 font-medium">Contactez votre administrateur.</span>
            </p>

            <form onSubmit={seConnecter} className="space-y-5">
              <div>
                <label htmlFor="matricule" className="block text-sm font-medium text-texte mb-1.5">Matricule</label>
                <div className="relative">
                  <input
                    id="matricule"
                    className={champ}
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                    placeholder="AUR-0000"
                    autoComplete="username"
                  />
                  <Icon name="badge" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-subtle text-[20px] pointer-events-none" />
                </div>
              </div>

              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-texte mb-1.5">Code PIN</label>
                <div className="relative">
                  <input
                    id="pin"
                    className={champ}
                    type={showPin ? "text" : "password"}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 grid place-items-center w-7 h-7 rounded-lg text-subtle hover:text-brand-600 hover:bg-surface-2 transition focus-visible:ring-2 focus-visible:ring-brand-500/40"
                    aria-label={showPin ? "Masquer le code PIN" : "Afficher le code PIN"}
                  >
                    <Icon name={showPin ? "visibility_off" : "visibility"} className="text-[20px]" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-muted cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={souvenir}
                    onChange={(e) => setSouvenir(e.target.checked)}
                    className="w-4 h-4 rounded accent-brand-600"
                  />
                  Se souvenir de moi
                </label>
                <button
                  type="button"
                  onClick={() => toast("Contactez votre administrateur pour réinitialiser votre code PIN.", "info")}
                  className="text-brand-600 hover:text-brand-700 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-500/40 rounded"
                >
                  Oublié ?
                </button>
              </div>

              {erreur && (
                <p role="alert" className="flex items-center gap-1.5 text-sm text-rose-600">
                  <Icon name="error" className="text-[18px]" />
                  {erreur}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-brand-600 hover:bg-brand-700 text-canvas font-medium text-sm py-2.5 transition flex items-center justify-center gap-1.5 shadow-sm shadow-brand-600/25 active:translate-y-px focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:translate-y-0"
              >
                {mode === "pin" ? (
                  <>
                    <Icon name="progress_activity" className="text-[18px] animate-spin" />
                    Connexion…
                  </>
                ) : (
                  <>
                    Se connecter
                    <Icon name="arrow_forward" className="text-[18px]" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => lancerConnexion("empreinte")}
                disabled={isLoading}
                className="w-full rounded-lg bg-surface-2 hover:bg-surface border border-[var(--border-strong)] text-texte font-medium text-sm py-2.5 transition flex items-center justify-center gap-1.5 active:translate-y-px focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:translate-y-0"
              >
                {mode === "empreinte" ? (
                  <>
                    <span className="live-dot text-brand-600" />
                    Lecture de l'empreinte…
                  </>
                ) : (
                  <>
                    <Icon name="fingerprint" className="text-[18px]" />
                    Pointer par empreinte
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-xs text-faint">© 2026 MADMEN — Logiciel de gestion du personnel.</p>
        </div>

        {/* ---------- Colonne visuelle (vitrine produit) ---------- */}
        <div className="hidden md:flex relative flex-col justify-between p-10 overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white">
          <Vagues color="#ffffff" opacity="0.07" />
          <div className="absolute -top-16 -right-10 w-72 h-72 rounded-full bg-brand-400/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-brand-500/12 blur-3xl pointer-events-none" />

          {/* Accroche */}
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45 mb-3">Tableau de bord</p>
            <h2 className="text-[1.6rem] font-semibold tracking-tight leading-snug">
              Pilotez votre personnel<br />en temps réel.
            </h2>
            <p className="text-white/55 text-sm mt-2.5 max-w-xs leading-relaxed">
              Présence, activité et productivité — d'un seul coup d'œil.
            </p>
          </div>

          {/* Aperçu du tableau de bord */}
          <div className="relative flex-1 flex items-center justify-center py-6">
            <div className="w-full max-w-[280px] rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 p-5 shadow-2xl ring-1 ring-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white/90">Aujourd'hui</span>
                <span className="live-dot text-emerald-300" />
              </div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/50 mb-1">Présence</p>
              <div className="flex items-end gap-2 mb-2">
                <p className="text-3xl font-semibold tabular-nums tracking-tight leading-none">94,2 %</p>
                <span className="mb-0.5 inline-flex items-center gap-0.5 rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[11px] font-medium text-emerald-300">
                  <Icon name="arrow_upward" className="text-[12px]" />3,2 %
                </span>
              </div>
              <AreaChart data={[58, 64, 61, 70, 67, 76, 80, 86, 90, 94]} height={46} color="#d2be9b" id="loginprev" />
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                <div className="rounded-xl bg-white/[0.07] border border-white/10 p-2.5">
                  <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider mb-0.5">Productivité</p>
                  <p className="text-base font-semibold tabular-nums tracking-tight">89,4 %</p>
                </div>
                <div className="rounded-xl bg-white/[0.07] border border-white/10 p-2.5">
                  <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider mb-0.5">Actifs</p>
                  <p className="text-base font-semibold tabular-nums tracking-tight">128</p>
                </div>
              </div>
            </div>

            {/* Chip employé (vie) */}
            <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-xl bg-white/12 backdrop-blur-xl border border-white/15 px-3 py-2 shadow-xl ring-1 ring-white/5">
              <Avatar name="Elena Vance" size="w-7 h-7" />
              <div className="leading-tight">
                <p className="text-xs font-medium">Elena Vance</p>
                <p className="text-[10px] text-emerald-300">Présent · 08:14</p>
              </div>
            </div>
          </div>

          {/* Pied : aide & contact */}
          <div className="relative flex items-center gap-3 text-xs text-white/50">
            <span className="flex items-center gap-1.5"><Icon name="help" className="text-[15px]" />Centre d'aide</span>
            <span className="text-white/25">·</span>
            <span className="flex items-center gap-1.5"><Icon name="mail" className="text-[15px]" />support@madmen.io</span>
          </div>
        </div>
      </div>
    </div>
  );
}
