import Icon from "./Icon.jsx";

const WEEKDAYS = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];

// État de pointage → style HAUTE LISIBILITÉ : bandeau coloré franc (pastille pleine,
// texte blanc), bord gauche épais, fond teinté. Contraste volontairement plus marqué
// pour distinguer présent / retard / absent d'un coup d'œil.
const ETAT = {
  Présent: { bg: "bg-emerald-50",  bord: "border-emerald-500", pill: "bg-emerald-600", num: "text-emerald-900", icon: "check_circle" },
  Retard:  { bg: "bg-amber-50",    bord: "border-amber-500",   pill: "bg-amber-500",   num: "text-amber-900",   icon: "schedule" },
  Absent:  { bg: "bg-rose-50",     bord: "border-rose-500",    pill: "bg-rose-600",    num: "text-rose-900",    icon: "cancel" },
};

// Couleurs des LOGS (pointages) : entrée = vert (on arrive), sortie = rouge (on part).
const PUNCH = {
  entree: { icon: "login",  txt: "text-emerald-800", ico: "text-emerald-600", bg: "bg-emerald-500/10", label: "Entrée" },
  sortie: { icon: "logout", txt: "text-rose-800",    ico: "text-rose-600",    bg: "bg-rose-500/10",    label: "Sortie" },
};

// Une ligne de log : icône + heure + libellé, code couleur entrée/sortie.
function Punch({ p, compact = false }) {
  const s = PUNCH[p.type] ?? PUNCH.entree;
  return (
    <div className={`flex items-center gap-1.5 rounded-md px-1.5 py-[3px] ${s.bg}`}>
      <Icon name={s.icon} className={`text-[12px] shrink-0 ${s.ico}`} />
      <span className={`text-[11px] font-bold tabular-nums leading-none ${s.txt}`}>{p.heure}</span>
      {!compact && (
        <span className={`ml-auto text-[8.5px] font-semibold uppercase tracking-wide ${s.ico} opacity-80`}>{s.label}</span>
      )}
    </div>
  );
}

function libelleJour(j) {
  return j.ferie ?? j.event ?? (j.today && !j.etat ? "aujourd'hui" : j.etat === "Prévu" ? "à pointer" : j.etat ?? "repos");
}

// Cellule de jour (grille desktop) — en-tête (numéro + état) puis JOURNAL des pointages.
function Cellule({ j, onJour }) {
  const st = ETAT[j.etat];
  const passages = Array.isArray(j.passages) ? j.passages : [];
  const bg = j.ferie ? "bg-rose-50/70" : j.event ? "bg-sky-50/70" : st ? st.bg : j.today ? "bg-or-50" : j.weekend ? "bg-surface-2/40" : "bg-surface-2/20";
  const bordL = st ? st.bord : j.ferie ? "border-rose-400" : j.event ? "border-sky-400" : j.today ? "border-or-400" : "border-transparent";
  const num = st ? st.num : j.today ? "text-or-700" : j.weekend ? "text-subtle" : "text-muted";
  const aria = `${WEEKDAYS[j.dow]} ${j.jour} — ${libelleJour(j)}` +
    (passages.length ? `, ${passages.map((p) => `${p.type === "entree" ? "entrée" : "sortie"} ${p.heure}`).join(", ")}` : "");

  return (
    <button
      onClick={() => onJour?.(j)}
      aria-label={aria}
      className={`group relative flex min-h-[118px] flex-col rounded-xl border-l-[5px] p-2 text-left transition-all hover:-translate-y-px hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${bg} ${bordL} ${
        j.today ? "ring-2 ring-or-400" : "ring-1 ring-border/40"
      }`}
    >
      {/* En-tête : numéro + badge aujourd'hui */}
      <div className="mb-1 flex items-center justify-between">
        <span className={`text-base font-extrabold leading-none tabular-nums ${num}`}>{j.jour}</span>
        {j.today && <span className="rounded bg-or-500 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-white">Auj.</span>}
      </div>

      {/* État (pastille pleine, fort contraste) */}
      {st && (
        <span className={`mb-1 inline-flex w-fit items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${st.pill}`}>
          <Icon name={st.icon} className="text-[12px]" /> {j.etat}
        </span>
      )}

      {/* Journal des pointages (tous les passages, code couleur) */}
      {passages.length > 0 ? (
        <div className="mt-0.5 flex flex-col gap-1">
          {passages.map((p, i) => <Punch key={i} p={p} />)}
        </div>
      ) : st === ETAT.Absent ? null : j.ferie ? (
        <span className="mt-auto inline-flex items-center gap-1 text-[10px] font-medium text-rose-700 line-clamp-2">
          <Icon name="flag" className="text-[12px] shrink-0" /> {j.ferie}
        </span>
      ) : j.event ? (
        <span className="mt-auto inline-flex items-center gap-1 text-[10px] font-medium text-sky-700 line-clamp-2">
          <Icon name="event" className="text-[12px] shrink-0" /> {j.event}
        </span>
      ) : j.etat === "Prévu" ? (
        <span className="mt-auto inline-flex items-center gap-1 text-[10.5px] text-muted">
          <span className="h-2 w-2 rounded-full border border-faint" /> À pointer
        </span>
      ) : null}
    </button>
  );
}

// Ligne de jour (liste mobile) — état + journal compact des pointages.
function LigneJour({ j, onJour }) {
  const st = ETAT[j.etat];
  const passages = Array.isArray(j.passages) ? j.passages : [];
  const bl = j.today ? "border-l-or-500 bg-or-50" : j.ferie ? "border-l-rose-500 bg-rose-50/50" : j.event ? "border-l-sky-500 bg-sky-50/50" : st ? `${st.bord.replace("border-", "border-l-")} ${st.bg}` : "border-l-border";
  const libelle = j.ferie ?? j.event ?? (j.today && !j.etat ? "Aujourd'hui" : j.etat === "Prévu" ? "À pointer" : j.etat ?? "—");
  return (
    <button onClick={() => onJour?.(j)} className={`flex w-full items-center gap-3 border-l-4 px-4 py-3 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${bl}`}>
      <div className="flex w-9 shrink-0 flex-col items-center">
        <span className="text-[10px] uppercase text-subtle">{WEEKDAYS[j.dow]}</span>
        <span className={`text-lg font-bold leading-none tabular-nums ${j.today ? "text-or-700" : "text-ink"}`}>{j.jour}</span>
      </div>
      {st && (
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${st.pill}`}>
          <Icon name={st.icon} className="text-[12px]" /> {j.etat}
        </span>
      )}
      {passages.length > 0 ? (
        <div className="flex flex-1 flex-wrap items-center gap-1">
          {passages.map((p, i) => <Punch key={i} p={p} compact />)}
        </div>
      ) : (
        <span className="flex-1 truncate text-sm text-texte">{libelle}</span>
      )}
    </button>
  );
}

// Petite statistique d'en-tête (compteurs d'états).
function Stat({ value, label, tone }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${tone}`}>
      <span className="text-lg font-bold leading-none tabular-nums">{value}</span>
      <span className="text-[11px] font-medium leading-tight opacity-80">{label}</span>
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

  // Légende — états + code couleur des pointages (entrée/sortie).
  const legende = [
    { icon: "check_circle", tone: "text-emerald-600", l: "Présent" },
    { icon: "schedule", tone: "text-amber-600", l: "Retard" },
    { icon: "cancel", tone: "text-rose-600", l: "Absent" },
    { icon: "login", tone: "text-emerald-600", l: "Entrée" },
    { icon: "logout", tone: "text-rose-600", l: "Sortie" },
    { icon: "flag", tone: "text-rose-600", l: "Férié" },
  ];

  return (
    <div className="card overflow-hidden">
      {/* En-tête : mois + légende + statistiques d'états */}
      <div className="flex flex-col gap-4 border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex items-center gap-2">
            <Icon name="calendar_month" className="text-[20px] text-muted" />
            <div className="text-base font-semibold tabular-nums text-ink" aria-label={`Calendrier ${cal.mois}`}>
              {cal.mois.split(" ")[0]} <span className="font-normal text-muted">{cal.mois.split(" ")[1]}</span>
            </div>
          </div>
          <div className="hidden flex-wrap items-center justify-end gap-x-3 gap-y-1.5 lg:flex">
            {legende.map((x) => (
              <span key={x.l} className="flex items-center gap-1.5 text-[11px] text-muted">
                <Icon name={x.icon} className={`text-[13px] ${x.tone}`} /> {x.l}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Stat value={presents} label={presents > 1 ? "Présents" : "Présent"} tone="bg-emerald-50 text-emerald-700" />
          <Stat value={retards} label={retards > 1 ? "Retards" : "Retard"} tone="bg-amber-50 text-amber-700" />
          <Stat value={absents} label={absents > 1 ? "Absences" : "Absence"} tone="bg-rose-50 text-rose-700" />
          <Stat value={aVenir} label="À pointer" tone="bg-brand-50 text-brand-700" />
        </div>
      </div>

      {/* Grille desktop */}
      <div className="hidden p-3 lg:block">
        <div className="mb-1.5 grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1 text-center text-[11px] font-semibold text-subtle">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: leading }).map((_, i) => (
            <div key={`l${i}`} className="min-h-[118px] rounded-xl bg-surface-2/20" />
          ))}
          {cal.jours.map((j) => (
            <Cellule key={j.jour} j={j} onJour={onJour} />
          ))}
          {Array.from({ length: trailing }).map((_, i) => (
            <div key={`e${i}`} className="min-h-[118px] rounded-xl bg-surface-2/20" />
          ))}
        </div>
      </div>

      {/* Liste mobile */}
      <div className="divide-y divide-border lg:hidden">
        {cal.jours.filter((j) => j.cours || j.ferie || j.event || j.today).map((j) => (
          <LigneJour key={j.jour} j={j} onJour={onJour} />
        ))}
      </div>

      {/* Note de pied */}
      <div className="border-t border-border bg-surface-2/40 px-5 py-3">
        <p className="text-xs text-subtle">
          Chaque jour travaillé affiche <span className="font-medium text-emerald-700">entrées</span> et <span className="font-medium text-rose-700">sorties</span> pointées · <span className="font-medium text-muted">cliquez sur un jour</span> pour le détail ou une correction.
        </p>
      </div>
    </div>
  );
}
