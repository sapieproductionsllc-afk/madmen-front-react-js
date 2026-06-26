import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import PointageJourModal from "../components/pointage/PointageJourModal.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { apiGet } from "../lib/api.js";
import { mapEmploye } from "../lib/mappers.js";

const photoDe = (id) => `https://i.pravatar.cc/160?u=${encodeURIComponent(id)}`;
const PERIODES = ["Jour", "Semaine", "Mois", "Année"];
const MOIS_AB = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MOIS_LONG = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const JOURS_AB = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];
const TONE = { Présent: "bg-emerald-50 text-emerald-700", Retard: "bg-amber-50 text-amber-700", Absent: "bg-rose-50 text-rose-600", Congé: "bg-sky-50 text-sky-700" };
// Statut API (enum, 'parti' = journée terminée) -> libellé. Le retard est affiché à part.
const STATUT_API = { present: "Présent", retard: "Retard", absent: "Absent", conge: "Congé", parti: "Présent" };

const p2 = (x) => String(x).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const heure = (dt) => (dt ? String(dt).slice(11, 16) : "--:--");
const dureeHm = (min) => (min && min > 0 ? `${Math.floor(min / 60)}h${p2(min % 60)}` : "—");

const lundiDe = (d) => { const x = new Date(d); const j = (x.getDay() + 6) % 7; x.setDate(x.getDate() - j); x.setHours(0, 0, 0, 0); return x; };
const addJours = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const addMois = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };

// Plage [début, fin] (objets Date) pour la période + date de référence.
function plage(periode, ref) {
  if (periode === "Jour") return [ref, ref];
  if (periode === "Semaine") { const s = lundiDe(ref); return [s, addJours(s, 6)]; }
  if (periode === "Mois") return [new Date(ref.getFullYear(), ref.getMonth(), 1), new Date(ref.getFullYear(), ref.getMonth() + 1, 0)];
  return [new Date(ref.getFullYear(), 0, 1), new Date(ref.getFullYear(), 11, 31)];
}
function decaler(periode, ref, sens) {
  if (periode === "Jour") return addJours(ref, sens);
  if (periode === "Semaine") return addJours(ref, sens * 7);
  if (periode === "Mois") return addMois(ref, sens);
  return addMois(ref, sens * 12);
}
function labelPeriode(periode, ref) {
  if (periode === "Jour") return ref.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  if (periode === "Semaine") { const [s, e] = plage("Semaine", ref); return `Semaine du ${s.getDate()} ${MOIS_AB[s.getMonth()]} au ${e.getDate()} ${MOIS_AB[e.getMonth()]}`; }
  if (periode === "Mois") return `${MOIS_LONG[ref.getMonth()]} ${ref.getFullYear()}`;
  return `${ref.getFullYear()}`;
}

function mapPointage(p) {
  const statut = STATUT_API[p.statut] || "Absent";
  const d = p.date ? new Date(p.date + "T00:00:00") : null;
  const ret = Number(p.retard_minutes) || 0;
  // Mouvements = TOUS les passages du jour (entrées/sorties) ; repli sur arrivée+départ
  // pour les jours qui n'ont que check_in/check_out (anciens pointages sans passages).
  const passagesRaw = Array.isArray(p.passages) ? p.passages : [];
  const mouvements = passagesRaw.length
    ? passagesRaw
    : [
        ...(p.heure_entree ? [{ type: "entree", heure: heure(p.heure_entree) }] : []),
        ...(p.heure_sortie ? [{ type: "sortie", heure: heure(p.heure_sortie) }] : []),
      ];
  return {
    rawDate: p.date,
    mois: d ? d.getMonth() : 0,
    dateLabel: d ? `${JOURS_AB[(d.getDay() + 6) % 7]} ${d.getDate()} ${MOIS_AB[d.getMonth()]}` : "—",
    arrivee: heure(p.heure_entree),
    depart: heure(p.heure_sortie),
    mouvements,
    temps: dureeHm(p.temps_present_minutes),
    retard: ret > 0 ? `+${ret} min` : "—",
    statut,
  };
}

// Chip d'un pointage : vert = entrée (on arrive), rouge = sortie (on part).
function MvtChip({ m }) {
  const inn = m.type === "entree";
  return (
    <span
      title={inn ? "Entrée" : "Sortie"}
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums ${inn ? "bg-emerald-500/15 text-emerald-700" : "bg-rose-500/15 text-rose-700"}`}
    >
      <Icon name={inn ? "login" : "logout"} className="text-[13px]" /> {m.heure}
    </span>
  );
}

function Centre({ icon, spin, rose, texte, retour }) {
  return (
    <div className="card py-16 text-center max-w-lg mx-auto">
      <Icon name={icon} className={`text-[40px] ${spin ? "text-brand-600 animate-spin" : rose ? "text-rose-500" : "text-faint"}`} />
      <p className="mt-2 text-sm text-muted">{texte}</p>
      {retour && (
        <button onClick={retour} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">
          <Icon name="arrow_back" className="text-[18px]" /> Retour au tableau de bord
        </button>
      )}
    </div>
  );
}

const StatutBadge = ({ statut }) => (
  <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${TONE[statut] ?? "bg-surface-2 text-muted"}`}>{statut}</span>
);

function TableJours({ rows, loading, onJour }) {
  return (
    <>
      <div className="px-4 sm:px-5 py-3 border-b border-border flex items-center gap-1.5 text-xs text-muted">
        <Icon name="touch_app" className="text-brand-600 text-[18px]" /> Touchez un jour pour corriger l'arrivée ou le départ.
      </div>
      <div className="overflow-x-auto scroll-thin">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-xs text-subtle border-b border-border">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-3 py-3 font-medium">Mouvements <span className="font-normal normal-case text-faint">· entrées / sorties</span></th>
              <th className="px-3 py-3 font-medium">Heures</th>
              <th className="px-3 py-3 font-medium">Retard</th>
              <th className="px-5 py-3 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.rawDate} onClick={() => onJour(r)} className="hover:bg-surface-2/60 cursor-pointer transition-colors">
                <td className="px-5 py-2.5 font-medium text-texte whitespace-nowrap capitalize">{r.dateLabel}</td>
                <td className="px-3 py-2.5">
                  {r.mouvements.length === 0 ? (
                    <span className="text-muted">—</span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1">
                      {r.mouvements.map((m, i) => <MvtChip key={i} m={m} />)}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2.5 tabular-nums text-muted">{r.temps}</td>
                <td className={`px-3 py-2.5 tabular-nums ${r.retard !== "—" ? "text-amber-600 font-medium" : "text-muted"}`}>{r.retard}</td>
                <td className="px-5 py-2.5"><StatutBadge statut={r.statut} /></td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-muted">Aucun pointage sur cette période.</td></tr>
            )}
            {loading && rows.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center"><Icon name="progress_activity" className="animate-spin text-[22px] text-brand-600" /></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SyntheseAnnee({ annee, vide }) {
  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full text-sm min-w-[560px]">
        <thead>
          <tr className="text-left text-xs text-subtle border-b border-border">
            <th className="px-5 py-3 font-medium">Mois</th>
            <th className="px-3 py-3 font-medium">Jours pointés</th>
            <th className="px-3 py-3 font-medium">Présences</th>
            <th className="px-3 py-3 font-medium">Retards</th>
            <th className="px-5 py-3 font-medium">Absences / congés</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {annee.map((m) => (
            <tr key={m.mois} className="hover:bg-surface-2/50">
              <td className="px-5 py-3 font-medium text-texte">{m.nom}</td>
              <td className="px-3 py-3 tabular-nums text-muted">{m.jours}</td>
              <td className="px-3 py-3 tabular-nums text-emerald-600 font-medium">{m.presents}</td>
              <td className="px-3 py-3 tabular-nums text-amber-600 font-medium">{m.retards}</td>
              <td className="px-5 py-3 tabular-nums text-muted">{m.absents} / {m.conges}</td>
            </tr>
          ))}
          {vide && <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-muted">Aucun pointage cette année.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

// Feuille de pointage d'UN agent — données réelles, filtrable par période, éditable au clic.
export default function Pointages() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dataVersion } = useUI();

  const [e, setE] = useState(null);
  const [pointages, setPointages] = useState([]);
  const [periode, setPeriode] = useState("Semaine");
  const [ref, setRef] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [jourEdit, setJourEdit] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [chargePointages, setChargePointages] = useState(false);
  const [erreur, setErreur] = useState(null);

  // Employé (en-tête + id numérique pour le modal) — endpoint accepte le matricule.
  useEffect(() => {
    let actif = true;
    setChargement(true); setErreur(null);
    apiGet(`/api/employes/${id}`)
      .then((emp) => { if (actif) setE(mapEmploye(emp)); })
      .catch((err) => { if (actif) setErreur(err?.message || "Erreur de chargement"); })
      .finally(() => { if (actif) setChargement(false); });
    return () => { actif = false; };
  }, [id]);

  // Pointages de la plage (serveur : employe_id=matricule + from/to).
  const [from, to] = plage(periode, ref);
  const fromY = ymd(from);
  const toY = ymd(to);
  useEffect(() => {
    let actif = true;
    setChargePointages(true);
    apiGet(`/api/pointages?employe_id=${encodeURIComponent(id)}&from=${fromY}&to=${toY}`)
      .then((data) => { if (actif) setPointages(Array.isArray(data) ? data.map(mapPointage) : []); })
      .catch(() => { if (actif) setPointages([]); })
      .finally(() => { if (actif) setChargePointages(false); });
    return () => { actif = false; };
  }, [id, fromY, toY, dataVersion]);

  // Synthèse mensuelle (vue Année).
  const annee = useMemo(() => {
    const parMois = {};
    pointages.forEach((j) => { (parMois[j.mois] ||= []).push(j); });
    return Object.keys(parMois).map((m) => {
      const arr = parMois[m];
      const c = (s) => arr.filter((j) => j.statut === s).length;
      return { mois: Number(m), nom: MOIS_LONG[m], jours: arr.length, presents: c("Présent") + c("Retard"), retards: c("Retard"), absents: c("Absent"), conges: c("Congé") };
    }).sort((a, b) => a.mois - b.mois);
  }, [pointages]);

  if (chargement) return <Centre icon="progress_activity" spin texte="Chargement des pointages…" />;
  if (erreur) return <Centre icon="error" rose texte={erreur} retour={() => navigate("/")} />;
  if (!e) return <Centre icon="person_off" texte={`Agent introuvable (${id}).`} retour={() => navigate("/")} />;

  const ouvrir = (r) => setJourEdit({
    date: r.rawDate,
    arrivee: r.arrivee === "--:--" ? "" : r.arrivee,
    depart: r.depart === "--:--" ? "" : r.depart,
  });

  return (
    <div className="space-y-4 pb-10">
      <button onClick={() => navigate(-1)} className="group inline-flex items-center gap-1.5 h-9 pl-2 pr-3.5 rounded-full bg-surface border border-border text-sm font-medium text-muted hover:text-ink hover:border-border-strong hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
        <Icon name="arrow_back" className="text-[18px] group-hover:-translate-x-0.5 transition-transform" /> Retour
      </button>

      {/* En-tête agent (vert) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-600 p-5 shadow-card flex items-center gap-4">
        <span className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-white/5" aria-hidden="true" />
        <span className="relative rounded-full ring-2 ring-or-400/80 ring-offset-2 ring-offset-brand-700 shrink-0">
          <Avatar src={photoDe(id)} name={e.name} size="w-14 h-14" textSize="text-lg" ring={false} />
        </span>
        <div className="relative min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-or-300">Feuille de pointage</p>
          <h1 className="text-xl font-semibold text-white leading-tight truncate">{e.name}</h1>
          <p className="text-sm text-white/70 truncate">{e.fonction} · {e.id}</p>
        </div>
      </div>

      {/* Barre période : navigation + sélecteur */}
      <div className="card p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setRef((r) => decaler(periode, r, -1))} className="w-9 h-9 grid place-items-center rounded-lg border border-border text-muted hover:text-ink hover:bg-surface-2 transition-colors" aria-label="Période précédente"><Icon name="chevron_left" className="text-[20px]" /></button>
          <p className="text-sm font-semibold text-ink min-w-[190px] text-center capitalize">{labelPeriode(periode, ref)}</p>
          <button onClick={() => setRef((r) => decaler(periode, r, 1))} className="w-9 h-9 grid place-items-center rounded-lg border border-border text-muted hover:text-ink hover:bg-surface-2 transition-colors" aria-label="Période suivante"><Icon name="chevron_right" className="text-[20px]" /></button>
          <button onClick={() => { const d = new Date(); d.setHours(0, 0, 0, 0); setRef(d); }} className="ml-1 px-2.5 h-9 rounded-lg border border-border text-xs font-medium text-muted hover:text-ink hover:bg-surface-2 transition-colors">Aujourd'hui</button>
        </div>
        <div className="inline-flex p-1 rounded-xl bg-surface-2 border border-border gap-1">
          {PERIODES.map((p) => (
            <button key={p} onClick={() => setPeriode(p)} aria-pressed={periode === p} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${periode === p ? "bg-surface text-brand-700 shadow-sm" : "text-muted hover:text-texte"}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div className="card overflow-hidden">
        {periode === "Année"
          ? <SyntheseAnnee annee={annee} vide={!chargePointages && pointages.length === 0} />
          : <TableJours rows={pointages} loading={chargePointages} onJour={ouvrir} />}
      </div>

      <PointageJourModal employeId={e._id} jour={jourEdit} onClose={() => setJourEdit(null)} />
    </div>
  );
}
