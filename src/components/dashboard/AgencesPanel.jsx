import { useNavigate } from "react-router-dom";
import SectionHeader from "../ui/SectionHeader.jsx";
import { agences } from "../../data/mockData.js";

function CarteAgence({ agence }) {
  const taux = Math.round((agence.present / agence.employees) * 100);

  return (
    <div className="card card-hover p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-xl bg-surface-2 text-muted flex items-center justify-center shrink-0 ring-1 ring-inset ring-black/[0.03]">
            <span className="material-symbols-rounded text-[18px]">apartment</span>
          </span>
          <span className="text-sm font-semibold text-texte truncate">{agence.name}</span>
        </div>
      </div>

      <div className="flex items-end gap-1.5 mb-4">
        <span className="text-2xl font-semibold text-ink tracking-tight tabular-nums leading-none">
          {agence.employees.toLocaleString("fr-FR")}
        </span>
        <span className="text-xs text-subtle mb-0.5">employés</span>
      </div>

      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-muted">Présents</span>
        <span className="text-xs font-semibold text-texte tabular-nums">
          {agence.present}/{agence.employees}
          <span className="ml-1 text-emerald-600">· {taux}%</span>
        </span>
      </div>
      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${taux}%` }}
        />
      </div>

      <div className="mt-4 pt-3.5 border-t border-border flex items-center justify-between">
        <span className="kicker">Productivité</span>
        <span className="text-sm font-semibold text-brand-600 tabular-nums">{agence.productivity} %</span>
      </div>
    </div>
  );
}

export default function AgencesPanel() {
  const navigate = useNavigate();
  return (
    <section>
      <SectionHeader
        variant="chip"
        icon="apartment"
        title="Effectifs par agence"
        action="Gérer les agences"
        onAction={() => navigate("/organisation")}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {agences.map((agence) => (
          <CarteAgence key={agence.id} agence={agence} />
        ))}
      </div>
    </section>
  );
}
