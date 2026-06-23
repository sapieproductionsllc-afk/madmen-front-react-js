import Icon from "./Icon.jsx";

const WEEKDAYS = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];

// Style par état de pointage (cellule colorée = lecture « heat-map »).
// Chips en teintes du thème (opacité du 500) — le palier 100 n'existe pas dans la palette custom.
const ETAT = {
  Présent: { bg: "bg-emerald-50", num: "text-emerald-800", chip: "bg-emerald-500/15 text-emerald-700", icon: "check" },
  Retard: { bg: "bg-amber-50", num: "text-amber-800", chip: "bg-amber-500/15 text-amber-700", icon: "schedule" },
  Absent: { bg: "bg-rose-50", num: "text-rose-800", chip: "bg-rose-500/15 text-rose-700", icon: "close" },
};
const BORD_ETAT = { Présent: "border-l-emerald-500", Retard: "border-l-amber-500", Absent: "border-l-rose-500" };

function libelleJour(j) {
  return j.ferie ?? j.event ?? (j.today && !j.etat ? "aujourd'hui" : j.etat === "Prévu" ? "à pointer" : j.etat ?? "repos");
}

// Cellule de jour (grille desktop) — fond teinté selon la présence ; l'état prime sur « aujourd'hui ».
function Cellule({ j, onJour }) {
  const st = ETAT[j.etat];
  const bg = j.ferie ? "bg-rose-50/70" : j.event ? "bg-sky-50/70" : st ? st.bg : j.today ? "bg-or-50" : j.weekend ? "bg-surface-2/50" : "bg-surface-2/20";
  const num = st ? st.num : j.today ? "text-or-700" : j.weekend ? "text-subtle" : "text-muted";

  return (
    <button
      onClick={() => onJour?.(j)}
      aria-label={`${WEEKDAYS[j.dow]} ${j.jour} juin — ${libelleJour(j)}${j.arrivee ? `, arrivée ${j.arrivee}` : ""}${j.depart ? `, départ ${j.depart}` : ""}`}
      className={`relative rounded-xl min-h-[86px] p-2 flex flex-col text-left transition-all hover:-translate-y-px hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${bg} ${
        j.today ? "ring-2 ring-or-400" : "ring-1 ring-border/50"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-sm font-bold tabular-nums ${num}`}>{j.jour}</span>
        {j.today && <span className="text-[9px] font-bold uppercase tracking-wide text-or-700 bg-or-100 px-1.5 py-0.5 rounded">Auj.</span>}
      </div>

      <div className="mt-auto pt-1">
        {j.ferie ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-700 line-clamp-2">
            <Icon name="flag" className="text-[12px] shrink-0" /> {j.ferie}
          </span>
        ) : j.event ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-700 line-clamp-2">
            <Icon name="event" className="text-[12px] shrink-0" /> {j.event}
          </span>
        ) : st ? (
          <div className="flex flex-col gap-0.5 items-start">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-semibold tabular-nums ${st.chip}`}>
              <Icon name={st.icon} className="text-[12px]" /> {j.arrivee ?? j.etat}
            </span>
            {j.depart && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted tabular-nums pl-0.5" title="Heure de départ">
                <Icon name="logout" className="text-[11px]" /> {j.depart}
              </span>
            )}
          </div>
        ) : j.etat === "Prévu" ? (
          <span className="inline-flex items-center gap-1 text-[10.5px] text-muted">
            <span className="w-2 h-2 rounded-full border border-faint" /> À pointer
          </span>
        ) : null}
      </div>
    </button>
  );
}

// Ligne de jour (liste mobile).
function LigneJour({ j, onJour }) {
  const st = ETAT[j.etat];
  const bl = j.today
    ? "border-l-or-500 bg-or-50"
    : j.ferie
    ? "border-l-rose-500 bg-rose-50/50"
    : j.event
    ? "border-l-sky-500 bg-sky-50/50"
    : BORD_ETAT[j.etat] ?? "border-l-border";
  const libelle = j.ferie ?? j.event ?? (j.today && !j.etat ? "Aujourd'hui" : j.etat === "Prévu" ? "À pointer" : j.etat ?? "—");
  return (
    <button onClick={() => onJour?.(j)} className={`w-full flex items-center gap-3 px-4 py-3 text-left border-l-4 ${bl} hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40`}>
      <div className="flex flex-col items-center w-9 shrink-0">
        <span className="text-[10px] uppercase text-subtle">{WEEKDAYS[j.dow].slice(0, 3)}</span>
        <span className={`text-lg font-semibold tabular-nums leading-none ${j.today ? "text-or-700" : "text-ink"}`}>{j.jour}</span>
      </div>
      {st ? (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${st.chip}`}>
          <Icon name={st.icon} className="text-[12px]" /> {j.etat}
        </span>
      ) : j.etat === "Prévu" ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-muted bg-surface-2 ring-1 ring-faint">
          <span className="w-1.5 h-1.5 rounded-full border border-faint" /> À pointer
        </span>
      ) : null}
      <span className="flex-1 text-sm text-texte truncate">{libelle}</span>
      {j.arrivee && (
        <span className="font-mono text-xs text-muted shrink-0 text-right tabular-nums">
          {j.arrivee}{j.depart ? ` → ${j.depart}` : ""}
        </span>
      )}
    </button>
  );
}

// Petite statistique d'en-tête (compteurs d'états — complémentaires des KPI sous le calendrier).
function Stat({ value, label, tone }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${tone}`}>
      <span className="text-lg font-bold tabular-nums leading-none">{value}</span>
      <span className="text-[11px] font-medium opacity-80 leading-tight">{label}</span>
    </div>
  );
}

export default function CalendrierPresence({ cal, onJour }) {
  const leading = cal.jours[0]?.dow ?? 0;
  const trailing = (7 - ((leading + cal.jours.length) % 7)) % 7;
  const compte = (etat) => cal.jours.filter((j) => j.etat === etat).length;
  const presents = compte("Présent");
  const retards = compte("Retard");
  const absents = compte("Absent");
  const aVenir = compte("Prévu");

  // Légende à ICÔNES (mêmes repères que les cellules → cohérent pour daltoniens).
  const legende = [
    { icon: "check", tone: "text-emerald-600", l: "Présent" },
    { icon: "schedule", tone: "text-amber-600", l: "Retard" },
    { icon: "close", tone: "text-rose-600", l: "Absent" },
    { ring: true, l: "À pointer" },
    { icon: "event", tone: "text-sky-600", l: "Événement" },
    { icon: "flag", tone: "text-rose-600", l: "Férié" },
  ];

  return (
    <div className="card overflow-hidden">
      {/* En-tête : mois + légende + statistiques d'états */}
      <div className="px-5 py-4 border-b border-border flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3">
          <div className="flex items-center gap-2">
            <Icon name="calendar_month" className="text-[20px] text-muted" />
            <div className="text-base font-semibold text-ink tabular-nums" aria-label={`Calendrier ${cal.mois}`}>
              {cal.mois.split(" ")[0]} <span className="font-normal text-muted">{cal.mois.split(" ")[1]}</span>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-x-3 gap-y-1.5 flex-wrap justify-end">
            {legende.map((x) => (
              <span key={x.l} className="flex items-center gap-1.5 text-[11px] text-muted">
                {x.icon ? (
                  <Icon name={x.icon} className={`text-[13px] ${x.tone}`} />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-surface-2 ring-1 ring-faint" />
                )}
                {x.l}
              </span>
            ))}
          </div>
        </div>

        {/* Compteurs d'états du mois (le taux / les heures / la rémunération restent sur les KPI dédiés) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Stat value={presents} label={presents > 1 ? "Présents" : "Présent"} tone="bg-emerald-50 text-emerald-700" />
          <Stat value={retards} label={retards > 1 ? "Retards" : "Retard"} tone="bg-amber-50 text-amber-700" />
          <Stat value={absents} label={absents > 1 ? "Absences" : "Absence"} tone="bg-rose-50 text-rose-700" />
          <Stat value={aVenir} label="À pointer" tone="bg-brand-50 text-brand-700" />
        </div>
      </div>

      {/* Grille desktop — cellules arrondies */}
      <div className="hidden lg:block p-3">
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1 text-center text-[11px] font-semibold text-subtle">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: leading }).map((_, i) => (
            <div key={`l${i}`} className="min-h-[86px] rounded-xl bg-surface-2/20" />
          ))}
          {cal.jours.map((j) => (
            <Cellule key={j.jour} j={j} onJour={onJour} />
          ))}
          {Array.from({ length: trailing }).map((_, i) => (
            <div key={`e${i}`} className="min-h-[86px] rounded-xl bg-surface-2/20" />
          ))}
        </div>
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
          Mois complet · les <span className="font-medium text-muted">jours travaillés</span> portent un état de pointage · <span className="font-medium text-muted">cliquez sur un jour</span> pour consulter ou justifier.
        </p>
      </div>
    </div>
  );
}
