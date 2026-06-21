import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar.jsx";
import Icon from "./Icon.jsx";

// Photo déterministe par employé (repli initiales géré par <Avatar> si hors-ligne).
const photoDe = (id) => `https://i.pravatar.cc/240?u=${encodeURIComponent(id)}`;

// État de présence → couleur de l'anneau clignotant autour de la photo.
//  vert = présent · bleu = déjeuner/pause · rouge = absent · gris = congé (4e état).
const STATUT = {
  "En activité": { label: "Présent", ring: "ring-emerald-500", halo: "bg-emerald-500/40", dot: "bg-emerald-500", txt: "text-emerald-600", pulse: true },
  "En pause": { label: "Déjeuner", ring: "ring-sky-500", halo: "bg-sky-500/40", dot: "bg-sky-500", txt: "text-sky-600", pulse: true },
  Absent: { label: "Absent", ring: "ring-rose-500", halo: "bg-rose-500/40", dot: "bg-rose-500", txt: "text-rose-600", pulse: true },
  Congé: { label: "En congé", ring: "ring-slate-300", halo: "bg-slate-400/30", dot: "bg-slate-400", txt: "text-subtle", pulse: false },
};

// Carte « agent » du tableau de bord — photo-centrée :
// grande photo circulaire + anneau clignotant selon la présence + heure de connexion.
export default function CarteAgent({ e, tr }) {
  const navigate = useNavigate();
  const live = tr?.live ?? "Absent";
  const s = STATUT[live] ?? STATUT.Absent;
  const arrivee = e.today?.arrivee && e.today.arrivee !== "--:--" ? e.today.arrivee : null;
  const aller = () => navigate(`/employes/${e.id}`);

  // Ligne « connecté à » selon l'état.
  const connexion =
    live === "Congé" ? "En congé" : arrivee ? null : "Non connecté";

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
      className="group card flex flex-col items-center text-center px-5 py-7 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
    >
      {/* Photo + anneau clignotant */}
      <div className="relative grid place-items-center">
        {s.pulse && (
          <span className={`absolute h-28 w-28 rounded-full ${s.halo} animate-ping`} aria-hidden="true" />
        )}
        <span className={`relative rounded-full ring-[3px] ${s.ring} ring-offset-4 ring-offset-surface`}>
          <Avatar src={photoDe(e.id)} name={e.name} size="w-24 h-24" />
        </span>
        <span className={`absolute bottom-1 right-1 z-10 w-5 h-5 rounded-full border-[3px] border-surface ${s.dot}`} aria-hidden="true" />
      </div>

      {/* Identité */}
      <p className="mt-5 text-base font-semibold text-ink leading-tight group-hover:text-brand-700 transition-colors">{e.name}</p>
      <p className="mt-0.5 text-xs text-muted truncate max-w-full">{e.fonction}</p>

      {/* Statut + heure de connexion */}
      <span className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold ${s.txt}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {s.label}
      </span>
      <p className="mt-2 text-sm text-muted">
        {connexion ?? (
          <>
            Connecté à <span className="font-mono font-semibold tabular-nums text-texte">{arrivee}</span>
          </>
        )}
      </p>
    </article>
  );
}
