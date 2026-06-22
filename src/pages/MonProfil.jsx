import { useState, useRef } from "react";
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

const photoDe = (id) => `https://i.pravatar.cc/160?u=${encodeURIComponent(id)}`;

const PERMISSIONS = ["Gestion du personnel", "Finance & paie", "Administration", "Rapports & analyses", "Appareils biométriques"];
const CONNEXIONS = [
  { id: 1, appareil: "Chrome · Windows", lieu: "Brazzaville, CG", date: "Aujourd'hui · 08:32", actuel: true },
  { id: 2, appareil: "Safari · iPhone", lieu: "Brazzaville, CG", date: "Hier · 19:14" },
  { id: 3, appareil: "Chrome · Windows", lieu: "Pointe-Noire, CG", date: "18 juin · 09:02" },
];

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
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const { toast, confirm } = useUI();

  const base = {
    name: user?.name || "Administrateur",
    email: user?.email || "admin@madmen.io",
    telephone: user?.telephone || "+242 06 12 34 56",
  };
  const [form, setForm] = useState(base);
  const [photo, setPhoto] = useState(null);
  const fileRef = useRef(null);
  const [twoFA, setTwoFA] = useState(true);
  const [mdpOuvert, setMdpOuvert] = useState(false);
  const [mdp, setMdp] = useState({ actuel: "", nouveau: "", confirme: "" });

  const choisirPhoto = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      if (photo) URL.revokeObjectURL(photo);
      setPhoto(URL.createObjectURL(f));
      toast("Photo de profil mise à jour", "success");
    }
    e.target.value = "";
  };

  const matricule = user?.matricule || "—";
  const role = user?.role || "Administrateur";
  const dirty = form.name !== base.name || form.email !== base.email || form.telephone !== base.telephone;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const enregistrer = () => {
    const email = form.email.trim();
    if (!form.name.trim() || !email) return toast("Nom et e-mail requis", "error");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast("Adresse e-mail invalide", "error");
    login({ ...user, name: form.name.trim(), email, telephone: form.telephone.trim() });
    toast("Profil mis à jour", "success");
  };
  const fermerMdp = () => { setMdpOuvert(false); setMdp({ actuel: "", nouveau: "", confirme: "" }); };
  const validerMdp = () => {
    if (!mdp.nouveau || mdp.nouveau !== mdp.confirme) return toast("Les mots de passe ne correspondent pas", "error");
    fermerMdp();
    toast("Mot de passe modifié", "success");
  };
  const deconnexion = () =>
    confirm({ title: "Se déconnecter ?", message: "Vous serez redirigé vers la page de connexion.", confirmLabel: "Se déconnecter", danger: true, onConfirm: () => { logout(); navigate("/login", { replace: true }); } });

  return (
    <div className="space-y-5 pb-12">
      <PageHeader title="Mon profil" subtitle="Vos informations personnelles et votre compte." />

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-600 p-5 sm:p-6 shadow-card flex items-center gap-4 flex-wrap">
        <span className="absolute -right-10 -top-12 w-44 h-44 rounded-full bg-white/5" aria-hidden="true" />
        <div className="relative shrink-0">
          <button type="button" onClick={() => fileRef.current?.click()} aria-label="Modifier la photo de profil" className="group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or-300 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700">
            <span className="relative block rounded-full overflow-hidden ring-2 ring-or-400/80 ring-offset-2 ring-offset-brand-700">
              <Avatar src={photo || photoDe(matricule)} name={form.name} size="w-16 h-16" textSize="text-xl" ring={false} />
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
              <span className="text-sm text-muted">Agence</span>
              <span className="text-sm font-medium text-texte">Toutes les agences</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Membre depuis</span>
              <span className="text-sm font-medium text-texte">Janvier 2018</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Dernière connexion</span>
              <span className="text-sm font-medium text-texte">Aujourd'hui · 08:32</span>
            </div>
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-subtle mb-2">Permissions</p>
              <div className="flex flex-wrap gap-1.5">
                {PERMISSIONS.map((p) => (
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
              <Toggle checked={twoFA} onChange={(v) => { setTwoFA(v); toast(v ? "2FA activée" : "2FA désactivée", "info"); }} label="Double authentification" />
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

        {/* Connexions récentes */}
        <Carte icon="devices" titre="Connexions récentes" desc="Activité récente de votre compte.">
          <div className="divide-y divide-border -my-1">
            {CONNEXIONS.map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-2.5">
                <span className="w-9 h-9 rounded-xl bg-surface-2 text-muted flex items-center justify-center shrink-0"><Icon name="computer" className="text-[18px]" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-texte truncate">{c.appareil}</p>
                  <p className="text-xs text-muted truncate">{c.lieu} · {c.date}</p>
                </div>
                {c.actuel && <span className="shrink-0"><StatusPill label="Session actuelle" tone="emerald" dot={false} /></span>}
              </div>
            ))}
          </div>
        </Carte>
      </div>

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
