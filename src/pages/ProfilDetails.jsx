import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import BandeauAgent from "../components/ui/BandeauAgent.jsx";
import EditableField from "../components/ui/EditableField.jsx";
import DocumentsSection from "../components/profil/DocumentsSection.jsx";
import BadgeModal from "../components/badge/BadgeModal.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { apiGet, apiPut, apiPatch, apiUpload } from "../lib/api.js";
import { mapEmploye } from "../lib/mappers.js";
import { fcfa } from "../data/datasets.js";

// Statut API (present/retard/absent/conge) -> statut « live » attendu par le BandeauAgent.
const STATUT_LIVE = { present: "En activité", retard: "En activité", absent: "Absent", conge: "Congé" };

const tonePastille = {
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  sky: "bg-sky-50 text-sky-600",
  brand: "bg-brand-50 text-brand-600",
  slate: "bg-slate-50 text-slate-600",
};

// ---------------------------------------------------------------- options des selects
const SEXE_OPTS = [
  { value: "Homme", label: "Homme" },
  { value: "Femme", label: "Femme" },
  { value: "Autre", label: "Autre" },
];
const ETAT_CIVIL_OPTS = [
  { value: "Célibataire", label: "Célibataire" },
  { value: "Marié(e)", label: "Marié(e)" },
  { value: "Divorcé(e)", label: "Divorcé(e)" },
  { value: "Veuf(ve)", label: "Veuf(ve)" },
];
const TYPE_CONTRAT_OPTS = [
  { value: "CDI", label: "CDI" },
  { value: "CDD", label: "CDD" },
  { value: "Stage", label: "Stage" },
  { value: "Intérim", label: "Intérim" },
  { value: "Freelance", label: "Freelance" },
];
const STATUT_OPTS = [
  { value: "actif", label: "Actif" },
  { value: "conge", label: "En congé" },
  { value: "suspendu", label: "Suspendu" },
];

// ---------------------------------------------------------------- helpers data
const hhmm = (iso) => (iso ? String(iso).slice(11, 16) : "—");
function dateFr(iso) {
  if (!iso) return "—";
  const d = String(iso).slice(0, 10).split("-");
  return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : String(iso);
}
const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
function dateCourte(iso) {
  if (!iso) return "—";
  const p = String(iso).slice(0, 10).split("-");
  if (p.length !== 3) return String(iso);
  return `${Number(p[2])} ${MOIS_COURTS[Number(p[1]) - 1] ?? p[1]}`;
}
// Évènement RH -> icône + teinte de la frise.
function styleRH(evenement = "") {
  const e = evenement.toLowerCase();
  if (e.includes("paie") || e.includes("salaire") || e.includes("augment")) return { icon: "payments", tone: "emerald" };
  if (e.includes("avenant") || e.includes("contrat")) return { icon: "edit_document", tone: "sky" };
  if (e.includes("poste") || e.includes("mutation")) return { icon: "swap_horiz", tone: "amber" };
  if (e.includes("embauche") || e.includes("entrée")) return { icon: "person_add", tone: "brand" };
  return { icon: "history", tone: "slate" };
}
const aujourdHui = () => new Date().toISOString().slice(0, 10);
// "YYYY-MM-DD..." -> "YYYY-MM-DD" (valeur attendue par <input type="date">).
const dateInput = (iso) => (iso ? String(iso).slice(0, 10) : "");

function useScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const sc = document.querySelector("main.overflow-y-auto");
    if (!sc) return;
    const on = () => {
      const m = sc.scrollHeight - sc.clientHeight;
      setP(m > 0 ? sc.scrollTop / m : 0);
    };
    sc.addEventListener("scroll", on, { passive: true });
    on();
    return () => sc.removeEventListener("scroll", on);
  }, []);
  return p;
}

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Frise HORIZONTALE (Activité / Historique) — INCHANGÉE.
function Timeline({ items, champTime = "time", champType = "type", champDetail = "detail" }) {
  if (!items.length) {
    return <p className="text-sm text-muted py-4 text-center">Aucune donnée disponible.</p>;
  }
  return (
    <ol className="flex overflow-x-auto scroll-thin snap-x pb-1">
      {items.map((ev, i) => (
        <li key={i} className="relative grow shrink-0 basis-[130px] max-w-[220px] snap-start flex flex-col items-center text-center px-1.5">
          {i < items.length - 1 && <span className="absolute top-[13px] left-1/2 w-full h-0.5 bg-border" aria-hidden="true" />}
          <span className={`relative z-10 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${tonePastille[ev.tone] ?? tonePastille.slate}`}>
            <Icon name={ev.icon} className="text-[15px]" filled />
          </span>
          <p className="mt-2 text-[11px] font-mono tabular-nums text-subtle">{ev[champTime]}</p>
          <p className="mt-0.5 text-[13px] font-semibold text-ink leading-tight">{ev[champType]}</p>
          <p className="text-[11px] text-muted leading-snug line-clamp-2 min-h-[2.1rem] mt-0.5" title={ev[champDetail]}>{ev[champDetail]}</p>
        </li>
      ))}
    </ol>
  );
}

// En-tête de carte (rang 3).
function CardHeader({ icon, title, count, action }) {
  return (
    <div className="flex items-center gap-2 mb-3.5">
      <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
        <Icon name={icon} className="text-[18px]" filled />
      </span>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {count != null && <span className="ml-auto text-xs font-semibold tabular-nums text-muted bg-surface-2 px-2 py-0.5 rounded-full">{count}</span>}
      {action && <span className="ml-auto">{action}</span>}
    </div>
  );
}

function Bloc({ title, icon, count, children }) {
  return (
    <div className="card p-5">
      <CardHeader icon={icon} title={title} count={count} />
      {children}
    </div>
  );
}

// Carte d'édition (sous-section du Résumé) : en-tête avec icône « crayon » indicative.
function EditCard({ icon, title, children }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
          <Icon name={icon} className="text-[18px]" filled />
        </span>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-subtle">
          <Icon name="edit" className="text-[14px]" /> Cliquer pour modifier
        </span>
      </div>
      <div>{children}</div>
    </div>
  );
}

// En-tête de section (page Détails en défilement continu).
function Section({ id, icon, title, first, children }) {
  const hid = `${id}-titre`;
  return (
    <section id={id} aria-labelledby={hid} className="scroll-mt-20 space-y-4">
      {!first && <div className="-mx-5 md:-mx-8 border-t border-border" aria-hidden="true" />}
      <div className="flex items-center gap-2.5 pt-1">
        <span className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
          <Icon name={icon} className="text-[20px]" filled />
        </span>
        <h2 id={hid} className="text-lg font-semibold text-ink leading-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

const ANCRES = { Résumé: "resume", Pointages: "pointages", Activité: "activite", Documents: "documents", Historique: "historique" };

const VIDE = {
  activite: [],
  actDetail: { connexions: [], deconnexions: [], inactivites: [], justifications: [] },
  rh: [],
};

export default function ProfilDetails() {
  const { id } = useParams(); // :id = matricule
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, dataVersion } = useUI();
  const progress = useScrollProgress();

  const [e, setE] = useState(null); // employé « mappé » (BandeauAgent)
  const [emp, setEmp] = useState(null); // employé API COMPLET (source des EditableField)
  const [numericId, setNumericId] = useState(null);
  const [live, setLive] = useState("Absent");
  const [detail, setDetail] = useState(VIDE); // activite / actDetail / rh
  const [opts, setOpts] = useState({ postes: [], departements: [], superieurs: [] });
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [badgeOuvert, setBadgeOuvert] = useState(false);
  const photoRef = useRef(null);

  useEffect(() => {
    let actif = true;
    if (!e) setChargement(true); // spinner seulement au 1er chargement ; refresh = silencieux
    setErreur(null);
    setDetail(VIDE);

    // 1) Résolution matricule -> id numérique via la liste, + options des selects.
    Promise.all([apiGet("/api/employes"), apiGet("/api/dashboard/presence")])
      .then(async ([employesData, presence]) => {
        const liste = Array.isArray(employesData) ? employesData : [];
        const empApi = liste.find((x) => x.matricule === id);
        if (!empApi) {
          if (actif) { setE(null); setEmp(null); setChargement(false); }
          return null;
        }
        const nid = empApi.id;

        // Options selects : postes + départements + responsables.
        const postes = await apiGet("/api/postes").catch(() => null);
        const departements = await apiGet("/api/departements").catch(() => null);
        const optionsPostes = Array.isArray(postes) && postes.length
          ? postes.map((p) => ({ value: String(p.id), label: p.nom || p.intitule || p.code || `Poste ${p.id}` }))
          : deriverOptions(liste, "poste_id", "poste_libelle");
        const optionsDeps = Array.isArray(departements) && departements.length
          ? departements.map((d) => ({ value: String(d.id), label: d.nom || d.libelle || `Département ${d.id}` }))
          : deriverOptions(liste, "departement_id", "departement_nom");
        const optionsSup = liste
          .filter((x) => x.id !== nid)
          .map((x) => ({ value: String(x.id), label: x.name || `${x.prenom ?? ""} ${x.nom ?? ""}`.trim() || x.matricule }))
          .sort((a, b) => a.label.localeCompare(b.label));

        // 2) Employé COMPLET (tous les champs, incl. les 7 nouveaux) via GET /api/employes/{id}.
        const complet = await apiGet(`/api/employes/${nid}`).catch(() => empApi);
        const source = complet && typeof complet === "object" ? complet : empApi;

        const ag = (presence?.agents ?? []).find((a) => a.matricule === id || a.id === nid);

        if (actif) {
          setNumericId(nid);
          setEmp(source);
          setE(mapEmploye(source));
          setLive(ag ? STATUT_LIVE[ag.statut] ?? "Absent" : "Absent");
          setOpts({ postes: optionsPostes, departements: optionsDeps, superieurs: optionsSup });
        }

        // 3) Sous-ressources Activité / Historique (INCHANGÉES). Documents gérés par <DocumentsSection>.
        const jour = aujourdHui();
        return Promise.all([
          apiGet(`/api/employes/${nid}/historique-rh`).catch(() => []),
          apiGet(`/api/sessions?employe_id=${nid}`).catch(() => []),
          apiGet(`/api/incidents?employe_id=${nid}&from=${jour}&to=${jour}`).catch(() => []),
        ]).then(([histo, sessions, incidents]) => {
          if (!actif) return;
          setDetail(construireDetail(histo, sessions, incidents, jour));
        });
      })
      .catch((err) => {
        if (actif) setErreur(err?.message || "Erreur de chargement");
      })
      .finally(() => {
        if (actif) setChargement(false);
      });

    return () => { actif = false; };
  }, [id, dataVersion]);

  // Défilement vers la section demandée.
  useEffect(() => {
    const ancre = ANCRES[location.state?.onglet];
    if (!ancre) return;
    const raf = requestAnimationFrame(() => {
      document.getElementById(ancre)?.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
      navigate(location.pathname, { replace: true, state: {} });
    });
    return () => cancelAnimationFrame(raf);
  }, [location.state, location.pathname, navigate]);

  // ---- Sauvegarde d'un champ employé (PUT partiel) + MAJ optimiste du state ----
  // Renvoie une promesse : rejette en cas d'échec -> EditableField restaure l'ancienne valeur.
  const enregistrerChamp = (champ) => async (valeur) => {
    const payload = { [champ]: normaliser(champ, valeur) };
    const maj = await apiPut(`/api/employes/${numericId}`, payload);
    // L'API renvoie l'employé enrichi : on le reprend pour rester cohérent (libellés, etc.).
    setEmp((prev) => (maj && typeof maj === "object" ? maj : { ...prev, ...payload }));
    setE((prev) => (maj && typeof maj === "object" ? mapEmploye(maj) : prev));
  };

  // Matricule / code_pin -> PATCH identifiants (pas PUT).
  const enregistrerIdentifiant = (champ) => async (valeur) => {
    await apiPatch(`/api/employes/${numericId}/identifiants`, { [champ]: valeur });
    if (champ === "matricule") {
      setEmp((prev) => ({ ...prev, matricule: valeur }));
      // Le matricule change l'URL (route :id) : on resynchronise.
      navigate(`/employes/${valeur}/details`, { replace: true });
    }
  };

  // Upload photo -> /api/fichiers puis PUT photo_url.
  const choisirPhoto = async (ev) => {
    const f = ev.target.files?.[0];
    ev.target.value = "";
    if (!f) return;
    if (!/^image\//.test(f.type)) return toast("Image uniquement (JPG, PNG, WebP).", "error");
    try {
      const up = await apiUpload("/api/fichiers", f);
      const url = up?.url;
      if (!url) throw new Error("Téléversement sans URL renvoyée");
      await apiPut(`/api/employes/${numericId}`, { photo_url: url });
      setEmp((prev) => ({ ...prev, photo_url: url }));
      setE((prev) => (prev ? { ...prev, photo: url } : prev));
      toast("Photo mise à jour", "success");
    } catch (err) {
      toast(err?.message || "Téléversement de la photo impossible", "error");
    }
  };

  if (chargement) {
    return (
      <div className="card py-16 text-center max-w-lg mx-auto">
        <Icon name="progress_activity" className="text-brand-600 text-[40px] animate-spin" />
        <p className="mt-2 text-sm text-muted">Chargement du dossier agent…</p>
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

  if (!e || !emp) {
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

  const { activite, actDetail, rh } = detail;

  return (
    <div className="space-y-7 pb-12">
      {/* Progression de défilement (repère passif) */}
      <div className="sticky top-0 z-20 -mx-5 md:-mx-8 -mt-6 md:-mt-8 h-0.5 bg-transparent" aria-hidden="true">
        <div className="h-full bg-or-500/80 transition-[width] duration-150" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>

      {/* Barre : retour + badge */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => navigate(`/employes/${id}`)}
          className="group inline-flex items-center gap-1.5 h-9 pl-2 pr-3.5 rounded-full bg-surface border border-border text-sm font-medium text-muted hover:text-ink hover:border-border-strong hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          <Icon name="arrow_back" className="text-[18px] group-hover:-translate-x-0.5 transition-transform" />
          Retour à la présence
        </button>
        <button
          onClick={() => setBadgeOuvert(true)}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          <Icon name="badge" className="text-[18px]" />
          Badge
        </button>
      </div>

      <BadgeModal open={badgeOuvert} onClose={() => setBadgeOuvert(false)} employe={{ ...e, photo_url: emp?.photo_url }} />

      <BandeauAgent
        e={e}
        live={live}
        onPaiements={() => navigate(`/employes/${id}/paiement`)}
        onPlus={() => navigate(`/pointage-horaires/${id}?solo=1`)}
        plusLabel="Pointage & Horaires"
        plusIcon="event_available"
      />

      {/* ---------- RÉSUMÉ (éditable inline) ---------- */}
      <Section id="resume" icon="badge" title="Résumé" first>
        {/* Photo de profil */}
        <div className="card p-5 flex items-center gap-4">
          <span className="w-16 h-16 rounded-2xl bg-surface-2 border border-border overflow-hidden flex items-center justify-center shrink-0">
            {emp.photo_url ? (
              <img src={emp.photo_url} alt="Photo de l'agent" className="w-full h-full object-cover" />
            ) : (
              <Icon name="person" className="text-faint text-[30px]" filled />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Photo de profil</p>
            <input ref={photoRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={choisirPhoto} />
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-2 text-texte border border-border-strong hover:border-or-500/60 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
            >
              <Icon name="photo_camera" className="text-[16px]" /> {emp.photo_url ? "Changer la photo" : "Ajouter une photo"}
            </button>
            <p className="text-xs text-subtle mt-1.5">JPG, PNG ou WebP.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Identité */}
          <EditCard icon="badge" title="Identité">
            <EditableField icon="person" label="Nom" value={emp.nom ?? ""} onSave={enregistrerChamp("nom")} />
            <EditableField icon="person" label="Prénom" value={emp.prenom ?? ""} onSave={enregistrerChamp("prenom")} />
            <EditableField icon="wc" label="Sexe" type="select" options={SEXE_OPTS} placeholder="Non renseigné" value={emp.sexe ?? ""} onSave={enregistrerChamp("sexe")} />
            <EditableField icon="cake" label="Naissance" type="date" value={dateInput(emp.date_naissance)} display={() => dateFr(emp.date_naissance)} onSave={enregistrerChamp("date_naissance")} />
            <EditableField icon="public" label="Nationalité" value={emp.nationalite ?? ""} onSave={enregistrerChamp("nationalite")} />
            <EditableField icon="favorite" label="État civil" type="select" options={ETAT_CIVIL_OPTS} placeholder="Non renseigné" value={emp.etat_civil ?? ""} onSave={enregistrerChamp("etat_civil")} />
          </EditCard>

          {/* Identifiants */}
          <EditCard icon="key" title="Identifiants">
            <EditableField
              icon="badge"
              label="Matricule"
              value={emp.matricule ?? ""}
              onSave={enregistrerIdentifiant("matricule")}
              validate={(v) => (!String(v).trim() ? "Le matricule est obligatoire." : null)}
            />
            <EditableField
              icon="pin"
              label="Code PIN"
              type="password"
              placeholder="4 chiffres"
              inputMode="numeric"
              maxLength={4}
              value=""
              display={() => "••••"}
              emptyText="••••"
              successText="Code PIN mis à jour"
              onSave={enregistrerIdentifiant("code_pin")}
              validate={(v) => (/^\d{4}$/.test(String(v)) ? null : "Le code PIN doit contenir exactement 4 chiffres.")}
            />
          </EditCard>

          {/* Coordonnées */}
          <EditCard icon="contact_mail" title="Coordonnées">
            <EditableField
              icon="mail"
              label="Email"
              type="email"
              value={emp.email ?? ""}
              onSave={enregistrerChamp("email")}
              validate={(v) => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Adresse e-mail invalide.")}
            />
            <EditableField icon="call" label="Téléphone" type="tel" value={emp.telephone ?? ""} onSave={enregistrerChamp("telephone")} />
            <EditableField icon="home" label="Adresse" value={emp.adresse ?? ""} onSave={enregistrerChamp("adresse")} />
          </EditCard>

          {/* Poste & contrat */}
          <EditCard icon="business_center" title="Poste & contrat">
            <EditableField
              icon="work"
              label="Poste"
              type="select"
              options={opts.postes}
              placeholder="Non assigné"
              value={emp.poste_id != null ? String(emp.poste_id) : ""}
              display={() => emp.poste_libelle || "—"}
              onSave={enregistrerChamp("poste_id")}
            />
            <EditableField
              icon="domain"
              label="Département"
              type="select"
              options={opts.departements}
              placeholder="Non assigné"
              value={emp.departement_id != null ? String(emp.departement_id) : ""}
              display={() => emp.departement_nom || "—"}
              onSave={enregistrerChamp("departement_id")}
            />
            <EditableField
              icon="supervisor_account"
              label="Responsable"
              type="select"
              options={opts.superieurs}
              placeholder="Aucun"
              value={emp.superieur_id != null ? String(emp.superieur_id) : ""}
              display={() => emp.manager_nom?.trim() || emp.superieur_nom?.trim() || "—"}
              onSave={enregistrerChamp("superieur_id")}
            />
            <EditableField icon="event" label="Embauche" type="date" value={dateInput(emp.date_embauche)} display={() => dateFr(emp.date_embauche)} onSave={enregistrerChamp("date_embauche")} />
            <EditableField icon="description" label="Type contrat" type="select" options={TYPE_CONTRAT_OPTS} placeholder="Non renseigné" value={emp.type_contrat ?? ""} onSave={enregistrerChamp("type_contrat")} />
            <EditableField
              icon="toggle_on"
              label="Statut"
              type="select"
              options={STATUT_OPTS}
              value={emp.statut ?? "actif"}
              display={() => (STATUT_OPTS.find((s) => s.value === emp.statut)?.label ?? emp.statut ?? "—")}
              onSave={enregistrerChamp("statut")}
            />
            <EditableField
              icon="payments"
              label="Salaire"
              type="number"
              min="0"
              value={emp.salaire ?? ""}
              display={() => (emp.salaire != null && emp.salaire !== "" ? fcfa(Number(emp.salaire)) : "—")}
              onSave={enregistrerChamp("salaire")}
            />
          </EditCard>

          {/* Contact d'urgence */}
          <EditCard icon="emergency" title="Contact d'urgence">
            <EditableField icon="person" label="Nom" value={emp.contact_urgence_nom ?? ""} onSave={enregistrerChamp("contact_urgence_nom")} />
            <EditableField icon="diversity_1" label="Lien" value={emp.contact_urgence_lien ?? ""} onSave={enregistrerChamp("contact_urgence_lien")} />
            <EditableField icon="call" label="Téléphone" type="tel" value={emp.contact_urgence_tel ?? ""} onSave={enregistrerChamp("contact_urgence_tel")} />
          </EditCard>

          {/* Notes */}
          <EditCard icon="sticky_note_2" title="Notes administratives">
            <EditableField
              label="Notes"
              type="textarea"
              placeholder="Notes internes (visibles par l'admin uniquement)…"
              value={emp.notes_admin ?? ""}
              onSave={enregistrerChamp("notes_admin")}
            />
          </EditCard>
        </div>
      </Section>

      {/* ---------- POINTAGES (INCHANGÉ) ---------- */}
      <Section id="pointages" icon="fingerprint" title="Pointages">
        <button
          type="button"
          onClick={() => navigate(`/employes/${id}/pointages`)}
          className="group w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-600 p-5 text-left flex items-center gap-4 shadow-card hover:to-brand-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or-400 focus-visible:ring-offset-2"
        >
          <span className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-white/5" aria-hidden="true" />
          <span className="relative w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0">
            <Icon name="edit_calendar" className="text-[22px]" filled />
          </span>
          <div className="relative flex-1 min-w-0">
            <p className="text-white font-semibold">Gérer les pointages</p>
            <p className="text-white/70 text-sm">Voir et corriger les pointages du jour (réservé à l'admin).</p>
          </div>
          <Icon name="arrow_forward" className="relative text-white text-[22px] shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </Section>

      {/* ---------- ACTIVITÉ (INCHANGÉ) ---------- */}
      <Section id="activite" icon="bolt" title="Activité du jour">
        <div className="grid grid-cols-2 gap-3 lg:gap-4">
          <Bloc title="Connexions" icon="login" count={actDetail.connexions.length}>
            <ul className="text-sm divide-y divide-border">
              {actDetail.connexions.map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                  <span className="text-muted truncate">Poste {c.poste}</span>
                  <span className="font-mono tabular-nums text-texte shrink-0">{c.time}</span>
                </li>
              ))}
            </ul>
          </Bloc>
          <Bloc title="Déconnexions" icon="logout" count={actDetail.deconnexions.length}>
            <ul className="text-sm divide-y divide-border">
              {actDetail.deconnexions.map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                  <span className="text-muted truncate">{c.motif}</span>
                  <span className="font-mono tabular-nums text-texte shrink-0">{c.time}</span>
                </li>
              ))}
            </ul>
          </Bloc>
          <Bloc title="Inactivités" icon="motion_photos_paused" count={actDetail.inactivites.length}>
            <ul className="text-sm divide-y divide-border">
              {actDetail.inactivites.map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                  <span className="text-muted truncate">Dès {c.debut}</span>
                  <span className="font-medium text-amber-600 shrink-0">{c.duree}</span>
                </li>
              ))}
            </ul>
          </Bloc>
          <Bloc title="Justifications" icon="verified" count={actDetail.justifications.length}>
            <ul className="text-sm divide-y divide-border">
              {actDetail.justifications.map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                  <span className="text-texte truncate">{c.date} · {c.motif}</span>
                  <StatusPill label={c.statut} tone="emerald" />
                </li>
              ))}
            </ul>
          </Bloc>
          <div className="col-span-2">
            <Bloc title="Journal du jour" icon="schedule">
              <Timeline items={activite} />
            </Bloc>
          </div>
        </div>
      </Section>

      {/* ---------- DOCUMENTS (CRUD complet) ---------- */}
      <Section id="documents" icon="folder" title="Documents">
        <DocumentsSection numericId={numericId} />
      </Section>

      {/* ---------- HISTORIQUE (INCHANGÉ) ---------- */}
      <Section id="historique" icon="history" title="Historique">
        <div className="card p-5">
          <Timeline items={rh} champTime="date" />
        </div>
        <p className="text-center text-xs text-faint pt-1">Fin du dossier agent</p>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------- helpers métier

// Champs numériques/FK -> envoyés comme nombre (ou null si vidés).
const CHAMPS_NUM = ["poste_id", "departement_id", "superieur_id", "salaire"];

// Normalise la valeur d'un champ avant PUT.
//  - vide -> null (les champs sont NULLABLE côté API ; le contrôleur n'altère que les champs fournis) ;
//  - FK / salaire -> Number ; le reste reste une chaîne nettoyée.
function normaliser(champ, valeur) {
  const v = typeof valeur === "string" ? valeur.trim() : valeur;
  if (v === "" || v == null) return null;
  if (CHAMPS_NUM.includes(champ)) return Number(v);
  return v;
}

// Dérive des options { value, label } depuis la liste d'employés (repli si /api/postes|departements absent).
function deriverOptions(liste, champId, champLabel) {
  const m = new Map();
  for (const x of liste) {
    if (x[champId] != null && x[champLabel]) m.set(String(x[champId]), x[champLabel]);
  }
  return [...m].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
}

// Construit Activité du jour + Historique RH (DOCUMENTS retirés : gérés par <DocumentsSection>).
function construireDetail(histo, sessions, incidents, jour) {
  const rh = (Array.isArray(histo) ? histo : []).map((h) => {
    const s = styleRH(h.evenement);
    return { date: dateFr(h.date), type: h.evenement, detail: h.detail || "", icon: s.icon, tone: s.tone };
  });

  const sessionsJour = (Array.isArray(sessions) ? sessions : []).filter(
    (s) => String(s.heure_debut ?? "").slice(0, 10) === jour
  );
  const poste = (s) => (s.poste_travail_id != null ? String(s.poste_travail_id) : "distant");
  const connexions = sessionsJour.filter((s) => s.heure_debut).map((s) => ({ time: hhmm(s.heure_debut), poste: poste(s) }));
  const deconnexions = sessionsJour.filter((s) => s.heure_fin).map((s) => ({ time: hhmm(s.heure_fin), motif: "Fin de session" }));

  const incJour = Array.isArray(incidents) ? incidents : [];
  const inactivites = incJour.map((i) => ({
    debut: hhmm(i.heure_verrouillage),
    duree: i.duree_minutes != null ? `${i.duree_minutes} min` : "—",
  }));
  const justifications = incJour
    .filter((i) => i.motif || i.justification)
    .map((i) => ({
      date: dateCourte(i.heure_verrouillage),
      motif: i.motif || i.justification,
      statut: i.statut === "justifie" ? "Approuvée" : i.statut || "—",
    }));

  const activite = [
    ...sessionsJour.filter((s) => s.heure_debut).map((s) => ({
      time: hhmm(s.heure_debut), type: "Connexion", detail: `Poste ${poste(s)}`, icon: "login", tone: "emerald", _t: s.heure_debut,
    })),
    ...sessionsJour.filter((s) => s.heure_fin).map((s) => ({
      time: hhmm(s.heure_fin), type: "Déconnexion", detail: `Poste ${poste(s)}`, icon: "logout", tone: "slate", _t: s.heure_fin,
    })),
    ...incJour.map((i) => ({
      time: hhmm(i.heure_verrouillage), type: "Inactivité", detail: i.motif || i.justification || "Poste verrouillé", icon: "motion_photos_paused", tone: "amber", _t: i.heure_verrouillage,
    })),
  ]
    .sort((a, b) => String(a._t).localeCompare(String(b._t)))
    .map(({ _t, ...ev }) => ev);

  return { activite, actDetail: { connexions, deconnexions, inactivites, justifications }, rh };
}
