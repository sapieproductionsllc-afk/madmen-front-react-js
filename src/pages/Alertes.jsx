import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader.jsx";
import StatTile from "../components/ui/StatTile.jsx";
import Button from "../components/ui/Button.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import Icon from "../components/ui/Icon.jsx";
import Drawer from "../components/ui/Drawer.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { apiGet } from "../lib/api.js";

const config = {
  Critique: { tone: "rose", icon: "gpp_bad", chip: "bg-rose-50 text-rose-700", bar: "bg-rose-500", rang: 0 },
  Moyen: { tone: "amber", icon: "warning", chip: "bg-amber-50 text-amber-700", bar: "bg-amber-500", rang: 1 },
  Faible: { tone: "slate", icon: "info", chip: "bg-slate-50 text-slate-700", bar: "bg-slate-500", rang: 2 },
};

// Normalise la sévérité de l'API vers les clés attendues par `config` (Critique/Moyen/Faible).
function normSeverite(s) {
  const v = String(s ?? "").toLowerCase();
  if (v.startsWith("crit") || v === "haute" || v === "high" || v === "élevé" || v === "eleve") return "Critique";
  if (v.startsWith("moy") || v === "medium" || v === "warning") return "Moyen";
  return "Faible";
}

// Extrait un HH:MM affichable depuis l'horodatage API (ISO, "HH:MM:SS", timestamp…).
function heure(h) {
  if (!h) return "00:00";
  const str = String(h);
  // Cas ISO ou "YYYY-MM-DD HH:MM:SS" : on isole la partie heure.
  const m = str.match(/(\d{2}):(\d{2})/);
  if (m) return `${m[1]}:${m[2]}`;
  return "00:00";
}

// Mapping API (GET /api/alertes) -> forme exacte attendue par le JSX (champs identiques au mock).
function mapAlerte(a) {
  return {
    id: a.id,
    type: a.type || "Alerte",
    severity: normSeverite(a.severite),
    employe: a.employe_nom || "Inconnu", // valeur neutre : préserve la logique « employé réel »
    agence: a.agence || "—", // absent de l'API -> neutre (pas de champ agence renvoyé)
    machine: a.machine || "—", // absent de l'API -> neutre (comme dans le mock)
    time: heure(a.horodatage),
    message: a.message || "",
    read: Boolean(a.lu),
  };
}

// Chronologie reconstituée (frontend / données mockées) autour de l'heure de l'alerte.
function chronologie(a) {
  const [h, m] = a.time.split(":").map(Number);
  const base = h * 60 + m;
  const fmt = (min) => {
    const x = ((min % 1440) + 1440) % 1440;
    return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
  };
  return [
    { time: fmt(base - 2), label: `Activité détectée sur ${a.machine !== "—" ? a.machine : "le poste concerné"}` },
    { time: fmt(base - 1), label: "Seuil de déclenchement atteint" },
    { time: a.time, label: `Alerte ${a.severity.toLowerCase()} générée`, accent: true },
    { time: fmt(base + 1), label: a.read ? "Consultée par un administrateur" : "En attente de revue", pending: !a.read },
  ];
}

export default function Alertes() {
  const { toast } = useUI();
  const navigate = useNavigate();
  const [donnees, setDonnees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [lues, setLues] = useState(() => new Set());
  const [selected, setSelected] = useState(null);

  // Données RÉELLES depuis l'API (remplace les mocks de src/data).
  useEffect(() => {
    apiGet("/api/alertes")
      .then((data) => {
        const liste = (Array.isArray(data) ? data : []).map(mapAlerte);
        setDonnees(liste);
        setLues(new Set(liste.filter((a) => a.read).map((a) => a.id)));
      })
      .catch((e) => setErreur(e.message || "Erreur de chargement"))
      .finally(() => setChargement(false));
  }, []);

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

  // Tri : non-lues d'abord, puis par gravité (Critique → Moyen → Faible).
  const triees = [...donnees].sort((a, b) => {
    const lu = Number(lues.has(a.id)) - Number(lues.has(b.id));
    if (lu !== 0) return lu;
    return (config[a.severity]?.rang ?? 9) - (config[b.severity]?.rang ?? 9);
  });

  const c0 = selected ? config[selected.severity] ?? config.Faible : null;
  const employeReel = selected && !["Inconnu", "Système"].includes(selected.employe);
  const chrono = selected ? chronologie(selected) : [];

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

      {chargement ? (
        <div className="card py-16 text-center">
          <Icon name="progress_activity" className="text-faint text-[40px] animate-spin" />
          <p className="mt-2 text-sm text-muted">Chargement des alertes…</p>
        </div>
      ) : erreur ? (
        <div className="card py-16 text-center">
          <Icon name="error" className="text-rose-500 text-[40px]" />
          <p className="mt-2 text-sm text-muted">{erreur}</p>
        </div>
      ) : triees.length === 0 ? (
        <div className="card py-16 text-center">
          <Icon name="notifications_off" className="text-faint text-[40px]" />
          <p className="mt-2 text-sm text-muted">Aucune alerte à afficher.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {triees.map((a) => {
            const c = config[a.severity] ?? config.Faible;
            const lu = lues.has(a.id);
            const critique = a.severity === "Critique" && !lu;
            return (
              <div
                key={a.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelected(a)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(a);
                  }
                }}
                aria-label={`Ouvrir le détail : ${a.type}`}
                className={`group relative flex items-stretch overflow-hidden rounded-2xl border bg-surface cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
                  lu
                    ? "border-border opacity-55 hover:opacity-80"
                    : critique
                      ? "border-rose-500/30 hover:-translate-y-px hover:shadow-lift"
                      : "border-border hover:border-border-strong hover:-translate-y-px hover:shadow-lift"
                }`}
              >
                {/* Barre de sévérité */}
                <span aria-hidden="true" className={`w-1.5 shrink-0 ${c.bar} ${lu ? "opacity-50" : ""}`} />
                {/* Voile teinté pour les critiques non lues */}
                {critique && <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-rose-500/[0.05]" />}

                <div className="relative flex flex-1 items-start gap-4 px-5 py-4 min-w-0">
                  <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${c.chip}`}>
                    <Icon name={c.icon} className="text-[22px]" filled />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-ink truncate">{a.type}</span>
                      <StatusPill label={a.severity} tone={c.tone} dot={false} />
                      {!lu && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600">Nouveau</span>
                      )}
                    </div>
                    <p className="text-sm text-texte">{a.message}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-xs text-muted">
                      <span className="flex items-center gap-1.5"><Icon name="person" className="text-[14px]" />{a.employe}</span>
                      <span className="flex items-center gap-1.5"><Icon name="apartment" className="text-[14px]" />{a.agence}</span>
                      <span className="flex items-center gap-1.5"><Icon name="dvr" className="text-[14px]" />{a.machine}</span>
                    </div>
                  </div>
                  {/* Colonne droite : horodatage + action */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <span className="flex items-center gap-1 text-xs text-muted whitespace-nowrap">
                      <Icon name="schedule" className="text-[14px]" />{a.time}
                    </span>
                    {!lu ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="check"
                        onClick={(e) => {
                          e.stopPropagation();
                          marquerLu(a);
                        }}
                      >
                        Marquer lu
                      </Button>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-subtle whitespace-nowrap">
                        <Icon name="check_circle" className="text-[14px]" />Lu
                      </span>
                    )}
                  </div>
                  {/* Indicateur d'ouverture du détail */}
                  <Icon
                    name="chevron_right"
                    className="self-center shrink-0 text-faint group-hover:text-muted transition-colors"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Panneau de détail */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.type}
        subtitle={selected ? `${selected.agence} · ${selected.time}` : ""}
        icon={c0?.icon}
        iconClass={c0?.chip}
        footer={
          selected ? (
            <>
              {employeReel && (
                <Button
                  variant="secondary"
                  icon="badge"
                  onClick={() => {
                    navigate("/employes");
                    setSelected(null);
                  }}
                >
                  Voir l'employé
                </Button>
              )}
              {!lues.has(selected.id) ? (
                <Button
                  variant="primary"
                  icon="check"
                  onClick={() => {
                    marquerLu(selected);
                    setSelected(null);
                  }}
                >
                  Marquer comme lu
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => setSelected(null)}>
                  Fermer
                </Button>
              )}
            </>
          ) : null
        }
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <StatusPill label={selected.severity} tone={c0.tone} dot={false} />
              {!lues.has(selected.id) && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600">Non lue</span>
              )}
            </div>

            <p className="text-[0.95rem] leading-relaxed text-texte">{selected.message}</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-surface-2 border border-border p-3 min-w-0">
                <p className="kicker mb-1.5">Employé</p>
                <div className="flex items-center gap-2 min-w-0">
                  {employeReel ? (
                    <Avatar name={selected.employe} size="w-6 h-6" />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-surface flex items-center justify-center shrink-0">
                      <Icon name="help" className="text-[14px] text-subtle" />
                    </span>
                  )}
                  <span className="text-sm text-texte truncate">{selected.employe}</span>
                </div>
              </div>
              <div className="rounded-xl bg-surface-2 border border-border p-3 min-w-0">
                <p className="kicker mb-1.5">Agence</p>
                <p className="text-sm text-texte truncate">{selected.agence}</p>
              </div>
              <div className="rounded-xl bg-surface-2 border border-border p-3 min-w-0">
                <p className="kicker mb-1.5">Appareil</p>
                <p className="text-sm text-texte font-mono truncate">{selected.machine}</p>
              </div>
              <div className="rounded-xl bg-surface-2 border border-border p-3 min-w-0">
                <p className="kicker mb-1.5">Horodatage</p>
                <p className="text-sm text-texte font-mono">{selected.time}</p>
              </div>
            </div>

            <div>
              <p className="kicker mb-3">Chronologie</p>
              <ol className="relative">
                {chrono.map((e, i) => (
                  <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                    <div className="relative flex flex-col items-center">
                      <span
                        className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ring-4 ring-surface ${
                          e.accent ? c0.bar : e.pending ? "bg-faint" : "bg-muted"
                        }`}
                      />
                      {i < chrono.length - 1 && <span className="w-px flex-1 bg-border mt-0.5" />}
                    </div>
                    <div className="pb-1">
                      <p className="text-sm text-texte leading-snug">{e.label}</p>
                      <p className="text-xs text-subtle font-mono mt-0.5">{e.time}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
