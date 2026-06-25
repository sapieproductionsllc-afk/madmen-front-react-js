import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import { Input, Select, Field, champClass } from "../components/ui/Input.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { apiGet, apiPost } from "../lib/api.js";
import { mapEmploye } from "../lib/mappers.js";

const photoDe = (id) => `https://i.pravatar.cc/120?u=${encodeURIComponent(id)}`;

const ICONE_TYPE = { "Congé": "event", Permission: "schedule", "Avance sur salaire": "payments", Avance: "payments", Absence: "report", Autre: "description" };
const TONE_STATUT = { "En attente": "amber", "Approuvée": "emerald", "Refusée": "rose" };
const TYPES = ["Congé", "Permission", "Avance sur salaire", "Autre"];

// Label FR du formulaire -> 'type' attendu par l'API (DemandeController::TYPES).
const TYPE_API = {
  "Congé": "conge",
  Permission: "permission",
  "Avance sur salaire": "avance",
  Avance: "avance",
  Absence: "absence",
  Autre: "autre",
};

// Décision front -> corps API attendu par POST /api/demandes/{id}/decision.
const DECISION_API = { "Approuvée": "approuve", "Refusée": "refuse" };

// Extrait les dates YYYY-MM-DD présentes dans le champ libre « Période / Date ».
const datesDuTexte = (s) => (String(s || "").match(/\d{4}-\d{2}-\d{2}/g) || []);

// Traduit le statut renvoyé par l'API vers les libellés attendus par le front.
const STATUT_API = {
  en_attente: "En attente", "en attente": "En attente", attente: "En attente", pending: "En attente",
  approuve: "Approuvée", approuvee: "Approuvée", "approuvée": "Approuvée", approved: "Approuvée", valide: "Approuvée", validee: "Approuvée",
  refuse: "Refusée", refusee: "Refusée", "refusée": "Refusée", rejected: "Refusée", rejete: "Refusée", rejetee: "Refusée",
};
const mapStatut = (s) => STATUT_API[String(s ?? "").toLowerCase().trim()] || "En attente";

// Compose une période lisible à partir des dates API (le mock avait un champ libre `periode`).
const mapPeriode = (d) => {
  const a = d.date_debut || "";
  const b = d.date_fin || "";
  if (a && b && a !== b) return `${a} → ${b}`;
  return a || b || "—";
};

// Demande API -> forme attendue par le JSX (champs identiques au mock).
// Type API -> libellé FR affiché (icône/badge). Inverse partiel de TYPE_API.
const TYPE_LABEL = {
  conge: "Congé", permission: "Permission", avance: "Avance sur salaire",
  absence: "Absence", formation: "Autre", attestation: "Autre", autre: "Autre",
};

function mapDemande(d) {
  return {
    id: d.reference || d.id, // identifiant métier affiché (ex. #0001) ; fallback id numérique
    _id: d.id, // id numérique : requis par /api/demandes/{id}/decision
    employeId: d.matricule || "", // lookup vers l'employé (indexé par matricule)
    type: TYPE_LABEL[d.type] || "Autre",
    periode: mapPeriode(d),
    motif: d.objet || "", // `objet` API = motif affiché
    statut: mapStatut(d.statut),
    soumisLe: d.soumisLe || "", // non garanti par l'API : valeur neutre
  };
}

export default function Demandes({ embedded = false }) {
  const { toast } = useUI();
  const [employes, setEmployes] = useState([]);
  const [liste, setListe] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [cat, setCat] = useState("En attente");
  const [agent, setAgent] = useState("");
  const [type, setType] = useState("Congé");
  const [periode, setPeriode] = useState("");
  const [motif, setMotif] = useState("");
  const [compteur, setCompteur] = useState(301);

  // Données RÉELLES depuis l'API (remplace les mocks de src/data).
  useEffect(() => {
    Promise.all([apiGet("/api/demandes"), apiGet("/api/employes")])
      .then(([dem, emp]) => {
        const listeEmp = (Array.isArray(emp) ? emp : []).map(mapEmploye);
        setEmployes(listeEmp);
        setAgent((a) => a || listeEmp[0]?.id || "");
        setListe((Array.isArray(dem) ? dem : []).map(mapDemande));
      })
      .catch((e) => setErreur(e.message || "Erreur de chargement"))
      .finally(() => setChargement(false));
  }, []);

  const empById = useMemo(() => Object.fromEntries(employes.map((e) => [e.id, e])), [employes]);

  const CATS = [
    { key: "En attente", label: "À traiter" },
    { key: "Toutes", label: "Toutes" },
    { key: "Approuvée", label: "Approuvées" },
    { key: "Refusée", label: "Refusées" },
  ];

  const compte = (k) => (k === "Toutes" ? liste.length : liste.filter((d) => d.statut === k).length);
  const filtre = useMemo(() => (cat === "Toutes" ? liste : liste.filter((d) => d.statut === cat)), [liste, cat]);

  const decider = async (id, statut) => {
    const cible = liste.find((d) => d.id === id);
    const ancien = cible?.statut ?? "En attente";

    // Optimistic UI : on bascule tout de suite.
    setListe((prev) => prev.map((d) => (d.id === id ? { ...d, statut } : d)));

    // Retour « En attente » : non supporté par l'API (pas d'endpoint) -> reste local.
    if (statut === "En attente") return toast("Demande remise en attente.", "info");

    const decision = DECISION_API[statut];
    const idApi = cible?._id; // id numérique requis par l'API
    if (!decision || idApi == null) {
      // Pas d'id serveur (ligne provisoire pas encore persistée) : on ne peut PAS
      // enregistrer la décision -> rollback + message honnête, jamais de faux succès.
      setListe((prev) => prev.map((d) => (d.id === id ? { ...d, statut: ancien } : d)));
      return toast("Demande non encore enregistrée — réessayez dans un instant.", "info");
    }
    try {
      await apiPost(`/api/demandes/${idApi}/decision`, { decision });
      toast(`Demande ${statut === "Approuvée" ? "approuvée" : "refusée"}.`, statut === "Approuvée" ? "success" : "info");
    } catch (err) {
      // Rollback : on rétablit l'ancien statut et on signale l'échec.
      setListe((prev) => prev.map((d) => (d.id === id ? { ...d, statut: ancien } : d)));
      toast(err?.message || "Échec de l'enregistrement de la décision.", "error");
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!agent) return toast("Sélectionnez un agent", "info");
    if (!motif.trim()) return toast("Veuillez préciser le motif", "info");

    const emp = empById[agent];
    if (!emp?._id) return toast("Agent introuvable", "error");

    // Construit le corps attendu par POST /api/demandes (création au nom d'un agent).
    const typeApi = TYPE_API[type] || "autre";
    const body = { employe_id: emp._id, type: typeApi, objet: motif.trim() };
    const [d1, d2] = datesDuTexte(periode);
    if (d1) body.date_debut = d1;
    if (d2 || d1) body.date_fin = d2 || d1; // une seule date -> début = fin
    if (typeApi === "avance") {
      const m = parseFloat(String(periode).replace(/[^\d.,]/g, "").replace(",", "."));
      if (!Number.isNaN(m) && m > 0) body.montant = m;
    }

    // Ligne provisoire (optimistic) en tête de liste.
    const tempId = `tmp-${compteur}`;
    const provisoire = { id: tempId, _id: null, employeId: agent, type, periode: periode.trim() || "—", motif: motif.trim(), statut: "En attente", soumisLe: "Aujourd'hui" };
    setListe((prev) => [provisoire, ...prev]);
    setCompteur((n) => n + 1);
    setType("Congé"); setPeriode(""); setMotif("");

    try {
      const cree = await apiPost("/api/demandes", body);
      // La réponse de création n'inclut pas le matricule (pas de JOIN) :
      // on le réinjecte pour conserver l'avatar/nom de l'agent dans la carte.
      const ligne = { ...mapDemande(cree), employeId: mapDemande(cree).employeId || agent };
      // Remplace la ligne provisoire par la demande réellement créée.
      setListe((prev) => prev.map((d) => (d.id === tempId ? ligne : d)));
      toast("Demande enregistrée (en attente)", "success");
    } catch (err) {
      // Rollback : on retire la ligne provisoire et on signale l'échec.
      setListe((prev) => prev.filter((d) => d.id !== tempId));
      toast(err?.message || "Échec de l'enregistrement de la demande.", "error");
    }
  }

  return (
    <div className={embedded ? "" : "space-y-5 pb-12"}>
      {!embedded && <PageHeader title="Demandes" subtitle="Approuvez ou refusez les demandes du personnel." />}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
        {/* FORMULAIRE — saisir au nom d'un agent */}
        <form onSubmit={handleSubmit} className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3.5">
            <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Icon name="post_add" className="text-[18px]" filled />
            </span>
            <h3 className="text-sm font-semibold text-ink">Saisir une demande pour un agent</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Agent" className="sm:col-span-2">
              <Select value={agent} onChange={(e) => setAgent(e.target.value)}>
                {employes.map((e) => <option key={e.id} value={e.id}>{e.name} · {e.fonction}</option>)}
              </Select>
            </Field>
            <Field label="Type"><Select value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field>
            <Field label="Période / Date"><Input value={periode} onChange={(e) => setPeriode(e.target.value)} placeholder="ex. 24 → 28 juin 2026" /></Field>
            <Field label="Motif" className="sm:col-span-2"><textarea className={champClass} rows={3} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Précisez le motif..." /></Field>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit" variant="primary" icon="send">Soumettre la demande</Button>
          </div>
        </form>

        {/* FILE D'APPROBATION */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto scroll-thin pb-1">
            {CATS.map((c) => (
              <button
                key={c.key}
                onClick={() => setCat(c.key)}
                aria-pressed={cat === c.key}
                aria-label={`${c.label}, ${compte(c.key)} demandes`}
                className={`shrink-0 inline-flex items-center gap-2 pl-3 pr-2 h-9 rounded-full text-sm whitespace-nowrap border transition-colors ${cat === c.key ? "bg-brand-600 text-canvas border-brand-600" : "bg-surface text-muted border-border hover:border-border-strong hover:text-texte"}`}
              >
                {c.label}
                <span className={`text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded-full ${cat === c.key ? "bg-canvas/20 text-canvas" : "bg-surface-2 text-texte"}`}>{compte(c.key)}</span>
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {chargement ? (
              <div className="card py-12 text-center">
                <Icon name="progress_activity" className="text-faint text-[36px] animate-spin" />
                <p className="mt-2 text-sm text-muted">Chargement des demandes…</p>
              </div>
            ) : erreur ? (
              <div className="card py-12 text-center">
                <Icon name="error" className="text-rose-500 text-[36px]" />
                <p className="mt-2 text-sm text-muted">{erreur}</p>
              </div>
            ) : (
              <>
                {filtre.map((d) => {
                  const ag = d.employeId ? empById[d.employeId] : null;
                  return (
                    <div key={d.id} className="card p-4 flex items-start gap-3">
                      {ag ? (
                        <Avatar src={photoDe(ag.id)} name={ag.name} size="w-10 h-10" />
                      ) : (
                        <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Icon name={ICONE_TYPE[d.type] ?? "description"} className="text-[20px]" filled /></span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-ink truncate">{ag?.name ?? "Demande interne"}</p>
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted bg-surface-2 border border-border rounded-full px-2 py-0.5">
                            <Icon name={ICONE_TYPE[d.type] ?? "description"} className="text-[13px]" /> {d.type}
                          </span>
                        </div>
                        <p className="text-sm text-muted mt-0.5 inline-flex items-center gap-1"><Icon name="calendar_month" className="text-[14px] text-faint" /> {d.periode}</p>
                        <p className="text-xs text-subtle mt-0.5 line-clamp-2">{d.motif}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <StatusPill label={d.statut} tone={TONE_STATUT[d.statut] ?? "slate"} />
                        {d.statut === "En attente" ? (
                          <div className="flex gap-1.5">
                            <Button size="sm" variant="success-soft" icon="check" onClick={() => decider(d.id, "Approuvée")}>Approuver</Button>
                            <Button size="sm" variant="danger-soft" icon="close" onClick={() => decider(d.id, "Refusée")}>Refuser</Button>
                          </div>
                        ) : (
                          <button onClick={() => decider(d.id, "En attente")} className="text-xs text-muted hover:text-texte underline-offset-2 hover:underline">Revenir en attente</button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filtre.length === 0 && (
                  <div className="card py-12 text-center">
                    <Icon name="inbox" className="text-faint text-[36px]" />
                    <p className="mt-2 text-sm text-muted">Aucune demande dans cette catégorie.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
