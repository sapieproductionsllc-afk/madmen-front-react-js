import { useMemo, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import { Input, Select, Field, champClass } from "../components/ui/Input.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { demandes, employes } from "../data/datasets.js";

const photoDe = (id) => `https://i.pravatar.cc/120?u=${encodeURIComponent(id)}`;
const empById = Object.fromEntries(employes.map((e) => [e.id, e]));

const ICONE_TYPE = { "Congé": "event", Permission: "schedule", "Avance sur salaire": "payments", Avance: "payments", Absence: "report", Autre: "description" };
const TONE_STATUT = { "En attente": "amber", "Approuvée": "emerald", "Refusée": "rose" };
const STATUTS_MOCK = ["En attente", "En attente", "Approuvée", "En attente", "Refusée"];
const TYPES = ["Congé", "Permission", "Avance sur salaire", "Autre"];

const demandesInitiales = demandes.map((d, i) => ({
  id: d.id, employeId: d.employeId, type: d.type, periode: d.periode, motif: d.motif,
  statut: STATUTS_MOCK[i % STATUTS_MOCK.length], soumisLe: d.soumisLe,
}));

const CATS = [
  { key: "En attente", label: "À traiter" },
  { key: "Toutes", label: "Toutes" },
  { key: "Approuvée", label: "Approuvées" },
  { key: "Refusée", label: "Refusées" },
];

export default function Demandes({ embedded = false }) {
  const { toast } = useUI();
  const [liste, setListe] = useState(demandesInitiales);
  const [cat, setCat] = useState("En attente");
  const [agent, setAgent] = useState(employes[0]?.id ?? "");
  const [type, setType] = useState("Congé");
  const [periode, setPeriode] = useState("");
  const [motif, setMotif] = useState("");
  const [compteur, setCompteur] = useState(301);

  const compte = (k) => (k === "Toutes" ? liste.length : liste.filter((d) => d.statut === k).length);
  const filtre = useMemo(() => (cat === "Toutes" ? liste : liste.filter((d) => d.statut === cat)), [liste, cat]);

  const decider = (id, statut) => {
    setListe((prev) => prev.map((d) => (d.id === id ? { ...d, statut } : d)));
    if (statut === "En attente") return toast("Demande remise en attente.", "info");
    toast(`Demande ${statut === "Approuvée" ? "approuvée" : "refusée"}.`, statut === "Approuvée" ? "success" : "info");
  };

  function handleSubmit(e) {
    e.preventDefault();
    if (!agent) return toast("Sélectionnez un agent", "info");
    if (!motif.trim()) return toast("Veuillez préciser le motif", "info");
    setListe((prev) => [{ id: `DM-${compteur}`, employeId: agent, type, periode: periode.trim() || "—", motif: motif.trim(), statut: "En attente", soumisLe: "Aujourd'hui" }, ...prev]);
    setCompteur((n) => n + 1);
    toast("Demande enregistrée (en attente)", "success");
    setType("Congé"); setPeriode(""); setMotif("");
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
          </div>
        </div>
      </div>
    </div>
  );
}
