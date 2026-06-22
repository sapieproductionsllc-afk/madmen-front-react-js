// src/lib/mappers.js — Adapte la forme de l'API à celle attendue par le front.
// Permet de garder les composants/design INCHANGÉS : on ne fait que traduire les champs.
// Décisions actées : on garde `département` (pas d'`agence`) ; pas d'école (fonction = poste).

const STATUT = { actif: "Actif", conge: "En congé", suspendu: "Suspendu" };
const TODAY = { present: "Présent", retard: "Retard", absent: "Absent", conge: "Congé" };

/** Employé API -> objet attendu par les pages/cartes du dashboard. */
export function mapEmploye(e) {
  const t = e.today || {};
  return {
    id: e.matricule, // le front indexe par matricule
    _id: e.id, // id numérique conservé pour les futurs appels API
    matricule: e.matricule,
    name: e.name || `${e.prenom ?? ""} ${e.nom ?? ""}`.trim(),
    fonction: e.poste_libelle || "—",
    department: e.departement_nom || "—",
    agence: e.departement_nom || "—", // décision : agence = département
    phone: e.telephone || "",
    email: e.email || "",
    role: e.role,
    status: STATUT[e.statut] || "Actif",
    today: {
      prevu: "",
      arrivee: t.arrivee ? String(t.arrivee).slice(11, 16) : "--:--",
      retardMin: t.retard_minutes ?? null,
      retenue: 0,
      statut: TODAY[t.statut] || (e.statut === "conge" ? "Congé" : "Absent"),
      poste: e.poste_libelle || "",
      justification: null,
    },
  };
}
