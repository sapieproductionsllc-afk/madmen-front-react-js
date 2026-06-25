import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { apiGet, apiPost, apiPut, apiUpload } from "../lib/api.js";

/* ============================================================================
   MADMEN — Enrôlement biométrique (écran « vitrine », brief premium).
   Palette locale : crème + teal profond + or discret.
   Fond crème #EFEBE0 · carte #FFFFFF · texte #2B2A27 / #6F6B60 / #8C8678
   filets #E6E1D4 · bord champ #DAD4C5 · champ inactif #FBF9F4
   teal hero #16463D · marque #1C5C50 · accent #1E7D67 · soft #E7F0EC
   or #C49A4A (clair) / #E7C173 (foncé)
   ========================================================================== */

const champClass =
  "w-full h-10 rounded-[9px] bg-[#FBF9F4] border border-[#DAD4C5] px-3 text-[13.5px] text-[#2B2A27] placeholder:text-[#A39E90] outline-none transition focus:border-[#1E7D67] focus:ring-[3px] focus:ring-[#1E7D67]/20";

const etapes = [
  { id: 0, label: "Profil", sub: "Identité & poste", icon: "badge" },
  { id: 1, label: "Accès", sub: "Empreinte, badge & validation", icon: "fingerprint" },
];

const aide = {
  0: "Renseignez l'identité et le poste. Seuls le prénom et le nom sont obligatoires — le reste se complète plus tard. Le matricule MADMEN est généré automatiquement.",
  1: "Capturez l'empreinte (optionnel), associez le badge et le code PIN, puis validez. L'employé pourra pointer immédiatement.",
};

// Options des champs RH (listes fermées).
const SEXES = ["Homme", "Femme", "Autre"];
const ETATS_CIVILS = ["Célibataire", "Marié(e)", "Divorcé(e)", "Veuf(ve)", "Union libre"];
const TYPES_CONTRAT = ["CDI", "CDD", "Stage", "Intérim", "Consultant"];
// Rôles proposés à l'enrôlement (super_admin volontairement exclu — voir la fiche).
const ROLES = [["employe", "Employé"], ["superviseur", "Superviseur"], ["directeur", "Directeur"]];

// Motif de code-barres fixe (déterministe) — largeurs en px, alternance barre/espace.
const BARRES = [3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1, 1, 2, 1, 2, 1, 3, 1, 2, 1, 1, 2];

function initialesDe(nom) {
  return nom.trim().split(/\s+/).map((m) => m[0]).slice(0, 2).join("").toUpperCase();
}

// Champ de formulaire (label au-dessus, grille régulière).
function Champ({ label, full, children }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-[11.5px] font-medium text-[#6F6B60] mb-1.5">{label}</span>
      {children}
    </label>
  );
}

// Section du formulaire (petit en-tête numéroté pour aérer une étape dense).
function Section({ num, titre, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-5 h-5 rounded-md bg-[#E7F0EC] text-[#1C5C50] text-[11px] font-bold flex items-center justify-center shrink-0">{num}</span>
        <span className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#6F6B60]">{titre}</span>
      </div>
      {children}
    </div>
  );
}

// Aperçu live du badge employé (carte blanche, en-tête teal, puce RFID, code-barres).
function BadgeEmploye({ form, photo, empreinteOk, matricule, pin }) {
  const lignes = [
    ["Matricule", matricule, true, false],
    ["Département", form.departement.trim() || "—", false, false],
    ["Badge RFID", form.badge.trim() || "—", true, false],
    ["Empreinte", empreinteOk ? "Enregistrée" : "—", false, empreinteOk],
    ["Code PIN", pin ? "••••" : "—", true, false],
  ];
  return (
    <div className="bg-white rounded-[14px] border border-[#E6E1D4] overflow-hidden shadow-[0_8px_24px_-12px_rgba(22,70,61,0.22)]">
      {/* En-tête teal */}
      <div className="relative bg-[#16463D] px-4 pt-3.5 pb-4 overflow-hidden">
        <Icon name="fingerprint" filled aria-hidden="true" className="pointer-events-none absolute -right-3 -bottom-6 text-white/[0.07] text-[90px] leading-none" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center">
              <Icon name="fingerprint" filled className="text-[#E7C173] text-[12px]" />
            </span>
            <span className="text-[11px] font-medium text-white tracking-wide">MADMEN</span>
          </div>
          <span className="self-center text-[9.5px] font-medium uppercase tracking-[0.16em] text-white/70">Carte d'accès</span>
        </div>
      </div>

      <div className="px-4 pb-4">
        {/* Identité — photo + nom ENTIÈREMENT dans la zone blanche (plus de chevauchement
            sur l'en-tête teal, qui rognait le haut du nom). */}
        <div className="mt-4 flex items-center gap-3">
          {photo ? (
            <img src={photo} alt="" className="w-16 h-16 rounded-xl object-cover ring-4 ring-white shrink-0" />
          ) : `${form.prenom} ${form.nom}`.trim() ? (
            <div className="w-16 h-16 rounded-xl ring-4 ring-white bg-[#E7F0EC] text-[#1C5C50] flex items-center justify-center text-lg font-medium shrink-0">
              {initialesDe(`${form.prenom} ${form.nom}`)}
            </div>
          ) : (
            <div className="w-16 h-16 rounded-xl ring-4 ring-white bg-[#FBF9F4] border border-[#E6E1D4] flex items-center justify-center shrink-0">
              <Icon name="person" className="text-[#A39E90] text-[28px]" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-[#2B2A27] truncate leading-tight">{`${form.prenom} ${form.nom}`.trim() || "Nouvel employé"}</p>
            <p className="text-[12px] text-[#6F6B60] truncate">{form.fonction.trim() || "Fonction à définir"}</p>
          </div>
        </div>

        {/* Puce RFID dorée */}
        <div className="mt-4 w-9 h-7 rounded-[5px] bg-gradient-to-br from-[#E7C173] to-[#C49A4A] ring-1 ring-[#C49A4A]/40 relative" aria-hidden="true">
          <span className="absolute inset-x-1.5 top-1/2 -translate-y-1/2 h-px bg-[#16463D]/25" />
          <span className="absolute inset-y-1.5 left-1/2 -translate-x-1/2 w-px bg-[#16463D]/25" />
        </div>

        {/* Champs du badge — grille label/valeur alignée */}
        <dl className="mt-4 space-y-2 text-[12px]">
          {lignes.map(([k, v, mono, ok]) => (
            <div key={k} className="flex items-baseline justify-between gap-3">
              <dt className="text-[#A39E90]">{k}</dt>
              <dd className={`text-right ${ok ? "text-[#1E7D67] font-medium" : "text-[#2B2A27]"} ${mono ? "font-mono tabular-nums" : ""}`}>{v}</dd>
            </div>
          ))}
        </dl>

        {/* Code-barres */}
        <div className="mt-4 pt-3 border-t border-[#E6E1D4]">
          <div className="flex items-stretch justify-center h-9" aria-hidden="true">
            {BARRES.map((w, i) => (
              <span key={i} className={i % 2 ? "bg-transparent" : "bg-[#2B2A27]"} style={{ width: `${w}px` }} />
            ))}
          </div>
          <p className="mt-1.5 text-[10px] font-mono tracking-[0.2em] text-[#A39E90] text-center">{matricule}</p>
        </div>
      </div>
    </div>
  );
}

export default function Enrolement() {
  const { toast } = useUI();
  const navigate = useNavigate();
  const { id: editId } = useParams(); // présent => mode « Modifier »
  const editMode = Boolean(editId);
  const [etape, setEtape] = useState(0);
  const [form, setForm] = useState({
    prenom: "", nom: "", fonction: "", departement: "", email: "", badge: "", pin: "",
    sexe: "", date_naissance: "", nationalite: "", etat_civil: "",
    telephone: "", adresse: "",
    contact_urgence_nom: "", contact_urgence_tel: "", contact_urgence_lien: "",
    date_embauche: "", type_contrat: "", role: "",
  });
  // poste_id / departement_id / superieur_id sélectionnés (FK envoyées à l'API).
  const [posteId, setPosteId] = useState("");
  const [departementId, setDepartementId] = useState("");
  const [superieurId, setSuperieurId] = useState("");
  const [photo, setPhoto] = useState(null); // aperçu (data URL) pour le badge
  const [photoFile, setPhotoFile] = useState(null); // fichier brut à téléverser
  const [captures, setCaptures] = useState(0);
  const [template, setTemplate] = useState(null); // dernier gabarit capturé (réel, via l'agent)
  const [scanning, setScanning] = useState(false);
  const [atteste, setAtteste] = useState(false);
  const [done, setDone] = useState(false);
  const [enregistre, setEnregistre] = useState(false); // création API en cours
  // Listes alimentant les <select> (postes/départements), dérivées de l'API.
  const [postes, setPostes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [superieurs, setSuperieurs] = useState([]); // employés (pour « supérieur hiérarchique »)
  // Résultat réel renvoyé par l'API après création (matricule + PIN générés).
  const [cree, setCree] = useState(null);

  // Au montage : on tente d'alimenter les <select> à partir des données réelles.
  // GET /api/config/postes ne renvoie que des seuils (pas une liste) : on dérive
  // donc les postes/départements de la liste des employés. Dégradation gracieuse :
  // toute erreur laisse simplement les listes vides (saisie texte de repli).
  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        const employes = await apiGet("/api/employes");
        if (!actif || !Array.isArray(employes)) return;
        const pMap = new Map();
        const dMap = new Map();
        for (const e of employes) {
          if (e.poste_id != null && e.poste_libelle) pMap.set(String(e.poste_id), e.poste_libelle);
          if (e.departement_id != null && e.departement_nom) dMap.set(String(e.departement_id), e.departement_nom);
        }
        setPostes([...pMap].map(([id, intitule]) => ({ id, intitule })).sort((a, b) => a.intitule.localeCompare(b.intitule)));
        setDepartements([...dMap].map(([id, nom]) => ({ id, nom })).sort((a, b) => a.nom.localeCompare(b.nom)));
        setSuperieurs(
          employes
            .map((e) => ({ id: String(e.id), nom: (e.name || `${e.prenom ?? ""} ${e.nom ?? ""}`.trim()) || `#${e.id}` }))
            .sort((a, b) => a.nom.localeCompare(b.nom)),
        );
      } catch {
        /* API indisponible : on garde les listes vides, saisie texte de repli */
      }
    })();
    return () => {
      actif = false;
    };
  }, []);

  // Mode édition : pré-remplit le wizard avec l'employé existant (GET /api/employes/{id}).
  useEffect(() => {
    if (!editId) return undefined;
    let actif = true;
    apiGet(`/api/employes/${editId}`)
      .then((e) => {
        if (!actif || !e) return;
        setForm((f) => ({
          ...f,
          prenom: e.prenom || "",
          nom: e.nom || "",
          fonction: e.poste_libelle || "",
          departement: e.departement_nom || "",
          email: e.email || "",
          sexe: e.sexe || "",
          date_naissance: e.date_naissance || "",
          nationalite: e.nationalite || "",
          etat_civil: e.etat_civil || "",
          telephone: e.telephone || "",
          adresse: e.adresse || "",
          contact_urgence_nom: e.contact_urgence_nom || "",
          contact_urgence_tel: e.contact_urgence_tel || "",
          contact_urgence_lien: e.contact_urgence_lien || "",
          date_embauche: e.date_embauche || "",
          type_contrat: e.type_contrat || "",
          role: e.role || "",
        }));
        if (e.poste_id != null) setPosteId(String(e.poste_id));
        if (e.departement_id != null) setDepartementId(String(e.departement_id));
        if (e.superieur_id != null) setSuperieurId(String(e.superieur_id));
        if (e.photo_url) setPhoto(e.photo_url);
      })
      .catch(() => toast("Impossible de charger l'employé à modifier", "error"));
    return () => {
      actif = false;
    };
  }, [editId]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const empreinteOk = captures >= 3;
  const pct = Math.round(((etape + 1) / 2) * 100);
  const pinValide = /^\d{4}$/.test(form.pin);
  // Matricule affiché : le VRAI renvoyé par l'API une fois créé, sinon un placeholder.
  const matricule = cree?.matricule || (`${form.prenom} ${form.nom}`.trim() ? "AUR-…" : "AUR-————");

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  // Capture RÉELLE via l'agent d'empreintes local (Live20, http://127.0.0.1:8080).
  // L'agent BLOQUE jusqu'à ce qu'un doigt soit posé ; on ne compte le passage QUE si
  // un vrai gabarit de qualité suffisante est lu. Délai max 25 s (sinon on annule).
  const scanner = async () => {
    if (scanning || empreinteOk) return;
    setScanning(true);
    const ctrl = new AbortController();
    const minuteur = setTimeout(() => ctrl.abort(), 25000);
    try {
      const r = await fetch("http://127.0.0.1:8080/capture", { method: "POST", body: "", signal: ctrl.signal });
      if (!r.ok) throw new Error("http");
      const j = await r.json();
      // Garde-fou : pas de gabarit ou qualité nulle = pas de vrai doigt -> on ne compte pas.
      if (!j.template || (typeof j.quality === "number" && j.quality <= 0)) {
        toast("Doigt non détecté — repositionnez le doigt bien à plat et réessayez", "info");
        return;
      }
      setTemplate(j.template);
      setCaptures((c) => Math.min(c + 1, 3));
    } catch (e) {
      toast(
        e?.name === "AbortError"
          ? "Aucun doigt détecté (délai dépassé) — réessayez"
          : "Lecteur d'empreintes indisponible — branchez le Live20 (app desktop requise)",
        "error",
      );
    } finally {
      clearTimeout(minuteur);
      setScanning(false);
    }
  };

  // Navigation 100% LIBRE entre les étapes (aucun blocage gauche/droite).
  // Le SEUL contrôle est à l'ENVOI : seul le NOM est obligatoire (+ attestation).
  // Tout le reste peut être complété plus tard via « Modifier ».
  const peutEnvoyer = form.prenom.trim().length > 0 && form.nom.trim().length > 0 && atteste;

  const suivant = () => setEtape((e) => Math.min(e + 1, 1));
  const precedent = () => setEtape((e) => Math.max(e - 1, 0));

  // Création RÉELLE de l'employé. Sépare « nom complet » en prénom + nom, téléverse
  // la photo si présente, puis POST /api/employes. Le PIN et le matricule sont
  // générés côté serveur : on affiche ceux renvoyés (code_pin_genere, matricule).
  const terminer = async () => {
    if (!atteste || enregistre) return;
    setEnregistre(true);

    // Prénom + nom saisis SÉPARÉMENT (plus de découpage hasardeux d'un « nom complet »).
    const prenom = form.prenom.trim();
    const nom = form.nom.trim();

    try {
      // Téléversement optionnel de la photo (best-effort : un échec n'empêche pas
      // la création de l'employé, on continue sans photo_url).
      let photoUrl = null;
      if (photoFile) {
        try {
          const up = await apiUpload("/api/fichiers", photoFile);
          photoUrl = up?.url || null;
        } catch {
          toast("Photo non téléversée — l'employé sera créé sans photo", "info");
        }
      }

      const payload = {
        nom,
        prenom,
        statut: "actif",
      };
      if (posteId) payload.poste_id = Number(posteId);
      if (departementId) payload.departement_id = Number(departementId);
      if (superieurId) payload.superieur_id = Number(superieurId);
      if (form.email.trim()) payload.email = form.email.trim();
      if (form.telephone.trim()) payload.telephone = form.telephone.trim();
      if (form.adresse.trim()) payload.adresse = form.adresse.trim();
      if (form.sexe) payload.sexe = form.sexe;
      if (form.date_naissance) payload.date_naissance = form.date_naissance;
      if (form.nationalite.trim()) payload.nationalite = form.nationalite.trim();
      if (form.etat_civil) payload.etat_civil = form.etat_civil;
      if (form.contact_urgence_nom.trim()) payload.contact_urgence_nom = form.contact_urgence_nom.trim();
      if (form.contact_urgence_tel.trim()) payload.contact_urgence_tel = form.contact_urgence_tel.trim();
      if (form.contact_urgence_lien.trim()) payload.contact_urgence_lien = form.contact_urgence_lien.trim();
      if (form.date_embauche) payload.date_embauche = form.date_embauche;
      if (form.type_contrat) payload.type_contrat = form.type_contrat;
      if (form.role) payload.role = form.role;
      if (photoUrl) payload.photo_url = photoUrl;

      const res = editMode
        ? await apiPut(`/api/employes/${editId}`, payload)
        : await apiPost("/api/employes", payload);
      const empId = res?.id ?? editId;
      setCree(res || {});

      // Enregistre l'empreinte (si re-capturée) + la pousse au K40 -> pointage au doigt.
      if (template && empId) {
        try {
          await apiPost(`/api/employes/${empId}/biometrie`, { type: "empreinte", template, doigt: "index_droit" });
          await apiPost(`/api/k40/push-user/${empId}`, {});
          await apiPost("/api/k40/push-fingerprints", {});
        } catch {
          toast("Employé enregistré — pense à cliquer « Synchroniser le K40 » dans Appareils", "info");
        }
      }

      setDone(true);
      toast(`${prenom} ${nom} a été ${editMode ? "modifié" : "enrôlé"} avec succès`);
    } catch (err) {
      toast(err?.message || "Échec de la création de l'employé", "error");
    } finally {
      setEnregistre(false);
    }
  };

  const recommencer = () => {
    setDone(false);
    setEtape(0);
    setForm({
      prenom: "", nom: "", fonction: "", departement: "", email: "", badge: "", pin: "",
      sexe: "", date_naissance: "", nationalite: "", etat_civil: "",
      telephone: "", adresse: "",
      contact_urgence_nom: "", contact_urgence_tel: "", contact_urgence_lien: "",
      date_embauche: "", type_contrat: "", role: "",
    });
    setPosteId("");
    setDepartementId("");
    setSuperieurId("");
    setPhoto(null);
    setPhotoFile(null);
    setCaptures(0);
    setTemplate(null);
    setAtteste(false);
    setCree(null);
  };

  const Ambiance = (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="absolute -top-24 right-10 w-[30rem] h-[30rem] rounded-full bg-[#1E7D67]/[0.07] blur-3xl" />
      <span className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-[#C49A4A]/10 blur-3xl" />
    </div>
  );

  // Puce kicker dorée (accent réutilisé).
  const PuceOr = <span className="w-1.5 h-1.5 rounded-full bg-[#E7C173] shadow-[0_0_6px_0_rgba(231,193,115,0.7)]" />;

  // ---------- Écran de succès ----------
  if (done) {
    return (
      <div className="max-w-3xl mx-auto reveal">
        <div className="relative overflow-hidden rounded-[18px] bg-[#16463D] px-8 py-10 text-center">
          <Icon name="verified" filled aria-hidden="true" className="pointer-events-none absolute -right-8 -bottom-12 text-white/[0.06] text-[240px] leading-none" />
          <div className="relative flex flex-col items-center">
            <span className="w-16 h-16 rounded-full bg-white/10 ring-4 ring-white/10 flex items-center justify-center mb-4">
              <Icon name="verified" filled className="text-[#E7C173] text-[38px]" />
            </span>
            <div className="flex items-center gap-1.5 mb-2">
              {PuceOr}
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#E7C173]">Enrôlement terminé</span>
            </div>
            <h2 className="text-[24px] font-medium text-white tracking-tight">{`${form.prenom} ${form.nom}`.trim()} est {editMode ? "modifié" : "enrôlé"}</h2>
            <p className="text-[13px] text-white/[0.68] mt-1.5">
              Matricule <span className="font-mono text-white">{matricule}</span> · l'employé peut désormais pointer.
            </p>
            {cree?.code_pin_genere && (
              <p className="text-[12px] text-white/[0.68] mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/[0.1] ring-1 ring-white/15 px-3 py-1.5">
                <Icon name="key" filled className="text-[#E7C173] text-[14px]" aria-hidden="true" />
                Code PIN généré : <span className="font-mono text-white tracking-[0.18em]">{cree.code_pin_genere}</span> — à communiquer à l'employé (visible une seule fois).
              </p>
            )}
          </div>
        </div>

        <div className="mx-auto w-full max-w-xs -mt-8 relative">
          <BadgeEmploye form={form} photo={photo} empreinteOk={empreinteOk} matricule={matricule} pin={cree?.code_pin_genere || form.pin} />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
          <button
            onClick={recommencer}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-[9px] bg-white border border-[#DAD4C5] text-[13.5px] font-medium text-[#2B2A27] hover:bg-[#FBF9F4] transition"
          >
            <Icon name="person_add" className="text-[16px]" aria-hidden="true" />
            Enrôler un autre
          </button>
          <button
            onClick={() => navigate("/employes")}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-[9px] bg-[#1E7D67] text-white text-[13.5px] font-medium shadow-[0_6px_16px_-6px_rgba(30,125,103,0.5)] hover:bg-[#1C5C50] transition"
          >
            <Icon name="groups" className="text-[16px]" aria-hidden="true" />
            Voir les employés
          </button>
        </div>
      </div>
    );
  }

  // ---------- Wizard ----------
  return (
    // Pas de `justify-center` : le contenu s'aligne en haut et reste ENTIÈREMENT visible
    // (le centrage forcé coupait le haut/bas quand le wizard dépassait la hauteur d'écran).
    // Le `main` du Layout gère le scroll ; on garde une largeur confortable + marge basse.
    <div className="reveal w-full max-w-5xl mx-auto pb-4">
      {/* Bandeau hero */}
      <div className="relative overflow-hidden rounded-[18px] bg-[#16463D] px-8 py-9 sm:px-10 sm:py-11">
        <Icon name="fingerprint" filled aria-hidden="true" className="pointer-events-none absolute -right-8 -bottom-16 text-white/[0.06] text-[300px] leading-none" />
        <span aria-hidden="true" className="pointer-events-none absolute -top-16 right-1/3 w-72 h-72 rounded-full bg-[#1E7D67]/25 blur-3xl" />
        <div className="absolute top-6 right-6 flex items-center gap-1.5 rounded-full bg-white/[0.14] ring-1 ring-white/25 px-2.5 py-1">
          <Icon name="fingerprint" filled className="text-[#E7C173] text-[14px]" aria-hidden="true" />
          <span className="text-[11px] font-medium text-white tracking-wide">MADMEN</span>
        </div>
        <div className="relative">
          <div className="flex items-center gap-1.5 mb-3">
            {PuceOr}
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#E7C173]">Enrôlement biométrique</span>
          </div>
          <h1 className="text-[28px] sm:text-[32px] font-medium text-white tracking-tight leading-tight">{editMode ? "Modifier l'employé" : "Nouvel employé"}</h1>
          <p className="text-[14px] text-white/[0.68] mt-2 max-w-md">
            Enregistrez l'identité, l'empreinte et les accès en deux étapes guidées.
          </p>
        </div>
      </div>

      {/* Stepper (chevauche le bas du hero, connecteurs segmentés) */}
      <div className="relative -mt-6 px-2 sm:px-6">
        <div className="absolute top-[22px] left-[12%] right-[12%] h-[2px] bg-[#E6E1D4]" />
        <div className="absolute top-[22px] left-[12%] h-[2px] bg-[#1C5C50] transition-all duration-500" style={{ width: `${etape * 76}%` }} />
        <div className="relative flex items-start justify-between gap-2">
          {etapes.map((e, i) => {
            const etat = i < etape ? "done" : i === etape ? "actif" : "avenir";
            return (
              <div key={e.id} className="flex flex-col items-center text-center flex-1 min-w-0">
                <span
                  className={`w-11 h-11 rounded-full flex items-center justify-center ring-4 ring-canvas transition-colors ${
                    etat === "actif"
                      ? "bg-[#1E7D67] text-white shadow-[0_0_0_4px_rgba(30,125,103,0.22),0_6px_14px_-4px_rgba(30,125,103,0.45)]"
                      : etat === "done"
                        ? "bg-[#1C5C50] text-white"
                        : "bg-white text-[#A39E90] border-[1.5px] border-[#E6E1D4]"
                  }`}
                >
                  <Icon name={etat === "done" ? "check" : e.icon} filled={etat === "actif"} className="text-[20px]" aria-hidden="true" />
                </span>
                <span className={`mt-2 text-[12px] font-medium ${i <= etape ? "text-[#2B2A27]" : "text-[#8C8678]"}`}>{e.label}</span>
                <span className="text-[11px] text-[#8C8678] hidden sm:block">{e.sub}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progression explicite */}
      <div className="flex items-center gap-3 px-2 sm:px-6 mt-5">
        <div className="flex-1 h-1.5 rounded-full bg-[#E6E1D4] overflow-hidden">
          <div className="h-full rounded-full bg-[#1E7D67] transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[11px] font-semibold text-[#1E7D67] bg-[#E7F0EC] rounded-full px-2.5 py-1 leading-none tabular-nums min-w-[44px] text-center">{`${pct} %`}</span>
      </div>

      {/* Contenu : formulaire (héros) + aperçu badge */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6 items-start">
        {/* Carte formulaire (ombre héros) */}
        <div className="lg:col-span-3 bg-white rounded-[14px] border border-[#E6E1D4] shadow-[0_18px_40px_-18px_rgba(22,70,61,0.25)] p-6 sm:p-7 flex flex-col">
          <div key={etape} className="modal-in min-h-[280px] flex flex-col justify-center">
            {/* Étape 0 — Identité */}
            {etape === 0 && (
              <div className="space-y-6">
                {/* 1 — Identité */}
                <Section num="1" titre="Identité">
                  <div className="flex items-center gap-4 mb-4">
                    <label className="relative w-16 h-16 rounded-xl overflow-hidden cursor-pointer shrink-0 ring-1 ring-[#DAD4C5]">
                      {photo ? (
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="w-full h-full bg-[#FBF9F4] flex items-center justify-center">
                          <Icon name="add_a_photo" className="text-[#A39E90] text-[22px]" aria-hidden="true" />
                        </span>
                      )}
                      <input type="file" accept="image/*" onChange={onPhoto} className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Ajouter une photo d'identité" />
                    </label>
                    <div>
                      <p className="text-[13.5px] font-medium text-[#2B2A27]">Photo d'identité</p>
                      <p className="text-[12px] text-[#8C8678]">Optionnelle — elle apparaîtra sur le badge.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-[14px]">
                    <Champ label="Prénom *">
                      <input className={champClass} value={form.prenom} onChange={set("prenom")} placeholder="Ex. Jean" autoFocus />
                    </Champ>
                    <Champ label="Nom *">
                      <input className={champClass} value={form.nom} onChange={set("nom")} placeholder="Ex. Dupont" />
                    </Champ>
                    <Champ label="Sexe">
                      <select className={`${champClass} appearance-none`} value={form.sexe} onChange={set("sexe")}>
                        <option value="">—</option>
                        {SEXES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Champ>
                    <Champ label="Date de naissance">
                      <input type="date" className={champClass} value={form.date_naissance} onChange={set("date_naissance")} />
                    </Champ>
                    <Champ label="Nationalité">
                      <input className={champClass} value={form.nationalite} onChange={set("nationalite")} placeholder="Ex. Congolaise" />
                    </Champ>
                    <Champ label="État civil">
                      <select className={`${champClass} appearance-none`} value={form.etat_civil} onChange={set("etat_civil")}>
                        <option value="">—</option>
                        {ETATS_CIVILS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Champ>
                  </div>
                </Section>

                {/* 2 — Coordonnées */}
                <Section num="2" titre="Coordonnées">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-[14px]">
                    <Champ label="Téléphone">
                      <input className={champClass} value={form.telephone} onChange={set("telephone")} placeholder="Ex. +242 06 000 0000" inputMode="tel" />
                    </Champ>
                    <Champ label="Email professionnel">
                      <input className={champClass} value={form.email} onChange={set("email")} placeholder="prenom.nom@madmen.io" />
                    </Champ>
                    <Champ label="Adresse" full>
                      <input className={champClass} value={form.adresse} onChange={set("adresse")} placeholder="Ex. 12 av. de la Paix, Brazzaville" />
                    </Champ>
                    <Champ label="Contact d'urgence — nom">
                      <input className={champClass} value={form.contact_urgence_nom} onChange={set("contact_urgence_nom")} placeholder="Ex. Marie Dupont" />
                    </Champ>
                    <Champ label="Contact d'urgence — téléphone">
                      <input className={champClass} value={form.contact_urgence_tel} onChange={set("contact_urgence_tel")} placeholder="Ex. +242 05 000 0000" inputMode="tel" />
                    </Champ>
                    <Champ label="Lien de parenté" full>
                      <input className={champClass} value={form.contact_urgence_lien} onChange={set("contact_urgence_lien")} placeholder="Ex. Conjoint, Parent, Ami…" />
                    </Champ>
                  </div>
                </Section>

                {/* 3 — Poste & contrat */}
                <Section num="3" titre="Poste & contrat">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-[14px]">
                    <Champ label="Fonction">
                      {postes.length > 0 ? (
                        <select
                          className={`${champClass} appearance-none`}
                          value={posteId}
                          onChange={(e) => {
                            const id = e.target.value;
                            setPosteId(id);
                            const p = postes.find((x) => x.id === id);
                            setForm((f) => ({ ...f, fonction: p ? p.intitule : "" }));
                          }}
                        >
                          <option value="">Sélectionner une fonction</option>
                          {postes.map((p) => (
                            <option key={p.id} value={p.id}>{p.intitule}</option>
                          ))}
                        </select>
                      ) : (
                        <input className={champClass} value={form.fonction} onChange={set("fonction")} placeholder="Ex. Comptable" />
                      )}
                    </Champ>
                    <Champ label="Département">
                      {departements.length > 0 ? (
                        <select
                          className={`${champClass} appearance-none`}
                          value={departementId}
                          onChange={(e) => {
                            const id = e.target.value;
                            setDepartementId(id);
                            const d = departements.find((x) => x.id === id);
                            setForm((f) => ({ ...f, departement: d ? d.nom : "" }));
                          }}
                        >
                          <option value="">Sélectionner un département</option>
                          {departements.map((d) => (
                            <option key={d.id} value={d.id}>{d.nom}</option>
                          ))}
                        </select>
                      ) : (
                        <input className={champClass} value={form.departement} onChange={set("departement")} placeholder="Ex. Finance" />
                      )}
                    </Champ>
                    <Champ label="Supérieur hiérarchique">
                      <select className={`${champClass} appearance-none`} value={superieurId} onChange={(e) => setSuperieurId(e.target.value)}>
                        <option value="">— Aucun</option>
                        {superieurs.filter((s) => s.id !== String(editId)).map((s) => (
                          <option key={s.id} value={s.id}>{s.nom}</option>
                        ))}
                      </select>
                    </Champ>
                    <Champ label="Date d'embauche">
                      <input type="date" className={champClass} value={form.date_embauche} onChange={set("date_embauche")} />
                    </Champ>
                    <Champ label="Type de contrat">
                      <select className={`${champClass} appearance-none`} value={form.type_contrat} onChange={set("type_contrat")}>
                        <option value="">—</option>
                        {TYPES_CONTRAT.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Champ>
                    <Champ label="Rôle">
                      <select className={`${champClass} appearance-none`} value={form.role || "employe"} onChange={set("role")}>
                        {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        {form.role === "super_admin" && <option value="super_admin">Super admin</option>}
                      </select>
                    </Champ>
                  </div>
                </Section>
              </div>
            )}

            {/* Étape 1 — Accès : empreinte + badge/PIN + validation */}
            {etape === 1 && (
              <div className="space-y-6">
                {/* 1 — Empreinte (optionnelle) */}
                <Section num="1" titre="Empreinte (optionnelle)">
                  <div className="flex flex-col items-center justify-center rounded-[12px] bg-[#FBF9F4] border border-[#E6E1D4] py-5 px-4">
                    <div className="flex items-center gap-2 mb-4 text-[12px] font-medium text-[#6F6B60]">
                      <span className="relative flex w-2 h-2">
                        <span className="absolute inline-flex w-full h-full rounded-full bg-[#1E7D67]/40 animate-ping" />
                        <span className="relative inline-flex w-2 h-2 rounded-full bg-[#1E7D67]" />
                      </span>
                      Lecteur connecté · Live20
                    </div>
                    <button
                      onClick={scanner}
                      disabled={scanning || empreinteOk}
                      aria-label="Lancer la capture d'empreinte"
                      className={`relative w-32 h-32 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 ${
                        empreinteOk ? "bg-[#E7F0EC] ring-4 ring-[#E7F0EC]" : "bg-white hover:brightness-[0.98] ring-1 ring-[#DAD4C5] cursor-pointer"
                      } ${scanning ? "ring-2 ring-[#1E7D67]/40" : ""}`}
                    >
                      <Icon
                        name={empreinteOk ? "check_circle" : "fingerprint"}
                        filled
                        className={`text-[58px] transition-colors duration-300 ${empreinteOk ? "text-[#1E7D67]" : "text-[#1C5C50]/70"}`}
                        aria-hidden="true"
                      />
                      {scanning && (
                        <>
                          <span className="pointer-events-none absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-[#1E7D67]/45 to-transparent animate-scanline" />
                          <span className="pointer-events-none absolute inset-0 rounded-full ring-4 ring-[#1E7D67]/30 animate-pulse" />
                        </>
                      )}
                    </button>
                    <p className="mt-4 text-[13.5px] font-medium text-[#2B2A27]">
                      {empreinteOk ? "Empreinte enregistrée" : scanning ? "Capture en cours…" : "Posez le doigt sur le lecteur"}
                    </p>
                    <p className="text-[12px] text-[#8C8678] mt-1 text-center">
                      {empreinteOk
                        ? "Les 3 passages ont été capturés avec succès."
                        : scanning
                          ? "Maintenez le doigt immobile…"
                          : `Passage ${Math.min(captures + 1, 3)} sur 3 — facultatif, enrôlable plus tard`}
                    </p>
                    <div className="flex items-center gap-2 mt-4">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${
                            i < captures ? "bg-[#1E7D67]" : i === captures && scanning ? "bg-[#1E7D67]/40 animate-pulse" : "bg-[#DAD4C5]"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </Section>

                {/* 2 — Badge & code PIN */}
                <Section num="2" titre="Badge & code PIN">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-[14px]">
                    <Champ label="Numéro de badge RFID" full>
                      <input className={champClass} value={form.badge} onChange={set("badge")} placeholder="Ex. RFID-00482" />
                    </Champ>
                    <Champ label="Code PIN (4 chiffres)">
                      <input
                        className={champClass}
                        type="password"
                        value={form.pin}
                        onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                        placeholder="••••"
                        inputMode="numeric"
                      />
                    </Champ>
                    <Champ label="Confirmation">
                      <div
                        className={`flex items-center gap-1.5 h-10 px-3 rounded-[9px] border text-[13px] ${
                          pinValide ? "border-[#1E7D67]/30 bg-[#E7F0EC] text-[#1E7D67] font-medium" : "border-[#DAD4C5] bg-[#FBF9F4] text-[#A39E90]"
                        }`}
                      >
                        {pinValide ? (
                          <>
                            <Icon name="check_circle" className="text-[18px]" filled aria-hidden="true" />
                            Code valide
                          </>
                        ) : (
                          "4 chiffres requis"
                        )}
                      </div>
                    </Champ>
                  </div>
                </Section>

                {/* 3 — Validation */}
                <Section num="3" titre="Validation">
                  <label className="flex items-center gap-2.5 text-[13px] text-[#2B2A27] cursor-pointer select-none">
                    <input type="checkbox" checked={atteste} onChange={(e) => setAtteste(e.target.checked)} className="w-4 h-4 rounded accent-[#1E7D67]" />
                    J'atteste l'exactitude des informations saisies.
                  </label>
                  <p className="mt-2 text-[12px] text-[#8C8678]">Le récapitulatif complet est visible sur le badge, à droite.</p>
                  {(!form.prenom.trim() || !form.nom.trim()) && (
                    <p className="mt-3 flex items-center gap-1.5 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <Icon name="warning" filled className="text-[15px] shrink-0" aria-hidden="true" />
                      Le prénom et le nom sont obligatoires — renseignez-les à l'étape « Profil ».
                    </p>
                  )}
                </Section>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-7 pt-5 border-t border-[#E6E1D4]">
            <button
              onClick={precedent}
              disabled={etape === 0}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-[9px] border border-[#DAD4C5] text-[13.5px] font-medium text-[#2B2A27] transition hover:bg-[#FBF9F4] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <Icon name="arrow_back" className="text-[16px]" aria-hidden="true" />
              Précédent
            </button>
            {etape < 1 ? (
              <button
                onClick={suivant}
                className="inline-flex items-center gap-1.5 h-10 px-5 rounded-[9px] bg-[#1E7D67] text-white text-[13.5px] font-medium shadow-[0_6px_16px_-6px_rgba(30,125,103,0.5)] transition hover:bg-[#1C5C50] active:translate-y-px"
              >
                Continuer
                <Icon name="arrow_forward" className="text-[16px]" aria-hidden="true" />
              </button>
            ) : (
              <button
                onClick={terminer}
                disabled={!peutEnvoyer || enregistre}
                className="inline-flex items-center gap-1.5 h-10 px-5 rounded-[9px] bg-[#1E7D67] text-white text-[13.5px] font-medium shadow-[0_6px_16px_-6px_rgba(30,125,103,0.5)] transition hover:bg-[#1C5C50] active:translate-y-px disabled:bg-[#A39E90] disabled:shadow-none disabled:cursor-not-allowed"
              >
                <Icon name={enregistre ? "progress_activity" : "check"} className={`text-[16px] ${enregistre ? "animate-spin" : ""}`} aria-hidden="true" />
                {enregistre ? "Enregistrement…" : editMode ? "Enregistrer les modifications" : "Terminer l'enrôlement"}
              </button>
            )}
          </div>
        </div>

        {/* Aperçu : badge + aide */}
        <aside className="lg:col-span-2 space-y-4">
          <BadgeEmploye form={form} photo={photo} empreinteOk={empreinteOk} matricule={matricule} pin={form.pin} />
          <div className="rounded-[14px] bg-[#E7F0EC] border border-[#1E7D67]/15 p-4 shadow-[0_4px_14px_-10px_rgba(22,70,61,0.2)]">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name={etapes[etape].icon} className="text-[#1C5C50] text-[18px]" filled aria-hidden="true" />
              <span className="text-[13px] font-medium text-[#1C5C50]">{etapes[etape].label}</span>
            </div>
            <p className="text-[12px] text-[#1C5C50]/80 leading-relaxed">{aide[etape]}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
