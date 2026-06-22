// Constantes d'affichage du dashboard (PAS de données : tout vient de l'API).
// Les anciennes fausses données (employés, paie, alertes, demandes, présence…) ont
// été retirées : chaque page/composant charge désormais ses VRAIES données via src/lib/api.js.

// Agences (libellés de filtres / formulaires).
export const agencesList = ["Siège Social", "Agence Centre", "Agence Nord", "Agence Sud", "Agence Est"];

// Statuts d'employé (options de formulaire).
export const statutsEmploye = ["Actif", "Congé", "Suspendu"];

// Statut « live » → tonalité de badge (vert / ambre / rouge / bleu).
export const toneLive = { "En activité": "emerald", "En pause": "amber", "Absent": "rose", "Congé": "sky" };

// Ordre d'affichage des statuts « live ».
export const ordreLive = { "En activité": 0, "En pause": 1, "Absent": 2, "Congé": 3 };

// Devise officielle de l'app : FCFA. Format « 1 300 FCFA ».
export const fcfa = (n) => Math.round(n).toLocaleString("fr-FR") + " FCFA";
