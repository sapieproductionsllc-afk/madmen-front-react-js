// Agrégats du tableau de bord — TOUS dérivés de la source unique `employes`.
import { employes, alertesNonLues } from "./datasets.js";

const auTravail = (e) => e.today.statut === "Présent" || e.today.statut === "Retard";

export const totalEmployes = employes.length;
export const totalPresents = employes.filter(auTravail).length;
const tauxPresence = Math.round((totalPresents / totalEmployes) * 1000) / 10;
const totalRetard = employes.filter((e) => e.today.statut === "Retard").length;

// --- Agences (effectifs & présence calculés depuis les employés) ---
const metaAgences = [
  { name: "Siège Social", zone: "Centre", productivity: 92 },
  { name: "Agence Centre", zone: "Zone A", productivity: 88 },
  { name: "Agence Nord", zone: "Zone B", productivity: 90 },
  { name: "Agence Sud", zone: "Zone C", productivity: 85 },
  { name: "Agence Est", zone: "Zone D", productivity: 87 },
];

export const agences = metaAgences.map((a, i) => {
  const membres = employes.filter((e) => e.agence === a.name);
  return {
    id: `ag-0${i + 1}`,
    name: a.name,
    zone: a.zone,
    employees: membres.length,
    present: membres.filter(auTravail).length,
    productivity: a.productivity,
  };
});

// --- Indicateurs clés (4 cartes) ---
export const stats = [
  { id: "total", icon: "groups", label: "Total employés", count: totalEmployes, decimals: 0, sub: `Répartis sur ${agences.length} agences`, trend: null, color: "indigo" },
  { id: "present", icon: "how_to_reg", label: "Présents aujourd'hui", count: totalPresents, decimals: 0, sub: `${tauxPresence.toString().replace(".", ",")} % de l'effectif`, trend: { dir: "up", value: "+1" }, color: "emerald" },
  { id: "prod", icon: "trending_up", label: "Productivité globale", count: 89.4, decimals: 1, suffix: " %", sub: "Moyenne pondérée des agences", trend: { dir: "up", value: "+12,4 %" }, color: "violet" },
  { id: "retard", icon: "schedule", label: "Retards du jour", count: totalRetard, decimals: 0, sub: "Retenues appliquées", trend: { dir: "down", value: "-1" }, color: "rose" },
];

// --- Présence en temps réel (échantillon pour le tableau de bord) ---
export const presence = employes.slice(0, 5).map((e) => ({
  id: e.id,
  name: e.name,
  agence: e.agence,
  department: e.department,
  status: e.today.statut,
  checkIn: e.today.arrivee,
  workstation: e.today.poste,
}));

// --- Flux d'activité en direct (échantillon parmi les présents) ---
export const activity = [
  { id: 1, name: "Elena Vance", machine: "WS-042-ALPHA", agence: "Siège Social", status: "Actif", apps: ["VS Code", "Slack", "+2"], worked: "06h 42m" },
  { id: 2, name: "Julian Rossi", machine: "WS-119-BETA", agence: "Agence Centre", status: "Inactif", apps: ["Jupyter", "Chrome"], worked: "05h 11m" },
  { id: 3, name: "Noyau Système", machine: "SRV-MAIN-001", agence: "Siège Social", status: "Incident", apps: ["Kernel Panic"], worked: "00h 02m" },
];

// --- Tendances de productivité (courbe sur 12 jours) ---
export const productivity = {
  value: 89.4,
  series: [62, 66, 64, 71, 69, 76, 74, 81, 79, 85, 83, 89],
  peakEfficiency: "10:30",
  weeklyGrowth: "+12,4",
};

export { alertesNonLues };
