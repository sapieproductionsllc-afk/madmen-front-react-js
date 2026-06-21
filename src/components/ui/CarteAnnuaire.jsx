import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar.jsx";
import Icon from "./Icon.jsx";

// Photo déterministe par employé (repli initiales géré par <Avatar> si hors-ligne).
const photoDe = (id) => `https://i.pravatar.cc/240?u=${encodeURIComponent(id)}`;

// Statut administratif (annuaire) → anneau coloré + icône (forme discriminante,
// indépendante de la couleur). vert = actif · or = congé · bleu = vacances · rouge = maladie.
const STATUT = {
  Actif: { label: "Actif", ring: "ring-emerald-500", dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700", icon: "check", pulse: true },
  "En congé": { label: "En congé", ring: "ring-or-500", dot: "bg-or-600", pill: "bg-or-100 text-or-700", icon: "weekend", pulse: false },
  "En vacances": { label: "En vacances", ring: "ring-sky-500", dot: "bg-sky-500", pill: "bg-sky-50 text-sky-700", icon: "beach_access", pulse: false },
  "Pause maladie": { label: "Pause maladie", ring: "ring-rose-500", dot: "bg-rose-500", pill: "bg-rose-50 text-rose-700", icon: "medical_services", pulse: false },
};

// Carte « annuaire » (page Agents) — format rectangulaire, même langage visuel que
// la carte du tableau de bord : photo circulaire + anneau de statut + pastille.
export default function CarteAnnuaire({ e }) {
  const navigate = useNavigate();
  const s = STATUT[e.status] ?? STATUT.Actif;
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
      aria-label={`${e.name} — ${s.label}. Voir le profil`}
      className="group card card-hover flex items-center gap-4 p-4 cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
    >
      {/* Photo + anneau de statut */}
      <div className="relative grid place-items-center shrink-0">
        {s.pulse && (
          <span className={`absolute h-20 w-20 rounded-full ring-2 ${s.ring} agent-halo`} aria-hidden="true" />
        )}
        <span className={`relative rounded-full ring-4 ${s.ring}`}>
          <Avatar src={photoDe(e.id)} name={e.name} size="w-20 h-20" textSize="text-xl" ring={false} />
        </span>
        <span
          className={`absolute -bottom-0.5 -right-0.5 z-10 grid place-items-center w-6 h-6 rounded-full border-[3px] border-surface text-white ${s.dot}`}
          aria-hidden="true"
        >
          <Icon name={s.icon} className="text-[13px]" filled />
        </span>
      </div>

      {/* Identité + statut */}
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-ink truncate leading-tight group-hover:text-or-700 transition-colors">{e.name}</p>
        <p className="mt-0.5 text-xs text-muted truncate">{e.fonction}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-bold ${s.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
            {s.label}
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] text-muted min-w-0">
            <Icon name="location_on" className="text-[14px] text-faint shrink-0" />
            <span className="truncate">{e.agence}</span>
          </span>
        </div>
      </div>

      <Icon name="chevron_right" className="text-faint text-[20px] shrink-0 group-hover:text-or-600 group-hover:translate-x-0.5 transition-all" />
    </article>
  );
}
