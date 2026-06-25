import Avatar from "./Avatar.jsx";
import Icon from "./Icon.jsx";
import StatusPill from "./StatusPill.jsx";
import ActionsRapides from "./ActionsRapides.jsx";
import { toneLive } from "../../data/datasets.js";

const dotLive = { "En activité": "bg-emerald-500", "En pause": "bg-amber-500", Absent: "bg-rose-500", Congé: "bg-sky-500" };
const barLive = { "En activité": "border-t-emerald-500", "En pause": "border-t-amber-500", Absent: "border-t-rose-500", Congé: "border-t-sky-500" };

function tempsTravaille(arrivee) {
  if (!arrivee || arrivee === "--:--") return "—";
  const [h, m] = arrivee.split(":").map(Number);
  let min = 13 * 60 + 30 - (h * 60 + m);
  if (min < 0) min = 0;
  return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}m`;
}

function Metrique({ icon, label, value, tone = "text-ink" }) {
  return (
    <div className="rounded-xl bg-surface-2 border border-border px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-muted text-xs mb-1">
        <Icon name={icon} className="text-[14px]" />
        {label}
      </div>
      <p className={`text-sm font-semibold font-mono tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

// Carte « présence » (page Présence) — le manager comprend la présence sans ouvrir le profil.
export default function CartePresence({ e, tr }) {
  const live = tr?.live ?? "Absent";
  const t = e.today ?? {};
  const present = live === "En activité" || live === "En pause";
  const actif = live === "En activité";
  const arrivee = present && t.arrivee && t.arrivee !== "--:--" ? t.arrivee : "—";
  const retard = t.retardMin > 0 ? `+${t.retardMin} min` : "0 min";
  const retardDej = t.retardDejeunerMin > 0 ? `+${t.retardDejeunerMin} min` : "0 min";
  const temps = present ? tempsTravaille(t.arrivee) : "—";

  return (
    <article className={`card flex flex-col overflow-hidden border-t-[3px] ${barLive[live] ?? "border-t-slate-400"}`}>
      <div className="p-5 flex items-start gap-3">
        <div className="relative shrink-0">
          <Avatar name={e.name} size="w-12 h-12" />
          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface ${dotLive[live] ?? "bg-slate-400"}`}>
            {actif && <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{e.name}</p>
          <p className="text-xs text-muted truncate">{e.fonction}</p>
        </div>
        <StatusPill label={live} tone={toneLive[live] ?? "slate"} />
      </div>

      <div className="px-5 pb-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
        <Metrique icon="login" label="Arrivée" value={arrivee} tone="text-emerald-600" />
        <Metrique icon="logout" label="Départ" value={present ? "En cours" : "—"} />
        <Metrique icon="schedule" label="Retard" value={retard} tone={t.retardMin > 0 ? "text-rose-600" : "text-ink"} />
        <Metrique icon="lunch_dining" label="Retard déj." value={retardDej} tone={t.retardDejeunerMin > 0 ? "text-rose-600" : "text-ink"} />
        <Metrique icon="timelapse" label="Temps travaillé" value={temps} />
      </div>

      <ActionsRapides id={e.id} />
    </article>
  );
}
