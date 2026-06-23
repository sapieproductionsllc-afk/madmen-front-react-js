import { useMemo, useRef, useState, useEffect } from "react";
import { apiGet, apiPost, apiUpload } from "../lib/api.js";
import { mapEmploye } from "../lib/mappers.js";
import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import { Input } from "../components/ui/Input.jsx";
import Icon from "../components/ui/Icon.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";

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

export default function Messagerie({ embedded = false }) {
  const { toast } = useUI();
  const [recherche, setRecherche] = useState("");
  const [selectedId, setSelectedId] = useState("ALL");
  // Fils de messages chargés à la demande, indexés par id de sélection (matricule ou "ALL").
  const [fils, setFils] = useState({});
  const [texte, setTexte] = useState("");
  const finFilRef = useRef(null);
  const fileRef = useRef(null);

  // Annuaire des employés (collègues) + conversations RÉELLES depuis l'API.
  const [employes, setEmployes] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [chargementFil, setChargementFil] = useState(false);

  useEffect(() => {
    setChargement(true);
    setErreur(null);
    Promise.all([apiGet("/api/employes"), apiGet("/api/conversations")])
      .then(([liste, convs]) => {
        setEmployes((liste ?? []).map(mapEmploye));
        setConversations(Array.isArray(convs) ? convs : []);
      })
      .catch((e) => {
        const msg = e?.message || "Erreur de chargement";
        setErreur(msg);
        toast(msg, "error");
      })
      .finally(() => setChargement(false));
  }, [toast]);

  // Trouve la conversation directe existante avec un employé (par son id numérique).
  const convDirecteDe = (employeId) =>
    conversations.find((c) => c.type === "direct" && c.autre_membre?.employe_id === employeId) || null;

  // Liste des conversations : « Tout le personnel » (diffusion) en tête + collègues.
  const convs = useMemo(() => {
    const collegues = employes.slice(0, 8);
    const TOUS = { id: "ALL", name: "Tout le personnel", fonction: `${employes.length} membres`, broadcast: true };
    return [TOUS, ...collegues];
  }, [employes]);

  const conv = useMemo(() => convs.find((e) => e.id === selectedId) ?? null, [convs, selectedId]);
  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return q ? convs.filter((e) => e.name.toLowerCase().includes(q)) : convs;
  }, [convs, recherche]);
  const messages = (selectedId && fils[selectedId]) || [];

  // À la sélection d'un collègue : charge la conversation directe existante, sinon la crée.
  useEffect(() => {
    if (!selectedId || selectedId === "ALL") return;
    if (fils[selectedId]) return; // déjà chargé

    const emp = employes.find((e) => e.id === selectedId);
    if (!emp?._id) return;

    let actif = true;
    setChargementFil(true);

    const chargerMessages = async (convId) => {
      const msgs = await apiGet(`/api/conversations/${convId}/messages`);
      if (!actif) return;
      setFils((prev) => ({ ...prev, [selectedId]: (Array.isArray(msgs) ? msgs : []).map(mapMessage) }));
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
        else if (actif) setFils((prev) => ({ ...prev, [selectedId]: [] }));
      } catch (e) {
        if (actif) toast(e?.message || "Impossible de charger la conversation", "error");
      } finally {
        if (actif) setChargementFil(false);
      }
    })();

    return () => {
      actif = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, employes, conversations]);

  useEffect(() => {
    finFilRef.current?.scrollIntoView({ block: "end" });
  }, [selectedId, messages.length]);

  const apercu = (id) => {
    if (id === "ALL") {
      // Aperçu du dernier message diffusé local, le cas échéant.
      const f = fils[id];
      if (f && f.length) {
        const m = f[f.length - 1];
        const t = m.type === "document" ? "📎 " + m.nom : m.texte;
        return { texte: (m.de === "moi" ? "Vous : " : "") + t, heure: m.heure };
      }
      return { texte: "Diffusion à tout le personnel", heure: "" };
    }
    // Aperçu depuis le résumé API de la conversation directe (dernier_message).
    const emp = employes.find((e) => e.id === id);
    const c = emp?._id != null ? convDirecteDe(emp._id) : null;
    const dm = c?.dernier_message;
    if (dm) return { texte: (dm.mien ? "Vous : " : "") + (dm.apercu ?? ""), heure: heureDe(dm.created_at) };
    const f = fils[id];
    if (f && f.length) {
      const m = f[f.length - 1];
      const t = m.type === "document" ? "📎 " + m.nom : m.texte;
      return { texte: (m.de === "moi" ? "Vous : " : "") + t, heure: m.heure };
    }
    return { texte: "Aucun message", heure: "" };
  };

  const ajouter = (msg) => setFils((prev) => ({ ...prev, [selectedId]: [...(prev[selectedId] || []), msg] }));
  const heureNow = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  async function envoyer() {
    const t = texte.trim();
    if (!t || !selectedId) return;
    setTexte("");

    if (conv?.broadcast) {
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
    const emp = employes.find((e) => e.id === selectedId);
    const c = emp?._id != null ? convDirecteDe(emp._id) : null;
    if (!c?.id) {
      toast("Conversation indisponible.", "error");
      return;
    }
    // Affichage optimiste.
    ajouter({ de: "moi", texte: t, heure: heureNow() });
    try {
      await apiPost(`/api/conversations/${c.id}/messages`, { type: "texte", contenu: t });
    } catch (e) {
      toast(e?.message || "Échec de l'envoi", "error");
    }
  }
  async function onFile(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !selectedId) return;
    // Le canal de diffusion « Tout le personnel » n'accepte que du texte.
    if (conv?.broadcast) {
      toast("Les pièces jointes ne sont pas diffusables à tout le personnel.", "info");
      return;
    }
    const emp = employes.find((x) => x.id === selectedId);
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
      await apiPost(`/api/conversations/${c.id}/messages`, { type, fichier_id: up.id });
      toast(`Document « ${f.name} » envoyé.`, "success");
    } catch (err) {
      toast(err?.message || "Échec de l'envoi du document", "error");
    }
  }
  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyer(); }
  }

  if (chargement) {
    return (
      <div className={embedded ? "" : "reveal"}>
        {!embedded && <PageHeader title="Messagerie" subtitle="Écrivez à un collègue ou à tout le personnel — message ou document." />}
        <div className="card py-16 text-center">
          <Icon name="progress_activity" className="text-faint text-[40px] animate-spin" />
          <p className="mt-2 text-sm text-muted">Chargement de la messagerie…</p>
        </div>
      </div>
    );
  }

  if (erreur) {
    return (
      <div className={embedded ? "" : "reveal"}>
        {!embedded && <PageHeader title="Messagerie" subtitle="Écrivez à un collègue ou à tout le personnel — message ou document." />}
        <div className="card py-16 text-center">
          <Icon name="error" className="text-rose-500 text-[40px]" />
          <p className="mt-2 text-sm text-muted">{erreur}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "" : "reveal"}>
      {!embedded && <PageHeader title="Messagerie" subtitle="Écrivez à un collègue ou à tout le personnel — message ou document." />}

      <div className={`card overflow-hidden min-h-[26rem] flex p-0 ${embedded ? "h-[calc(100dvh-21rem)]" : "h-[calc(100dvh-15rem)]"}`}>
        {/* VOLET GAUCHE */}
        <aside className={`w-72 shrink-0 border-r border-border flex-col ${selectedId ? "hidden md:flex" : "flex"}`}>
          <div className="p-3 border-b border-border">
            <SearchInput value={recherche} onChange={setRecherche} placeholder="Rechercher…" />
          </div>
          <div className="flex-1 overflow-y-auto scroll-thin">
            {liste.length === 0 && <p className="px-4 py-6 text-sm text-muted text-center">Aucun résultat.</p>}
            {liste.map((e) => {
              const a = apercu(e.id);
              const actif = e.id === selectedId;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setSelectedId(e.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-border/60 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${actif ? "bg-brand-50" : "hover:bg-surface-2"}`}
                >
                  {e.broadcast ? (
                    <span className="w-10 h-10 rounded-full bg-or-100 text-or-700 flex items-center justify-center shrink-0"><Icon name="campaign" className="text-[20px]" filled /></span>
                  ) : (
                    <Avatar src={photoDe(e.id)} name={e.name} size="w-10 h-10" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-ink truncate">{e.name}</span>
                      <span className="text-[11px] text-subtle shrink-0 tabular-nums">{a.heure}</span>
                    </div>
                    <p className="text-xs text-muted line-clamp-1">{a.texte}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* VOLET DROIT */}
        <section className="flex-1 flex flex-col min-w-0">
          {conv ? (
            <>
              <header className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
                <button type="button" onClick={() => setSelectedId(null)} className="md:hidden -ml-1 mr-1 w-8 h-8 rounded-lg text-muted hover:bg-surface-2 hover:text-texte flex items-center justify-center" aria-label="Retour à la liste">
                  <Icon name="arrow_back" className="text-[20px]" />
                </button>
                {conv.broadcast ? (
                  <span className="w-10 h-10 rounded-full bg-or-100 text-or-700 flex items-center justify-center shrink-0"><Icon name="campaign" className="text-[20px]" filled /></span>
                ) : (
                  <Avatar src={photoDe(conv.id)} name={conv.name} size="w-10 h-10" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{conv.name}</p>
                  <p className="text-xs text-muted truncate">{conv.broadcast ? `Diffusion · ${conv.fonction}` : conv.fonction}</p>
                </div>
              </header>

              {conv.broadcast && (
                <div className="px-4 py-2 bg-or-50 border-b border-or-100 text-xs text-or-700 flex items-center gap-1.5">
                  <Icon name="info" className="text-[15px]" /> Vos messages seront diffusés à tout le personnel.
                </div>
              )}

              <div className="flex-1 overflow-y-auto scroll-thin p-4 flex flex-col bg-surface" role="log" aria-live="polite" aria-label={conv.broadcast ? "Fil de diffusion" : `Conversation avec ${conv.name}`}>
                {messages.length === 0 ? (
                  <p className="m-auto text-sm text-subtle">
                    {chargementFil ? "Chargement de la conversation…" : "Aucun message — démarrez la conversation."}
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
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{m.nom}</p>
                                <p className={`text-[11px] ${moi ? "text-white/85" : "text-subtle"}`}>{m.taille}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => toast("Téléchargement du document…", "info")}
                                aria-label={`Télécharger ${m.nom}`}
                                className={`ml-1 shrink-0 rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 ${moi ? "hover:bg-white/15 focus-visible:ring-white/60" : "hover:bg-black/5 focus-visible:ring-brand-600"}`}
                              >
                                <Icon name="download" className="text-[18px]" />
                              </button>
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
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-10 h-10 rounded-lg border border-border text-muted hover:text-brand-700 hover:border-border-strong hover:bg-surface-2 flex items-center justify-center shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                  title="Joindre un document"
                  aria-label="Joindre un document"
                >
                  <Icon name="attach_file" className="text-[20px]" />
                </button>
                <Input value={texte} onChange={(e) => setTexte(e.target.value)} onKeyDown={onKeyDown} placeholder={conv.broadcast ? "Message à tout le personnel…" : "Écrivez un message…"} className="flex-1" aria-label="Votre message" />
                <Button variant="brand" icon="send" onClick={envoyer} disabled={!texte.trim()}>Envoyer</Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <span className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4"><Icon name="forum" className="text-[32px]" filled /></span>
              <p className="text-sm font-medium text-ink">Sélectionnez une conversation</p>
              <p className="text-xs text-muted mt-1">Tout le personnel ou un collègue, dans la liste.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
