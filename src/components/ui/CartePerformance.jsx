import { useEffect, useState } from "react";
import Avatar from "./Avatar.jsx";
import Icon from "./Icon.jsx";
import ActionsRapides from "./ActionsRapides.jsx";
import { apiGet } from "../../lib/api.js";

const barColor = (p) => (p >= 90 ? "bg-emerald-500" : p >= 80 ? "bg-sky-500" : p >= 70 ? "bg-amber-500" : "bg-rose-500");
const txtColor = (p) => (p >= 90 ? "text-emerald-600" : p >= 80 ? "text-sky-600" : p >= 70 ? "text-amber-600" : "text-rose-600");

// API statut pointage (present/retard/absent/conge) -> libellé attendu par le JSX.
const STATUT_PRESENCE = { present: "Présent", retard: "Retard", absent: "Absent", conge: "Congé" };

// "AAAA-MM-JJ HH:MM:SS" | "HH:MM:SS" -> "HH:MM" (ou "—").
function hhmm(v) {
  if (!v) return "—";
  const m = String(v).match(/(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "—";
}

// "AAAA-MM-JJ" -> "20 juin" (libellé court FR).
const MOIS_COURT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
function dateCourte(v) {
  if (!v) return "—";
  const [, mn, j] = String(v).slice(0, 10).split("-");
  if (!mn || !j) return String(v);
  return `${Number(j)} ${MOIS_COURT[Number(mn) - 1] ?? ""}`.trim();
}

// Durée travaillée (minutes) -> "8h 12m" (ou "—").
function dureeTexte(min) {
  const m = Math.round(Number(min) || 0);
  if (m <= 0) return "—";
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

// Minutes -> "Xh YYm" (productivité : temps moyen / inactivité).
function hhmmDuree(min) {
  const m = Math.round(Number(min) || 0);
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

// GET /api/pointages?employe_id={id} -> 7 derniers jours [{date,statut,arrivee,depart,retardMin,temps}].
function mapPresence(rows) {
  return (Array.isArray(rows) ? rows : [])
    .slice(0, 7) // déjà trié ORDER BY id DESC (plus récents d'abord)
    .map((p) => ({
      date: dateCourte(p.date),
      statut: STATUT_PRESENCE[p.statut] ?? "Absent",
      arrivee: hhmm(p.heure_entree),
      depart: hhmm(p.heure_sortie),
      retardMin: Number(p.retard_minutes) || 0,
      temps: dureeTexte(p.temps_present_minutes),
    }));
}

// GET /api/productivite/{id} -> { score, rang, total, tendance, tempsMoyen, inactivite, serie }.
function mapProductivite(data) {
  const resume = data?.resume ?? {};
  const serie = (Array.isArray(data?.serie) ? data.serie : []).map((d) => Math.round(Number(d.taux_productivite) || 0));
  const jours = Number(resume.jours_travailles) || 0;
  return {
    score: Math.round(Number(resume.taux_moyen) || 0),
    rang: Number(data?.rang) || 0,
    total: Number(data?.total) || 0,
    tendance: Number(data?.tendance) || 0,
    tempsMoyen: jours ? hhmmDuree((Number(resume.heures_travaillees) || 0) * 60 / jours) : "—",
    inactivite: jours ? hhmmDuree((Number(resume.heures_inactivite) || 0) * 60 / jours) : "—",
    serie,
  };
}

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
  // id numérique API (mapEmploye expose _id) ; repli sur e.id si besoin.
  const apiId = e?._id ?? e?.id;

  // États vides neutres : aucune donnée fictive tant que l'API n'a pas répondu.
  const [presence, setPresence] = useState([]);
  const [prod, setProd] = useState({ score: 0, rang: 0, total: 0, tendance: 0, tempsMoyen: "—", inactivite: "—", serie: [] });

  useEffect(() => {
    let actif = true;
    if (apiId == null) return undefined;

    Promise.all([
      apiGet(`/api/pointages?employe_id=${apiId}`).catch(() => []),
      apiGet(`/api/productivite/${apiId}`).catch(() => null),
    ])
      .then(([pointages, prodData]) => {
        if (!actif) return;
        setPresence(mapPresence(pointages));
        if (prodData) setProd(mapProductivite(prodData));
      })
      .catch(() => {
        /* états vides neutres déjà en place */
      });

    return () => {
      actif = false;
    };
  }, [apiId]);

  const jours = presence.length || 1;
  const presents = presence.filter((p) => p.statut === "Présent" || p.statut === "Retard").length;
  const presencePct = presence.length ? Math.round((presents / jours) * 100) : 0;
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
