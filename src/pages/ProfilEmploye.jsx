import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import BandeauAgent from "../components/ui/BandeauAgent.jsx";
import CalendrierPresence from "../components/ui/CalendrierPresence.jsx";
import PointageJourModal from "../components/pointage/PointageJourModal.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { apiGet } from "../lib/api.js";
import { mapEmploye } from "../lib/mappers.js";

// API statut (present/retard/absent/conge) -> statut live attendu par le JSX/BandeauAgent.
const STATUT_LIVE = { present: "En activité", retard: "En activité", absent: "Absent", conge: "Congé" };

// API status (PRESENT/LATE/ABSENT) -> état de pointage attendu par CalendrierPresence.
const ETAT_API = { PRESENT: "Présent", LATE: "Retard", ABSENT: "Absent" };

// Libellés FR des mois (le composant lit cal.mois sous la forme "Mois AAAA").
const MOIS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

// "HH:MM:SS" | "AAAA-MM-JJ HH:MM:SS" -> "HH:MM" (ou null).
function hhmm(v) {
  if (!v) return null;
  const s = String(v);
  const m = s.match(/(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : null;
}

/**
 * Reconstruit la grille mensuelle attendue par CalendrierPresence à partir du
 * bulletin de paie (GET /api/employes/{id}/paie). On garde EXACTEMENT la forme
 * produite par l'ancien mock calendrierPresence() de profil.js.
 * - planning : objet { isoJour(1=lun..7=dim) -> {debut,fin} } ; un jour présent = jour travaillé (cours).
 * - detail[] : une entrée par jour pointé/absent/férié, indexée par date, avec status.
 */
function construireCalendrier(paie) {
  const mois = paie?.mois ?? null; // "AAAA-MM"
  const planning = paie?.planning ?? {}; // { "1": {debut,fin}, ... }
  const valeurHeure = Number(paie?.valeur_heure) || 0;

  const detailParDate = Object.fromEntries((paie?.detail ?? []).map((d) => [d.date, d]));

  let annee, moisNum;
  if (mois) {
    const [a, mn] = mois.split("-").map(Number);
    annee = a;
    moisNum = mn; // 1..12
  } else {
    const now = new Date();
    annee = now.getFullYear();
    moisNum = now.getMonth() + 1;
  }

  const nbJours = new Date(annee, moisNum, 0).getDate(); // dernier jour du mois
  const today = new Date();
  const estMoisCourant = today.getFullYear() === annee && today.getMonth() + 1 === moisNum;
  const todayJour = estMoisCourant ? today.getDate() : -1;

  const jours = [];
  let joursCours = 0;
  let coursEcoules = 0;
  let joursPointes = 0;

  for (let d = 1; d <= nbJours; d++) {
    const date = `${annee}-${String(moisNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const jsDow = new Date(annee, moisNum - 1, d).getDay(); // 0=dim..6=sam
    const iso = jsDow === 0 ? 7 : jsDow; // 1=lun..7=dim
    const dow = iso - 1; // 0=lun..6=dim (attendu par le composant)
    const weekend = iso >= 6; // samedi/dimanche

    const det = detailParDate[date] ?? null;
    const ferie = det?.status === "FERIE" ? det.libelle ?? "Jour férié" : null;
    const event = null; // TODO: endpoint API manquant pour les événements pédagogiques du calendrier
    const cours = !!planning[String(iso)] && !ferie; // jour travaillé prévu (hors férié)
    const futur = todayJour >= 0 && d > todayJour;

    let etat = null; // "Présent" | "Retard" | "Absent" | "Prévu"
    let arrivee = null;
    let depart = null;
    let retardMin = 0;

    if (cours) {
      joursCours++;
      if (det && ETAT_API[det.status]) {
        coursEcoules++;
        etat = ETAT_API[det.status];
        if (det.status === "PRESENT" || det.status === "LATE") {
          arrivee = hhmm(det.check_in);
          depart = hhmm(det.check_out); // heure de départ (sortie K40)
          retardMin = Math.round((Number(det.late_seconds) || 0) / 60);
          joursPointes++;
        }
      } else if (futur) {
        etat = "Prévu"; // jour à venir, à pointer
      } else {
        // Jour ouvré passé sans détail (ni pointage ni absence calculée) -> à pointer.
        etat = "Prévu";
      }
    }

    jours.push({ jour: d, date, dow, weekend, ferie, event, cours, futur, today: d === todayJour, etat, arrivee, depart, retardMin });
  }

  const heuresPlanifiees = (Number(paie?.temps_theorique_mensuel_sec) || 0) / 3600;
  const heuresTravaillees = (Number(paie?.temps_total_travaille_sec) || 0) / 3600;

  return {
    mois: mois ? `${MOIS_FR[moisNum - 1]} ${annee}` : "—",
    today: todayJour,
    jours,
    joursCours,
    coursEcoules,
    joursPointes,
    heuresPlanifiees: Math.round(heuresPlanifiees),
    heuresTravaillees: Math.round(heuresTravaillees),
    tauxPresence: coursEcoules ? Math.round((joursPointes / coursEcoules) * 100) : 0,
    tauxHoraire: Math.round(valeurHeure),
    remunerationEstimee: Math.round(heuresTravaillees * valeurHeure),
  };
}

export default function ProfilEmploye() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, dataVersion } = useUI();

  // Données RÉELLES depuis l'API (remplacent les mocks de src/data/datasets.js).
  const [e, setE] = useState(null);
  const [live, setLive] = useState("Absent");
  const [cal, setCal] = useState(null); // calendrier de présence reconstruit depuis la paie du mois
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [jourEdit, setJourEdit] = useState(null); // jour du calendrier en édition (pointage manuel)

  useEffect(() => {
    let actif = true;
    if (!e) setChargement(true); // spinner seulement au 1er chargement ; refresh = silencieux
    setErreur(null);

    // Employé (liste -> recherche par matricule, le param :id est le matricule)
    // + présence temps réel (agents[] de /api/dashboard/presence indexé par matricule).
    Promise.all([apiGet("/api/employes"), apiGet("/api/dashboard/presence")])
      .then(([employesData, presence]) => {
        if (!actif) return null;

        const agentApi = (Array.isArray(employesData) ? employesData : []).find((x) => x.matricule === id);
        const agent = agentApi ? mapEmploye(agentApi) : null;

        const ag = (presence?.agents ?? []).find((a) => a.matricule === id || a.id === agentApi?.id);
        const statutLive = ag ? STATUT_LIVE[ag.statut] ?? "Absent" : "Absent";

        setE(agent);
        setLive(statutLive);

        // Calendrier de présence : bulletin de paie du mois courant (par id numérique).
        if (!agentApi?.id) return null;
        const moisCourant = new Date().toISOString().slice(0, 7); // AAAA-MM
        return apiGet(`/api/employes/${agentApi.id}/paie?mois=${moisCourant}`);
      })
      .then((paie) => {
        if (actif && paie) setCal(construireCalendrier(paie));
      })
      .catch((err) => {
        if (actif) setErreur(err?.message || "Erreur de chargement");
      })
      .finally(() => {
        if (actif) setChargement(false);
      });

    return () => {
      actif = false;
    };
  }, [id, dataVersion]);

  if (chargement) {
    return (
      <div className="card py-16 text-center max-w-lg mx-auto">
        <Icon name="progress_activity" className="text-faint text-[40px] animate-spin" />
        <p className="mt-2 text-sm text-muted">Chargement de l'agent…</p>
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="card py-16 text-center max-w-lg mx-auto">
        <Icon name="error" className="text-rose-500 text-[40px]" />
        <p className="mt-2 text-sm text-muted">{erreur}</p>
        <button onClick={() => navigate("/")} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">
          <Icon name="arrow_back" className="text-[18px]" /> Retour au tableau de bord
        </button>
      </div>
    );
  }

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

  // Calendrier reconstruit depuis la paie ; repli VIDE neutre si le bulletin est indisponible.
  const calAffiche = cal ?? {
    mois: `${MOIS_FR[new Date().getMonth()]} ${new Date().getFullYear()}`,
    today: -1,
    jours: [],
    joursCours: 0,
    coursEcoules: 0,
    joursPointes: 0,
    heuresPlanifiees: 0,
    heuresTravaillees: 0,
    tauxPresence: 0,
    tauxHoraire: 0,
    remunerationEstimee: 0,
  };

  return (
    <div className="space-y-4 pb-10">
      {/* Barre : retour + modifier */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => navigate(-1)}
          className="group inline-flex items-center gap-1.5 h-9 pl-2 pr-3.5 rounded-full bg-surface border border-border text-sm font-medium text-muted hover:text-ink hover:border-border-strong hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          <Icon name="arrow_back" className="text-[18px] group-hover:-translate-x-0.5 transition-transform" />
          Retour
        </button>
        <button
          onClick={() => navigate(`/enrolement/${e._id}`)}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          <Icon name="edit" className="text-[18px]" />
          Modifier
        </button>
      </div>

      <BandeauAgent
        e={e}
        live={live}
        tauxHoraire={calAffiche.tauxHoraire}
        onPaiements={() => navigate(`/employes/${id}/paiement`)}
        onPlus={() => navigate(`/employes/${id}/details`)}
        plusLabel="Plus de détails"
        plusIcon="chevron_right"
      />

      {/* Calendrier de présence — clic sur un jour = saisir/corriger arrivée & départ */}
      <CalendrierPresence cal={calAffiche} onJour={(j) => setJourEdit(j)} />

      <PointageJourModal employeId={e._id} jour={jourEdit} onClose={() => setJourEdit(null)} />

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
