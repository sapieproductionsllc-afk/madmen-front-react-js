import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import Modal from "../components/ui/Modal.jsx";
import { Input, Select, Field } from "../components/ui/Input.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { apiGet } from "../lib/api.js";

// Devise officielle de l'app : FCFA. Format « 1 300 FCFA » (repris de datasets.js, ce n'est pas une donnée).
const fcfa = (n) => Math.round(n).toLocaleString("fr-FR") + " FCFA";

const photoDe = (id) => `https://i.pravatar.cc/80?u=${encodeURIComponent(id)}`;

const AUJ_ISO = "2026-06-21";
const AUJ = new Date(AUJ_ISO + "T00:00:00");
const isoMoins = (n) => { const d = new Date(AUJ); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const PERIODE_API = AUJ_ISO.slice(0, 7); // "YYYY-MM" interrogé côté API

const CATEGORIES_DEP = ["Loyer", "Charges", "Fournitures", "Transport", "Maintenance", "Autre"];

const PERIODES = [
  { key: "Semaine", label: "Semaine", min: isoMoins(7), prevMin: isoMoins(14) },
  { key: "Mois", label: "Mois", min: "2026-06-01", prevMin: "2026-05-01" },
  { key: "Année", label: "Année", min: "2026-01-01", prevMin: "2025-01-01" },
];
const META_TYPE = {
  Salaire: { icon: "payments", bg: "bg-sky-50 text-sky-600", txt: "text-sky-700" },
  Avance: { icon: "savings", bg: "bg-amber-50 text-amber-600", txt: "text-amber-600" },
  Dépense: { icon: "receipt_long", bg: "bg-rose-50 text-rose-600", txt: "text-rose-600" },
};
const COLS = "items-center gap-3 grid-cols-[2rem_minmax(0,1fr)_8rem] sm:grid-cols-[2rem_minmax(0,1fr)_7rem_8rem_6rem_5rem]";
const focusable = "focus-visible:outline-none focus-visible:shadow-focus";

// ---------------------------------------------------------------------------
// MAPPING API -> forme attendue par le JSX (champs identiques aux anciens mocks).
// ---------------------------------------------------------------------------

// Statut de paie API -> libellé attendu par le JSX (StatusPill + workflow de paiement).
// L'API /api/paie n'expose pas d'état « payé » par employé : on part de « En attente »
// (neutre) pour laisser le workflow de paiement fonctionner ; « En retard » si la paie
// n'est pas calculable côté API.
function statutPaie(p) {
  if (p && p.paie_calculable === false) return "En retard";
  return "En attente";
}

// Une ligne de /api/paie -> { e:{id,name,fonction}, f:{base,primes,avances,retenues,net,status} }.
// `fonction`/poste n'est pas renvoyé par /api/paie -> valeur neutre "" (rien ne casse).
function mapLignePaie(p) {
  const emp = p.employe || {};
  const id = emp.matricule ?? String(emp.id ?? "");
  const name = (`${emp.prenom ?? ""} ${emp.nom ?? ""}`).trim() || emp.matricule || "—";
  const f = {
    base: Number(p.salaire_brut) || 0,
    primes: Number(p.primes) || 0,
    avances: Number(p.avances) || 0,
    retenues: Number(p.retenues) || 0,
    net: Number(p.salaire_net) || 0,
    status: statutPaie(p),
  };
  return { e: { id, name, fonction: "" }, f };
}

// Une dépense de /api/depenses -> mouvement « Dépense » attendu par MvtRow.
function mapDepenseMvt(d) {
  return {
    id: `DEP-${d.id}`,
    date: String(d.date).slice(0, 10),
    type: "Dépense",
    libelle: d.libelle,
    categorie: d.categorie,
    montant: Number(d.montant) || 0,
  };
}

function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function MvtRow({ m }) {
  const meta = META_TYPE[m.type];
  return (
    <div className="flex items-center gap-3 py-3">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}><Icon name={meta.icon} className="text-[18px]" filled /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink truncate">{m.libelle}</p>
        <p className="text-xs text-muted">{m.type}{m.categorie ? ` · ${m.categorie}` : ""}</p>
      </div>
      <span className="text-xs text-subtle tabular-nums shrink-0 hidden sm:block w-16 text-right">{fmtDate(m.date)}</span>
      <span className={`text-sm font-semibold tabular-nums shrink-0 w-32 text-right ${meta.txt}`}>− {fcfa(m.montant)}</span>
    </div>
  );
}

export default function Finance() {
  const { confirm, toast } = useUI();
  const [periode, setPeriode] = useState("Mois");

  // --- Données réelles de l'API (remplacent les mocks de src/data) ---
  const [lignesPaie, setLignesPaie] = useState([]);
  const [mouvementsBase, setMouvementsBase] = useState([]);
  const [synthese, setSynthese] = useState(null); // { total_courant, total_precedent, delta }
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const [statuts, setStatuts] = useState({});
  const [annulables, setAnnulables] = useState({});
  const [ajouts, setAjouts] = useState([]);
  const [selection, setSelection] = useState(() => new Set());
  const [q, setQ] = useState("");

  const [detail, setDetail] = useState(null); // "total" | "Salaire" | "Avance" | "Dépense"
  const [payOuverte, setPayOuverte] = useState(false);
  const [depOuverte, setDepOuverte] = useState(false);
  const [dLib, setDLib] = useState("");
  const [dCat, setDCat] = useState(CATEGORIES_DEP[0]);
  const [dMontant, setDMontant] = useState("");
  const [dDate, setDDate] = useState(AUJ_ISO);

  useEffect(() => {
    setChargement(true);
    setErreur(null);
    Promise.all([
      apiGet(`/api/paie?mois=${PERIODE_API}`),
      apiGet(`/api/depenses?periode=${PERIODE_API}`),
      apiGet(`/api/finance/synthese?periode=${PERIODE_API}`),
    ])
      .then(([paie, depenses, synth]) => {
        const lignes = (paie?.paie ?? []).map(mapLignePaie);
        setLignesPaie(lignes);
        // Statut initial de paie par employé (workflow de paiement).
        setStatuts(Object.fromEntries(lignes.map((l) => [l.e.id, l.f.status])));

        // Mouvements du journal : dépenses société (réelles) + salaires/avances dérivés
        // des bulletins de paie, datés dans le mois courant pour le filtre « Mois ».
        const deps = (Array.isArray(depenses) ? depenses : []).map(mapDepenseMvt);
        const salaires = lignes.map((l, i) => ({
          id: `SAL-${l.e.id}`, date: isoMoins(2 + (i % 6)), type: "Salaire",
          libelle: l.e.name, employeId: l.e.id, montant: l.f.net,
        }));
        const avances = lignes.filter((l) => l.f.avances > 0).map((l, i) => ({
          id: `AVA-${l.e.id}`, date: isoMoins(5 + (i % 10)), type: "Avance",
          libelle: l.e.name, employeId: l.e.id, montant: l.f.avances,
        }));
        setMouvementsBase([...salaires, ...avances, ...deps]);

        setSynthese(synth ?? null);
      })
      .catch((err) => setErreur(err?.message || "Erreur de chargement"))
      .finally(() => setChargement(false));
  }, []);

  const minPeriode = PERIODES.find((p) => p.key === periode).min;
  const mvtsPeriode = useMemo(() => [...mouvementsBase, ...ajouts].filter((m) => m.date >= minPeriode).sort((a, b) => (a.date < b.date ? 1 : -1)), [mouvementsBase, ajouts, minPeriode]);
  const totals = useMemo(() => {
    const par = (t) => mvtsPeriode.filter((m) => m.type === t).reduce((s, m) => s + m.montant, 0);
    const salaires = par("Salaire"), avances = par("Avance"), depenses = par("Dépense");
    return { salaires, avances, depenses, total: salaires + avances + depenses };
  }, [mvtsPeriode]);
  const prevTotals = useMemo(() => {
    const cfg = PERIODES.find((p) => p.key === periode);
    const prev = [...mouvementsBase, ...ajouts].filter((m) => m.date >= cfg.prevMin && m.date < cfg.min);
    const par = (t) => prev.filter((m) => m.type === t).reduce((s, m) => s + m.montant, 0);
    const salaires = par("Salaire"), avances = par("Avance"), depenses = par("Dépense");
    return { salaires, avances, depenses, total: salaires + avances + depenses };
  }, [mouvementsBase, ajouts, periode]);
  const deltaPct = (cur, prev) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null);
  // Delta global « Total dépensé » : fourni par /api/finance/synthese pour le mois courant.
  const deltaTotal = periode === "Mois" && synthese && Number(synthese.total_precedent) > 0
    ? Math.round(((Number(synthese.total_courant) - Number(synthese.total_precedent)) / Number(synthese.total_precedent)) * 100)
    : deltaPct(totals.total, prevTotals.total);

  const nonPayes = lignesPaie.filter((l) => statuts[l.e.id] !== "Payé");
  const payes = lignesPaie.filter((l) => statuts[l.e.id] === "Payé");
  const totalAPayer = nonPayes.reduce((s, l) => s + l.f.net, 0);
  const totalPaye = payes.reduce((s, l) => s + l.f.net, 0);
  const selValides = [...selection].filter((id) => statuts[id] !== "Payé");
  const totalSelection = lignesPaie.filter((l) => selValides.includes(l.e.id)).reduce((s, l) => s + l.f.net, 0);

  const listePaie = useMemo(() => {
    const t = q.trim().toLowerCase();
    return lignesPaie.filter((l) => !t || l.e.name.toLowerCase().includes(t) || l.e.fonction.toLowerCase().includes(t));
  }, [q, lignesPaie]);

  const marquerPayes = (ids) => {
    if (!ids.length) return;
    setAnnulables((a) => { const n = { ...a }; ids.forEach((id) => { if (!(id in n)) n[id] = statuts[id]; }); return n; });
    setStatuts((prev) => { const n = { ...prev }; ids.forEach((id) => (n[id] = "Payé")); return n; });
    setAjouts((prev) => [...ids.map((id) => { const l = lignesPaie.find((x) => x.e.id === id); return { id: `SAL-${id}-${ids.length}-${Object.keys(annulables).length}`, date: AUJ_ISO, type: "Salaire", libelle: l.e.name, employeId: id, montant: l.f.net }; }), ...prev]);
    setSelection(new Set());
  };
  const payerTous = () => {
    const ids = nonPayes.map((l) => l.e.id);
    if (!ids.length) return toast("Tout le personnel est déjà payé.", "info");
    confirm({ title: "Payer tout le personnel ?", message: `${ids.length} agents seront payés en une fois, pour un total de ${fcfa(totalAPayer)}.`, confirmLabel: "Tout payer", onConfirm: () => { marquerPayes(ids); toast(`${ids.length} paiements validés (${fcfa(totalAPayer)})`, "success"); } });
  };
  const payerSelection = () => {
    if (!selValides.length) return;
    confirm({ title: "Payer la sélection ?", message: `${selValides.length} agent(s) seront payés, pour un total de ${fcfa(totalSelection)}.`, confirmLabel: "Payer la sélection", onConfirm: () => { marquerPayes(selValides); toast(`${selValides.length} paiement(s) validé(s)`, "success"); } });
  };
  const payerUn = (l) => confirm({ title: "Valider ce paiement ?", message: `${l.e.name} — ${fcfa(l.f.net)} sera marqué comme payé.`, confirmLabel: "Valider", onConfirm: () => { marquerPayes([l.e.id]); toast(`Paiement de ${l.e.name} validé`, "success"); } });
  const annuler = (l) => confirm({ title: "Annuler ce paiement ?", message: `Le paiement de ${l.e.name} (${fcfa(l.f.net)}) sera annulé et retiré du journal.`, confirmLabel: "Annuler le paiement", danger: true, onConfirm: () => {
    setStatuts((prev) => ({ ...prev, [l.e.id]: annulables[l.e.id] ?? "En attente" }));
    setAjouts((prev) => prev.filter((m) => !(m.type === "Salaire" && m.employeId === l.e.id)));
    setAnnulables((a) => { const n = { ...a }; delete n[l.e.id]; return n; });
    toast(`Paiement de ${l.e.name} annulé`, "info");
  } });

  const toggleSel = (id) => setSelection((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const idsSelectionnables = listePaie.filter((l) => statuts[l.e.id] !== "Payé").map((l) => l.e.id);
  const toutCoche = idsSelectionnables.length > 0 && idsSelectionnables.every((id) => selection.has(id));
  const partiel = !toutCoche && idsSelectionnables.some((id) => selection.has(id));
  const toutSelectionner = () => setSelection(() => (toutCoche ? new Set() : new Set(idsSelectionnables)));

  const ajouterDepense = () => {
    const montant = Number(dMontant);
    if (!dLib.trim()) return toast("Renseignez le libellé", "info");
    if (!dDate) return toast("Renseignez la date", "info");
    if (dDate > AUJ_ISO) return toast("La date ne peut pas être dans le futur", "info");
    if (!montant || montant <= 0) return toast("Montant invalide", "info");
    setAjouts((prev) => [{ id: `DEP-${dLib}-${montant}-${prev.length}`, date: dDate, type: "Dépense", libelle: dLib.trim(), categorie: dCat, montant }, ...prev]);
    toast(`Dépense « ${dLib.trim()} » enregistrée`, "success");
    setDepOuverte(false); setDLib(""); setDCat(CATEGORIES_DEP[0]); setDMontant(""); setDDate(AUJ_ISO);
  };

  const KPIS = [
    { key: "total", label: "Total dépensé", montant: totals.total, delta: deltaTotal, icon: "account_balance_wallet", bg: "bg-or-100 text-or-700", tone: "or" },
    { key: "Salaire", label: "Salaires versés", montant: totals.salaires, delta: deltaPct(totals.salaires, prevTotals.salaires), icon: "payments", bg: "bg-sky-50 text-sky-600", tone: "sky" },
    { key: "Avance", label: "Avances", montant: totals.avances, delta: deltaPct(totals.avances, prevTotals.avances), icon: "savings", bg: "bg-amber-50 text-amber-600", tone: "amber" },
    { key: "Dépense", label: "Dépenses société", montant: totals.depenses, delta: deltaPct(totals.depenses, prevTotals.depenses), icon: "receipt_long", bg: "bg-rose-50 text-rose-600", tone: "rose" },
  ];
  const libPrec = periode === "Année" ? "an précédent" : periode === "Semaine" ? "semaine préc." : "mois préc.";
  const detailKpi = detail ? KPIS.find((k) => k.key === detail) : null;
  const detailMvts = detail ? (detail === "total" ? mvtsPeriode : mvtsPeriode.filter((m) => m.type === detail)) : [];

  if (chargement) {
    return (
      <div className="card py-16 text-center">
        <Icon name="progress_activity" className="text-faint text-[40px] animate-spin" />
        <p className="mt-2 text-sm text-muted">Chargement des finances…</p>
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="card py-16 text-center">
        <Icon name="error" className="text-faint text-[40px]" />
        <p className="mt-2 text-sm text-muted">{erreur}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      <PageHeader title="Finance & Paie" subtitle="Vue d'ensemble des finances et paiement du personnel.">
        <Button variant="secondary" icon="receipt_long" onClick={() => setDepOuverte(true)}>Ajouter une dépense</Button>
        <Button variant="primary" icon="payments" onClick={() => setPayOuverte(true)}>Payer le personnel</Button>
      </PageHeader>

      {/* Période */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border overflow-hidden">
          {PERIODES.map((p) => (
            <button key={p.key} onClick={() => setPeriode(p.key)} aria-pressed={periode === p.key} className={`px-4 py-1.5 text-sm font-medium transition-colors ${focusable} ${periode === p.key ? "bg-brand-600 text-canvas" : "bg-surface text-muted hover:text-texte"}`}>{p.label}</button>
          ))}
        </div>
        <p className="text-xs text-muted">Cliquez une carte pour voir le détail.</p>
      </div>

      {/* KPIs cliquables */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map((k) => (
          <button key={k.key} onClick={() => setDetail(k.key)} title="Voir le détail" className={`card card-hover p-4 text-left flex flex-col gap-3 group ${focusable}`}>
            <div className="flex items-center justify-between gap-2">
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${k.bg}`}><Icon name={k.icon} className="text-[22px]" filled /></span>
              {k.delta !== null ? (
                <span title={`${Math.abs(k.delta)} % vs ${libPrec}`} className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${k.delta > 0 ? "text-rose-600 bg-rose-50" : k.delta < 0 ? "text-emerald-600 bg-emerald-50" : "text-muted bg-surface-2"}`}>
                  <Icon name={k.delta > 0 ? "north_east" : k.delta < 0 ? "south_east" : "remove"} className="text-[12px]" /> {Math.abs(k.delta)} %
                </span>
              ) : (
                <Icon name="chevron_right" className="text-[20px] text-faint group-hover:text-muted transition-colors" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xl font-semibold text-ink tabular-nums leading-tight truncate">{fcfa(k.montant)}</p>
              <p className="text-xs text-muted mt-0.5">{k.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Carte paiement (accès à la liste via bouton) */}
      <div className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="w-12 h-12 rounded-2xl bg-or-100 text-or-700 flex items-center justify-center shrink-0"><Icon name="groups" className="text-[26px]" filled /></span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink">Paiement du personnel</h3>
          <p className="text-xs text-muted mt-0.5">{payes.length} payés · {nonPayes.length} en attente</p>
        </div>
        <div className="sm:ml-auto flex items-center gap-4 sm:gap-6">
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-subtle">À payer</p>
            <p className="text-xl font-semibold tabular-nums text-or-700 leading-tight">{fcfa(totalAPayer)}</p>
          </div>
          <Button variant="primary" icon="payments" onClick={() => setPayOuverte(true)} disabled={nonPayes.length === 0}>Payer le personnel</Button>
        </div>
      </div>

      {/* Derniers mouvements (aperçu) */}
      <section className="card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Icon name="receipt_long" className="text-[20px]" filled /></span>
          <div className="mr-auto min-w-0">
            <h3 className="text-sm font-semibold text-ink">Derniers mouvements</h3>
            <p className="text-xs text-muted">{mvtsPeriode.length} opération{mvtsPeriode.length > 1 ? "s" : ""} · {periode.toLowerCase()}</p>
          </div>
          <Button variant="ghost" size="sm" iconRight="chevron_right" onClick={() => setDetail("total")} disabled={mvtsPeriode.length === 0}>Voir tout</Button>
        </div>
        {mvtsPeriode.length === 0 ? (
          <div className="py-12 text-center"><Icon name="receipt_long" className="text-faint text-[34px]" /><p className="mt-2 text-sm text-muted">Aucun mouvement sur cette période.</p></div>
        ) : (
          <div className="px-4 sm:px-5 divide-y divide-border">
            {mvtsPeriode.slice(0, 6).map((m) => <MvtRow key={m.id} m={m} />)}
          </div>
        )}
      </section>

      {/* ---------- MODALE DÉTAIL KPI ---------- */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detailKpi?.label} subtitle={detailKpi ? `${fcfa(detailKpi.montant)} · ${periode.toLowerCase()} · ${detailMvts.length} opération${detailMvts.length > 1 ? "s" : ""}` : ""} icon={detailKpi?.icon} iconTone={detailKpi?.tone} size="lg">
        {detailMvts.length === 0 ? (
          <div className="py-10 text-center"><Icon name="receipt_long" className="text-faint text-[34px]" /><p className="mt-2 text-sm text-muted">Aucun mouvement sur cette période.</p></div>
        ) : (
          <div className="divide-y divide-border -my-1">
            {detailMvts.map((m) => <MvtRow key={m.id} m={m} />)}
          </div>
        )}
      </Modal>

      {/* ---------- MODALE PAIEMENT GROUPÉ ---------- */}
      <Modal
        open={payOuverte}
        onClose={() => setPayOuverte(false)}
        title="Paiement du personnel"
        subtitle={`${payes.length} payés (${fcfa(totalPaye)}) · ${nonPayes.length} en attente (${fcfa(totalAPayer)})`}
        icon="payments"
        iconTone="or"
        size="xl"
        footer={<>
          <span className="mr-auto text-sm text-muted self-center hidden sm:block">À payer : <span className="font-semibold text-or-700">{fcfa(totalAPayer)}</span></span>
          {selValides.length > 0 && <Button variant="secondary" icon="check" onClick={payerSelection}>Payer la sélection ({selValides.length})</Button>}
          <Button variant="primary" icon="payments" onClick={payerTous} disabled={nonPayes.length === 0}>Tout payer</Button>
        </>}
      >
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher un agent…" className="w-full sm:w-72 mb-3" />

        <div role="row" className={`hidden sm:grid ${COLS} pb-2 text-[11px] font-semibold uppercase tracking-wide text-subtle border-b border-border`}>
          <label className="flex items-center"><input type="checkbox" checked={toutCoche} ref={(el) => { if (el) el.indeterminate = partiel; }} aria-checked={toutCoche ? "true" : partiel ? "mixed" : "false"} onChange={toutSelectionner} className={`w-4 h-4 accent-brand-600 ${focusable}`} aria-label="Tout sélectionner" /></label>
          <span role="columnheader">Agent</span>
          <span role="columnheader" className="text-right">Avance</span>
          <span role="columnheader" className="text-right">Net à payer</span>
          <span role="columnheader" className="text-center">Statut</span>
          <span role="columnheader" className="text-right">Action</span>
        </div>

        <div role="table" aria-label="Paiements du personnel" className="divide-y divide-border">
          {listePaie.map((l) => {
            const st = statuts[l.e.id];
            const paye = st === "Payé";
            const tone = paye ? "emerald" : st === "En retard" ? "rose" : "amber";
            return (
              <div key={l.e.id} role="row" className={`grid ${COLS} py-2.5`}>
                <label className="flex items-center"><input type="checkbox" checked={selection.has(l.e.id)} disabled={paye} onChange={() => toggleSel(l.e.id)} className={`w-4 h-4 accent-brand-600 disabled:opacity-30 ${focusable}`} aria-label={`Sélectionner ${l.e.name}`} /></label>
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={photoDe(l.e.id)} name={l.e.name} size="w-9 h-9" />
                  <div className="min-w-0"><p className="text-sm font-medium text-ink truncate">{l.e.name}</p><p className="text-xs text-muted truncate">{l.e.fonction}</p></div>
                </div>
                <span className={`hidden sm:block text-right text-sm tabular-nums ${l.f.avances > 0 ? "text-amber-600" : "text-faint"}`} aria-label={l.f.avances > 0 ? `Avance ${fcfa(l.f.avances)}` : "Aucune avance"}>{l.f.avances > 0 ? `− ${fcfa(l.f.avances)}` : "—"}</span>
                <span className="text-right text-sm font-semibold tabular-nums text-or-700" aria-label={`Net à payer ${fcfa(l.f.net)}`}>{fcfa(l.f.net)}</span>
                <span className="hidden sm:flex justify-center"><StatusPill label={st} tone={tone} /></span>
                <div className="hidden sm:flex justify-end">
                  {paye ? (
                    annulables[l.e.id] ? <button onClick={() => annuler(l)} className={`text-xs text-muted hover:text-rose-600 underline-offset-2 hover:underline ${focusable}`}>Annuler</button> : <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><Icon name="task_alt" className="text-[16px]" filled /> Payé</span>
                  ) : (
                    <Button size="sm" variant="primary" onClick={() => payerUn(l)}>Payer</Button>
                  )}
                </div>
              </div>
            );
          })}
          {listePaie.length === 0 && <p className="py-8 text-center text-sm text-muted">Aucun agent trouvé.</p>}
        </div>
      </Modal>

      {/* ---------- MODALE AJOUTER UNE DÉPENSE ---------- */}
      <Modal
        open={depOuverte}
        onClose={() => setDepOuverte(false)}
        title="Ajouter une dépense"
        subtitle="Dépense liée à la société (hors paie)."
        icon="receipt_long"
        iconTone="rose"
        footer={<><Button variant="ghost" onClick={() => setDepOuverte(false)}>Annuler</Button><Button variant="primary" icon="add" onClick={ajouterDepense}>Enregistrer</Button></>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Libellé" className="sm:col-span-2"><Input value={dLib} onChange={(e) => setDLib(e.target.value)} placeholder="ex. Loyer des bureaux — juin" /></Field>
          <Field label="Catégorie"><Select value={dCat} onChange={(e) => setDCat(e.target.value)}>{CATEGORIES_DEP.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
          <Field label="Date"><Input type="date" max={AUJ_ISO} value={dDate} onChange={(e) => setDDate(e.target.value)} /></Field>
          <Field label="Montant (FCFA)" className="sm:col-span-2"><Input type="number" min="0" value={dMontant} onChange={(e) => setDMontant(e.target.value)} placeholder="ex. 150000" /></Field>
        </div>
      </Modal>
    </div>
  );
}
