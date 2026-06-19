import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import AreaChart from "../components/ui/AreaChart.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const champ =
  "w-full rounded-xl bg-white/[0.06] border border-white/10 pl-3.5 pr-10 py-3 text-sm text-white placeholder-white/35 outline-none focus:border-brand-400/60 focus:ring-2 focus:ring-brand-400/25 transition";

function Champ({ label, icon, children }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium text-white/45 mb-1.5 uppercase tracking-wider">{label}</span>
      <div className="relative">
        {children}
        <Icon name={icon} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 text-[20px]" />
      </div>
    </label>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [matricule, setMatricule] = useState("AUR-8821");
  const [pin, setPin] = useState("1234");

  const seConnecter = (e) => {
    e.preventDefault();
    login();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300">
      <div className="w-full max-w-5xl grid md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl bg-slate-950 text-white md:min-h-[600px]">
        {/* ---------- Colonne formulaire ---------- */}
        <div className="flex flex-col p-7 sm:p-10">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
              <Icon name="fingerprint" className="text-white text-[22px]" filled />
            </span>
            <span className="text-lg font-bold tracking-tight">MADMEN</span>
          </div>

          <div className="flex-1 flex flex-col justify-center py-10 max-w-sm w-full mx-auto">
            <p className="text-[11px] font-semibold text-brand-400 uppercase tracking-[0.2em] mb-3">Espace sécurisé</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
              Connexion<span className="text-brand-400">.</span>
            </h1>
            <p className="text-white/55 text-sm mb-7">Accédez à votre tableau de bord.</p>

            <form onSubmit={seConnecter} className="space-y-4">
              <Champ label="Matricule" icon="badge">
                <input className={champ} value={matricule} onChange={(e) => setMatricule(e.target.value)} placeholder="AUR-0000" />
              </Champ>
              <Champ label="Code PIN" icon="lock">
                <input className={champ} type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••" />
              </Champ>

              <div className="flex items-center justify-between text-sm pt-1">
                <label className="flex items-center gap-2 text-white/55 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-500" />
                  Se souvenir de moi
                </label>
                <button type="button" className="text-brand-400 hover:text-brand-300 font-medium">Oublié ?</button>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-600/25"
              >
                Se connecter
                <Icon name="arrow_forward" className="text-[20px]" />
              </button>

              <button
                type="button"
                onClick={seConnecter}
                className="w-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white/80 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Icon name="fingerprint" className="text-[20px]" />
                Pointer par empreinte
              </button>
            </form>
          </div>

          <p className="text-xs text-white/35">© 2026 MADMEN — Logiciel de gestion du personnel.</p>
        </div>

        {/* ---------- Colonne visuelle (intégrée à la carte) ---------- */}
        <div className="hidden md:block relative overflow-hidden bg-gradient-to-br from-brand-600 via-indigo-700 to-slate-900">
          <div className="absolute -top-20 -right-10 w-80 h-80 rounded-full bg-brand-400/30 blur-3xl" />
          <div className="absolute bottom-0 -left-10 w-80 h-80 rounded-full bg-indigo-300/20 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "26px 26px" }} />

          {/* Courbe décorative */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 520 600" fill="none" preserveAspectRatio="none">
            <path d="M 70 520 C 220 440, 250 240, 470 130" stroke="white" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="1 11" strokeLinecap="round" />
            <circle cx="70" cy="520" r="6" fill="#c7d2fe" />
            <circle cx="470" cy="130" r="5" fill="white" />
          </svg>

          {/* Titre du panneau */}
          <div className="absolute top-10 left-10 right-10">
            <h2 className="text-2xl font-semibold tracking-tight leading-snug">
              Pilotez votre personnel<br />en temps réel.
            </h2>
            <p className="text-white/60 text-sm mt-2">Présence, activité et productivité, d'un coup d'œil.</p>
          </div>

          {/* Carte — présence */}
          <div className="absolute top-[42%] right-8 w-52 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/65">Présence</span>
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-300">
                <Icon name="arrow_upward" className="text-[13px]" />3,2 %
              </span>
            </div>
            <p className="text-3xl font-semibold text-white tabular-nums leading-none mb-2">94,2 %</p>
            <AreaChart data={[58, 64, 61, 70, 67, 76, 80, 86, 90, 94]} height={44} color="#c7d2fe" id="loginmini" />
          </div>

          {/* Pastille — actifs */}
          <div className="absolute bottom-12 left-9 flex items-center gap-2.5 rounded-xl bg-white/10 backdrop-blur-xl border border-white/15 px-4 py-3 shadow-xl">
            <span className="live-dot text-emerald-300" />
            <span className="text-sm text-white/90">128 employés actifs</span>
          </div>

          <div className="absolute bottom-6 right-8 flex items-center gap-2 text-white/40">
            <Icon name="fingerprint" className="text-[20px]" filled />
            <span className="text-sm font-semibold tracking-tight">MADMEN</span>
          </div>
        </div>
      </div>
    </div>
  );
}
