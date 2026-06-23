import { useMemo, useRef, useState, useEffect } from "react";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import { Input, Select, Field, champClass } from "../components/ui/Input.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { apiGet, apiPost, apiUpload } from "../lib/api.js";
import { mapEmploye } from "../lib/mappers.js";

const photoDe = (id) => `https://i.pravatar.cc/120?u=${encodeURIComponent(id)}`;

// Heure courte (HH:MM) à partir d'un horodatage API (created_at) ou maintenant.
const heureDe = (ts) => {
  const d = ts ? new Date(typeof ts === "string" ? ts.replace(" ", "T") : ts) : new Date();
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

// Message API -> forme attendue par le JSX (de/texte/heure, ou document).
const mapMessage = (m) => {
  const base = { de: m.mien ? "moi" : "lui", heure: heureDe(m.created_at) };
  if (m.type !== "texte" && m.fichier) {
    const ko = m.fichier.taille != null ? Math.max(1, Math.round(m.fichier.taille / 1024)) : null;
    return { ...base, type: "document", nom: m.fichier.nom_original || "Document", taille: ko != null ? `${ko} Ko` : "—" };
  }
  return { ...base, texte: m.contenu ?? "" };
};

// Identifiant client pour l'idempotence offline-first des envois.
const uuid = () =>
  (globalThis.crypto?.randomUUID?.() ?? `cli-${Date.now()}-${Math.random().toString(16).slice(2)}`);

const ICONE_TYPE = { "Congé": "event", Permission: "schedule", "Avance sur salaire": "payments", Avance: "payments", Absence: "report", Autre: "description" };
const TONE_STATUT = { "En attente": "amber", "Approuvée": "emerald", "Refusée": "rose" };
const TYPES = ["Congé", "Permission", "Avance sur salaire", "Autre"];
const CATS = [
  { key: "En attente", label: "À traiter" },
  { key: "Toutes", label: "Toutes" },
  { key: "Approuvée", label: "Approuvées" },
  { key: "Refusée", label: "Refusées" },
];

// Traduit le statut renvoyé par l'API des demandes vers les libellés attendus par le front.
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

// Demande API -> forme attendue par le JSX (champs identiques au mock), avec le VRAI statut.
function mapDemande(d) {
  return {
    id: d.reference || d.id, // identifiant métier (ex. DM-201) ; fallback id numérique
    employeId: d.matricule || "", // lookup vers l'employé (indexé par matricule)
    type: d.type || "Autre",
    periode: mapPeriode(d),
    motif: d.objet || "", // `objet` API = motif affiché
    statut: mapStatut(d.statut),
    soumisLe: d.soumisLe || "", // non garanti par l'API : valeur neutre
  };
}

export default function Communication() {
  const { toast } = useUI();
  const [sel, setSel] = useState("demandes"); // "demandes" | "ALL" | matricule
  const [recherche, setRecherche] = useState("");

  // --- Données RÉELLES depuis l'API (remplacent les mocks de src/data) ---
  const [employes, setEmployes] = useState([]);
  const [liste, setListe] = useState([]);
  const [conversations, setConversations] = useState([]); // conversations RÉELLES (API)
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [chargementFil, setChargementFil] = useState(false);

  // --- Demandes ---
  const [catD, setCatD] = useState("En attente");
  const [formOuvert, setFormOuvert] = useState(false);
  const [agent, setAgent] = useState("");
  const [type, setType] = useState("Congé");
  const [periode, setPeriode] = useState("");
  const [motif, setMotif] = useState("");
  const [compteur, setCompteur] = useState(301);

  useEffect(() => {
    setChargement(true);
    setErreur(null);
    Promise.all([apiGet("/api/employes"), apiGet("/api/demandes")])
      .then(([emp, dem]) => {
        const listeEmp = (Array.isArray(emp) ? emp : []).map(mapEmploye);
        setEmployes(listeEmp);
        setAgent((a) => a || listeEmp[0]?.id || "");
        setListe((Array.isArray(dem) ? dem : []).map(mapDemande));
      })
      .catch((e) => setErreur(e?.message || "Erreur de chargement"))
      .finally(() => setChargement(false));

    // Conversations de messagerie : dégradation gracieuse si l'endpoint échoue.
    apiGet("/api/conversations")
      .then((convs) => setConversations(Array.isArray(convs) ? convs : []))
      .catch(() => setConversations([]));
  }, []);

  const empById = useMemo(() => Object.fromEntries(employes.map((e) => [e.id, e])), [employes]);
  const collegues = useMemo(() => employes.slice(0, 8), [employes]);

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

  // --- Messagerie (branchée sur l'API, cf. Messagerie.jsx) ---
  // Fils chargés à la demande, indexés par sélection : "ALL" (diffusion) ou matricule (direct).
  const [fils, setFils] = useState({});
  const [texte, setTexte] = useState("");
  const fileRef = useRef(null);
  const finFilRef = useRef(null);

  const conv = sel === "demandes" ? null : sel === "ALL" ? { id: "ALL", name: "Tout le personnel", fonction: `${employes.length} membres`, broadcast: true } : empById[sel];
  const messages = (conv && fils[conv.id]) || [];
  const heureNow = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const ajouter = (msg) => setFils((prev) => ({ ...prev, [conv.id]: [...(prev[conv.id] || []), msg] }));

  // Trouve la conversation directe existante avec un employé (par son id numérique).
  const convDirecteDe = (employeId) =>
    conversations.find((c) => c.type === "direct" && c.autre_membre?.employe_id === employeId) || null;

  // À la sélection d'un collègue : charge la conversation directe existante, sinon la crée.
  useEffect(() => {
    if (!conv || conv.broadcast) return; // "demandes" ou diffusion : rien à charger
    if (fils[conv.id]) return; // déjà chargé

    const emp = empById[conv.id];
    if (!emp?._id) return;

    let actif = true;
    setChargementFil(true);

    const chargerMessages = async (convId) => {
      const msgs = await apiGet(`/api/conversations/${convId}/messages`);
      if (!actif) return;
      setFils((prev) => ({ ...prev, [conv.id]: (Array.isArray(msgs) ? msgs : []).map(mapMessage) }));
    };

    (async () => {
      try {
        let c = convDirecteDe(emp._id);
        if (!c) {
          // Pas de fil direct existant -> on le crée (idempotent côté API).
          c = await apiPost("/api/conversations", { type: "direct", membres: [emp._id] });
          if (!actif) return;
          if (c && !conversations.some((x) => x.id === c.id)) {
            setConversations((prev) => [c, ...prev]);
          }
        }
        if (c?.id != null) await chargerMessages(c.id);
        else if (actif) setFils((prev) => ({ ...prev, [conv.id]: [] }));
      } catch (e) {
        // Dégradation gracieuse : fil vide plutôt qu'une page cassée.
        if (actif) {
          setFils((prev) => ({ ...prev, [conv.id]: [] }));
          toast(e?.message || "Impossible de charger la conversation", "error");
        }
      } finally {
        if (actif) setChargementFil(false);
      }
    })();

    return () => {
      actif = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, employes, conversations]);

  async function envoyer() {
    const t = texte.trim();
    if (!t || !conv) return;
    setTexte("");

    if (conv.broadcast) {
      // Diffusion « Tout le personnel » via le canal annonce.
      try {
        await apiPost("/api/conversations/broadcast", { contenu: t });
        ajouter({ de: "moi", texte: t, heure: heureNow() });
        toast(`Message diffusé à ${employes.length} membres.`, "success");
      } catch (e) {
        toast(e?.message || "Échec de la diffusion", "error");
      }
      return;
    }

    // Message direct : envoi à la conversation du collègue sélectionné.
    const emp = empById[conv.id];
    const c = emp?._id != null ? convDirecteDe(emp._id) : null;
    if (!c?.id) {
      toast("Conversation indisponible.", "error");
      return;
    }
    // Affichage optimiste.
    ajouter({ de: "moi", texte: t, heure: heureNow() });
    try {
      await apiPost(`/api/conversations/${c.id}/messages`, { type: "texte", contenu: t, client_uuid: uuid() });
    } catch (e) {
      toast(e?.message || "Échec de l'envoi", "error");
    }
  }

  async function onFile(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !conv) return;
    // Le canal de diffusion « Tout le personnel » n'accepte que du texte.
    if (conv.broadcast) {
      toast("Les pièces jointes ne sont pas diffusables à tout le personnel.", "info");
      return;
    }
    const emp = empById[conv.id];
    const c = emp?._id != null ? convDirecteDe(emp._id) : null;
    if (!c?.id) {
      toast("Conversation indisponible.", "error");
      return;
    }
    // Affichage optimiste, puis upload réel + message lié au fichier.
    ajouter({ de: "moi", type: "document", nom: f.name, taille: `${Math.max(1, Math.round(f.size / 1024))} Ko`, heure: heureNow() });
    try {
      const up = await apiUpload("/api/fichiers", f); // -> { id, nom_original, mime, taille, url }
      const type = (f.type || "").startsWith("image/") ? "image" : "document";
      await apiPost(`/api/conversations/${c.id}/messages`, { type, fichier_id: up.id, client_uuid: uuid() });
      toast(`Document « ${f.name} » envoyé.`, "success");
    } catch (err) {
      toast(err?.message || "Échec de l'envoi du document", "error");
    }
  }

  useEffect(() => {
    finFilRef.current?.scrollIntoView({ block: "end" });
  }, [sel, messages.length]);

  const apercu = (id) => {
    if (id === "ALL") {
      // Aperçu du dernier message diffusé localement, le cas échéant.
      const f = fils[id];
      if (f && f.length) {
        const m = f[f.length - 1];
        const t = m.type === "document" ? "📎 " + m.nom : m.texte;
        return (m.de === "moi" ? "Vous : " : "") + t;
      }
      return "Diffusion à tout le personnel";
    }
    // Aperçu depuis le résumé API de la conversation directe (dernier_message).
    const emp = empById[id];
    const c = emp?._id != null ? convDirecteDe(emp._id) : null;
    const dm = c?.dernier_message;
    if (dm) return (dm.mien ? "Vous : " : "") + (dm.apercu ?? "");
    const f = fils[id];
    if (f && f.length) {
      const m = f[f.length - 1];
      const t = m.type === "document" ? "📎 " + m.nom : m.texte;
      return (m.de === "moi" ? "Vous : " : "") + t;
    }
    return "";
  };

  const convListe = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const arr = [{ id: "ALL", name: "Tout le personnel", broadcast: true }, ...collegues];
    return q ? arr.filter((e) => e.name.toLowerCase().includes(q)) : arr;
  }, [recherche, collegues]);

  const railItem = (actif) => `w-full flex items-center gap-3 px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${actif ? "bg-brand-50" : "hover:bg-surface-2"}`;

  return (
    <div className="h-full">
      <div className="card overflow-hidden h-full min-h-[30rem] flex p-0 rounded-none border-0">
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

                {chargement && (
                  <div className="card py-12 text-center"><Icon name="progress_activity" className="text-faint text-[36px] animate-spin" /><p className="mt-2 text-sm text-muted">Chargement des demandes…</p></div>
                )}
                {!chargement && erreur && (
                  <div className="card py-12 text-center"><Icon name="error" className="text-rose-500 text-[36px]" /><p className="mt-2 text-sm text-muted">{erreur}</p></div>
                )}
                {!chargement && !erreur && filtreD.map((d) => {
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
                {!chargement && !erreur && filtreD.length === 0 && (
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

              <div className="flex-1 overflow-y-auto scroll-thin p-4 flex flex-col bg-surface-2/30" role="log" aria-live="polite" aria-label={conv.broadcast ? "Fil de diffusion" : `Conversation avec ${conv.name}`}>
                {messages.length === 0 ? (
                  <p className="m-auto text-sm text-subtle">
                    {chargementFil && !conv.broadcast ? "Chargement de la conversation…" : "Aucun message — démarrez la conversation."}
                  </p>
                ) : (
                  <div className="mt-auto flex flex-col space-y-2.5">
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
                    <div ref={finFilRef} />
                  </div>
                )}
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
