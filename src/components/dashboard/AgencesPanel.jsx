import SectionHeader from "../ui/SectionHeader.jsx";
import { agences } from "../../data/mockData.js";

function CarteAgence({ agence }) {
  const taux = Math.round((agence.present / agence.employees) * 100);

  return (
    <div className="card card-hover p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-rounded text-[18px]">apartment</span>
          </span>
          <span className="text-sm font-semibold text-slate-800 truncate">{agence.name}</span>
        </div>
      </div>

      <div className="flex items-end gap-1.5 mb-3">
        <span className="text-2xl font-semibold text-slate-900 tabular-nums leading-none">
          {agence.employees.toLocaleString("fr-FR")}
        </span>
        <span className="text-xs text-slate-400 mb-0.5">employés</span>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
        <span>Présents</span>
        <span className="font-medium text-slate-700">
          {agence.present}/{agence.employees}
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${taux}%` }} />
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400">Productivité</span>
        <span className="text-sm font-semibold text-brand-600">{agence.productivity} %</span>
      </div>
    </div>
  );
}

export default function AgencesPanel() {
  return (
    <section>
      <SectionHeader icon="apartment" title="Effectifs par agence" action="Gérer les agences" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {agences.map((agence) => (
          <CarteAgence key={agence.id} agence={agence} />
        ))}
      </div>
    </section>
  );
}
