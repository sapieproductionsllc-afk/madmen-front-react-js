import Icon from "./Icon.jsx";

const WEEKDAYS = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];

const dotEtat = { Présent: "bg-emerald-500", Retard: "bg-amber-500", Absent: "bg-rose-500" };
const pillEtat = {
  Présent: "bg-emerald-50 text-emerald-700",
  Retard: "bg-amber-50 text-amber-700",
  Absent: "bg-rose-50 text-rose-700",
};

// Libellé lisible d'un jour (toast, aria).
function libelleJour(j) {
  return j.ferie ?? j.event ?? (j.today && !j.etat ? "aujourd'hui" : j.etat === "Prévu" ? "à pointer" : j.etat ?? "repos");
}

// Une cellule de jour (grille desktop) — présence par jour.
function Cellule({ j, onJour }) {
  const bg = j.today ? "bg-or-50" : j.ferie ? "bg-rose-50" : j.event ? "bg-sky-50" : j.weekend ? "bg-surface-2/60" : "bg-surface";
  const num = j.today ? "text-or-700 font-bold" : j.ferie ? "text-rose-600" : j.weekend ? "text-faint" : "text-texte";

  return (
    <button
      onClick={() => onJour?.(j)}
      aria-label={`${WEEKDAYS[j.dow]} ${j.jour} juin — ${libelleJour(j)}${j.arrivee ? `, arrivée ${j.arrivee}` : ""}`}
      className={`relative ${bg} min-h-[92px] p-2.5 flex flex-col justify-between text-left transition-colors hover:bg-emerald-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
        j.today ? "ring-2 ring-inset ring-or-400" : ""
      } ${j.event ? "border-l-2 border-sky-400" : ""}`}
    >
      <div className="flex items-start justify-between">
        <span className={`text-[13px] font-semibold tabular-nums ${num}`}>{j.jour}</span>
        {dotEtat[j.etat] && <span className={`w-2 h-2 rounded-full mt-0.5 ${dotEtat[j.etat]}`} aria-hidden="true" />}
        {j.etat === "Prévu" && <span className="w-2 h-2 rounded-full mt-0.5 bg-surface-2 ring-1 ring-faint" aria-hidden="true" />}
      </div>
      <div className="leading-tight">
        {j.ferie ? (
          <span className="text-[10px] font-medium text-rose-700 line-clamp-2">{j.ferie}</span>
        ) : j.event ? (
          <span className="text-[10px] font-medium text-sky-700 line-clamp-2">{j.event}</span>
        ) : j.etat === "Absent" ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700">Absent</span>
        ) : j.etat === "Présent" || j.etat === "Retard" ? (
          <div className="flex flex-col gap-1 items-start">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${pillEtat[j.etat]}`}>{j.etat}</span>
            <span className="text-[11px] font-mono tabular-nums text-subtle">{j.arrivee}</span>
          </div>
        ) : j.etat === "Prévu" ? (
          <span className="text-[11px] text-subtle">À pointer</span>
        ) : j.today ? (
          <span className="text-[11px] font-semibold text-or-700">Aujourd'hui</span>
        ) : (
          <span className="text-sm text-subtle">—</span>
        )}
      </div>
    </button>
  );
}

// Une ligne de jour (liste mobile).
function LigneJour({ j, onJour }) {
  const bl = j.today
    ? "border-l-or-500 bg-or-50"
    : j.ferie
    ? "border-l-rose-500 bg-rose-50/50"
    : j.event
    ? "border-l-sky-500 bg-sky-50/50"
    : j.etat === "Présent"
    ? "border-l-emerald-500"
    : j.etat === "Retard"
    ? "border-l-amber-500"
    : j.etat === "Absent"
    ? "border-l-rose-500"
    : "border-l-border";
  const libelle = j.ferie ?? j.event ?? (j.today && !j.etat ? "Aujourd'hui" : j.etat === "Prévu" ? "À pointer" : j.etat ?? "—");
  return (
    <button onClick={() => onJour?.(j)} className={`w-full flex items-center gap-3 px-4 py-3 text-left border-l-4 ${bl} hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40`}>
      <div className="flex flex-col items-center w-9 shrink-0">
        <span className="text-[10px] uppercase text-subtle">{WEEKDAYS[j.dow].slice(0, 3)}</span>
        <span className={`text-lg font-semibold tabular-nums leading-none ${j.today ? "text-or-700" : "text-ink"}`}>{j.jour}</span>
      </div>
      {dotEtat[j.etat] ? (
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotEtat[j.etat]}`} aria-hidden="true" />
      ) : j.etat === "Prévu" ? (
        <span className="w-2 h-2 rounded-full shrink-0 bg-surface-2 ring-1 ring-faint" aria-hidden="true" />
      ) : null}
      <span className="flex-1 text-sm text-texte truncate">{libelle}</span>
      {j.arrivee && <span className="font-mono text-sm text-muted shrink-0">{j.arrivee}</span>}
    </button>
  );
}

export default function CalendrierPresence({ cal, onJour }) {
  const trailing = (7 - (cal.jours.length % 7)) % 7;

  // États (points) + jours spéciaux (carrés de fond) dans la légende.
  const legendeEtats = [
    { dot: "bg-emerald-500", l: "Présent" },
    { dot: "bg-amber-500", l: "Retard" },
    { dot: "bg-rose-500", l: "Absent" },
    { ring: true, l: "À pointer" },
  ];
  const legendeFonds = [
    { sw: "bg-rose-50 ring-1 ring-rose-400", l: "Férié" },
    { sw: "bg-sky-50 ring-1 ring-sky-400", l: "Événement" },
    { sw: "bg-or-50 ring-1 ring-or-400", l: "Aujourd'hui" },
  ];

  return (
    <div className="card overflow-hidden">
      {/* En-tête + légende */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <button type="button" disabled aria-disabled="true" className="w-8 h-8 rounded-lg flex items-center justify-center text-muted disabled:opacity-40 disabled:cursor-default" aria-label="Mois précédent">
            <Icon name="chevron_left" className="text-[20px]" />
          </button>
          <div className="text-base font-semibold text-ink tabular-nums" aria-label={`Calendrier ${cal.mois}`}>
            {cal.mois.split(" ")[0]} <span className="font-normal text-muted">{cal.mois.split(" ")[1]}</span>
          </div>
          <button type="button" disabled aria-disabled="true" className="w-8 h-8 rounded-lg flex items-center justify-center text-muted disabled:opacity-40 disabled:cursor-default" aria-label="Mois suivant">
            <Icon name="chevron_right" className="text-[20px]" />
          </button>
        </div>
        <div className="hidden lg:flex items-center gap-x-3 gap-y-1.5 flex-wrap">
          {legendeEtats.map((x) => (
            <span key={x.l} className="flex items-center gap-1.5 text-[11px] text-muted">
              <span className={`w-2 h-2 rounded-full ${x.ring ? "bg-surface-2 ring-1 ring-faint" : x.dot}`} />
              {x.l}
            </span>
          ))}
          {legendeFonds.map((x) => (
            <span key={x.l} className="flex items-center gap-1.5 text-[11px] text-muted">
              <span className={`w-3 h-3 rounded-sm ${x.sw}`} />
              {x.l}
            </span>
          ))}
        </div>
      </div>

      {/* Grille desktop */}
      <div className="hidden lg:grid grid-cols-7 gap-px bg-surface-2 p-px">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-surface py-2 text-center text-[11px] font-medium text-subtle">{d}</div>
        ))}
        {cal.jours.map((j) => (
          <Cellule key={j.jour} j={j} onJour={onJour} />
        ))}
        {Array.from({ length: trailing }).map((_, i) => (
          <div key={`e${i}`} className="bg-surface-2/40 min-h-[92px]" />
        ))}
      </div>

      {/* Liste mobile */}
      <div className="lg:hidden divide-y divide-border">
        {cal.jours.filter((j) => j.cours || j.ferie || j.event || j.today).map((j) => (
          <LigneJour key={j.jour} j={j} onJour={onJour} />
        ))}
      </div>

      {/* Note de pied */}
      <div className="px-5 py-3 border-t border-border bg-surface-2/40">
        <p className="text-xs text-subtle">
          La présence est affichée <span className="font-medium text-muted">par jour travaillé</span>. <span className="font-medium text-muted">Cliquez sur un jour</span> pour consulter ou justifier un pointage.
        </p>
      </div>
    </div>
  );
}
