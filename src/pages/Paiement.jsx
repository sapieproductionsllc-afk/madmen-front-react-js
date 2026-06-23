import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import Button from "../components/ui/Button.jsx";
import Table from "../components/ui/Table.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import BandeauAgent from "../components/ui/BandeauAgent.jsx";
import SalaireFixe from "../components/salaire/SalaireFixe.jsx";
import { Input, Field } from "../components/ui/Input.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { fcfa } from "../data/datasets.js";
import { apiGet } from "../lib/api.js";
import { mapEmploye } from "../lib/mappers.js";

const champMontant =
  "w-36 rounded-lg bg-canvas border border-border px-3 py-1.5 text-sm text-right font-mono tabular-nums text-texte outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15";

// "YYYY-MM" -> "Juin 2026" (libellé de mois affiché dans le JSX). Repli : valeur brute.
const MOIS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
function moisLabel(mois) {
  if (typeof mois !== "string") return "";
  const [a, m] = mois.split("-");
  const i = Number(m) - 1;
  return MOIS_FR[i] ? `${MOIS_FR[i]} ${a}` : mois;
}

// Bulletin de paie API -> forme attendue par le JSX (identique à l'ancien `paieDetail`).
// L'API renvoie déjà des montants en devise réelle (pas de conversion).
function mapPaie(bulletin) {
  if (!bulletin) return { base: 0, primes: 0, retenues: 0, avances: 0, net: 0, status: "En attente", moisLabel: "" };
  const base = Number(bulletin.salaire_brut) || 0;
  const primes = Number(bulletin.primes) || 0;
  // Retenues affichées = retenues manuelles + déductions automatiques (retard + absence).
  const retenues =
    (Number(bulletin.retenues) || 0) +
    (Number(bulletin.deduction_retard) || 0) +
    (Number(bulletin.deduction_absence) || 0);
  const avances = Number(bulletin.avances) || 0;
  // L'API /api/paie n'expose pas de statut « payé » ici -> valeur neutre par défaut.
  const status = bulletin.status === "Payé" ? "Payé" : "En attente";
  return {
    base,
    primes,
    retenues,
    avances,
    net: Number(bulletin.salaire_net) || 0,
    status,
    moisLabel: moisLabel(bulletin.mois),
  };
}

function CardHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
        <Icon name={icon} className="text-[18px]" filled />
      </span>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
    </div>
  );
}

export default function Paiement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useUI();

  // Données RÉELLES depuis l'API (remplacent les mocks de src/data).
  const [e, setE] = useState(null);
  const [base, setBase] = useState(null);
  const [paiements, setPaiements] = useState([]);
  const [live, setLive] = useState("Absent"); // l'API /api/paie n'expose pas de statut temps réel
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [empId, setEmpId] = useState(null); // id NUMÉRIQUE (pour les endpoints salaire)
  const [tick, setTick] = useState(0); // recharge le bulletin après modif du salaire fixe

  // Composition du salaire (modifiable) + avances en cours (dette) + statut.
  const [compo, setCompo] = useState({ base: 0, primes: 0, retenues: 0 });
  const [avances, setAvances] = useState(0);
  const [statut, setStatut] = useState("En attente");
  const [mouvement, setMouvement] = useState("");

  useEffect(() => {
    let actif = true;
    setChargement(true);
    setErreur(null);

    Promise.all([
      apiGet("/api/employes"),
      apiGet("/api/paie"),
      apiGet("/api/prets").catch(() => null), // avances : optionnel si l'endpoint est absent
    ])
      .then(([employesData, paieData, pretsData]) => {
        if (!actif) return;

        const agentApi = (Array.isArray(employesData) ? employesData : []).find((x) => x.matricule === id);
        const agent = agentApi ? mapEmploye(agentApi) : null;

        const liste = Array.isArray(paieData?.paie) ? paieData.paie : [];
        const bulletin = liste.find((b) => b?.employe?.matricule === id) || null;
        const paie = mapPaie(bulletin);

        // Avances = somme des mensualités des prêts en cours de l'employé (repli : bulletin).
        let totalAvances = paie.avances;
        if (Array.isArray(pretsData) && agentApi) {
          const empId = agentApi.id;
          const somme = pretsData
            .filter((p) => p && p.employe_id === empId && p.statut === "en_cours")
            .reduce((s, p) => s + (Number(p.mensualite) || 0), 0);
          if (pretsData.some((p) => p && p.employe_id === empId)) totalAvances = somme;
        }

        // Historique des paiements : l'API n'expose pas l'historique multi-mois ici,
        // on présente le bulletin du mois courant (vide si pas de paie).
        const histo = bulletin
          ? [{ mois: paie.moisLabel || "Mois en cours", net: paie.net, status: paie.status }]
          : [];

        setEmpId(agentApi?.id ?? null);
        setE(agent);
        setBase(paie);
        setPaiements(histo);
        setCompo({ base: paie.base, primes: paie.primes, retenues: paie.retenues });
        setAvances(totalAvances);
        setStatut(paie.status === "Payé" ? "Payé" : "En attente");
      })
      .catch((err) => {
        if (actif) setErreur(err?.message || "Erreur de chargement");
      })
      .finally(() => {
        if (actif) setChargement(false);
      });

    return () => {
      actif = false;
    };
  }, [id, tick]);

  if (chargement) {
    return (
      <div className="card py-16 text-center max-w-lg mx-auto">
        <Icon name="progress_activity" className="text-faint text-[40px] animate-spin" />
        <p className="mt-2 text-sm text-muted">Chargement de la paie…</p>
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

  const salaireMois = compo.base + compo.primes - compo.retenues;
  const net = Math.max(0, salaireMois - avances);

  const majCompo = (champ, val) => setCompo((c) => ({ ...c, [champ]: Math.max(0, Number(val) || 0) }));

  const donnerAvance = () => {
    const m = Number(mouvement);
    if (!m || m <= 0) return toast("Saisissez un montant valide.", "info");
    setAvances((a) => a + m);
    setMouvement("");
    toast(`Avance de ${fcfa(m)} versée à ${e.name}. Sera déduite du salaire.`, "success");
  };
  const reglerDette = () => {
    const m = Number(mouvement);
    if (!m || m <= 0) return toast("Saisissez un montant valide.", "info");
    if (!avances) return toast("Aucune dette en cours.", "info");
    setAvances((a) => Math.max(0, a - m));
    setMouvement("");
    toast(`Dette réduite de ${fcfa(m)}.`, "success");
  };
  const solder = () => {
    if (!avances) return toast("Aucune dette en cours.", "info");
    setAvances(0);
    toast("Dette entièrement soldée.", "success");
  };
  const payer = () => {
    setStatut("Payé");
    toast(`Net de ${fcfa(net)} versé à ${e.name}.`, "success");
  };

  const lignes = [
    { k: "base", label: "Salaire de base", signe: "", tone: "text-texte" },
    { k: "primes", label: "Primes", signe: "+", tone: "text-emerald-600" },
    { k: "retenues", label: "Retenues", signe: "−", tone: "text-rose-600" },
  ];

  const paieCols = [
    { key: "mois", label: "Mois", render: (r) => <span className="text-texte font-medium">{r.mois}</span> },
    { key: "net", label: "Net versé", align: "right", render: (r) => <span className="font-mono tabular-nums text-ink font-medium">{fcfa(r.net)}</span> },
    { key: "status", label: "Statut", align: "right", render: (r) => <StatusPill label={r.status} tone={r.status === "Payé" ? "emerald" : "amber"} /> },
  ];

  return (
    <div className="space-y-4 pb-10">
      <button
        onClick={() => navigate(-1)}
        className="group inline-flex items-center gap-1.5 h-9 pl-2 pr-3.5 rounded-full bg-surface border border-border text-sm font-medium text-muted hover:text-ink hover:border-border-strong hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        <Icon name="arrow_back" className="text-[18px] group-hover:-translate-x-0.5 transition-transform" />
        Retour
      </button>

      <BandeauAgent
        e={e}
        live={live}
        onPaiements={() => navigate("/finance")}
        onPlus={() => navigate(`/employes/${id}/details`)}
        plusLabel="Dossier détaillé"
        plusIcon="chevron_right"
      />

      {/* Net à verser — point focal + action de paiement */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-600 p-6 shadow-card flex items-center justify-between gap-4 flex-wrap">
        <span className="absolute -right-10 -top-12 w-44 h-44 rounded-full bg-white/5" aria-hidden="true" />
        <div className="relative">
          <p className="text-[11px] uppercase tracking-wide text-or-300 font-semibold">Net à verser</p>
          <p className="text-3xl font-bold text-white font-mono tabular-nums mt-1 leading-none">{fcfa(net)}</p>
          <p className="text-white/70 text-sm mt-1.5">{e.name} · Mois en cours</p>
        </div>
        <div className="relative flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statut === "Payé" ? "bg-emerald-400/20 border-emerald-300/30 text-emerald-100" : "bg-white/10 border-white/20 text-white/90"}`}>
            <Icon name={statut === "Payé" ? "check_circle" : "schedule"} className="text-[14px]" filled />
            {statut}
          </span>
          <Button variant="primary" icon="check_circle" onClick={payer} disabled={statut === "Payé"}>
            {statut === "Payé" ? "Déjà payé" : "Marquer comme payé"}
          </Button>
        </div>
      </div>

      {/* Salaire fixe (historique daté) — alimente le calcul de paie */}
      {empId && <SalaireFixe employeId={empId} onChange={() => setTick((t) => t + 1)} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Composition du salaire (éditable) */}
        <div className="card p-5">
          <CardHeader icon="receipt_long" title="Composition du salaire" />
          <div className="divide-y divide-border">
            {lignes.map((l) => (
              <div key={l.k} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-sm text-muted">
                  {l.signe && <span className={`font-semibold ${l.tone}`}>{l.signe} </span>}
                  {l.label}
                </span>
                <div className="flex items-center gap-1.5">
                  <input type="number" min="0" value={compo[l.k]} onChange={(ev) => majCompo(l.k, ev.target.value)} className={champMontant} aria-label={l.label} />
                  <span className="text-xs text-subtle w-8">FCFA</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 pt-3.5 mt-1 border-t border-border">
            <span className="text-sm font-semibold text-ink">Salaire du mois</span>
            <span className="text-lg font-bold font-mono tabular-nums text-ink">{fcfa(salaireMois)}</span>
          </div>
        </div>

        {/* Avances & dettes */}
        <div className="card p-5">
          <CardHeader icon="account_balance_wallet" title="Avances & dettes" />

          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-amber-700/80">Avances en cours (déduites du net)</p>
              <p className="text-xl font-bold font-mono tabular-nums text-amber-700 mt-0.5">{fcfa(avances)}</p>
            </div>
            <Icon name="account_balance_wallet" className="text-amber-500 text-[28px]" filled />
          </div>

          <div className="mt-3.5 flex items-end gap-2">
            <Field label="Montant (FCFA)" className="flex-1">
              <Input type="number" min="0" value={mouvement} onChange={(ev) => setMouvement(ev.target.value)} placeholder="ex. 50000" />
            </Field>
            <Button variant="brand" icon="add_card" onClick={donnerAvance}>Donner</Button>
            <Button variant="secondary" icon="undo" onClick={reglerDette}>Régler</Button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-[11px] text-faint flex items-center gap-1.5"><Icon name="lock" className="text-[14px]" /> Réservé à l'administrateur.</p>
            <button onClick={solder} className="text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-40" disabled={!avances}>
              Solder la dette
            </button>
          </div>
        </div>
      </div>

      {/* Historique des paiements */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Icon name="history" className="text-[18px]" filled />
          </span>
          <h3 className="text-sm font-semibold text-ink">Historique des paiements</h3>
        </div>
        <Table columns={paieCols} data={paiements} rowKey={(r) => r.mois} minWidth={420} />
      </div>
    </div>
  );
}
