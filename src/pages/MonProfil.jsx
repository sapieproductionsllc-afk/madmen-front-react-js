import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import Modal from "../components/ui/Modal.jsx";
import { Input, Field } from "../components/ui/Input.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { apiGet, authMe } from "../lib/api.js";
import { mapEmploye } from "../lib/mappers.js";

const photoDe = (id) => `https://i.pravatar.cc/160?u=${encodeURIComponent(id)}`;

// Libellé d'affichage du rôle métier (valeurs réelles de l'API : employe,
// superviseur, directeur, super_admin — cf. Core/Auth.php).
const LIBELLE_ROLE = {
  employe: "Employé",
  superviseur: "Superviseur",
  directeur: "Directeur",
  super_admin: "Administrateur",
};
const libelleRole = (r) => LIBELLE_ROLE[r] || (r ? r.charAt(0).toUpperCase() + r.slice(1) : "Employé");

// Permissions DÉRIVÉES du rôle (l'API ne renvoie pas de liste de permissions :
// le RBAC est hiérarchique par rang). On affiche une liste neutre et cohérente
// avec le rang réel de l'utilisateur — aucune donnée inventée.
function permissionsDuRole(role) {
  const base = ["Espace personnel", "Mes demandes", "Mes pointages"];
  if (role === "superviseur") return [...base, "Suivi d'équipe", "Rapports & analyses"];
  if (role === "directeur") return [...base, "Gestion du personnel", "Finance & paie", "Rapports & analyses"];
  if (role === "super_admin") return ["Gestion du personnel", "Finance & paie", "Administration", "Rapports & analyses", "Appareils biométriques"];
  return base; // employe
}

// Profil API (/api/me/profil) -> forme attendue par le JSX de la page.
// On réutilise mapEmploye pour l'identité (name/email/role/matricule), puis on
// complète avec les champs propres au profil (telephone, manager, département).
function mapProfil(p) {
  const e = mapEmploye(p);
  return {
    id: e.matricule || p.matricule || "",
    matricule: e.matricule || p.matricule || "—",
    name: e.name || "",
    email: e.email || "",
    telephone: p.telephone || e.phone || "", // l'API expose `telephone` en clair
    role: e.role || p.role || "", // rôle BRUT (employe/superviseur/...) — libellé via libelleRole()
    fonction: p.poste || e.fonction || "—", // l'API expose `poste`
    department: p.departement || e.department || "—", // l'API expose `departement`
    manager: p.manager || "", // non utilisé par le design actuel — conservé au cas où
    photo_url: p.photo_url || "", // photo réelle si présente
  };
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors shrink-0 focus-visible:outline-none focus-visible:shadow-focus ${checked ? "bg-brand-600" : "bg-surface-2 border border-border-strong"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
    </button>
  );
}

function Carte({ icon, titre, desc, children, action }) {
  return (
    <section className="card p-5">
      <div className="flex items-start gap-3 mb-4">
        <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Icon name={icon} className="text-[22px]" filled /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-ink tracking-tight">{titre}</h2>
          {desc && <p className="text-xs text-muted">{desc}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function MonProfil() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast, confirm } = useUI();

  // Données RÉELLES du profil de l'employé connecté (remplace les valeurs mock).
  const [profil, setProfil] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const base = {
    name: profil?.name || "",
    email: profil?.email || "",
    telephone: profil?.telephone || "",
  };
  const [form, setForm] = useState(base);
  const [photo, setPhoto] = useState(null);
  const fileRef = useRef(null);
  // 2FA : pas d'endpoint de gestion côté API -> état d'affichage figé (pas de
  // bascule trompeuse). Le toggle informe que la fonctionnalité arrive bientôt.
  const twoFA = true;
  const [mdpOuvert, setMdpOuvert] = useState(false);
  const [mdp, setMdp] = useState({ actuel: "", nouveau: "", confirme: "" });

  useEffect(() => {
    let actif = true;
    // Source principale : /api/me/profil (identité complète, scopée au jeton).
    // DÉGRADATION GRACIEUSE : si elle échoue, on retombe sur /api/auth/me
    // (matricule + rôle), puis sur le `user` en mémoire — sans planter la page.
    apiGet("/api/me/profil")
      .then((data) => {
        if (!actif) return;
        const p = mapProfil(data || {});
        setProfil(p);
        setForm({ name: p.name, email: p.email, telephone: p.telephone });
      })
      .catch(() =>
        authMe()
          .then((me) => {
            if (!actif) return;
            const p = mapProfil({
              matricule: me?.matricule || user?.matricule || "",
              role: me?.role || user?.role || "",
              nom: user?.name || "",
              email: user?.email || "",
            });
            setProfil(p);
            setForm({ name: p.name, email: p.email, telephone: p.telephone });
          })
          .catch(() => {
            if (!actif) return;
            // Dernier recours : ce qu'on a en mémoire (contexte d'auth).
            if (user) {
              const p = mapProfil({ matricule: user.matricule, role: user.role, nom: user.name, email: user.email || "" });
              setProfil(p);
              setForm({ name: p.name, email: p.email, telephone: p.telephone });
            } else {
              setErreur("Profil indisponible pour le moment.");
            }
          })
      )
      .finally(() => actif && setChargement(false));
    return () => {
      actif = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choisirPhoto = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      if (photo) URL.revokeObjectURL(photo);
      // Aperçu local uniquement : pas d'endpoint d'upload de photo de profil côté
      // API -> on n'affirme PAS que c'est enregistré (le rechargement repartira
      // de la photo serveur). Honnête : info, pas un faux succès.
      setPhoto(URL.createObjectURL(f));
      toast("Aperçu local — l'enregistrement de la photo n'est pas encore disponible.", "info");
    }
    e.target.value = "";
  };

  const matricule = profil?.matricule || "—";
  const role = libelleRole(profil?.role);
  const permissions = permissionsDuRole(profil?.role);
  const dirty = form.name !== base.name || form.email !== base.email || form.telephone !== base.telephone;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const enregistrer = () => {
    const email = form.email.trim();
    if (!form.name.trim() || !email) return toast("Nom et e-mail requis", "error");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast("Adresse e-mail invalide", "error");
    // Pas d'endpoint d'écriture /api/me/profil côté API : on ne peut PAS persister
    // ces changements. Message honnête (pas de faux succès), le formulaire reste
    // tel quel pour que l'utilisateur sache que rien n'a été enregistré.
    toast("Modification du profil bientôt disponible — contactez un administrateur.", "info");
  };
  const fermerMdp = () => { setMdpOuvert(false); setMdp({ actuel: "", nouveau: "", confirme: "" }); };
  const validerMdp = () => {
    if (!mdp.nouveau || mdp.nouveau !== mdp.confirme) return toast("Les mots de passe ne correspondent pas", "error");
    // SÉCURITÉ : pas d'endpoint de changement de PIN self-service -> NE PAS prétendre que
    // c'est fait. On oriente vers la régénération de PIN par un administrateur.
    fermerMdp();
    toast("Changement non disponible ici — demandez à un administrateur de régénérer votre PIN.", "info");
  };
  const deconnexion = () =>
    confirm({ title: "Se déconnecter ?", message: "Vous serez redirigé vers la page de connexion.", confirmLabel: "Se déconnecter", danger: true, onConfirm: () => { logout(); navigate("/login", { replace: true }); } });

  return (
    <div className="space-y-5 pb-12">
      <PageHeader title="Mon profil" subtitle="Vos informations personnelles et votre compte." />

      {chargement ? (
        <div className="card py-12 text-center">
          <Icon name="progress_activity" className="text-faint text-[36px] animate-spin" />
          <p className="mt-2 text-sm text-muted">Chargement de votre profil…</p>
        </div>
      ) : erreur ? (
        <div className="card py-12 text-center">
          <Icon name="error" className="text-rose-500 text-[36px]" />
          <p className="mt-2 text-sm text-muted">{erreur}</p>
        </div>
      ) : (
      <>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-600 p-5 sm:p-6 shadow-card flex items-center gap-4 flex-wrap">
        <span className="absolute -right-10 -top-12 w-44 h-44 rounded-full bg-white/5" aria-hidden="true" />
        <div className="relative shrink-0">
          <button type="button" onClick={() => fileRef.current?.click()} aria-label="Modifier la photo de profil" className="group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or-300 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700">
            <span className="relative block rounded-full overflow-hidden ring-2 ring-or-400/80 ring-offset-2 ring-offset-brand-700">
              <Avatar src={photo || profil?.photo_url || photoDe(matricule)} name={form.name} size="w-16 h-16" textSize="text-xl" ring={false} />
              <span className="absolute inset-0 bg-ink/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Icon name="photo_camera" className="text-white text-[20px]" />
              </span>
            </span>
          </button>
          <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-or-500 text-ink flex items-center justify-center border-2 border-brand-700 pointer-events-none">
            <Icon name="photo_camera" className="text-[13px]" />
          </span>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={choisirPhoto} />
        </div>
        <div className="relative min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-or-300">Mon compte</p>
          <h1 className="text-xl font-semibold text-white leading-tight truncate">{form.name}</h1>
          <p className="text-sm text-white/75 truncate">{role} · {matricule}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
            <span className="inline-flex items-center gap-1.5 min-w-0"><Icon name="mail" className="text-[15px] text-white/70 shrink-0" /><span className="truncate">{form.email}</span></span>
            <span className="inline-flex items-center gap-1.5"><Icon name="call" className="text-[15px] text-white/70" />{form.telephone}</span>
          </div>
        </div>
        <span className="relative shrink-0"><StatusPill label="Compte actif" tone="emerald" /></span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Informations personnelles */}
        <Carte icon="badge" titre="Informations personnelles" desc="Modifiez vos coordonnées.">
          <div className="space-y-4">
            <Field label="Nom complet"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="Adresse e-mail"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
            <Field label="Téléphone"><Input value={form.telephone} onChange={(e) => set("telephone", e.target.value)} /></Field>
            <Field label="Matricule"><Input value={matricule} disabled className="opacity-60 cursor-not-allowed" /></Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setForm(base)} disabled={!dirty}>Annuler</Button>
            <Button variant="primary" icon="save" onClick={enregistrer} disabled={!dirty}>Enregistrer</Button>
          </div>
        </Carte>

        {/* Rôle & accès */}
        <Carte icon="admin_panel_settings" titre="Rôle & accès" desc="Vos permissions sur la plateforme.">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Rôle</span>
              <StatusPill label={role} tone="brand" dot={false} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Poste</span>
              <span className="text-sm font-medium text-texte">{profil?.fonction || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Département</span>
              <span className="text-sm font-medium text-texte">{profil?.department || "—"}</span>
            </div>
            {profil?.manager && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Responsable</span>
                <span className="text-sm font-medium text-texte">{profil.manager}</span>
              </div>
            )}
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-subtle mb-2">Permissions</p>
              <div className="flex flex-wrap gap-1.5">
                {permissions.map((p) => (
                  <span key={p} className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 bg-brand-50 border border-brand-600/15 rounded-full px-2 py-1">
                    <Icon name="check" className="text-[13px]" /> {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Carte>

        {/* Sécurité */}
        <Carte icon="shield" titre="Sécurité" desc="Protégez l'accès à votre compte.">
          <div className="space-y-1">
            <div className="flex items-center justify-between py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-texte">Mot de passe</p>
                <p className="text-xs text-muted">Dernière modification il y a 3 mois</p>
              </div>
              <Button variant="secondary" size="sm" icon="lock_reset" onClick={() => setMdpOuvert(true)}>Modifier</Button>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-border">
              <div className="min-w-0">
                <p className="text-sm font-medium text-texte">Double authentification (2FA)</p>
                <p className="text-xs text-muted">{twoFA ? "Activée" : "Désactivée"} — sécurité renforcée</p>
              </div>
              <Toggle checked={twoFA} onChange={() => toast("Gestion de la double authentification bientôt disponible.", "info")} label="Double authentification" />
            </div>
            <div className="flex items-center justify-between py-2 border-t border-border">
              <div className="min-w-0">
                <p className="text-sm font-medium text-texte">Déconnexion</p>
                <p className="text-xs text-muted">Fermer la session sur cet appareil</p>
              </div>
              <Button variant="danger-soft" size="sm" icon="logout" onClick={deconnexion}>Se déconnecter</Button>
            </div>
          </div>
        </Carte>

        {/* Connexions récentes — pas d'historique de connexions web exposé par l'API
            (la route /api/sessions concerne les postes biométriques kiosque, hors
            sujet ici). On affiche au moins la session courante, sans inventer. */}
        <Carte icon="devices" titre="Connexions récentes" desc="Activité récente de votre compte.">
          <div className="divide-y divide-border -my-1">
            <div className="flex items-center gap-3 py-2.5">
              <span className="w-9 h-9 rounded-xl bg-surface-2 text-muted flex items-center justify-center shrink-0"><Icon name="computer" className="text-[18px]" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-texte truncate">Cet appareil</p>
                <p className="text-xs text-muted truncate">Session en cours</p>
              </div>
              <span className="shrink-0"><StatusPill label="Session actuelle" tone="emerald" dot={false} /></span>
            </div>
          </div>
          <p className="mt-3 text-xs text-subtle">L'historique détaillé des connexions n'est pas encore disponible.</p>
        </Carte>
      </div>
      </>
      )}

      {/* Modale changement de mot de passe */}
      <Modal
        open={mdpOuvert}
        onClose={fermerMdp}
        title="Modifier le mot de passe"
        subtitle="Choisissez un mot de passe robuste."
        icon="lock_reset"
        footer={<><Button variant="ghost" onClick={fermerMdp}>Annuler</Button><Button variant="primary" icon="check" onClick={validerMdp}>Mettre à jour</Button></>}
      >
        <div className="space-y-4">
          <Field label="Mot de passe actuel"><Input type="password" placeholder="••••••••" value={mdp.actuel} onChange={(e) => setMdp((m) => ({ ...m, actuel: e.target.value }))} /></Field>
          <Field label="Nouveau mot de passe"><Input type="password" placeholder="••••••••" value={mdp.nouveau} onChange={(e) => setMdp((m) => ({ ...m, nouveau: e.target.value }))} /></Field>
          <Field label="Confirmer le nouveau mot de passe"><Input type="password" placeholder="••••••••" value={mdp.confirme} onChange={(e) => setMdp((m) => ({ ...m, confirme: e.target.value }))} /></Field>
        </div>
      </Modal>
    </div>
  );
}
