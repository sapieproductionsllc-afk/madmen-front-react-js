# MADMEN — Front (React)

Tableau de bord de **gestion intelligente des employés et de contrôle des postes de travail**.
Module 1 — cœur web (SaaS multi-entreprises). Interface en français, thème *Premium Dark Mode*.

## Stack technique

- **Vite** + **React** (JavaScript)
- **Tailwind CSS** (thème repris de l'export Google Stitch — voir `design-reference/`)
- Polices **Inter** + **Geist**, icônes **Material Symbols**
- Empaquetage **APK** possible plus tard via **Capacitor** (sans réécriture)

## Démarrer

```bash
npm install      # installer les dépendances (une seule fois)
npm run dev      # serveur de développement  -> http://localhost:5173
npm run build    # construire la version de production (dossier dist/)
npm run preview  # prévisualiser la version de production
```

## Structure

```
src/
├── App.jsx                  # racine de l'application
├── main.jsx                 # point d'entrée React
├── index.css                # styles globaux + Tailwind
├── data/
│   └── mockData.js          # données de démonstration (à remplacer par l'API)
├── components/
│   ├── ui/                  # briques de base : Icon, Avatar, GlassCard
│   ├── layout/              # TopNav, SideNav, Layout
│   └── dashboard/           # StatCard, StatsGrid, AgencesPanel, PresenceTable,
│       └──                  # ProductivityTrends, ActivityStream, Fab
└── pages/
    └── Dashboard.jsx        # assemblage de l'écran "Résumé Exécutif"
```

## Fonctionnalités de l'écran actuel

- 7 statistiques globales (présence, activité, productivité)
- **Effectifs par agence** : nombre d'employés, présents et productivité par agence
- Tableau de **présence en temps réel** (avec colonne Agence)
- **Tendances de productivité** (graphique)
- **Flux d'activité en direct** (statut Actif / Inactif / Incident, barres animées)
- Interface **responsive** (menu latéral coulissant sur mobile)

## Données

Les données affichées sont des **données de démonstration** (`src/data/mockData.js`).
Elles seront remplacées par la vraie API (pointage biométrique, agents postes de travail)
lors des prochains modules.
