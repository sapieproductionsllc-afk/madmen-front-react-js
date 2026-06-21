import Avatar from "./Avatar.jsx";
import Icon from "./Icon.jsx";
import ActionsRapides from "./ActionsRapides.jsx";
import { historiquePresence, productiviteEmploye } from "../../data/profil.js";

const barColor = (p) => (p >= 90 ? "bg-emerald-500" : p >= 80 ? "bg-sky-500" : p >= 70 ? "bg-amber-500" : "bg-rose-500");
const txtColor = (p) => (p >= 90 ? "text-emerald-600" : p >= 80 ? "text-sky-600" : p >= 70 ? "text-amber-600" : "text-rose-600");

function Barre({ label, pct }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted">{label}</span>
        <span className={`font-mono font-semibold tabular-nums ${txtColor(pct)}`}>{pct} %</span>
      </div>
      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
        <div className={`h-full rounded-full ${barColor(pct)}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Carte « performance » (page Rapports) — indicateurs agrégés par agent.
export default function CartePerformance({ e }) {
  const presence = historiquePresence(e.id);
  const prod = productiviteEmploye(e.id);
  const jours = presence.length || 1;
  const presents = presence.filter((p) => p.statut === "Présent" || p.statut === "Retard").length;
  const presencePct = Math.round((presents / jours) * 100);
  const retards = presence.filter((p) => p.statut === "Retard").length;
  const absences = presence.filter((p) => p.statut === "Absent").length;

  return (
    <article className="card flex flex-col overflow-hidden">
      <div className="p-5 flex items-start gap-3 border-b border-border">
        <Avatar name={e.name} size="w-12 h-12" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{e.name}</p>
          <p className="text-xs text-muted truncate">{e.fonction}</p>
        </div>
        <span className={`text-lg font-semibold font-mono tabular-nums ${txtColor(prod.score)}`}>{prod.score}%</span>
      </div>

      <div className="p-5 space-y-3.5">
        <Barre label="Présence" pct={presencePct} />
        <Barre label="Productivité" pct={prod.score} />
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="rounded-xl bg-surface-2 border border-border px-3 py-2.5">
            <p className={`text-lg font-semibold tabular-nums leading-none ${retards > 0 ? "text-amber-600" : "text-ink"}`}>{retards}</p>
            <p className="text-xs text-muted mt-1">Retards (7 j)</p>
          </div>
          <div className="rounded-xl bg-surface-2 border border-border px-3 py-2.5">
            <p className={`text-lg font-semibold tabular-nums leading-none ${absences > 0 ? "text-rose-600" : "text-ink"}`}>{absences}</p>
            <p className="text-xs text-muted mt-1">Absences (7 j)</p>
          </div>
        </div>
      </div>

      <ActionsRapides id={e.id} />
    </article>
  );
}
