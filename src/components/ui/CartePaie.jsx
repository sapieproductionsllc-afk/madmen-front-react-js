import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar.jsx";
import Icon from "./Icon.jsx";
import StatusPill from "./StatusPill.jsx";
import { fcfa } from "../../data/datasets.js";

const tonePaie = { Payé: "emerald", "En attente": "amber", "En retard": "rose" };
const barPaie = { Payé: "border-t-emerald-500", "En attente": "border-t-amber-500", "En retard": "border-t-rose-500" };

function Ligne({ label, value, tone = "text-texte", signe }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className={`font-mono tabular-nums ${tone}`}>{signe}{value}</span>
    </div>
  );
}

// Carte financière (page Paiements).
export default function CartePaie({ e, f, statut, onPayer, onBulletin }) {
  const navigate = useNavigate();
  const paye = statut === "Payé";

  return (
    <article className={`card flex flex-col overflow-hidden border-t-[3px] ${barPaie[statut] ?? "border-t-slate-400"}`}>
      {/* En-tête identité */}
      <div className="p-5 flex items-start gap-3">
        <Avatar name={e.name} size="w-12 h-12" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{e.name}</p>
          <p className="text-xs text-muted truncate">{e.fonction}</p>
        </div>
        <StatusPill label={statut} tone={tonePaie[statut] ?? "slate"} />
      </div>

      {/* Détail des montants */}
      <div className="px-5 pb-4 space-y-2 border-t border-border pt-4">
        <Ligne label="Salaire de base" value={fcfa(f.base)} />
        <Ligne label="Primes" value={fcfa(f.primes)} tone="text-emerald-600" signe="+ " />
        <Ligne label="Avances" value={fcfa(f.avances)} tone="text-amber-600" signe="− " />
        <Ligne label="Retenues" value={fcfa(f.retenues)} tone="text-rose-600" signe="− " />
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-border">
          <span className="text-sm font-semibold text-texte">À payer</span>
          <span className="text-xl font-semibold font-mono tabular-nums text-or-700">{fcfa(f.net)}</span>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="mt-auto grid grid-cols-3 border-t border-border divide-x divide-border">
        <button
          onClick={() => onPayer(e, f)}
          disabled={paye}
          className={`py-3 flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
            paye ? "text-emerald-600 cursor-default" : "text-or-700 hover:bg-or-50"
          }`}
        >
          <Icon name={paye ? "task_alt" : "payments"} className="text-[20px]" filled />
          {paye ? "Payé" : "Payer"}
        </button>
        <button onClick={() => onBulletin(e)} className="py-3 flex flex-col items-center gap-1 text-xs font-medium text-muted hover:text-brand-600 hover:bg-surface-2 transition-colors">
          <Icon name="description" className="text-[20px]" />
          Bulletin
        </button>
        <button
          onClick={() => navigate(`/employes/${e.id}`, { state: { onglet: "Paiements" } })}
          className="py-3 flex flex-col items-center gap-1 text-xs font-medium text-muted hover:text-brand-600 hover:bg-surface-2 transition-colors"
        >
          <Icon name="history" className="text-[20px]" />
          Historique
        </button>
      </div>
    </article>
  );
}
