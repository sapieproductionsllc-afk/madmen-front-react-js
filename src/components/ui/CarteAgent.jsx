import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar.jsx";
import Icon from "./Icon.jsx";
import StatusPill from "./StatusPill.jsx";
import { toneLive } from "../../data/datasets.js";

// Pastille de présence (point d'angle de l'avatar) + liseré supérieur de carte.
const dotLive = {
  "En activité": "bg-emerald-500",
  "En pause": "bg-amber-500",
  Absent: "bg-rose-500",
  Congé: "bg-sky-500",
};
const barLive = {
  "En activité": "border-t-emerald-500",
  "En pause": "border-t-amber-500",
  Absent: "border-t-rose-500",
  Congé: "border-t-sky-500",
};

function Ligne({ icon, value }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <Icon name={icon} className="text-brand-600/70 text-[18px] shrink-0" />
      <span className="truncate text-texte">{value}</span>
    </div>
  );
}

// Carte « agent » — brique centrale (dashboard, annuaire, rapports).
export default function CarteAgent({ e, tr }) {
  const navigate = useNavigate();
  const live = tr?.live ?? "Absent";
  const t = e.today ?? {};
  const actif = live === "En activité";
  const arrivee = t.arrivee && t.arrivee !== "--:--" ? t.arrivee : "—";
  const enRetard = typeof t.retardMin === "number" && t.retardMin > 0;
  const justif = t.justification;
  const aller = () => navigate(`/employes/${e.id}`);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={aller}
      onKeyDown={(ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          aller();
        }
      }}
      aria-label={`Voir le profil de ${e.name}`}
      className={`group card flex flex-col overflow-hidden cursor-pointer border-t-[3px] ${barLive[live] ?? "border-t-slate-400"} hover:-translate-y-1 hover:shadow-lg hover:border-brand-600/40 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40`}
    >
      {/* En-tête identité + badge statut */}
      <div className="p-5 flex items-start gap-3.5">
        <div className="relative shrink-0">
          <Avatar name={e.name} size="w-14 h-14" />
          <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-surface ${dotLive[live] ?? "bg-slate-400"}`} aria-hidden="true">
            {actif && <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-ink truncate leading-tight group-hover:text-brand-700 transition-colors">{e.name}</p>
          <p className="text-xs font-mono text-muted mt-0.5">{e.id}</p>
        </div>
        <StatusPill label={live} tone={toneLive[live] ?? "slate"} />
      </div>

      {/* Infos pro */}
      <div className="px-5 pb-4 space-y-2.5 text-sm border-t border-border pt-4">
        <Ligne icon="work" value={e.fonction} />
        <Ligne icon="domain" value={e.department} />
        <Ligne icon="location_on" value={e.agence} />
      </div>

      {/* Présence du jour : prévu → arrivée + retard */}
      <div className="mx-5 mb-4 rounded-xl bg-canvas border border-border px-3.5 py-3">
        <p className="kicker mb-2">Présence du jour</p>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted">Prévu</span>
            <span className="font-mono tabular-nums text-texte">{t.prevu ?? "—"}</span>
          </div>
          <Icon name="arrow_forward" className="text-subtle text-[16px]" />
          <div className="flex items-center gap-2">
            <span className="text-muted">Arrivée</span>
            <span className={`font-mono tabular-nums font-medium ${enRetard ? "text-rose-600" : "text-emerald-600"}`}>{arrivee}</span>
          </div>
        </div>
        {enRetard && (
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-rose-600">
            <Icon name="schedule" className="text-[14px]" />
            +{t.retardMin} min de retard
          </p>
        )}
        {justif && (
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted">
            <Icon name="verified" className="text-[14px] text-brand-600/70" />
            {justif.motif ?? justif.statut}
          </p>
        )}
      </div>

      {/* Dernière activité + depuis */}
      <div className="px-5 pb-4 flex items-start gap-2.5 text-sm">
        <Icon name="bolt" className="text-brand-600/70 text-[18px] shrink-0 mt-0.5" filled />
        <div className="min-w-0">
          <p className="text-texte truncate">{tr?.detail ?? "Aucune activité"}</p>
          {tr?.depuis && tr.depuis !== "—" && <p className="text-xs text-subtle mt-0.5">{tr.depuis}</p>}
        </div>
      </div>

      {/* Pied : bouton Voir profil */}
      <div className="mt-auto px-5 pb-5 pt-1">
        <span className="w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-brand-50 text-brand-700 text-sm font-semibold border border-brand-100 group-hover:bg-brand-600 group-hover:text-canvas group-hover:border-brand-600 transition-colors">
          Voir profil
          <Icon name="arrow_forward" className="text-[18px] group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </article>
  );
}
