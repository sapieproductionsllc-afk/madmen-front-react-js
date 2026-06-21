import { useParams, useNavigate } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import BandeauAgent from "../components/ui/BandeauAgent.jsx";
import CalendrierPresence from "../components/ui/CalendrierPresence.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { employes, tempsReel, fcfa } from "../data/datasets.js";
import { calendrierPresence } from "../data/profil.js";

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
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink transition-colors">
        <Icon name="arrow_back" className="text-[18px]" />
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

      {/* Synthèse Pointages */}
      <div className="flex items-baseline justify-between pt-1">
        <h2 className="text-lg font-semibold text-ink">Pointages</h2>
        <span className="text-sm text-muted">{cal.mois}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-start justify-between gap-2">
            <p className="text-2xl font-semibold tabular-nums leading-none text-ink">
              {cal.joursPointes} <span className="text-base text-muted">/ {cal.coursEcoules}</span>
            </p>
            <span className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Icon name="event_available" className="text-[20px]" filled /></span>
          </div>
          <p className="text-xs text-muted mt-2">Jours pointés · jours travaillés écoulés</p>
        </div>
        <div className="card p-4 border-l-4 border-l-or-500">
          <div className="flex items-start justify-between gap-2">
            <p className="text-2xl font-semibold font-mono tabular-nums leading-none text-ink">{cal.heuresTravaillees} h 00</p>
            <span className="w-9 h-9 rounded-lg bg-or-100 text-or-700 flex items-center justify-center shrink-0"><Icon name="schedule" className="text-[20px]" filled /></span>
          </div>
          <p className="text-xs text-muted mt-2">Sur {cal.heuresPlanifiees} h planifiées</p>
        </div>
        <div className="card p-4 border-l-4 border-l-sky-500">
          <div className="flex items-start justify-between gap-2">
            <p className="text-2xl font-semibold tabular-nums leading-none text-ink">{cal.tauxPresence} %</p>
            <span className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0"><Icon name="trending_up" className="text-[20px]" filled /></span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-2 mt-2 overflow-hidden">
            <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${cal.tauxPresence}%` }} />
          </div>
          <p className="text-xs text-muted mt-1.5">Taux de présence</p>
        </div>
        <div className="card p-4 border-l-4 border-l-or-500">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xl font-semibold font-mono tabular-nums leading-none text-ink">{fcfa(cal.remunerationEstimee)}</p>
            <span className="w-9 h-9 rounded-lg bg-or-100 text-or-700 flex items-center justify-center shrink-0"><Icon name="account_balance_wallet" className="text-[20px]" filled /></span>
          </div>
          <p className="text-xs text-muted mt-2">Rémunération estimée · selon la présence</p>
        </div>
      </div>

      <div>
        <button onClick={() => navigate(`/employes/${id}/details`)} className="inline-flex items-center gap-1 text-sm font-medium text-or-700 hover:text-or-600">
          Voir le détail des pointages <Icon name="arrow_forward" className="text-[18px]" />
        </button>
      </div>
    </div>
  );
}
