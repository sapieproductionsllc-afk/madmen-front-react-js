import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar.jsx";
import Icon from "./Icon.jsx";

// Photo déterministe par employé (repli initiales géré par <Avatar> si hors-ligne).
const photoDe = (id) => `https://i.pravatar.cc/240?u=${encodeURIComponent(id)}`;

// État de présence → anneau coloré + icône (forme discriminante, indépendante de
// la couleur pour les daltoniens). vert = présent · bleu = déjeuner · rouge = absent
// · or = congé (état passif, sans clignotement).
const STATUT = {
  "En activité": { label: "Présent", ring: "ring-emerald-500", dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700", icon: "check", pulse: true },
  "En pause": { label: "En pause", ring: "ring-sky-500", dot: "bg-sky-500", pill: "bg-sky-50 text-sky-700", icon: "local_cafe", pulse: true },
  Absent: { label: "Absent", ring: "ring-rose-500", dot: "bg-rose-500", pill: "bg-rose-50 text-rose-700", icon: "close", pulse: true },
  Congé: { label: "En congé", ring: "ring-or-500", dot: "bg-or-600", pill: "bg-or-100 text-or-700", icon: "flight", pulse: false },
};

// Carte « agent » du tableau de bord — photo-centrée :
// grande photo circulaire + anneau de présence (clignotant doux) + heure de connexion.
export default function CarteAgent({ e, tr }) {
  const navigate = useNavigate();
  const live = (tr?.live === "Retard" ? "En activité" : tr?.live) ?? "Absent";
  const s = STATUT[live] ?? STATUT.Absent;
  const arrivee = e.today?.arrivee && e.today.arrivee !== "--:--" ? e.today.arrivee : null;
  const retard = typeof e.today?.retardMin === "number" && e.today.retardMin > 5 ? e.today.retardMin : null;
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
      className="group card card-hover flex flex-col items-center text-center px-5 py-6 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
    >
      {/* Photo + anneau de présence */}
      <div className="relative grid place-items-center">
        {s.pulse && (
          <span className={`absolute h-24 w-24 rounded-full ring-2 ${s.ring} agent-halo`} aria-hidden="true" />
        )}
        <span className={`relative rounded-full ring-4 ${s.ring}`}>
          <Avatar src={photoDe(e.id)} name={e.name} size="w-24 h-24" textSize="text-2xl" ring={false} />
        </span>
        {/* Pastille d'état : couleur + icône (repère pour daltoniens) */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 z-10 grid place-items-center w-7 h-7 rounded-full border-[3px] border-surface text-white ${s.dot}`}
          aria-hidden="true"
        >
          <Icon name={s.icon} className="text-[14px]" filled />
        </span>
      </div>

      {/* Identité */}
      <p className="mt-4 min-h-[2.5rem] flex items-center text-base font-semibold text-ink leading-tight line-clamp-2 group-hover:text-or-700 transition-colors">
        {e.name}
      </p>
      <p className="-mt-0.5 text-xs text-muted truncate max-w-full">{e.fonction}</p>

      {/* Statut (message n°1, en aplat coloré) */}
      <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold ${s.pill}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
        {s.label}
      </span>

      {/* Heure de connexion (info factuelle, mise en avant) */}
      <span className="mt-2.5 inline-flex items-center gap-1.5 max-w-full rounded-full bg-canvas border border-border px-3 py-1.5 text-[13px] text-muted whitespace-nowrap">
        <Icon name={arrivee ? "login" : "event_busy"} className="text-[15px] text-brand-600 shrink-0" filled />
        {arrivee ? (
          <span className="truncate min-w-0">
            Connecté à <span className="font-mono font-bold tabular-nums text-ink">{arrivee}</span>
            {retard && <span className="font-semibold text-amber-700"> · +{retard} min</span>}
          </span>
        ) : (
          <span className="truncate min-w-0">{tr?.detail ?? (live === "Congé" ? "En congé" : "Pas de pointage")}</span>
        )}
      </span>
    </article>
  );
}
