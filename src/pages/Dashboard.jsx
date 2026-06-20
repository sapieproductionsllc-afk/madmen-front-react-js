import StatsGrid from "../components/dashboard/StatsGrid.jsx";
import AgencesPanel from "../components/dashboard/AgencesPanel.jsx";
import PresenceTable from "../components/dashboard/PresenceTable.jsx";
import ProductivityTrends from "../components/dashboard/ProductivityTrends.jsx";
import ActivityStream from "../components/dashboard/ActivityStream.jsx";

export default function Dashboard() {
  return (
    <div className="space-y-7 pb-12">
      {/* En-tête */}
      <header className="reveal flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="kicker mb-2">Tableau de bord</p>
          <h1 className="text-2xl md:text-[1.75rem] font-semibold text-ink tracking-tight">
            Résumé exécutif
          </h1>
          <p className="mt-1.5 text-sm text-muted leading-relaxed">
            Performance globale de l'organisation et supervision en temps réel.
          </p>
        </div>
        <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-surface border border-border shadow-soft self-start md:self-auto">
          <span className="live-dot text-emerald-500" />
          <span className="text-sm font-medium text-muted">Tous les systèmes opérationnels</span>
        </div>
      </header>

      {/* Indicateurs clés */}
      <StatsGrid />

      {/* Présence + Productivité */}
      <div className="reveal grid grid-cols-1 xl:grid-cols-3 gap-5" style={{ animationDelay: "100ms" }}>
        <div className="xl:col-span-2">
          <PresenceTable />
        </div>
        <ProductivityTrends />
      </div>

      {/* Effectifs par agence */}
      <div className="reveal" style={{ animationDelay: "160ms" }}>
        <AgencesPanel />
      </div>

      {/* Flux d'activité */}
      <div className="reveal" style={{ animationDelay: "220ms" }}>
        <ActivityStream />
      </div>
    </div>
  );
}
