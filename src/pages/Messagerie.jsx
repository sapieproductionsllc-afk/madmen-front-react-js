import { useMemo, useRef, useState, useEffect } from "react";
import { employes } from "../data/datasets.js";
import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import { Input } from "../components/ui/Input.jsx";
import Icon from "../components/ui/Icon.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";

const photoDe = (id) => `https://i.pravatar.cc/120?u=${encodeURIComponent(id)}`;
const collegues = employes.slice(0, 8);
// Diffusion à tout le personnel en tête de liste.
const TOUS = { id: "ALL", name: "Tout le personnel", fonction: `${employes.length} membres`, broadcast: true };
const convs = [TOUS, ...collegues];

const filsSeed = {
  ALL: [
    { de: "moi", texte: "Bonjour à toutes et à tous — réunion générale vendredi à 10h en salle B2.", heure: "08:00" },
    { de: "moi", type: "document", nom: "Note_de_service_juin.pdf", taille: "182 Ko", heure: "08:01" },
  ],
  "AUR-1187": [
    { de: "lui", texte: "Bonjour ! Les copies du test d'anglais sont prêtes.", heure: "08:42" },
    { de: "moi", texte: "Parfait, merci. Tu peux les déposer au bureau RH ?", heure: "08:45" },
    { de: "lui", texte: "Oui, je passe avant midi.", heure: "08:46" },
  ],
  "AUR-8821": [
    { de: "moi", texte: "Elena, le rapport de sécurité est validé ?", heure: "09:10" },
    { de: "lui", texte: "Oui, je l'envoie d'ici une heure.", heure: "09:12" },
    { de: "moi", texte: "Je bloque un créneau mardi matin.", heure: "09:15" },
  ],
  "AUR-4491": [
    { de: "lui", texte: "Je suis en congé aujourd'hui, je réponds à mon retour.", heure: "07:30" },
    { de: "moi", texte: "Pas de souci, bon repos !", heure: "07:35" },
  ],
  "AUR-1102": [
    { de: "lui", texte: "Le modèle a fini d'entraîner cette nuit.", heure: "08:05" },
    { de: "moi", texte: "Excellent, quels résultats ?", heure: "08:20" },
    { de: "lui", texte: "Précision en hausse de 4 points.", heure: "08:22" },
  ],
  "AUR-9031": [
    { de: "moi", texte: "Sarah, tout va bien de ton côté ?", heure: "10:00" },
    { de: "lui", texte: "Je suis souffrante aujourd'hui, désolée.", heure: "10:12" },
  ],
  "AUR-7720": [
    { de: "lui", texte: "Les fiches de paie sont prêtes à valider.", heure: "11:02" },
    { de: "moi", texte: "Je regarde ça cet après-midi.", heure: "11:10" },
  ],
  "AUR-6654": [
    { de: "moi", texte: "Amélie, peux-tu programmer les entretiens annuels ?", heure: "14:20" },
    { de: "lui", texte: "Oui, je lance les invitations aujourd'hui.", heure: "14:25" },
  ],
  "AUR-3398": [
    { de: "lui", texte: "Le poste WS-205 est de nouveau opérationnel.", heure: "09:40" },
    { de: "moi", texte: "Merci Karim, rapide comme toujours !", heure: "09:42" },
  ],
};

export default function Messagerie({ embedded = false }) {
  const { toast } = useUI();
  const [recherche, setRecherche] = useState("");
  const [selectedId, setSelectedId] = useState("ALL");
  const [fils, setFils] = useState(filsSeed);
  const [texte, setTexte] = useState("");
  const finFilRef = useRef(null);
  const fileRef = useRef(null);

  const conv = useMemo(() => convs.find((e) => e.id === selectedId) ?? null, [selectedId]);
  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return q ? convs.filter((e) => e.name.toLowerCase().includes(q)) : convs;
  }, [recherche]);
  const messages = (selectedId && fils[selectedId]) || [];

  useEffect(() => {
    finFilRef.current?.scrollIntoView({ block: "end" });
  }, [selectedId, messages.length]);

  const apercu = (id) => {
    const f = fils[id];
    if (!f || !f.length) return { texte: "Aucun message", heure: "" };
    const m = f[f.length - 1];
    const t = m.type === "document" ? "📎 " + m.nom : m.texte;
    return { texte: (m.de === "moi" ? "Vous : " : "") + t, heure: m.heure };
  };

  const ajouter = (msg) => setFils((prev) => ({ ...prev, [selectedId]: [...(prev[selectedId] || []), msg] }));
  const heureNow = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  function envoyer() {
    const t = texte.trim();
    if (!t || !selectedId) return;
    ajouter({ de: "moi", texte: t, heure: heureNow() });
    setTexte("");
    if (conv?.broadcast) toast(`Message diffusé à ${employes.length} membres.`, "success");
  }
  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    ajouter({ de: "moi", type: "document", nom: f.name, taille: `${Math.max(1, Math.round(f.size / 1024))} Ko`, heure: heureNow() });
    toast(conv?.broadcast ? `Document diffusé à ${employes.length} membres.` : `Document « ${f.name} » envoyé.`, "success");
    e.target.value = "";
  }
  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyer(); }
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

              <div className="flex-1 overflow-y-auto scroll-thin p-4 flex flex-col space-y-2.5 bg-surface" role="log" aria-live="polite" aria-label={conv.broadcast ? "Fil de diffusion" : `Conversation avec ${conv.name}`}>
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
                {messages.length === 0 && <p className="m-auto text-sm text-subtle">Aucun message — démarrez la conversation.</p>}
                <div ref={finFilRef} />
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
