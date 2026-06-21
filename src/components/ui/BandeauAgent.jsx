import Icon from "./Icon.jsx";
import { useUI } from "./UIProvider.jsx";
import { fcfa } from "../../data/datasets.js";

const dotLive = { "En activité": "bg-emerald-400", "En pause": "bg-amber-400", Absent: "bg-rose-400", Congé: "bg-sky-400" };
const ringLive = { "En activité": "ring-emerald-400", "En pause": "ring-amber-400", Absent: "ring-rose-400", Congé: "ring-sky-400" };

// Bandeau profil agent (vert sapin) — partagé entre la fiche Présence et la page Détails.
export default function BandeauAgent({ e, live = "Absent", tauxHoraire = 1300, onPaiements, onPlus, plusLabel = "Plus de détails", plusIcon = "chevron_right" }) {
  const { toast } = useUI();
  const initiales = e.name.split(" ").map((w) => w[0]).slice(0, 2).join("");

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-600 p-6 shadow-card">
      <div className="absolute -right-8 -top-10 w-44 h-44 rounded-full bg-white/5" aria-hidden="true" />
      <div className="absolute -right-16 top-16 w-44 h-44 rounded-full bg-white/5" aria-hidden="true" />
      <div className="relative flex flex-col sm:flex-row sm:items-start gap-5">
        {/* Photo carrée + point de présence */}
        <div className="relative shrink-0 mx-auto sm:mx-0">
          <div className={`w-[88px] h-[88px] rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-[26px] font-bold text-white ring-2 ring-offset-2 ring-offset-brand-700 ${ringLive[live] ?? "ring-white/30"}`}>
            {initiales}
          </div>
          <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-brand-600 ${dotLive[live] ?? "bg-slate-300"}`} />
        </div>

        {/* Identité */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide text-ink bg-gradient-to-br from-or-300 to-or-500">
            <Icon name="work" className="text-[14px]" filled />
            Agent
          </span>
          <h1 className="text-2xl font-semibold text-white tracking-tight mt-2">{e.name}</h1>
          <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-sm text-white/75">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="menu_book" className="text-[16px] text-white/50" /> <span className="font-semibold text-white">{e.matiere ?? e.fonction}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="schedule" className="text-[16px] text-white/50" /> {fcfa(e.tauxHoraire ?? tauxHoraire)} / h
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="badge" className="text-[16px] text-white/50" /> Matricule <span className="font-mono">{e.id}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="domain" className="text-[16px] text-white/50" /> Service {e.department}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-2 shrink-0">
          <button onClick={onPaiements} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold bg-or-500 text-ink hover:bg-or-400 transition-colors">
            <Icon name="payments" className="text-[18px]" filled /> Paiements
          </button>
          <button onClick={() => toast(`Message à ${e.name}`, "info")} aria-label="Message" title="Message" className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors">
            <Icon name="mail" className="text-[18px]" />
          </button>
          <button onClick={() => toast("Préférences d'affichage", "info")} aria-label="Affichage" title="Affichage" className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors">
            <Icon name="light_mode" className="text-[18px]" />
          </button>
          <button onClick={onPlus} className="inline-flex items-center gap-1 h-10 px-3.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/15 text-white/90 border border-white/15 transition-colors">
            {plusLabel} <Icon name={plusIcon} className="text-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
