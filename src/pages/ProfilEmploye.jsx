import { useParams, useNavigate } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import BandeauAgent from "../components/ui/BandeauAgent.jsx";
import CalendrierPresence from "../components/ui/CalendrierPresence.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { employes, tempsReel } from "../data/datasets.js";
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
        onPaiements={() => navigate(`/employes/${id}/paiement`)}
        onPlus={() => navigate(`/employes/${id}/details`)}
        plusLabel="Plus de détails"
        plusIcon="chevron_right"
      />

      {/* Calendrier de présence */}
      <CalendrierPresence
        cal={cal}
        onJour={(j) => toast(`Journée du ${j.jour} juin — ${j.ferie ?? j.event ?? (j.etat === "Prévu" ? "à pointer" : j.etat) ?? "repos"}`, "info")}
      />

      {/* Bande pointages → feuille de pointage éditable (admin) */}
      <button
        onClick={() => navigate(`/employes/${id}/pointages`)}
        className="group w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-600 p-5 text-left flex items-center gap-4 shadow-card hover:to-brand-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or-400 focus-visible:ring-offset-2"
      >
        <span className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-white/5" aria-hidden="true" />
        <span className="relative w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0">
          <Icon name="edit_calendar" className="text-[22px]" filled />
        </span>
        <div className="relative flex-1 min-w-0">
          <p className="text-white font-semibold">Gérer les pointages</p>
          <p className="text-white/70 text-sm">Voir et corriger les pointages de {e.name.split(" ")[0]} (réservé à l'admin).</p>
        </div>
        <Icon name="arrow_forward" className="relative text-white text-[22px] shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}
