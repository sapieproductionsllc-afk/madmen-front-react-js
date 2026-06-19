// Données de démonstration (mock).
// À remplacer plus tard par les vraies données issues de l'API / Supabase.

// --- Agences ---
export const agences = [
  { id: "ag-01", name: "Siège Social", zone: "Centre", employees: 320, present: 268, productivity: 92 },
  { id: "ag-02", name: "Agence Centre", zone: "Zone A", employees: 180, present: 142, productivity: 88 },
  { id: "ag-03", name: "Agence Nord", zone: "Zone B", employees: 210, present: 175, productivity: 90 },
  { id: "ag-04", name: "Agence Sud", zone: "Zone C", employees: 156, present: 121, productivity: 85 },
  { id: "ag-05", name: "Agence Est", zone: "Zone D", employees: 134, present: 98, productivity: 81 },
];

export const totalEmployes = agences.reduce((somme, a) => somme + a.employees, 0);
export const totalPresents = agences.reduce((somme, a) => somme + a.present, 0);
const tauxPresence = Math.round((totalPresents / totalEmployes) * 1000) / 10;

// --- Indicateurs clés (4 cartes essentielles) ---
export const stats = [
  {
    id: "total",
    icon: "groups",
    label: "Total employés",
    count: totalEmployes,
    decimals: 0,
    sub: `Répartis sur ${agences.length} agences`,
    trend: null,
    color: "indigo",
  },
  {
    id: "present",
    icon: "how_to_reg",
    label: "Présents aujourd'hui",
    count: totalPresents,
    decimals: 0,
    sub: `${tauxPresence.toString().replace(".", ",")} % de l'effectif`,
    trend: { dir: "up", value: "+3,2 %" },
    color: "emerald",
  },
  {
    id: "prod",
    icon: "trending_up",
    label: "Productivité globale",
    count: 89.4,
    decimals: 1,
    suffix: " %",
    sub: "Moyenne pondérée des agences",
    trend: { dir: "up", value: "+12,4 %" },
    color: "violet",
  },
  {
    id: "alerts",
    icon: "warning",
    label: "Alertes critiques",
    count: 8,
    decimals: 0,
    sub: "Nécessitent une action",
    trend: { dir: "down", value: "-2" },
    color: "rose",
  },
];

// --- Présence en temps réel ---
export const presence = [
  {
    id: "AUR-8821",
    name: "Elena Vance",
    agence: "Siège Social",
    department: "Cybersécurité",
    status: "Présent",
    checkIn: "08:14",
    workstation: "WS-042-ALPHA",
    photo:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC_VQPsyAZlDPxZBguxo0VxhxARPf3OgYFoTind2L2TvXNHG4bgYkaXPfIa-zvYKFGGKsTznyZh8Ej1DF_6ZEBS8HijOF5OndIU2X1kfeIv7H8dBgyTZImlzCqH2PttsAkG153Rm13NzIkusYDacVh76zD4brL80b64gZSh7bRWn9dXRHg7-TyC6Ir6cc_ra6RTE4RLpm9sqH1W3CSOnqRlNWtrEKGAeZ4NuXfUvNCatryLMYB_hqf391WxeAR0tRpAjn1QpOsMrs0",
  },
  {
    id: "AUR-4491",
    name: "Marcus Thorne",
    agence: "Agence Nord",
    department: "Infrastructure",
    status: "En congé",
    checkIn: "--:--",
    workstation: "Distant",
    photo:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDmqrRwJILFqW4_JBa9MaQxvtD5CtvVauQcI0fhEPYSv55Lgw3hQEfj-tBTDmNCk1uvPWli_FbzjZCfvPWhCviDTSr89t-G3QdQiQAf3HUhZF6gMrnQcM-0syraVe0ec0i18RyYEsCopwd8If487xKkPYM8TNnzw-vYABdNK5Ukg49n71StlgICTWUyaEAyW_a4WMvCGVjKJvOdM-CgNe6NybAfFVcG6d14ogq5TcUisHvvdGSsW6ICxlAnc14t03NEtSMe4e12o6M",
  },
  {
    id: "AUR-1102",
    name: "Julian Rossi",
    agence: "Agence Centre",
    department: "Recherche IA",
    status: "Présent",
    checkIn: "09:02",
    workstation: "WS-119-BETA",
    photo:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDW7Z4FrcImWjIAGBMRdE9YHbbd_as88WUlsau9X_Yr2I81cRLl88r_8yi5fgggFYpZZVv7paKI3AHi3mvE80ThhNm45flNzTfe4SZXdLAF3DqeqdAl4N1bjaI05PcP4GUB_VBYwVYoDPiaEGjOD_3Sixh69f7JSdyyYYMI7zVW0W6sHLX-HwzMMZENiS2KqwF7HeJRo0JmtEwzrrn7w4maGaaaAg9n3GfH0HFutimmE4nvF4pZsR9dM47_1Pn3wGXALqhcYXgOzZY",
  },
  {
    id: "AUR-9031",
    name: "Sarah Jenkins",
    agence: "Agence Sud",
    department: "Opérations",
    status: "Absent",
    checkIn: "--:--",
    workstation: "HORS LIGNE",
    photo:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCsuYiho0e4OsAaa4KAlvFXz2DG68bnlxlaV1uJL2mZTWJA3cjpgB78ayi2M--g2KjABG-TK-mMqSQCIl0BJ-VX41bj_8SftJyo586ZNmOvBLCQnRldD01nw3xatU--Ic9QCGSoRPKG5IbgyZHNi29vuHc_opf_U71Bvv41mBWx_rxNC10tEZJWZOeel8loNT6fZU3qozRApF17F-TUvSMh5fJ-rFw3X5SKlYczFG70W9_LsP6-MQFuFl2AA38H-lDWe8WogfzHtxg",
  },
];

// --- Flux d'activité en direct ---
export const activity = [
  { id: 1, name: "Elena Vance", machine: "MAC-PRO-8291", agence: "Siège Social", status: "Actif", apps: ["VS Code", "Slack", "+2"], worked: "06h 42m" },
  { id: 2, name: "Julian Rossi", machine: "DGX-A100-ST", agence: "Agence Centre", status: "Inactif", apps: ["Jupyter", "Chrome"], worked: "05h 11m" },
  { id: 3, name: "Noyau Système", machine: "SRV-MAIN-001", agence: "Siège Social", status: "Incident", apps: ["Kernel Panic"], worked: "00h 02m" },
];

// --- Tendances de productivité (courbe sur 12 jours) ---
export const productivity = {
  value: 89.4,
  series: [62, 66, 64, 71, 69, 76, 74, 81, 79, 85, 83, 89],
  peakEfficiency: "10:30",
  weeklyGrowth: "+12,4",
};
