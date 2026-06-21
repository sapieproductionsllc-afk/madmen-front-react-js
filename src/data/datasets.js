// Données fictives pour l'ensemble des pages (à remplacer plus tard par l'API).

// SOURCE UNIQUE : chaque employé porte son pointage du jour (`today`).
// Tous les chiffres de l'app (dashboard, présence, agences) en sont dérivés.
export const employes = [
  { id: "AUR-1187", name: "Prince Makaya", fonction: "Professeur d'anglais", matiere: "Anglais", tauxHoraire: 1300, department: "Langues", agence: "Siège Social", phone: "+242 06 123 45 67", email: "p.makaya@madmen.io", status: "Actif", today: { prevu: "08:00", arrivee: "--:--", retardMin: null, retenue: 0, statut: "Présent", poste: "Salle A1", justification: null } },
  { id: "AUR-8821", name: "Elena Vance", fonction: "Responsable Cybersécurité", department: "Cybersécurité", agence: "Siège Social", phone: "+33 6 12 45 78 90", email: "e.vance@madmen.io", status: "Actif", today: { prevu: "08:30", arrivee: "08:14", retardMin: 0, retenue: 0, statut: "Présent", poste: "WS-042-ALPHA", justification: null } },
  { id: "AUR-4491", name: "Marcus Thorne", fonction: "Ingénieur Infrastructure", department: "Infrastructure", agence: "Agence Nord", phone: "+33 6 88 21 09 14", email: "m.thorne@madmen.io", status: "Congé", today: { prevu: "08:30", arrivee: "--:--", retardMin: null, retenue: 0, statut: "Congé", poste: "Distant", justification: { statut: "Justifié", motif: "Congé approuvé", via: "RH" } } },
  { id: "AUR-1102", name: "Julian Rossi", fonction: "Chercheur IA", department: "Recherche IA", agence: "Agence Centre", phone: "+33 6 47 55 33 21", email: "j.rossi@madmen.io", status: "Actif", today: { prevu: "08:30", arrivee: "08:47", retardMin: 17, retenue: 34, statut: "Retard", poste: "WS-119-BETA", justification: null } },
  { id: "AUR-9031", name: "Sarah Jenkins", fonction: "Coordinatrice Opérations", department: "Opérations", agence: "Agence Sud", phone: "+33 6 33 78 12 90", email: "s.jenkins@madmen.io", status: "Suspendu", today: { prevu: "08:30", arrivee: "--:--", retardMin: null, retenue: 0, statut: "Absent", poste: "HORS LIGNE", justification: { statut: "À justifier" } } },
  { id: "AUR-7720", name: "David Mercier", fonction: "Comptable Senior", department: "Finance", agence: "Siège Social", phone: "+33 6 21 44 67 80", email: "d.mercier@madmen.io", status: "Actif", today: { prevu: "08:30", arrivee: "08:25", retardMin: 0, retenue: 0, statut: "Présent", poste: "WS-011", justification: null } },
  { id: "AUR-6654", name: "Amélie Dubois", fonction: "Chargée RH", department: "Ressources Humaines", agence: "Siège Social", phone: "+33 6 09 87 65 43", email: "a.dubois@madmen.io", status: "Actif", today: { prevu: "08:30", arrivee: "08:33", retardMin: 3, retenue: 0, statut: "Présent", poste: "WS-014", justification: null } },
  { id: "AUR-3398", name: "Karim Benali", fonction: "Technicien Support", department: "Infrastructure", agence: "Agence Est", phone: "+33 6 55 12 34 56", email: "k.benali@madmen.io", status: "Actif", today: { prevu: "08:30", arrivee: "08:39", retardMin: 9, retenue: 18, statut: "Retard", poste: "WS-205", justification: null } },
  { id: "AUR-2241", name: "Léa Fontaine", fonction: "Analyste Données", department: "Recherche IA", agence: "Agence Centre", phone: "+33 6 78 90 12 34", email: "l.fontaine@madmen.io", status: "Actif", today: { prevu: "08:30", arrivee: "09:05", retardMin: 35, retenue: 70, statut: "Retard", poste: "WS-121", justification: null } },
  { id: "AUR-5567", name: "Thomas Girard", fonction: "Chef de Projet", department: "Opérations", agence: "Agence Nord", phone: "+33 6 41 23 65 87", email: "t.girard@madmen.io", status: "Actif", today: { prevu: "08:30", arrivee: "08:20", retardMin: 0, retenue: 0, statut: "Présent", poste: "WS-301", justification: null } },
  { id: "AUR-8843", name: "Nadia Cherif", fonction: "Juriste", department: "Juridique", agence: "Siège Social", phone: "+33 6 62 89 47 10", email: "n.cherif@madmen.io", status: "Congé", today: { prevu: "08:30", arrivee: "--:--", retardMin: null, retenue: 0, statut: "Congé", poste: "Distant", justification: { statut: "Justifié", motif: "Congé approuvé", via: "RH" } } },
  { id: "AUR-1190", name: "Paul Lefèvre", fonction: "Agent de Sécurité", department: "Sécurité", agence: "Agence Sud", phone: "+33 6 17 28 39 40", email: "p.lefevre@madmen.io", status: "Actif", today: { prevu: "08:30", arrivee: "--:--", retardMin: null, retenue: 0, statut: "Absent", poste: "HORS LIGNE", justification: { statut: "Justifié", motif: "Rendez-vous médical", via: "App employé" } } },
  { id: "AUR-7012", name: "Inès Moreau", fonction: "Designer Produit", department: "Recherche IA", agence: "Agence Est", phone: "+33 6 30 51 72 93", email: "i.moreau@madmen.io", status: "Actif", today: { prevu: "08:30", arrivee: "08:28", retardMin: 0, retenue: 0, statut: "Présent", poste: "WS-208", justification: null } },
];

export const departements = [
  { name: "Cybersécurité", lead: "Elena Vance", headcount: 42, agence: "Siège Social" },
  { name: "Infrastructure", lead: "Marcus Thorne", headcount: 78, agence: "Multi-agences" },
  { name: "Recherche IA", lead: "Julian Rossi", headcount: 35, agence: "Agence Centre" },
  { name: "Opérations", lead: "Sarah Jenkins", headcount: 120, agence: "Multi-agences" },
  { name: "Finance", lead: "David Mercier", headcount: 24, agence: "Siège Social" },
  { name: "Ressources Humaines", lead: "Amélie Dubois", headcount: 18, agence: "Siège Social" },
];

// retenues = total ; retardRetenue = part liée aux retards (prélèvement automatique)
export const paie = [
  { id: "AUR-8821", name: "Elena Vance", base: 5200, primes: 800, avances: 0, retenues: 420, retardRetenue: 0, status: "Validé" },
  { id: "AUR-1102", name: "Julian Rossi", base: 4800, primes: 600, avances: 500, retenues: 380, retardRetenue: 34, status: "Validé" },
  { id: "AUR-7720", name: "David Mercier", base: 4100, primes: 300, avances: 0, retenues: 320, retardRetenue: 0, status: "En attente" },
  { id: "AUR-6654", name: "Amélie Dubois", base: 3600, primes: 250, avances: 200, retenues: 280, retardRetenue: 0, status: "Validé" },
  { id: "AUR-5567", name: "Thomas Girard", base: 4300, primes: 450, avances: 0, retenues: 350, retardRetenue: 0, status: "En attente" },
  { id: "AUR-3398", name: "Karim Benali", base: 2800, primes: 150, avances: 300, retenues: 210, retardRetenue: 18, status: "Validé" },
  { id: "AUR-2241", name: "Léa Fontaine", base: 3900, primes: 400, avances: 0, retenues: 370, retardRetenue: 70, status: "En attente" },
  { id: "AUR-1190", name: "Paul Lefèvre", base: 2400, primes: 120, avances: 0, retenues: 180, retardRetenue: 0, status: "Validé" },
];

// Pointages du jour (ZKTeco K40) — DÉRIVÉS de la source unique `employes`.
// Règle : retard > 5 min => retenue auto (2 €/min).
export const pointages = employes.map((e) => ({
  id: e.id,
  name: e.name,
  agence: e.agence,
  prevu: e.today.prevu,
  arrivee: e.today.arrivee,
  retardMin: e.today.retardMin,
  retenue: e.today.retenue,
  status: e.today.statut,
  justification: e.today.justification,
}));

export const alertes = [
  { id: 1, type: "Tentative refusée", severity: "Critique", employe: "Inconnu", agence: "Siège Social", machine: "WS-042-ALPHA", time: "09:42", message: "3 tentatives de connexion refusées (PIN incorrect).", read: false },
  { id: 2, type: "Retard", severity: "Moyen", employe: "Karim Benali", agence: "Agence Est", machine: "—", time: "09:15", message: "Arrivée à 09:15 (horaire prévu 08:30).", read: false },
  { id: 3, type: "Inactivité", severity: "Moyen", employe: "Julian Rossi", agence: "Agence Centre", machine: "DGX-A100-ST", time: "11:03", message: "Inactivité de 7 minutes — motif : pause café.", read: false },
  { id: 4, type: "Déconnexion", severity: "Faible", employe: "Sarah Jenkins", agence: "Agence Sud", machine: "WS-118-GAMMA", time: "10:21", message: "Déconnexion inhabituelle hors plage horaire.", read: true },
  { id: 5, type: "Incident poste", severity: "Critique", employe: "Système", agence: "Siège Social", machine: "SRV-MAIN-001", time: "08:58", message: "Incident noyau détecté sur le serveur principal.", read: false },
  { id: 6, type: "Absence", severity: "Moyen", employe: "Paul Lefèvre", agence: "Agence Sud", machine: "—", time: "08:30", message: "Absence non justifiée à l'ouverture.", read: true },
];

export const appareils = [
  { id: "DEV-01", name: "Lecteur empreintes — Entrée A", type: "Empreinte", agence: "Siège Social", status: "En ligne", lastSync: "il y a 2 min" },
  { id: "DEV-02", name: "Caméra faciale — Hall", type: "Reconnaissance faciale", agence: "Siège Social", status: "En ligne", lastSync: "il y a 1 min" },
  { id: "DEV-03", name: "Badge RFID — Parking", type: "RFID", agence: "Agence Nord", status: "En ligne", lastSync: "il y a 4 min" },
  { id: "DEV-04", name: "Lecteur empreintes — Étage 2", type: "Empreinte", agence: "Agence Centre", status: "Hors ligne", lastSync: "il y a 3 h" },
  { id: "DEV-05", name: "Badge RFID — Entrée B", type: "RFID", agence: "Agence Sud", status: "En ligne", lastSync: "il y a 6 min" },
  { id: "DEV-06", name: "Caméra faciale — Atelier", type: "Reconnaissance faciale", agence: "Agence Est", status: "Maintenance", lastSync: "il y a 1 j" },
];

export const utilisateurs = [
  { id: 1, name: "Elena Vance", email: "e.vance@madmen.io", role: "Directeur Général", agence: "Toutes", status: "Actif", lastLogin: "Aujourd'hui, 08:14" },
  { id: 2, name: "Amélie Dubois", email: "a.dubois@madmen.io", role: "RH", agence: "Siège Social", status: "Actif", lastLogin: "Aujourd'hui, 09:02" },
  { id: 3, name: "Thomas Girard", email: "t.girard@madmen.io", role: "Manager", agence: "Agence Nord", status: "Actif", lastLogin: "Hier, 17:48" },
  { id: 4, name: "David Mercier", email: "d.mercier@madmen.io", role: "Comptable", agence: "Siège Social", status: "Actif", lastLogin: "Aujourd'hui, 08:55" },
  { id: 5, name: "Karim Benali", email: "k.benali@madmen.io", role: "Manager", agence: "Agence Est", status: "Suspendu", lastLogin: "Il y a 5 jours" },
];

export const roles = [
  { name: "Directeur Général", desc: "Accès complet à toutes les agences et données.", users: 1, tone: "indigo" },
  { name: "RH", desc: "Personnel, présence et paie. Pas d'accès système.", users: 3, tone: "emerald" },
  { name: "Manager", desc: "Supervision de sa propre agence uniquement.", users: 6, tone: "amber" },
  { name: "Comptable", desc: "Finance & paie et rapports. Pas de biométrie.", users: 2, tone: "violet" },
];

export const classement = [
  { rank: 1, name: "Elena Vance", agence: "Siège Social", productivity: 96, worked: "7h 42m" },
  { rank: 2, name: "Léa Fontaine", agence: "Agence Centre", productivity: 94, worked: "7h 30m" },
  { rank: 3, name: "Thomas Girard", agence: "Agence Nord", productivity: 92, worked: "7h 18m" },
  { rank: 4, name: "Inès Moreau", agence: "Agence Est", productivity: 90, worked: "7h 05m" },
  { rank: 5, name: "David Mercier", agence: "Siège Social", productivity: 88, worked: "6h 58m" },
  { rank: 6, name: "Karim Benali", agence: "Agence Est", productivity: 85, worked: "6h 44m" },
  { rank: 7, name: "Julian Rossi", agence: "Agence Centre", productivity: 83, worked: "6h 31m" },
];

export const rapports = [
  { icon: "event_available", title: "Présence mensuelle", desc: "Synthèse des présences, retards et absences par agence.", periode: "Mai 2026" },
  { icon: "trending_up", title: "Productivité par département", desc: "Temps travaillé, inactivité et taux par département.", periode: "Mai 2026" },
  { icon: "payments", title: "Récapitulatif de paie", desc: "Salaires, primes, avances et retenues du mois.", periode: "Mai 2026" },
  { icon: "warning", title: "Incidents & alertes", desc: "Tentatives refusées, déconnexions et incidents postes.", periode: "Mai 2026" },
  { icon: "apartment", title: "Comparatif des agences", desc: "Effectifs, présence et performance comparés.", periode: "T2 2026" },
  { icon: "schedule", title: "Heures supplémentaires", desc: "Heures additionnelles par employé et par équipe.", periode: "Mai 2026" },
];

export const agencesList = ["Siège Social", "Agence Centre", "Agence Nord", "Agence Sud", "Agence Est"];
export const statutsEmploye = ["Actif", "Congé", "Suspendu"];

// Demandes en attente d'accord (congé / permission / justification d'absence) — liées par matricule.
export const demandes = [
  { id: "DM-201", employeId: "AUR-2241", type: "Congé", periode: "24 → 28 juin 2026", jours: 5, motif: "Congés payés annuels", soumisLe: "18 juin 2026" },
  { id: "DM-202", employeId: "AUR-3398", type: "Permission", periode: "23 juin 2026 · 14:00 → 16:00", motif: "Rendez-vous médical", soumisLe: "19 juin 2026" },
  { id: "DM-203", employeId: "AUR-9031", type: "Absence", periode: "20 juin 2026", motif: "Absence non justifiée à l'ouverture", soumisLe: "20 juin 2026" },
  { id: "DM-204", employeId: "AUR-7012", type: "Congé", periode: "1 → 12 juillet 2026", jours: 10, motif: "Congé d'été", soumisLe: "15 juin 2026" },
  { id: "DM-205", employeId: "AUR-1102", type: "Permission", periode: "25 juin 2026 · matin", motif: "Démarche administrative", soumisLe: "19 juin 2026" },
];

// Index rapide matricule → demande en attente.
export const demandeParEmploye = Object.fromEntries(demandes.map((d) => [d.employeId, d]));

// ---------------------------------------------------------------------------
// VUE CENTRÉE AGENTS — statut temps réel + dernière activité (lié par matricule)
// ---------------------------------------------------------------------------
export const tempsReel = {
  "AUR-1187": { live: "En activité", detail: "Cours d'anglais · Salle A1", depuis: "à l'instant" },
  "AUR-8821": { live: "En activité", detail: "Connectée · poste WS-042-ALPHA", depuis: "à l'instant" },
  "AUR-4491": { live: "Congé", detail: "Congé approuvé jusqu'au 24 juin", depuis: "—" },
  "AUR-1102": { live: "En activité", detail: "Session active · poste WS-119-BETA", depuis: "il y a 2 min" },
  "AUR-9031": { live: "Absent", detail: "Aucun pointage aujourd'hui", depuis: "—" },
  "AUR-7720": { live: "En pause", detail: "Pause déjeuner", depuis: "il y a 18 min" },
  "AUR-6654": { live: "En activité", detail: "Connectée · poste WS-014", depuis: "il y a 5 min" },
  "AUR-3398": { live: "En activité", detail: "Intervention support · poste WS-205", depuis: "il y a 1 min" },
  "AUR-2241": { live: "En pause", detail: "Pause café", depuis: "il y a 7 min" },
  "AUR-5567": { live: "En activité", detail: "Réunion projet · salle B2", depuis: "il y a 12 min" },
  "AUR-8843": { live: "Congé", detail: "Congé approuvé jusqu'au 22 juin", depuis: "—" },
  "AUR-1190": { live: "Absent", detail: "Absence justifiée · RDV médical", depuis: "—" },
  "AUR-7012": { live: "En activité", detail: "Maquettage · poste WS-208", depuis: "il y a 3 min" },
};

// Statut live → tonalité de badge (vert / ambre / rouge / bleu)
export const toneLive = { "En activité": "emerald", "En pause": "amber", "Absent": "rose", "Congé": "sky" };
export const ordreLive = { "En activité": 0, "En pause": 1, "Absent": 2, "Congé": 3 };

// Devise officielle de l'app : FCFA. Format « 1 300 FCFA ».
export const fcfa = (n) => Math.round(n).toLocaleString("fr-FR") + " FCFA";

// Flux d'activité récente (panneau droit du dashboard).
export const activiteRecente = [
  { time: "09:24", name: "Karim Benali", action: "Pointage d'entrée", icon: "login", tone: "emerald" },
  { time: "09:18", name: "Léa Fontaine", action: "Début de pause", icon: "local_cafe", tone: "amber" },
  { time: "09:05", name: "Julian Rossi", action: "Entrée (retard +17 min)", icon: "login", tone: "rose" },
  { time: "08:47", name: "David Mercier", action: "Reprise d'activité", icon: "play_circle", tone: "emerald" },
  { time: "08:33", name: "Amélie Dubois", action: "Pointage d'entrée", icon: "login", tone: "emerald" },
  { time: "08:30", name: "Paul Lefèvre", action: "Absence signalée", icon: "event_busy", tone: "rose" },
  { time: "08:20", name: "Thomas Girard", action: "Pointage d'entrée", icon: "login", tone: "emerald" },
];

// Source unique du compteur d'alertes (utilisé par le menu latéral ET le header)
export const alertesNonLues = alertes.filter((a) => !a.read).length;
