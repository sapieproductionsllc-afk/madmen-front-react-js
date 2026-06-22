import { useMemo, useRef, useState, useEffect } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import { Input, Select, Field, champClass } from "../components/ui/Input.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { employes, demandes } from "../data/datasets.js";

const photoDe = (id) => `https://i.pravatar.cc/120?u=${encodeURIComponent(id)}`;
const empById = Object.fromEntries(employes.map((e) => [e.id, e]));
const collegues = employes.slice(0, 8);

const ICONE_TYPE = { "Congé": "event", Permission: "schedule", "Avance sur salaire": "payments", Avance: "payments", Absence: "report", Autre: "description" };
const TONE_STATUT = { "En attente": "amber", "Approuvée": "emerald", "Refusée": "rose" };
const STATUTS_MOCK = ["En attente", "En attente", "Approuvée", "En attente", "Refusée"];
const TYPES = ["Congé", "Permission", "Avance sur salaire", "Autre"];
const CATS = [
  { key: "En attente", label: "À traiter" },
  { key: "Toutes", label: "Toutes" },
  { key: "Approuvée", label: "Approuvées" },
  { key: "Refusée", label: "Refusées" },
];

const demandesInitiales = demandes.map((d, i) => ({
  id: d.id, employeId: d.employeId, type: d.type, periode: d.periode, motif: d.motif,
  statut: STATUTS_MOCK[i % STATUTS_MOCK.length], soumisLe: d.soumisLe,
}));

const filsSeed = {
  ALL: [
    { de: "moi", texte: "Bonjour à toutes et à tous — réunion générale vendredi à 10h en salle B2.", heure: "08:00" },
    { de: "moi", type: "document", nom: "Note_de_service_juin.pdf", taille: "182 Ko", heure: "08:01" },
  ],
  "AUR-1187": [{ de: "lui", texte: "Les copies du test d'anglais sont prêtes.", heure: "08:42" }, { de: "moi", texte: "Parfait, dépose-les au bureau RH.", heure: "08:45" }],
  "AUR-8821": [{ de: "moi", texte: "Le rapport de sécurité est validé ?", heure: "09:10" }, { de: "lui", texte: "Oui, je l'envoie d'ici une heure.", heure: "09:12" }],
  "AUR-4491": [{ de: "lui", texte: "Je suis en congé, je réponds à mon retour.", heure: "07:30" }, { de: "moi", texte: "Pas de souci, bon repos !", heure: "07:35" }],
  "AUR-1102": [{ de: "lui", texte: "Le modèle a fini d'entraîner cette nuit.", heure: "08:05" }, { de: "moi", texte: "Excellent, on présente vendredi.", heure: "08:25" }],
  "AUR-9031": [{ de: "moi", texte: "Tout va bien de ton côté ?", heure: "10:00" }, { de: "lui", texte: "Souffrante aujourd'hui, désolée.", heure: "10:12" }],
  "AUR-7720": [{ de: "lui", texte: "Les fiches de paie sont prêtes à valider.", heure: "11:02" }, { de: "moi", texte: "Je regarde cet après-midi.", heure: "11:10" }],
  "AUR-6654": [{ de: "moi", texte: "Peux-tu programmer les entretiens annuels ?", heure: "14:20" }, { de: "lui", texte: "Oui, je lance les invitations.", heure: "14:25" }],
  "AUR-3398": [{ de: "lui", texte: "Le poste WS-205 est réopérationnel.", heure: "09:40" }, { de: "moi", texte: "Merci Karim !", heure: "09:42" }],
};

export default function Communication() {
  const { toast } = useUI();
  const [sel, setSel] = useState("demandes"); // "demandes" | "ALL" | matricule
  const [recherche, setRecherche] = useState("");

  // --- Demandes ---
  const [liste, setListe] = useState(demandesInitiales);
  const [catD, setCatD] = useState("En attente");
  const [formOuvert, setFormOuvert] = useState(false);
  const [agent, setAgent] = useState(employes[0]?.id ?? "");
  const [type, setType] = useState("Congé");
  const [periode, setPeriode] = useState("");
  const [motif, setMotif] = useState("");
  const [compteur, setCompteur] = useState(301);
  const pending = liste.filter((d) => d.statut === "En attente").length;
  const compteCat = (k) => (k === "Toutes" ? liste.length : liste.filter((d) => d.statut === k).length);
  const filtreD = useMemo(() => (catD === "Toutes" ? liste : liste.filter((d) => d.statut === catD)), [liste, catD]);

  const decider = (id, statut) => {
    setListe((prev) => prev.map((d) => (d.id === id ? { ...d, statut } : d)));
    toast(statut === "En attente" ? "Demande remise en attente." : `Demande ${statut === "Approuvée" ? "approuvée" : "refusée"}.`, statut === "Approuvée" ? "success" : "info");
  };
  const soumettre = (e) => {
    e.preventDefault();
    if (!motif.trim()) return toast("Veuillez préciser le motif", "info");
    setListe((prev) => [{ id: `DM-${compteur}`, employeId: agent, type, periode: periode.trim() || "—", motif: motif.trim(), statut: "En attente", soumisLe: "Aujourd'hui" }, ...prev]);
    setCompteur((n) => n + 1);
    toast("Demande enregistrée (en attente)", "success");
    setType("Congé"); setPeriode(""); setMotif(""); setFormOuvert(false);
  };

  // --- Messagerie ---
  const [fils, setFils] = useState(filsSeed);
  const [texte, setTexte] = useState("");
  const fileRef = useRef(null);
  const finFilRef = useRef(null);
  const conv = sel === "demandes" ? null : sel === "ALL" ? { id: "ALL", name: "Tout le personnel", fonction: `${employes.length} membres`, broadcast: true } : empById[sel];
  const messages = (conv && fils[conv.id]) || [];
  const heureNow = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const ajouter = (msg) => setFils((prev) => ({ ...prev, [conv.id]: [...(prev[conv.id] || []), msg] }));
  const envoyer = () => {
    const t = texte.trim();
    if (!t || !conv) return;
    ajouter({ de: "moi", texte: t, heure: heureNow() });
    setTexte("");
    if (conv.broadcast) toast(`Message diffusé à ${employes.length} membres.`, "success");
  };
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f || !conv) return;
    ajouter({ de: "moi", type: "document", nom: f.name, taille: `${Math.max(1, Math.round(f.size / 1024))} Ko`, heure: heureNow() });
    toast(conv.broadcast ? `Document diffusé à ${employes.length} membres.` : `Document « ${f.name} » envoyé.`, "success");
    e.target.value = "";
  };

  useEffect(() => {
    finFilRef.current?.scrollIntoView({ block: "end" });
  }, [sel, messages.length]);

  const apercu = (id) => {
    const f = fils[id];
    if (!f || !f.length) return "";
    const m = f[f.length - 1];
    return (m.de === "moi" ? "Vous : " : "") + (m.type === "document" ? "📎 " + m.nom : m.texte);
  };

  const convListe = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const arr = [{ id: "ALL", name: "Tout le personnel", broadcast: true }, ...collegues];
    return q ? arr.filter((e) => e.name.toLowerCase().includes(q)) : arr;
  }, [recherche]);

  const railItem = (actif) => `w-full flex items-center gap-3 px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${actif ? "bg-brand-50" : "hover:bg-surface-2"}`;

  return (
    <div className="space-y-5 pb-2">
      <PageHeader title="Communication" subtitle="Approuvez les demandes et échangez avec le personnel." />

      <div className="card overflow-hidden h-[calc(100dvh-13rem)] min-h-[30rem] flex p-0">
        {/* RAIL GAUCHE */}
        <aside aria-label="Canaux et conversations" className={`w-72 shrink-0 border-r border-border flex-col ${sel ? "hidden md:flex" : "flex"}`}>
          {/* Canal Demandes (épinglé) */}
          <p className="kicker px-3 pt-3 pb-1 !text-subtle">Boîte RH</p>
          <button onClick={() => setSel("demandes")} aria-current={sel === "demandes" ? "true" : undefined} className={`${railItem(sel === "demandes")} border-b border-border`}>
            <span className="w-10 h-10 rounded-xl bg-or-100 text-or-700 flex items-center justify-center shrink-0"><Icon name="fact_check" className="text-[20px]" filled /></span>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-semibold text-ink">Demandes</span>
              <p className="text-xs text-muted line-clamp-1">{pending} à traiter</p>
            </div>
            {pending > 0 && <span aria-label={`${pending} demandes à traiter`} className="bg-rose-500 text-white text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full shrink-0">{pending}</span>}
          </button>

          <div className="p-3 border-b border-border">
            <SearchInput value={recherche} onChange={setRecherche} placeholder="Rechercher…" />
          </div>

          <div className="flex-1 overflow-y-auto scroll-thin">
            <p className="kicker px-3 pt-3 pb-1 !text-subtle">Messagerie</p>
            {convListe.map((e) => {
              const actif = sel === e.id;
              return (
                <button key={e.id} onClick={() => setSel(e.id)} aria-current={actif ? "true" : undefined} className={railItem(actif)}>
                  {e.broadcast ? (
                    <span className="w-10 h-10 rounded-full bg-or-100 text-or-700 flex items-center justify-center shrink-0"><Icon name="campaign" className="text-[20px]" filled /></span>
                  ) : (
                    <Avatar src={photoDe(e.id)} name={e.name} size="w-10 h-10" />
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-ink truncate block">{e.name}</span>
                    <p className="text-xs text-muted line-clamp-1">{apercu(e.id) || "—"}</p>
                  </div>
                </button>
              );
            })}
            {convListe.length === 0 && <p className="px-3 py-4 text-xs text-subtle">Aucun collègue trouvé.</p>}
          </div>
        </aside>

        {/* PANNEAU DROIT */}
        <section className="flex-1 flex flex-col min-w-0">
          {sel === "demandes" ? (
            <>
              {/* En-tête demandes */}
              <header className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0 min-h-[60px]">
                <button type="button" onClick={() => setSel(null)} className="md:hidden -ml-1 w-8 h-8 rounded-lg text-muted hover:bg-surface-2 flex items-center justify-center" aria-label="Retour"><Icon name="arrow_back" className="text-[20px]" /></button>
                <span className="w-10 h-10 rounded-xl bg-or-100 text-or-700 flex items-center justify-center shrink-0"><Icon name="fact_check" className="text-[20px]" filled /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">Demandes du personnel</p>
                  <p className="text-xs text-muted">Approuvez ou refusez les demandes</p>
                </div>
                <Button size="sm" variant="secondary" icon={formOuvert ? "close" : "add"} onClick={() => setFormOuvert((v) => !v)}>{formOuvert ? "Fermer" : "Nouvelle"}</Button>
              </header>

              {/* Filtres */}
              <div className="flex items-center gap-2 overflow-x-auto scroll-thin px-4 py-2.5 border-b border-border shrink-0">
                {CATS.map((c) => (
                  <button key={c.key} onClick={() => setCatD(c.key)} aria-pressed={catD === c.key} className={`shrink-0 inline-flex items-center gap-1.5 pl-3 pr-2 h-8 rounded-full text-xs whitespace-nowrap border transition-colors ${catD === c.key ? "bg-brand-600 text-canvas border-brand-600" : "bg-surface text-muted border-border hover:border-border-strong hover:text-texte"}`}>
                    {c.label}<span className={`text-[11px] font-semibold tabular-nums px-1.5 rounded-full ${catD === c.key ? "bg-canvas/25 font-semibold" : "bg-surface-2 text-texte"}`}>{compteCat(c.key)}</span>
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-2.5 bg-surface-2/30">
                {/* Formulaire repliable */}
                {formOuvert && (
                  <form onSubmit={soumettre} className="card p-4">
                    <p className="text-sm font-semibold text-ink mb-3">Nouvelle demande</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Agent" className="sm:col-span-2"><Select value={agent} onChange={(e) => setAgent(e.target.value)}>{employes.map((e) => <option key={e.id} value={e.id}>{e.name} · {e.fonction}</option>)}</Select></Field>
                      <Field label="Type"><Select value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field>
                      <Field label="Période / Date"><Input value={periode} onChange={(e) => setPeriode(e.target.value)} placeholder="ex. 24 → 28 juin 2026" /></Field>
                      <Field label="Motif" className="sm:col-span-2"><textarea className={champClass} rows={2} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Motif…" /></Field>
                    </div>
                    <div className="mt-3 flex justify-end"><Button type="submit" size="sm" variant="primary" icon="send">Soumettre</Button></div>
                  </form>
                )}

                {filtreD.map((d) => {
                  const ag = d.employeId ? empById[d.employeId] : null;
                  return (
                    <div key={d.id} className="card p-4 flex items-start gap-3">
                      {ag ? <Avatar src={photoDe(ag.id)} name={ag.name} size="w-10 h-10" /> : <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Icon name={ICONE_TYPE[d.type] ?? "description"} className="text-[20px]" filled /></span>}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-ink truncate">{ag?.name ?? "Demande interne"}</p>
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted bg-surface-2 border border-border rounded-full px-2 py-0.5"><Icon name={ICONE_TYPE[d.type] ?? "description"} className="text-[13px]" /> {d.type}</span>
                        </div>
                        <p className="text-sm text-muted mt-0.5 inline-flex items-center gap-1"><Icon name="calendar_month" className="text-[14px] text-faint" /> {d.periode}</p>
                        <p className="text-xs text-subtle mt-0.5 line-clamp-2">{d.motif}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <StatusPill label={d.statut} tone={TONE_STATUT[d.statut] ?? "amber"} />
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
                {filtreD.length === 0 && (
                  <div className="card py-12 text-center"><Icon name="inbox" className="text-faint text-[36px]" /><p className="mt-2 text-sm text-muted">Aucune demande dans cette catégorie.</p></div>
                )}
              </div>
            </>
          ) : conv ? (
            <>
              <header className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0 min-h-[60px]">
                <button type="button" onClick={() => setSel(null)} className="md:hidden -ml-1 w-8 h-8 rounded-lg text-muted hover:bg-surface-2 flex items-center justify-center" aria-label="Retour"><Icon name="arrow_back" className="text-[20px]" /></button>
                {conv.broadcast ? <span className="w-10 h-10 rounded-full bg-or-100 text-or-700 flex items-center justify-center shrink-0"><Icon name="campaign" className="text-[20px]" filled /></span> : <Avatar src={photoDe(conv.id)} name={conv.name} size="w-10 h-10" />}
                <div className="min-w-0"><p className="text-sm font-semibold text-ink truncate">{conv.name}</p><p className="text-xs text-muted truncate">{conv.broadcast ? `Diffusion · ${conv.fonction}` : conv.fonction}</p></div>
              </header>
              {conv.broadcast && <div className="px-4 py-2 bg-or-50 border-b border-or-100 text-xs text-or-700 flex items-center gap-1.5"><Icon name="info" className="text-[15px]" /> Vos messages seront diffusés à tout le personnel.</div>}

              <div className="flex-1 overflow-y-auto scroll-thin p-4 flex flex-col space-y-2.5 bg-surface-2/30" role="log" aria-live="polite" aria-label={conv.broadcast ? "Fil de diffusion" : `Conversation avec ${conv.name}`}>
                {messages.map((m, i) => {
                  const moi = m.de === "moi";
                  const bulle = moi ? "bg-brand-600 text-white rounded-br-sm" : "bg-surface-2 text-texte rounded-bl-sm";
                  return (
                    <div key={i} className={`flex flex-col ${moi ? "items-end" : "items-start"}`}>
                      {m.type === "document" ? (
                        <div className={`flex items-center gap-2.5 rounded-2xl px-3 py-2 max-w-[78%] ${bulle}`}>
                          <Icon name="description" className="text-[24px] shrink-0" filled />
                          <div className="min-w-0"><p className="text-sm font-medium truncate">{m.nom}</p><p className={`text-[11px] ${moi ? "text-white/85" : "text-subtle"}`}>{m.taille}</p></div>
                          <button type="button" onClick={() => toast("Téléchargement du document…", "info")} aria-label={`Télécharger ${m.nom}`} className={`ml-1 shrink-0 rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 ${moi ? "hover:bg-white/15 focus-visible:ring-white/60" : "hover:bg-black/5 focus-visible:ring-brand-600"}`}><Icon name="download" className="text-[18px]" /></button>
                        </div>
                      ) : (
                        <div className={`rounded-2xl px-3.5 py-2 max-w-[75%] text-sm leading-relaxed ${bulle}`}>{m.texte}</div>
                      )}
                      <span className="text-[10px] text-subtle mt-0.5 tabular-nums px-1">{m.heure}{moi && conv.broadcast ? " · Diffusé à tous" : ""}</span>
                    </div>
                  );
                })}
                {messages.length === 0 && <p className="m-auto text-sm text-subtle">Aucun message — démarrez la conversation.</p>}
                <div ref={finFilRef} />
              </div>

              <div className="border-t border-border p-3 flex items-center gap-2 shrink-0 bg-surface">
                <input type="file" ref={fileRef} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={onFile} />
                <button type="button" onClick={() => fileRef.current?.click()} className="w-10 h-10 rounded-lg border border-border text-muted hover:text-brand-700 hover:border-border-strong hover:bg-surface-2 flex items-center justify-center shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2" title="Joindre un document" aria-label="Joindre un document"><Icon name="attach_file" className="text-[20px]" /></button>
                <Input value={texte} onChange={(e) => setTexte(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyer(); } }} placeholder={conv.broadcast ? "Message à tout le personnel…" : "Écrivez un message…"} className="flex-1" aria-label="Votre message" />
                <Button variant="brand" icon="send" onClick={envoyer} disabled={!texte.trim()}>Envoyer</Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <span className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4"><Icon name="forum" className="text-[32px]" filled /></span>
              <p className="text-sm font-medium text-ink">Sélectionnez un élément</p>
              <p className="text-xs text-muted mt-1">Demandes à approuver, ou une conversation.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
