// Données fictives pour l'ensemble des pages (à remplacer plus tard par l'API).

export const employes = [
  { id: "AUR-8821", name: "Elena Vance", fonction: "Responsable Cybersécurité", department: "Cybersécurité", agence: "Siège Social", phone: "+33 6 12 45 78 90", email: "e.vance@madmen.io", status: "Actif" },
  { id: "AUR-4491", name: "Marcus Thorne", fonction: "Ingénieur Infrastructure", department: "Infrastructure", agence: "Agence Nord", phone: "+33 6 88 21 09 14", email: "m.thorne@madmen.io", status: "Congé" },
  { id: "AUR-1102", name: "Julian Rossi", fonction: "Chercheur IA", department: "Recherche IA", agence: "Agence Centre", phone: "+33 6 47 55 33 21", email: "j.rossi@madmen.io", status: "Actif" },
  { id: "AUR-9031", name: "Sarah Jenkins", fonction: "Coordinatrice Opérations", department: "Opérations", agence: "Agence Sud", phone: "+33 6 33 78 12 90", email: "s.jenkins@madmen.io", status: "Suspendu" },
  { id: "AUR-7720", name: "David Mercier", fonction: "Comptable Senior", department: "Finance", agence: "Siège Social", phone: "+33 6 21 44 67 80", email: "d.mercier@madmen.io", status: "Actif" },
  { id: "AUR-6654", name: "Amélie Dubois", fonction: "Chargée RH", department: "Ressources Humaines", agence: "Siège Social", phone: "+33 6 09 87 65 43", email: "a.dubois@madmen.io", status: "Actif" },
  { id: "AUR-3398", name: "Karim Benali", fonction: "Technicien Support", department: "Infrastructure", agence: "Agence Est", phone: "+33 6 55 12 34 56", email: "k.benali@madmen.io", status: "Actif" },
  { id: "AUR-2241", name: "Léa Fontaine", fonction: "Analyste Données", department: "Recherche IA", agence: "Agence Centre", phone: "+33 6 78 90 12 34", email: "l.fontaine@madmen.io", status: "Actif" },
  { id: "AUR-5567", name: "Thomas Girard", fonction: "Chef de Projet", department: "Opérations", agence: "Agence Nord", phone: "+33 6 41 23 65 87", email: "t.girard@madmen.io", status: "Actif" },
  { id: "AUR-8843", name: "Nadia Cherif", fonction: "Juriste", department: "Juridique", agence: "Siège Social", phone: "+33 6 62 89 47 10", email: "n.cherif@madmen.io", status: "Congé" },
  { id: "AUR-1190", name: "Paul Lefèvre", fonction: "Agent de Sécurité", department: "Sécurité", agence: "Agence Sud", phone: "+33 6 17 28 39 40", email: "p.lefevre@madmen.io", status: "Actif" },
  { id: "AUR-7012", name: "Inès Moreau", fonction: "Designer Produit", department: "Recherche IA", agence: "Agence Est", phone: "+33 6 30 51 72 93", email: "i.moreau@madmen.io", status: "Actif" },
];

export const departements = [
  { name: "Cybersécurité", lead: "Elena Vance", headcount: 42, agence: "Siège Social" },
  { name: "Infrastructure", lead: "Marcus Thorne", headcount: 78, agence: "Multi-agences" },
  { name: "Recherche IA", lead: "Julian Rossi", headcount: 35, agence: "Agence Centre" },
  { name: "Opérations", lead: "Sarah Jenkins", headcount: 120, agence: "Multi-agences" },
  { name: "Finance", lead: "David Mercier", headcount: 24, agence: "Siège Social" },
  { name: "Ressources Humaines", lead: "Amélie Dubois", headcount: 18, agence: "Siège Social" },
];

export const paie = [
  { id: "AUR-8821", name: "Elena Vance", base: 5200, primes: 800, avances: 0, retenues: 420, status: "Validé" },
  { id: "AUR-1102", name: "Julian Rossi", base: 4800, primes: 600, avances: 500, retenues: 380, status: "Validé" },
  { id: "AUR-7720", name: "David Mercier", base: 4100, primes: 300, avances: 0, retenues: 320, status: "En attente" },
  { id: "AUR-6654", name: "Amélie Dubois", base: 3600, primes: 250, avances: 200, retenues: 280, status: "Validé" },
  { id: "AUR-5567", name: "Thomas Girard", base: 4300, primes: 450, avances: 0, retenues: 350, status: "En attente" },
  { id: "AUR-3398", name: "Karim Benali", base: 2800, primes: 150, avances: 300, retenues: 210, status: "Validé" },
  { id: "AUR-2241", name: "Léa Fontaine", base: 3900, primes: 400, avances: 0, retenues: 300, status: "En attente" },
  { id: "AUR-1190", name: "Paul Lefèvre", base: 2400, primes: 120, avances: 0, retenues: 180, status: "Validé" },
];

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
