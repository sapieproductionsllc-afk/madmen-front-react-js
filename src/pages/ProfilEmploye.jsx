import { useParams, useNavigate } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import BandeauAgent from "../components/ui/BandeauAgent.jsx";
import CalendrierPresence from "../components/ui/CalendrierPresence.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { employes, tempsReel, fcfa } from "../data/datasets.js";
import { calendrierPresence } from "../data/profil.js";

// Présence = vert/sapin/bleu ; OR réservé à la paie.
const TONES = {
  emerald: "bg-emerald-50 text-emerald-600",
  brand: "bg-brand-50 text-brand-600",
  sky: "bg-sky-50 text-sky-600",
  or: "bg-or-100 text-or-700",
};

// Carte KPI de pointage (synthèse du mois).
function KpiPointage({ icon, tone = "brand", value, unit, label, bar, valueClass = "text-2xl" }) {
  return (
    <div className="card p-4 flex flex-col">
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${TONES[tone]}`}>
        <Icon name={icon} className="text-[22px]" filled />
      </span>
      <p className={`mt-3 font-bold tabular-nums leading-none text-ink ${valueClass}`}>
        {value}
        {unit && <span className="text-base font-semibold text-muted ml-1">{unit}</span>}
      </p>
      {bar != null && (
        <div className="h-1.5 rounded-full bg-surface-2 mt-2.5 overflow-hidden" aria-hidden="true">
          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${bar}%` }} />
        </div>
      )}
      <p className="text-xs text-muted mt-2 min-h-[2rem]">{label}</p>
    </div>
  );
}

export default function ProfilEmploye() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useUI();

  const e = employes.find((x) => x.id === id);

  if (!e) {
    return (
      <div className="card py-16 text-center max-w-lg mx-auto">
        <Icon name="person_off" className="text-faint text-[40px]" />
        <p className="mt-2 text-sm text-muted">Agent introuvable ({id}).</p>
        <button onClick={() => navigate("/")} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">
          <Icon name="arrow_back" className="text-[18px]" /> Retour au tableau de bord
        </button>
      </div>
    );
  }

  const tr = tempsReel[id] ?? {};
  const live = tr.live ?? "Absent";
  const cal = calendrierPresence(id);

  return (
    <div className="space-y-4 pb-10">
      {/* Bouton retour */}
      <button
        onClick={() => navigate(-1)}
        className="group inline-flex items-center gap-1.5 h-9 pl-2 pr-3.5 rounded-full bg-surface border border-border text-sm font-medium text-muted hover:text-ink hover:border-border-strong hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        <Icon name="arrow_back" className="text-[18px] group-hover:-translate-x-0.5 transition-transform" />
        Retour
      </button>

      <BandeauAgent
        e={e}
        live={live}
        tauxHoraire={cal.tauxHoraire}
        onPaiements={() => navigate(`/employes/${id}/details`, { state: { onglet: "Paiements" } })}
        onPlus={() => navigate(`/employes/${id}/details`)}
        plusLabel="Plus de détails"
        plusIcon="chevron_right"
      />

      {/* Calendrier de présence */}
      <CalendrierPresence
        cal={cal}
        onJour={(j) => toast(`Journée du ${j.jour} juin — ${j.ferie ?? j.event ?? (j.etat === "Prévu" ? "à pointer" : j.etat) ?? "repos"}`, "info")}
      />

      {/* En-tête section Pointages */}
      <div className="flex items-center gap-2.5 pt-1">
        <span className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
          <Icon name="fact_check" className="text-[20px]" filled />
        </span>
        <h2 className="text-lg font-semibold text-ink leading-tight">Pointages</h2>
      </div>

      {/* Cartes de synthèse */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiPointage
          icon="event_available"
          tone="emerald"
          value={cal.joursPointes}
          unit={`/ ${cal.coursEcoules}`}
          label="Jours pointés"
        />
        <KpiPointage
          icon="schedule"
          tone="sky"
          value={cal.heuresTravaillees}
          unit="h"
          label={`Sur ${cal.heuresPlanifiees} h planifiées`}
          valueClass="text-2xl font-mono"
        />
        <KpiPointage
          icon="trending_up"
          tone="brand"
          value={cal.tauxPresence}
          unit="%"
          bar={cal.tauxPresence}
          label="Taux de présence"
        />
        <KpiPointage
          icon="account_balance_wallet"
          tone="or"
          value={fcfa(cal.remunerationEstimee)}
          label="Rémunération estimée"
          valueClass="text-2xl font-mono"
        />
      </div>

      {/* Voir le détail des pointages */}
      <button
        onClick={() => navigate(`/employes/${id}/details`, { state: { onglet: "Activité" } })}
        className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl border border-border bg-surface text-sm font-semibold text-brand-700 hover:bg-surface-2 hover:border-border-strong hover:text-brand-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        Voir le détail des pointages
        <Icon name="arrow_forward" className="text-[18px] group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}
