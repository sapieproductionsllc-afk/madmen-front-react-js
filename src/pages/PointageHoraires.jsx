import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import Icon from "../components/ui/Icon.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import { Select } from "../components/ui/Input.jsx";
import CalendrierPresence from "../components/ui/CalendrierPresence.jsx";
import ConfigHoraire from "../components/horaire/ConfigHoraire.jsx";
import RecapMensuel from "../components/horaire/RecapMensuel.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { apiGet } from "../lib/api.js";
import { mapEmploye } from "../lib/mappers.js";

const MOIS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

// API status (PRESENT/LATE/ABSENT) -> état attendu par CalendrierPresence.
const ETAT_API = { PRESENT: "Présent", LATE: "Retard", ABSENT: "Absent" };

// "HH:MM:SS" | "AAAA-MM-JJ HH:MM:SS" -> "HH:MM" (ou null).
function hhmm(v) {
  if (!v) return null;
  const m = String(v).match(/(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : null;
}

// Liste des 6 derniers mois (AAAA-MM) pour le sélecteur.
function derniersMois(n = 6) {
  const out = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const mois = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
    out.push({ value: mois, label: `${MOIS_FR[x.getMonth()]} ${x.getFullYear()}` });
  }
  return out;
}

// Reconstruit la grille mensuelle attendue par CalendrierPresence depuis le bulletin
// de paie (même logique que ProfilEmploye, le moteur ne change pas).
function construireCalendrier(paie) {
  const mois = paie?.mois ?? null;
  const planning = paie?.planning ?? {};
  const detailParDate = Object.fromEntries((paie?.detail ?? []).map((d) => [d.date, d]));

  let annee, moisNum;
  if (mois) {
    const [a, mn] = mois.split("-").map(Number);
    annee = a;
    moisNum = mn;
  } else {
    const now = new Date();
    annee = now.getFullYear();
    moisNum = now.getMonth() + 1;
  }

  const nbJours = new Date(annee, moisNum, 0).getDate();
  const today = new Date();
  const estMoisCourant = today.getFullYear() === annee && today.getMonth() + 1 === moisNum;
  const todayJour = estMoisCourant ? today.getDate() : -1;

  const jours = [];
  for (let d = 1; d <= nbJours; d++) {
    const date = `${annee}-${String(moisNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const jsDow = new Date(annee, moisNum - 1, d).getDay();
    const iso = jsDow === 0 ? 7 : jsDow;
    const dow = iso - 1;
    const weekend = iso >= 6;

    const det = detailParDate[date] ?? null;
    const ferie = det?.status === "FERIE" ? det.libelle ?? "Jour férié" : null;
    const conge = det?.status === "CONGE" || det?.status === "CONGE_PAYE";
    const cours = !!planning[String(iso)] && !ferie;
    const futur = todayJour >= 0 && d > todayJour;

    let etat = null;
    let arrivee = null;
    let depart = null;
    let retardMin = 0;
    let passages = []; // tous les pointages du jour : [{ type:'entree'|'sortie', heure:'HH:MM' }]
    let event = conge ? "Congé" : null;

    if (cours && !conge) {
      if (det && ETAT_API[det.status]) {
        etat = ETAT_API[det.status];
        if (det.status === "PRESENT" || det.status === "LATE") {
          arrivee = hhmm(det.check_in);
          depart = hhmm(det.check_out);
          passages = Array.isArray(det.passages) ? det.passages : [];
          retardMin = Math.round((Number(det.late_seconds) || 0) / 60);
        }
      } else if (futur) {
        etat = "Prévu";
      } else {
        etat = "Prévu";
      }
    }

    jours.push({ jour: d, dow, weekend, ferie, event, cours, futur, today: d === todayJour, etat, arrivee, depart, passages, retardMin });
  }

  return {
    mois: mois ? `${MOIS_FR[moisNum - 1]} ${annee}` : "—",
    today: todayJour,
    jours,
  };
}

// Ligne employé dans la liste de gauche.
function LigneEmploye({ e, actif, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
        actif ? "bg-brand-50 ring-1 ring-brand-200" : "hover:bg-surface-2"
      }`}
    >
      <Avatar name={e.name} size="w-9 h-9" />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium truncate ${actif ? "text-brand-700" : "text-texte"}`}>{e.name}</p>
        <p className="text-xs text-muted truncate">{e.fonction} · {e.matricule}</p>
      </div>
      {actif && <Icon name="chevron_right" className="text-brand-500 text-[18px] shrink-0" />}
    </button>
  );
}

export default function PointageHoraires() {
  const { matricule } = useParams();
  const [searchParams] = useSearchParams();
  const solo = searchParams.get("solo") === "1"; // ouvert depuis la fiche d'un employé : vue mono-agent (sans liste)
  const navigate = useNavigate();
  const { toast, dataVersion } = useUI();

  const [employes, setEmployes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [q, setQ] = useState("");
  const [selId, setSelId] = useState(null); // matricule sélectionné
  const [mois, setMois] = useState(() => new Date().toISOString().slice(0, 7));

  const [paie, setPaie] = useState(null);
  const [paieChargement, setPaieChargement] = useState(false);
  const [tick, setTick] = useState(0); // force le rechargement après save horaire

  const moisOptions = useMemo(() => derniersMois(12), []);

  // Charge la liste des employés (résolution matricule -> id numérique).
  useEffect(() => {
    let actif = true;
    if (!employes.length) setChargement(true); // spinner seulement au 1er chargement ; refresh = silencieux
    setErreur(null);
    apiGet("/api/employes")
      .then((data) => {
        if (!actif) return;
        const liste = (Array.isArray(data) ? data : []).map(mapEmploye);
        setEmployes(liste);
        // Sélection initiale : param d'URL (matricule) sinon premier de la liste.
        const init = matricule && liste.find((x) => x.matricule === matricule) ? matricule : liste[0]?.matricule ?? null;
        setSelId(init);
      })
      .catch((e) => actif && setErreur(e?.message || "Erreur de chargement"))
      .finally(() => actif && setChargement(false));
    return () => {
      actif = false;
    };
    // Le roster (résolution matricule -> id) est une liste quasi-statique : on ne la
    // recharge PAS à chaque `dataVersion`. Les données vivantes (paie/calendrier) sont
    // rafraîchies par l'effet ci-dessous, qui lui dépend bien de `dataVersion`.
  }, [matricule]);

  const selectionne = employes.find((e) => e.matricule === selId) || null;
  const empNumId = selectionne?._id ?? null;

  // Charge le bulletin de paie (calendrier + récap) à chaque changement d'employé/mois/save.
  useEffect(() => {
    if (!empNumId) {
      setPaie(null);
      return;
    }
    let actif = true;
    if (!paie) setPaieChargement(true); // calendrier : spinner au 1er chargement ; refresh = silencieux
    apiGet(`/api/employes/${empNumId}/paie?mois=${mois}`)
      .then((d) => actif && setPaie(d || null))
      .catch(() => actif && setPaie(null))
      .finally(() => actif && setPaieChargement(false));
    return () => {
      actif = false;
    };
  }, [empNumId, mois, tick, dataVersion]);

  const liste = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return employes;
    return employes.filter(
      (e) =>
        e.name.toLowerCase().includes(t) ||
        e.matricule.toLowerCase().includes(t) ||
        e.fonction.toLowerCase().includes(t) ||
        e.department.toLowerCase().includes(t)
    );
  }, [q, employes]);

  const cal = useMemo(() => (paie ? construireCalendrier(paie) : null), [paie]);
  const moisLabel = moisOptions.find((m) => m.value === mois)?.label ?? mois;

  const choisir = (m) => {
    setSelId(m);
    // Met à jour l'URL pour le partage/deep-link (matricule en param).
    navigate(`/pointage-horaires/${m}`, { replace: true });
  };

  return (
    <div className="space-y-5 pb-12">
      {solo && (
        <button
          onClick={() => navigate(`/employes/${matricule}/details`)}
          className="group inline-flex items-center gap-1.5 h-9 pl-2 pr-3.5 rounded-full bg-surface border border-border text-sm font-medium text-muted hover:text-ink hover:border-border-strong hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          <Icon name="arrow_back" className="text-[18px] group-hover:-translate-x-0.5 transition-transform" />
          Retour à la fiche
        </button>
      )}
      <PageHeader
        title="Pointage & Horaires"
        subtitle="Configurez les horaires de chaque agent, suivez la présence et vérifiez le récap avant la paie."
      />

      <div className={`grid grid-cols-1 gap-5 items-start ${solo ? "" : "lg:grid-cols-[320px_1fr]"}`}>
        {/* Colonne gauche : liste des employés (masquée en vue mono-agent depuis une fiche) */}
        {!solo && (
        <div className="card p-3 lg:sticky lg:top-4">
          <div className="px-1 pb-3">
            <SearchInput value={q} onChange={setQ} placeholder="Rechercher un agent…" />
          </div>
          {chargement ? (
            <div className="py-12 text-center">
              <Icon name="progress_activity" className="text-faint text-[32px] animate-spin" />
              <p className="mt-2 text-sm text-muted">Chargement…</p>
            </div>
          ) : erreur ? (
            <div className="py-12 text-center">
              <Icon name="error" className="text-rose-500 text-[32px]" />
              <p className="mt-2 text-sm text-muted">{erreur}</p>
            </div>
          ) : liste.length === 0 ? (
            <div className="py-12 text-center">
              <Icon name="search_off" className="text-faint text-[32px]" />
              <p className="mt-2 text-sm text-muted">Aucun agent.</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-[70vh] overflow-y-auto scroll-thin pr-0.5">
              {liste.map((e) => (
                <LigneEmploye key={e.matricule} e={e} actif={e.matricule === selId} onClick={() => choisir(e.matricule)} />
              ))}
            </div>
          )}
        </div>
        )}

        {/* Colonne droite : config + calendrier + récap */}
        <div className="space-y-5">
          {!selectionne ? (
            <div className="card py-20 text-center">
              <Icon name="person_search" className="text-faint text-[40px]" />
              <p className="mt-2 text-sm text-muted">Sélectionnez un agent pour configurer son horaire.</p>
            </div>
          ) : (
            <>
              {/* En-tête agent + sélecteur de mois */}
              <div className="card p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={selectionne.name} size="w-11 h-11" textSize="text-sm" />
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-ink truncate">{selectionne.name}</p>
                    <p className="text-xs text-muted truncate">{selectionne.fonction} · {selectionne.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="calendar_month" className="text-muted text-[18px]" />
                  <Select value={mois} onChange={(e) => setMois(e.target.value)} className="w-44">
                    {moisOptions.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* CONFIG HORAIRE (le cœur) */}
              <ConfigHoraire employeId={empNumId} onSaved={() => setTick((t) => t + 1)} />

              {/* CALENDRIER de présence */}
              {paieChargement ? (
                <div className="card py-16 text-center">
                  <Icon name="progress_activity" className="text-faint text-[32px] animate-spin" />
                  <p className="mt-2 text-sm text-muted">Chargement du calendrier…</p>
                </div>
              ) : cal ? (
                <CalendrierPresence
                  cal={cal}
                  onJour={(j) => {
                    const base = j.ferie ?? j.event ?? (j.etat === "Prévu" ? "à pointer" : j.etat) ?? "repos";
                    const horaires = j.arrivee ? ` · arrivée ${j.arrivee}${j.depart ? ` → départ ${j.depart}` : ""}` : "";
                    toast(`${j.jour} ${cal.mois.split(" ")[0].toLowerCase()} — ${base}${horaires}`, "info");
                  }}
                />
              ) : (
                <div className="card py-12 text-center">
                  <Icon name="event_busy" className="text-faint text-[32px]" />
                  <p className="mt-2 text-sm text-muted">Pas de données de présence pour ce mois.</p>
                </div>
              )}

              {/* RÉCAP MENSUEL avant validation paie */}
              {!paieChargement && (
                <RecapMensuel
                  paie={paie}
                  moisLabel={moisLabel}
                  onValiderPaie={() => navigate(`/employes/${selectionne.matricule}/paiement`)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
