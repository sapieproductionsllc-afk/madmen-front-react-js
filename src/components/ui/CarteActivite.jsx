import Avatar from "./Avatar.jsx";
import Icon from "./Icon.jsx";
import StatusPill from "./StatusPill.jsx";
import ActionsRapides from "./ActionsRapides.jsx";
import { toneLive } from "../../data/datasets.js";

const dotLive = { "En activité": "bg-emerald-500", "En pause": "bg-amber-500", Absent: "bg-rose-500", Congé: "bg-sky-500" };
const barLive = { "En activité": "border-t-emerald-500", "En pause": "border-t-amber-500", Absent: "border-t-rose-500", Congé: "border-t-sky-500" };

// Applications par défaut selon le service.
const APPS = {
  Cybersécurité: ["SOC Console", "VPN", "Slack"],
  "Recherche IA": ["Jupyter", "VS Code", "Slack"],
  "Ressources Humaines": ["Suite RH", "Mail", "Excel"],
  Infrastructure: ["Terminal", "Monitoring", "Slack"],
  Opérations: ["ERP", "Planning", "Mail"],
  Finance: ["Sage", "Excel", "Mail"],
  Développement: ["VS Code", "GitLab", "Slack"],
  Marketing: ["Canva", "Analytics", "Mail"],
};
const appsDe = (dep) => APPS[dep] ?? ["Suite RH", "Mail", "Slack"];

// Carte « activité » (page Activité) — poste, applications, inactivité.
export default function CarteActivite({ e, tr }) {
  const live = tr?.live ?? "Absent";
  const actif = live === "En activité";
  const t = e.today ?? {};
  const poste = t.poste && !["HORS LIGNE", "Distant"].includes(t.poste) ? t.poste : "Hors ligne";
  const apps = appsDe(e.department);
  const enLigne = live === "En activité" || live === "En pause";

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

      <div className="px-5 pb-4 space-y-3 border-t border-border pt-4 text-sm">
        <div className="flex items-center gap-2">
          <Icon name="desktop_windows" className="text-brand-600/70 text-[18px] shrink-0" />
          <span className="text-muted">Poste</span>
          <span className="ml-auto font-mono text-texte">{poste}</span>
        </div>
        <div className="flex items-start gap-2">
          <Icon name="apps" className="text-brand-600/70 text-[18px] shrink-0 mt-0.5" />
          <div className="flex flex-wrap gap-1.5">
            {enLigne ? (
              apps.map((a) => (
                <span key={a} className="text-xs font-medium text-texte bg-surface-2 border border-border px-2 py-0.5 rounded-md">{a}</span>
              ))
            ) : (
              <span className="text-xs text-subtle">Aucune session active</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="bolt" className="text-brand-600/70 text-[18px] shrink-0" filled />
          <span className="text-muted truncate">{tr?.detail ?? "Aucune activité"}</span>
          {tr?.depuis && tr.depuis !== "—" && <span className="ml-auto text-xs text-subtle shrink-0">{tr.depuis}</span>}
        </div>
      </div>

      <ActionsRapides id={e.id} />
    </article>
  );
}
