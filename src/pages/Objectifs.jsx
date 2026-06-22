import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import { Input, Select, Field } from "../components/ui/Input.jsx";
import Icon from "../components/ui/Icon.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import Modal from "../components/ui/Modal.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { employes } from "../data/datasets.js";
import { apiGet } from "../lib/api.js";

const photoDe = (id) => `https://i.pravatar.cc/80?u=${encodeURIComponent(id)}`;
const empById = Object.fromEntries(employes.map((e) => [e.id, e]));

const COULEUR_CATEGORIE = {
  Performance: "bg-emerald-50 text-emerald-600",
  Présence: "bg-sky-50 text-sky-600",
  Formation: "bg-or-100 text-or-700",
  "Développement personnel": "bg-brand-50 text-brand-600",
};
const ICONE_CATEGORIE = { Performance: "trending_up", Présence: "co_present", Formation: "school", "Développement personnel": "self_improvement" };
const TONE_STATUT = { "En cours": "sky", Atteint: "emerald", "En retard": "amber" };
const CATEGORIES = ["Performance", "Présence", "Formation", "Développement personnel"];
const STATUTS = ["En cours", "Atteint", "En retard"];

// Traduction des valeurs API -> libellés attendus par le JSX (catégories/statuts).
const CATEGORIE_API = { performance: "Performance", formation: "Formation", perso: "Développement personnel" };
const STATUT_API = { en_cours: "En cours", atteint: "Atteint", abandonne: "En retard" };

// Mappe un objectif renvoyé par l'API vers la forme consommée par le JSX.
// Les objectifs /api/me sont personnels (scopés au jeton) : pas de portée partagée
// ni de membres côté API -> valeurs neutres pour ne rien casser dans l'affichage.
function mapObjectif(o) {
  return {
    id: o.id,
    titre: o.titre ?? "",
    categorie: CATEGORIE_API[o.categorie] ?? o.categorie ?? "",
    echeance: o.echeance ?? "",
    progression: typeof o.progression === "number" ? o.progression : Number(o.progression) || 0,
    statut: STATUT_API[o.statut] ?? "En cours",
    portee: "Personnel",
    tous: false,
    membres: [],
  };
}

const CATS = [
  { key: "Tous", label: "Tous" },
  { key: "Personnel", label: "Personnels" },
  { key: "Partagé", label: "Partagés" },
];

function formatDate(iso) {
  if (!iso) return "Sans échéance";
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function Membres({ ids }) {
  return (
    <div className="flex -space-x-2">
      {ids.slice(0, 4).map((id) => (
        <Avatar key={id} src={photoDe(id)} name={empById[id]?.name ?? id} size="w-6 h-6" ring={false} className="ring-2 ring-surface" />
      ))}
      {ids.length > 4 && <span className="w-6 h-6 rounded-full ring-2 ring-surface bg-surface-2 text-[10px] font-semibold text-muted flex items-center justify-center">+{ids.length - 4}</span>}
    </div>
  );
}

// Sélecteur de membres (tout le personnel ou agents précis) — recherche + compteur.
function SelecteurMembres({ tous, setTous, ids, setIds }) {
  const [q, setQ] = useState("");
  const toggle = (id) => setIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const filtres = employes.filter((e) => e.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className="rounded-xl border border-border bg-surface-2/40 p-3">
      <button type="button" onClick={() => setTous(!tous)} aria-pressed={tous} className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium border transition-colors ${tous ? "bg-brand-50 border-brand-600/40 text-brand-700" : "bg-surface border-border text-texte hover:border-border-strong"}`}>
        <Icon name="groups" className="text-[18px]" filled /> Tout le personnel
        {tous && <Icon name="check" className="text-[16px] ml-auto" />}
      </button>
      {!tous && (
        <div className="mt-3" role="group" aria-label="Sélection des agents">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="relative flex-1 max-w-[16rem]">
              <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-subtle" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un agent…" className="w-full rounded-lg bg-canvas border border-border pl-8 pr-3 py-1.5 text-xs text-texte placeholder:text-subtle outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15" />
            </div>
            <span className="text-xs text-muted shrink-0" aria-live="polite">{ids.length} sélectionné{ids.length > 1 ? "s" : ""}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto scroll-thin">
            {filtres.map((e) => {
              const on = ids.includes(e.id);
              return (
                <button key={e.id} type="button" onClick={() => toggle(e.id)} aria-pressed={on} className={`inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border text-xs transition-colors ${on ? "bg-brand-50 border-brand-600/40 text-brand-700" : "bg-surface border-border text-muted hover:border-border-strong hover:text-texte"}`}>
                  <Avatar src={photoDe(e.id)} name={e.name} size="w-5 h-5" ring={false} /> {e.name}{on && <Icon name="check" className="text-[14px]" />}
                </button>
              );
            })}
            {filtres.length === 0 && <p className="text-xs text-subtle py-2 px-1">Aucun agent trouvé.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function CarteObjectif({ objectif, onGerer, onSupprimer }) {
  const couleur = COULEUR_CATEGORIE[objectif.categorie] ?? "bg-surface-2 text-muted";
  const icone = ICONE_CATEGORIE[objectif.categorie] ?? "flag";
  const enRetard = objectif.statut !== "Atteint" && objectif.echeance && new Date(objectif.echeance + "T00:00:00") < new Date();
  const tone = enRetard ? "amber" : TONE_STATUT[objectif.statut] ?? "amber";
  const statut = enRetard ? "En retard" : objectif.statut;
  const pct = Math.max(0, Math.min(100, objectif.progression));
  const partage = objectif.portee === "Partagé";

  return (
    <article className="card p-5 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${couleur}`}><Icon name={icone} className="text-[20px]" filled /></span>
        <StatusPill label={statut} tone={tone} />
      </div>

      <h3 className="text-ink font-semibold mt-3 leading-snug">{objectif.titre}</h3>
      <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted"><Icon name="event" className="text-[16px] text-faint" /> {formatDate(objectif.echeance)}</p>

      <div className="pt-4">
        <div className="flex items-center justify-between mb-1.5"><span className="text-xs text-subtle">Progression</span><span className="text-xs font-medium text-texte tabular-nums">{pct} %</span></div>
        <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden"><div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} /></div>
      </div>

      {/* Portée + actions */}
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2 min-h-[2.5rem]">
        {partage ? (
          objectif.tous ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 bg-brand-50 px-2 py-1 rounded-full"><Icon name="groups" className="text-[14px]" filled /> Tout le personnel</span>
          ) : (
            <span className="inline-flex items-center gap-2 min-w-0" title={`${objectif.membres.length} agent(s)`}><Membres ids={objectif.membres} /><span className="text-xs text-muted">{objectif.membres.length} agent{objectif.membres.length > 1 ? "s" : ""}</span></span>
          )
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted bg-surface-2 border border-border px-2 py-1 rounded-full"><Icon name="lock_person" className="text-[14px]" /> Personnel</span>
        )}
        <div className="flex items-center gap-1 shrink-0">
          <Button size="sm" variant="secondary" icon={partage ? "tune" : "share"} aria-label={`${partage ? "Gérer" : "Partager"} l'objectif ${objectif.titre}`} onClick={() => onGerer(objectif)}>{partage ? "Gérer" : "Partager"}</Button>
          <button onClick={() => onSupprimer(objectif)} aria-label={`Supprimer l'objectif ${objectif.titre}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-subtle hover:text-rose-600 hover:bg-rose-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"><Icon name="delete" className="text-[18px]" /></button>
        </div>
      </div>
    </article>
  );
}

export default function Objectifs() {
  const { toast, confirm } = useUI();
  const [objectifs, setObjectifs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [cat, setCat] = useState("Tous");

  // Charge les VRAIS objectifs de l'employé connecté (JWT géré par api.js).
  useEffect(() => {
    setChargement(true);
    setErreur(null);
    apiGet("/api/me/objectifs")
      .then((data) => setObjectifs(Array.isArray(data) ? data.map(mapObjectif) : []))
      .catch((e) => setErreur(e?.message || "Impossible de charger les objectifs."))
      .finally(() => setChargement(false));
  }, []);

  // Création
  const [titre, setTitre] = useState("");
  const [categorie, setCategorie] = useState(CATEGORIES[0]);
  const [echeance, setEcheance] = useState("");
  const [portee, setPortee] = useState("Personnel");
  const [fTous, setFTous] = useState(true);
  const [fIds, setFIds] = useState([]);

  // Modale « Gérer l'objectif »
  const [edit, setEdit] = useState(null);
  const [ePortee, setEPortee] = useState("Personnel");
  const [eTous, setETous] = useState(true);
  const [eIds, setEIds] = useState([]);
  const [eProg, setEProg] = useState(0);
  const [eStatut, setEStatut] = useState("En cours");

  const compte = (k) => (k === "Tous" ? objectifs.length : objectifs.filter((o) => o.portee === k).length);
  const liste = useMemo(() => (cat === "Tous" ? objectifs : objectifs.filter((o) => o.portee === cat)), [objectifs, cat]);

  const creationInvalide = !titre.trim() || (portee === "Partagé" && !fTous && fIds.length === 0);
  function handleSubmit(e) {
    e.preventDefault();
    if (creationInvalide) return;
    const estPartage = portee === "Partagé";
    setObjectifs((prev) => [{ id: Date.now(), titre: titre.trim(), categorie, echeance, progression: 0, statut: "En cours", portee, tous: estPartage && fTous, membres: estPartage && !fTous ? [...new Set(fIds)] : [] }, ...prev]);
    toast(`Objectif « ${titre.trim()} » créé`, "success");
    setTitre(""); setCategorie(CATEGORIES[0]); setEcheance(""); setPortee("Personnel"); setFTous(true); setFIds([]);
  }

  const ouvrirGerer = (o) => {
    setEdit(o);
    setEPortee(o.portee); setETous(o.portee === "Partagé" ? o.tous : true); setEIds(o.portee === "Partagé" ? o.membres : []);
    setEProg(o.progression); setEStatut(o.statut);
  };
  const editInvalide = ePortee === "Partagé" && !eTous && eIds.length === 0;
  const enregistrer = () => {
    if (editInvalide) return;
    const estP = ePortee === "Partagé";
    setObjectifs((prev) => prev.map((o) => (o.id === edit.id ? { ...o, portee: ePortee, tous: estP && eTous, membres: estP && !eTous ? [...new Set(eIds)] : [], progression: eProg, statut: eStatut } : o)));
    toast(`Objectif « ${edit.titre} » mis à jour`, "success");
    setEdit(null);
  };
  const supprimer = (o) => {
    confirm?.({ title: "Supprimer cet objectif ?", message: `« ${o.titre} » sera définitivement retiré.`, confirmLabel: "Supprimer", danger: true, onConfirm: () => { setObjectifs((prev) => prev.filter((x) => x.id !== o.id)); toast("Objectif supprimé", "info"); } });
  };

  const segPortee = (val, set) => (
    <div className="inline-flex rounded-lg border border-border overflow-hidden">
      {["Personnel", "Partagé"].map((p) => (
        <button key={p} type="button" onClick={() => set(p)} aria-pressed={val === p} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${val === p ? "bg-brand-600 text-canvas" : "bg-surface text-muted hover:text-texte"}`}>
          <Icon name={p === "Personnel" ? "lock_person" : "groups"} className="text-[16px]" /> {p}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-5 pb-12">
      <PageHeader title="Objectifs" subtitle="Créez vos objectifs personnels ou partagez-les avec les agents." />

      {/* Création */}
      <section className="card p-5">
        <div className="flex items-center gap-2 mb-3.5">
          <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Icon name="flag" className="text-[18px]" filled /></span>
          <h3 className="text-sm font-semibold text-ink">Nouvel objectif</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Field label="Intitulé" className="lg:col-span-2"><Input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="ex. Atteindre 95 % de présence" /></Field>
            <Field label="Catégorie"><Select value={categorie} onChange={(e) => setCategorie(e.target.value)}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
            <Field label="Échéance"><Input type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} /></Field>
          </div>
          <div className="mt-3">
            <Field label="Portée">{segPortee(portee, setPortee)}</Field>
          </div>
          {portee === "Partagé" && <div className="mt-3"><SelecteurMembres tous={fTous} setTous={setFTous} ids={fIds} setIds={setFIds} /></div>}
          <div className="mt-4 flex justify-end">
            <Button type="submit" variant="primary" icon="add" disabled={creationInvalide}>Ajouter l'objectif</Button>
          </div>
        </form>
      </section>

      {/* Filtres */}
      <div className="flex items-center gap-2 overflow-x-auto scroll-thin pb-1">
        {CATS.map((c) => (
          <button key={c.key} onClick={() => setCat(c.key)} aria-pressed={cat === c.key} className={`shrink-0 inline-flex items-center gap-2 pl-3 pr-2 h-9 rounded-full text-sm whitespace-nowrap border transition-colors ${cat === c.key ? "bg-brand-600 text-canvas border-brand-600" : "bg-surface text-muted border-border hover:border-border-strong hover:text-texte"}`}>
            {c.label}<span className={`text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded-full ${cat === c.key ? "bg-canvas/20" : "bg-surface-2 text-texte"}`}>{compte(c.key)}</span>
          </button>
        ))}
      </div>

      {/* Grille */}
      {chargement ? (
        <div className="card py-14 text-center">
          <Icon name="progress_activity" className="text-faint text-[36px] animate-spin" />
          <p className="mt-2 text-sm text-muted">Chargement des objectifs…</p>
        </div>
      ) : erreur ? (
        <div className="card py-14 text-center">
          <Icon name="error" className="text-faint text-[36px]" />
          <p className="mt-2 text-sm text-muted">{erreur}</p>
        </div>
      ) : liste.length === 0 ? (
        <div className="card py-14 text-center">
          <Icon name="flag" className="text-faint text-[36px]" />
          <p className="mt-2 text-sm text-muted">{objectifs.length === 0 ? "Aucun objectif pour l'instant — créez-en un ci-dessus." : cat === "Personnel" ? "Aucun objectif personnel." : "Aucun objectif partagé."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {liste.map((o) => <CarteObjectif key={o.id} objectif={o} onGerer={ouvrirGerer} onSupprimer={supprimer} />)}
        </div>
      )}

      {/* Modale Gérer l'objectif */}
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.portee === "Partagé" ? "Gérer l'objectif" : "Partager l'objectif"}
        subtitle={edit?.titre}
        icon="tune"
        footer={<><Button variant="ghost" onClick={() => setEdit(null)}>Annuler</Button><Button variant="primary" icon="check" onClick={enregistrer} disabled={editInvalide}>Enregistrer</Button></>}
      >
        {/* Avancement */}
        <p className="text-xs font-medium text-subtle mb-1.5">Avancement</p>
        <div className="flex items-center gap-3">
          <input type="range" min="0" max="100" value={eProg} onChange={(e) => { const v = Number(e.target.value); setEProg(v); if (v >= 100) setEStatut("Atteint"); }} className="flex-1 accent-brand-600" aria-label="Progression" />
          <span className="text-sm font-semibold tabular-nums text-ink w-12 text-right">{eProg} %</span>
        </div>
        <div className="mt-3">
          <Field label="Statut"><Select value={eStatut} onChange={(e) => setEStatut(e.target.value)}>{STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
        </div>

        {/* Partage */}
        <div className="mt-5 pt-4 border-t border-border">
          <Field label="Portée">{segPortee(ePortee, setEPortee)}</Field>
          {ePortee === "Partagé" && <div className="mt-3"><SelecteurMembres tous={eTous} setTous={setETous} ids={eIds} setIds={setEIds} /></div>}
        </div>
      </Modal>
    </div>
  );
}
