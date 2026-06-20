import { useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import StatTile from "../components/ui/StatTile.jsx";
import Button from "../components/ui/Button.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { alertes as donnees } from "../data/datasets.js";

const config = {
  Critique: { tone: "rose", icon: "gpp_bad", chip: "bg-rose-500/15 text-rose-400" },
  Moyen: { tone: "amber", icon: "warning", chip: "bg-amber-500/15 text-amber-400" },
  Faible: { tone: "slate", icon: "info", chip: "bg-slate-500/15 text-slate-400" },
};

export default function Alertes() {
  const { toast } = useUI();
  const [lues, setLues] = useState(() => new Set(donnees.filter((a) => a.read).map((a) => a.id)));

  const marquerLu = (a) => {
    setLues((s) => new Set(s).add(a.id));
    toast("Alerte marquée comme lue", "info");
  };

  const toutMarquer = () => {
    setLues(new Set(donnees.map((a) => a.id)));
    toast("Toutes les alertes ont été marquées comme lues");
  };

  const nonLues = donnees.filter((a) => !lues.has(a.id)).length;
  const compteur = (sev) => donnees.filter((a) => a.severity === sev).length;

  return (
    <div>
      <PageHeader title="Alertes" subtitle={`${nonLues} alerte(s) non lue(s) nécessitent votre attention.`}>
        <Button variant="secondary" icon="done_all" onClick={toutMarquer}>
          Tout marquer comme lu
        </Button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatTile icon="gpp_bad" label="Critiques" value={compteur("Critique")} color="rose" />
        <StatTile icon="warning" label="Moyennes" value={compteur("Moyen")} color="amber" />
        <StatTile icon="info" label="Faibles" value={compteur("Faible")} color="slate" />
      </div>

      <div className="space-y-3">
        {donnees.map((a) => {
          const c = config[a.severity] ?? config.Faible;
          const lu = lues.has(a.id);
          return (
            <div key={a.id} className={`card p-4 flex items-start gap-4 ${lu ? "opacity-60" : ""}`}>
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.chip}`}>
                <Icon name={c.icon} className="text-[22px]" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-ink">{a.type}</span>
                  <StatusPill label={a.severity} tone={c.tone} dot={false} />
                  {!lu && <span className="w-2 h-2 rounded-full bg-brand-500" />}
                </div>
                <p className="text-sm text-texte">{a.message}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-subtle">
                  <span className="flex items-center gap-1"><Icon name="person" className="text-[14px]" />{a.employe}</span>
                  <span className="flex items-center gap-1"><Icon name="apartment" className="text-[14px]" />{a.agence}</span>
                  <span className="flex items-center gap-1"><Icon name="dvr" className="text-[14px]" />{a.machine}</span>
                  <span className="flex items-center gap-1"><Icon name="schedule" className="text-[14px]" />{a.time}</span>
                </div>
              </div>
              {!lu && (
                <Button variant="ghost" size="sm" onClick={() => marquerLu(a)}>
                  Marquer lu
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
