// Détails RH complets + historiques par employé (fiche profil /employes/:id).
// Données fictives (frontend) — générées de façon déterministe par matricule.
import { employes, paie } from "./datasets.js";

const empById = Object.fromEntries(employes.map((e) => [e.id, e]));
const paieById = Object.fromEntries(paie.map((p) => [p.id, p]));

// Détails RH statiques (adresse, contact d'urgence, manager, date d'embauche).
export const employeDetails = {
  "AUR-1187": { manager: "Direction Pédagogique", embauche: "12/09/2022", adresse: "Quartier Centre, Brazzaville", urgence: { nom: "Gloire Makaya", lien: "Conjoint", tel: "+242 06 222 33 44" } },
  "AUR-8821": { manager: "Direction Générale", embauche: "14/01/2018", adresse: "14 rue des Lilas, 75011 Paris", urgence: { nom: "Marc Vance", lien: "Conjoint", tel: "+33 6 11 22 33 44" } },
  "AUR-1102": { manager: "Elena Vance", embauche: "03/09/2020", adresse: "8 av. du Centre, 69003 Lyon", urgence: { nom: "Sofia Rossi", lien: "Sœur", tel: "+33 6 22 33 44 55" } },
  "AUR-6654": { manager: "Direction Générale", embauche: "22/05/2019", adresse: "3 rue Victor Hugo, 75009 Paris", urgence: { nom: "Paul Dubois", lien: "Conjoint", tel: "+33 6 33 44 55 66" } },
  "AUR-3398": { manager: "Marcus Thorne", embauche: "11/02/2022", adresse: "27 rue de l'Est, 67000 Strasbourg", urgence: { nom: "Yasmine Benali", lien: "Mère", tel: "+33 6 44 55 66 77" } },
  "AUR-5567": { manager: "Sarah Jenkins", embauche: "30/06/2017", adresse: "5 quai Nord, 59000 Lille", urgence: { nom: "Claire Girard", lien: "Conjoint", tel: "+33 6 55 66 77 88" } },
  "AUR-7012": { manager: "Julian Rossi", embauche: "18/11/2021", adresse: "12 rue de l'Atelier, 67000 Strasbourg", urgence: { nom: "Léo Moreau", lien: "Frère", tel: "+33 6 66 77 88 99" } },
  "AUR-7720": { manager: "Direction Générale", embauche: "07/03/2016", adresse: "9 bd Haussmann, 75008 Paris", urgence: { nom: "Anne Mercier", lien: "Conjoint", tel: "+33 6 77 88 99 00" } },
  "AUR-9031": { manager: "Julian Rossi", embauche: "25/08/2023", adresse: "44 rue du Sud, 13001 Marseille", urgence: { nom: "Tom Jenkins", lien: "Frère", tel: "+33 6 88 99 00 11" } },
  "AUR-1190": { manager: "Thomas Girard", embauche: "01/04/2022", adresse: "16 rue du Port, 13002 Marseille", urgence: { nom: "Marie Lefèvre", lien: "Mère", tel: "+33 6 99 00 11 22" } },
  "AUR-4491": { manager: "David Mercier", embauche: "19/10/2019", adresse: "21 av. du Nord, 59000 Lille", urgence: { nom: "Eva Thorne", lien: "Conjoint", tel: "+33 6 10 20 30 40" } },
  "AUR-8843": { manager: "Direction Générale", embauche: "13/07/2021", adresse: "6 rue Centrale, 75002 Paris", urgence: { nom: "Sami Cherif", lien: "Frère", tel: "+33 6 20 30 40 50" } },
  "AUR-2241": { manager: "Julian Rossi", embauche: "09/01/2023", adresse: "33 rue de la Recherche, 69002 Lyon", urgence: { nom: "Hugo Fontaine", lien: "Conjoint", tel: "+33 6 30 40 50 60" } },
};

// PRNG déterministe par matricule (historiques stables d'un rendu à l'autre).
function makeRng(id) {
  let s = 7;
  for (const c of id) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function addMin(hhmm, min) {
  const [h, m] = hhmm.split(":").map(Number);
  const tot = h * 60 + m + min;
  return `${String(Math.floor(tot / 60)).padStart(2, "0")}:${String(tot % 60).padStart(2, "0")}`;
}

const DATES = ["20 juin", "19 juin", "18 juin", "17 juin", "16 juin", "13 juin", "12 juin"];

// Historique de présence — 7 derniers jours ouvrés.
export function historiquePresence(id) {
  const r = makeRng(id + "p");
  return DATES.map((date) => {
    const v = r();
    if (v < 0.06) return { date, statut: "Congé", arrivee: "—", depart: "—", retardMin: 0, temps: "—" };
    if (v < 0.1) return { date, statut: "Absent", arrivee: "—", depart: "—", retardMin: 0, temps: "—" };
    const retardMin = r() < 0.28 ? Math.floor(r() * 22) + 1 : 0;
    const am = 30 + retardMin;
    const arrivee = `0${8 + Math.floor(am / 60)}:${String(am % 60).padStart(2, "0")}`;
    const depart = `1${7 + (r() < 0.5 ? 0 : 1)}:${String(10 + Math.floor(r() * 45)).padStart(2, "0")}`;
    const temps = `8h ${String(5 + Math.floor(r() * 40)).padStart(2, "0")}m`;
    return { date, statut: retardMin > 5 ? "Retard" : "Présent", arrivee, depart, retardMin, temps };
  });
}

// Journal d'activité du jour.
export function historiqueActivite(id) {
  const e = empById[id];
  const arr = e?.today?.arrivee && e.today.arrivee !== "--:--" ? e.today.arrivee : "08:30";
  const poste = e?.today?.poste && e.today.poste !== "HORS LIGNE" && e.today.poste !== "Distant" ? e.today.poste : "Poste distant";
  return [
    { time: arr, type: "Connexion", detail: `Poste ${poste}`, icon: "login", tone: "emerald" },
    { time: addMin(arr, 2), type: "Début de session", detail: `Application ${e?.department ?? "Métier"}`, icon: "play_circle", tone: "emerald" },
    { time: "10:00", type: "Réunion d'équipe", detail: "Salle de réunion B2", icon: "groups", tone: "sky" },
    { time: "11:20", type: "Pause", detail: "Pause café", icon: "local_cafe", tone: "amber" },
    { time: "11:35", type: "Reprise d'activité", detail: `Poste ${poste}`, icon: "play_circle", tone: "emerald" },
    { time: "12:48", type: "Tâches métier", detail: `Application ${e?.department ?? "Métier"}`, icon: "monitoring", tone: "brand" },
  ];
}

// Conversion des montants (données € de base) vers des FCFA réalistes.
const FCFA = 150;

// Historique des paiements — 6 derniers mois (FCFA).
export function historiquePaiements(id) {
  const p = paieById[id];
  const base = p?.base ?? 3000;
  const primes = p?.primes ?? 200;
  const retenues = p?.retenues ?? 240;
  const avances = p?.avances ?? 0;
  const net = (base + primes - retenues - avances) * FCFA;
  const mois = ["Mai 2026", "Avril 2026", "Mars 2026", "Février 2026", "Janvier 2026", "Décembre 2025"];
  return mois.map((m, i) => ({
    mois: m,
    net: net + (i === 0 ? 0 : (((i * 13) % 60) - 20) * FCFA),
    status: i === 0 && p?.status === "En attente" ? "En attente" : "Payé",
  }));
}

// Fiche de paie détaillée du mois courant (FCFA).
export function paieDetail(id) {
  const p = paieById[id];
  const base = (p?.base ?? 3000) * FCFA;
  const primes = (p?.primes ?? 200) * FCFA;
  const retenues = (p?.retenues ?? 240) * FCFA;
  const avances = (p?.avances ?? 0) * FCFA;
  return { base, primes, avances, retenues, net: base + primes - retenues - avances, status: p?.status ?? "Payé" };
}

// Documents RH.
export function documentsEmploye(id) {
  const d = employeDetails[id];
  return [
    { nom: "Contrat de travail (CDI)", type: "Contrat", date: d?.embauche ?? "—", icon: "description", size: "240 Ko" },
    { nom: "Pièce d'identité", type: "Identité", date: d?.embauche ?? "—", icon: "badge", size: "1,2 Mo" },
    { nom: "Fiche de paie — Mai 2025", type: "Paie", date: "31/05/2025", icon: "receipt_long", size: "180 Ko" },
    { nom: "Avenant — Télétravail", type: "RH", date: "10/03/2024", icon: "edit_document", size: "95 Ko" },
  ];
}

// Calendrier mensuel — Juin 2026 (modèle hebdomadaire de créneaux, conforme à la maquette).
// Juin 2026 démarre un lundi · 30 jours · aujourd'hui = 21.
// Modèle : 2 créneaux les LUN/MAR/MER · férié le 10 · événement le 11.
const MOIS_LABEL = "Juin 2026";
const NB_JOURS = 30;
const TODAY = 21;
const COURS_DOW = [0, 1, 2]; // lundi, mardi, mercredi
const CRENEAUX_JOUR = 2; // 2 créneaux par jour travaillé
const TAUX_HORAIRE = 1300; // FCFA / h
const FERIES = { 10: "Journée Nationale de Réconciliation" };
const EVENTS = { 11: "Réunion pédagogique" };

export function calendrierPresence(id = "") {
  const r = makeRng(id + "presence-juin");
  const jours = [];
  let joursCours = 0;
  let coursEcoules = 0;
  let joursPointes = 0;
  for (let d = 1; d <= NB_JOURS; d++) {
    const dow = (d - 1) % 7; // 0 = lundi … 6 = dimanche (1er juin = lundi)
    const weekend = dow >= 5;
    const ferie = FERIES[d] ?? null;
    const event = EVENTS[d] ?? null;
    const cours = COURS_DOW.includes(dow) && !ferie; // jour travaillé (attendu)
    const futur = d > TODAY;
    let etat = null; // "Présent" | "Retard" | "Absent" | "Prévu"
    let arrivee = null;
    let retardMin = 0;
    if (cours) {
      joursCours++;
      if (futur) {
        etat = "Prévu"; // à pointer (jour à venir)
      } else {
        coursEcoules++;
        const v = r();
        if (v < 0.1) {
          etat = "Absent";
        } else {
          retardMin = r() < 0.22 ? Math.floor(r() * 16) + 1 : 0;
          etat = retardMin > 5 ? "Retard" : "Présent";
          arrivee = `08:${String(retardMin).padStart(2, "0")}`;
          joursPointes++;
        }
      }
    }
    jours.push({ jour: d, dow, weekend, ferie, event, cours, futur, today: d === TODAY, etat, arrivee, retardMin });
  }
  const heuresTravaillees = joursPointes * CRENEAUX_JOUR;
  const heuresPlanifiees = joursCours * CRENEAUX_JOUR;
  return {
    mois: MOIS_LABEL,
    today: TODAY,
    jours,
    joursCours,
    coursEcoules,
    joursPointes,
    heuresPlanifiees,
    heuresTravaillees,
    tauxPresence: coursEcoules ? Math.round((joursPointes / coursEcoules) * 100) : 0,
    tauxHoraire: TAUX_HORAIRE,
    remunerationEstimee: heuresTravaillees * TAUX_HORAIRE,
  };
}

// Productivité de l'agent (score, classement, tendance, série 7 jours).
export function productiviteEmploye(id) {
  const r = makeRng(id + "prod");
  const score = 72 + Math.floor(r() * 27); // 72–98 %
  const rang = 1 + Math.floor(r() * 12);
  const tendance = Math.round((r() * 9 - 3) * 10) / 10; // -3 … +6
  const tempsMoyen = `${6 + Math.floor(r() * 2)}h ${String(Math.floor(r() * 59)).padStart(2, "0")}m`;
  const inactivite = `${Math.floor(r() * 2)}h ${String(15 + Math.floor(r() * 40)).padStart(2, "0")}m`;
  const serie = Array.from({ length: 7 }, () => 58 + Math.floor(r() * 40));
  return { score, rang, total: 12, tendance, tempsMoyen, inactivite, serie };
}

// Détail de l'activité du jour : connexions, déconnexions, inactivités, justifications.
export function activiteDetail(id) {
  const e = empById[id];
  const arr = e?.today?.arrivee && e.today.arrivee !== "--:--" ? e.today.arrivee : "08:30";
  const poste = e?.today?.poste && !["HORS LIGNE", "Distant"].includes(e.today.poste) ? e.today.poste : "Poste distant";
  return {
    connexions: [
      { time: arr, poste },
      { time: "11:35", poste },
      { time: "13:05", poste },
    ],
    deconnexions: [
      { time: "11:20", motif: "Pause café" },
      { time: "12:50", motif: "Pause déjeuner" },
    ],
    inactivites: [
      { debut: "10:42", duree: "8 min" },
      { debut: "14:15", duree: "12 min" },
    ],
    justifications: [
      { date: "18 juin", motif: "Rendez-vous médical", statut: "Approuvée" },
      { date: "12 juin", motif: "Retard transport", statut: "Approuvée" },
    ],
  };
}

// Historique RH (événements clés).
export function historiqueRH(id) {
  const d = employeDetails[id];
  return [
    { date: "31/05/2025", type: "Paie validée", detail: "Salaire de mai versé", icon: "payments", tone: "emerald" },
    { date: "10/03/2024", type: "Avenant signé", detail: "Passage en télétravail partiel", icon: "edit_document", tone: "sky" },
    { date: "15/06/2023", type: "Augmentation", detail: "Révision salariale annuelle", icon: "trending_up", tone: "emerald" },
    { date: "02/02/2022", type: "Changement de poste", detail: "Nouveau service / fonction", icon: "swap_horiz", tone: "amber" },
    { date: d?.embauche ?? "—", type: "Embauche", detail: "Entrée dans l'entreprise", icon: "person_add", tone: "brand" },
  ];
}
