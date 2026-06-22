import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import Button from "../components/ui/Button.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import { FilterSelect } from "../components/ui/Input.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { apiGet } from "../lib/api.js";
import { mapEmploye } from "../lib/mappers.js";

const photoDe = (id) => `https://i.pravatar.cc/160?u=${encodeURIComponent(id)}`;
const STATUTS = ["Présent", "Retard", "Absent", "Congé"];
const TONE_TXT = { Présent: "text-emerald-600", Retard: "text-amber-600", Absent: "text-rose-600", Congé: "text-sky-600" };
const PCT_INIT = { Présent: 100, Retard: 90, Absent: 0, Congé: 0 };
const MOIS_AB = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MOIS_LONG = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const PERIODES = ["Jour", "Semaine", "Mois", "Année"];
const MOIS_COURANT = new Date().getMonth(); // mois de référence pour le filtre « Mois »
const champTime =
  "w-[5rem] rounded-lg bg-canvas border border-border px-2 py-1 text-sm font-mono tabular-nums text-texte outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15";

// Statut API (enum) -> libellé attendu par le JSX.
const STATUT_API = { present: "Présent", retard: "Retard", absent: "Absent", conge: "Congé" };
// DATETIME 'YYYY-MM-DD HH:MM:SS' -> 'HH:MM' ; '--:--' si absent.
const heure = (dt) => (dt ? String(dt).slice(11, 16) : "--:--");
// minutes -> 'Xh MM' ; '—' si rien.
const dureeHm = (min) => (min && min > 0 ? `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}` : "—");

// Pointage API -> ligne attendue par le JSX (mêmes champs que le mock).
function mapPointage(p) {
  const statut = STATUT_API[p.statut] || "Absent";
  const d = p.date ? new Date(p.date + "T00:00:00") : null;
  return {
    mois: d ? d.getMonth() : MOIS_COURANT,
    date: d ? `${d.getDate()} ${MOIS_AB[d.getMonth()]}` : "—",
    arrivee: heure(p.heure_entree),
    depart: heure(p.heure_sortie),
    temps: dureeHm(p.temps_present_minutes),
    statut,
    pourcentage: PCT_INIT[statut] ?? 100,
  };
}

const tranche = (p, tous) =>
  p === "Jour" ? tous.slice(-1) : p === "Semaine" ? tous.slice(-5) : p === "Mois" ? tous.filter((j) => j.mois === MOIS_COURANT) : [];

// Feuille de pointage d'UN agent — éditable, filtrable par période.
export default function Pointages() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useUI();

  const [e, setE] = useState(null);
  const [tous, setTous] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    setChargement(true);
    setErreur(null);
    apiGet("/api/pointages")
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        // L'agent est identifié par son matricule OU son id numérique dans l'URL.
        const sien = rows.filter((p) => String(p.employe_id) === String(id) || String(p.matricule) === String(id));
        const base = sien[0] || {};
        // En-tête agent via mapEmploye (champs absents -> valeurs neutres, rien ne casse).
        setE(mapEmploye({
          matricule: base.matricule ?? id,
          id: base.employe_id ?? null,
          name: base.name ?? "",
          poste_libelle: base.poste_libelle ?? "",
          departement_nom: base.departement_nom ?? "",
          statut: base.statut_employe ?? null,
          today: base,
        }));
        setTous(sien.map(mapPointage));
      })
      .catch((err) => setErreur(err.message || "Erreur de chargement"))
      .finally(() => setChargement(false));
  }, [id]);

  const annee = useMemo(() => {
    const parMois = {};
    tous.forEach((j) => { (parMois[j.mois] ||= []).push(j); });
    return Object.keys(parMois).map((m) => {
      const arr = parMois[m];
      const compter = (s) => arr.filter((j) => j.statut === s).length;
      return {
        mois: Number(m), nom: MOIS_LONG[m], jours: arr.length,
        presents: compter("Présent") + compter("Retard"), retards: compter("Retard"),
        absents: compter("Absent"), conges: compter("Congé"),
        moy: Math.round(arr.reduce((s, j) => s + j.pourcentage, 0) / arr.length),
      };
    });
  }, [tous]);

  const [periode, setPeriode] = useState("Semaine");
  const [rows, setRows] = useState([]);
  useEffect(() => { if (periode !== "Année") setRows(tranche(periode, tous)); }, [periode, tous]);

  if (chargement) {
    return (
      <div className="card py-16 text-center max-w-lg mx-auto">
        <Icon name="progress_activity" className="text-brand-600 text-[40px] animate-spin" />
        <p className="mt-2 text-sm text-muted">Chargement des pointages…</p>
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="card py-16 text-center max-w-lg mx-auto">
        <Icon name="error" className="text-rose-500 text-[40px]" />
        <p className="mt-2 text-sm text-muted">{erreur}</p>
        <button onClick={() => navigate("/")} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">
          <Icon name="arrow_back" className="text-[18px]" /> Retour au tableau de bord
        </button>
      </div>
    );
  }

  if (!e) {
    return (
      <div className="card py-16 text-center max-w-lg mx-auto">
        <Icon name="person_off" className="text-faint text-[40px]" />
        <p className="mt-2 text-sm text-muted">Agent introuvable ({id}).</p>
        <button onClick={() => navigate("/")} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">
          <Icon name="arrow_back" className="text-[18px]" /> Retour au tableau de bord
        </button>
      </div>
    );
  }

  const maj = (i, champ, val) => setRows((list) => list.map((r, idx) => (idx === i ? { ...r, [champ]: val } : r)));
  const majPct = (i, val) => maj(i, "pourcentage", Math.max(0, Math.min(100, Number(val) || 0)));
  const enregistrer = () => toast(`Pointages de ${e.name} enregistrés.`, "success");

  const moyenne = periode === "Année"
    ? (tous.length ? Math.round(tous.reduce((s, j) => s + j.pourcentage, 0) / tous.length) : 0)
    : (rows.length ? Math.round(rows.reduce((s, r) => s + r.pourcentage, 0) / rows.length) : 0);

  return (
    <div className="space-y-4 pb-10">
      <button
        onClick={() => navigate(-1)}
        className="group inline-flex items-center gap-1.5 h-9 pl-2 pr-3.5 rounded-full bg-surface border border-border text-sm font-medium text-muted hover:text-ink hover:border-border-strong hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        <Icon name="arrow_back" className="text-[18px] group-hover:-translate-x-0.5 transition-transform" /> Retour
      </button>

      {/* En-tête agent (vert) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-600 p-5 shadow-card flex items-center gap-4 flex-wrap">
        <span className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-white/5" aria-hidden="true" />
        <span className="relative rounded-full ring-2 ring-or-400/80 ring-offset-2 ring-offset-brand-700 shrink-0">
          <Avatar src={photoDe(id)} name={e.name} size="w-14 h-14" textSize="text-lg" ring={false} />
        </span>
        <div className="relative min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-or-300">Feuille de pointage</p>
          <h1 className="text-xl font-semibold text-white leading-tight truncate">{e.name}</h1>
          <p className="text-sm text-white/70 truncate">{e.fonction} · {e.id}</p>
        </div>
        <div className="relative flex items-center gap-2 shrink-0">
          <div className="text-right mr-1 hidden sm:block">
            <p className="text-2xl font-bold text-white tabular-nums leading-none">{moyenne}%</p>
            <p className="text-[11px] text-white/60">travail moyen · {periode.toLowerCase()}</p>
          </div>
          <Button variant="primary" icon="save" onClick={enregistrer}>Enregistrer</Button>
        </div>
      </div>

      {/* Tableau */}
      <div className="card overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted inline-flex items-center gap-1.5">
            <Icon name="edit_calendar" className="text-brand-600 text-[18px]" />
            {periode === "Année" ? "Synthèse mensuelle — lecture seule." : "Modifiez librement les pointages — réservé à l'administrateur."}
          </p>
          {/* Filtre de période */}
          <div className="inline-flex p-1 rounded-xl bg-surface-2 border border-border gap-1">
            {PERIODES.map((p) => (
              <button
                key={p}
                onClick={() => setPeriode(p)}
                aria-pressed={periode === p}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:shadow-focus ${periode === p ? "bg-surface text-brand-700 shadow-sm" : "text-muted hover:text-texte"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {periode === "Année" ? (
          /* ---- Synthèse mensuelle (lecture seule) ---- */
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs text-subtle border-b border-border">
                  <th className="px-5 py-3 font-medium">Mois</th>
                  <th className="px-3 py-3 font-medium">Jours ouvrés</th>
                  <th className="px-3 py-3 font-medium">Présences</th>
                  <th className="px-3 py-3 font-medium">Retards</th>
                  <th className="px-3 py-3 font-medium">Absences / congés</th>
                  <th className="px-5 py-3 font-medium">Travail moyen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {annee.map((m) => (
                  <tr key={m.mois} className="hover:bg-surface-2/50">
                    <td className="px-5 py-3 font-medium text-texte whitespace-nowrap">{m.nom}</td>
                    <td className="px-3 py-3 text-muted tabular-nums">{m.jours}</td>
                    <td className="px-3 py-3 tabular-nums"><span className="text-emerald-600 font-medium">{m.presents}</span></td>
                    <td className="px-3 py-3 tabular-nums"><span className="text-amber-600 font-medium">{m.retards}</span></td>
                    <td className="px-3 py-3 tabular-nums text-muted">{m.absents} / {m.conges}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums text-texte font-medium w-9">{m.moy}%</span>
                        <span className="hidden md:block w-24 h-1.5 rounded-full bg-surface-2 overflow-hidden" aria-hidden="true">
                          <span className="block h-full rounded-full bg-brand-500" style={{ width: `${m.moy}%` }} />
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ---- Détail jour par jour (éditable) ---- */
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-sm min-w-[660px]">
              <thead>
                <tr className="text-left text-xs text-subtle border-b border-border">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Arrivée</th>
                  <th className="px-3 py-3 font-medium">Départ</th>
                  <th className="px-3 py-3 font-medium">Heures</th>
                  <th className="px-3 py-3 font-medium">Travail</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-surface-2/50">
                    <td className="px-5 py-2.5 font-medium text-texte whitespace-nowrap">{r.date}</td>
                    <td className="px-3 py-2.5"><input value={r.arrivee} onChange={(ev) => maj(i, "arrivee", ev.target.value)} placeholder="--:--" className={champTime} aria-label={`Arrivée ${r.date}`} /></td>
                    <td className="px-3 py-2.5"><input value={r.depart} onChange={(ev) => maj(i, "depart", ev.target.value)} placeholder="--:--" className={champTime} aria-label={`Départ ${r.date}`} /></td>
                    <td className="px-3 py-2.5"><input value={r.temps} onChange={(ev) => maj(i, "temps", ev.target.value)} placeholder="—" className={`${champTime} w-[4.5rem]`} aria-label={`Heures ${r.date}`} /></td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <input type="number" min="0" max="100" value={r.pourcentage} onChange={(ev) => majPct(i, ev.target.value)} className="w-16 rounded-lg bg-canvas border border-border px-2 py-1 text-sm tabular-nums text-texte outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15" aria-label={`Pourcentage de travail ${r.date}`} />
                        <span className="hidden md:block w-16 h-1.5 rounded-full bg-surface-2 overflow-hidden" aria-hidden="true">
                          <span className="block h-full rounded-full bg-brand-500" style={{ width: `${r.pourcentage}%` }} />
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5">
                      <FilterSelect
                        value={r.statut}
                        onChange={(ev) => maj(i, "statut", ev.target.value)}
                        className={`rounded-lg bg-canvas border border-border pl-2 py-1 font-medium focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 ${TONE_TXT[r.statut] ?? "text-texte"}`}
                        aria-label={`Statut ${r.date}`}
                      >
                        {STATUTS.map((s) => (
                          <option key={s} value={s} className="text-texte">{s}</option>
                        ))}
                      </FilterSelect>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-muted">Aucun pointage sur cette période.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-3.5 border-t border-border flex items-center justify-between gap-3">
          <p className="text-[11px] text-faint flex items-center gap-1.5"><Icon name="lock" className="text-[14px]" /> Modifications réservées à l'administrateur.</p>
          {periode !== "Année" && <Button variant="primary" icon="save" onClick={enregistrer}>Enregistrer les corrections</Button>}
        </div>
      </div>
    </div>
  );
}
