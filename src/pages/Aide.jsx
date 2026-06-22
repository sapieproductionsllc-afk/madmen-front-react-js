import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";

const GUIDES = [
  { icon: "space_dashboard", titre: "Tableau de bord", desc: "Vue en temps réel des présences et de l'activité du jour.", to: "/" },
  { icon: "groups", titre: "Agents", desc: "Annuaire du personnel, fiches détaillées et statuts.", to: "/employes" },
  { icon: "co_present", titre: "Présence & pointage", desc: "Suivi des pointages et corrections manuelles par période.", to: "/presence" },
  { icon: "payments", titre: "Finance & Paie", desc: "Paiement groupé, avances, dépenses et journal financier.", to: "/finance" },
  { icon: "forum", titre: "Communication", desc: "Approuver les demandes et écrire au personnel.", to: "/communication" },
  { icon: "admin_panel_settings", titre: "Administration", desc: "Appareils biométriques, utilisateurs et paramètres.", to: "/administration" },
];

const FAQ = [
  { q: "Comment ajouter un employé ?", r: "Cliquez sur « + Actions » en haut à droite, puis « Ajouter un employé ». La photo et l'agence sont facultatives. L'employé pourra ensuite être enrôlé (empreinte, badge, code PIN) depuis la page Enrôlement." },
  { q: "Comment payer tout le personnel d'un coup ?", r: "Dans Finance & Paie, ouvrez « Payer le personnel ». Cochez les agents souhaités ou utilisez « Tout payer » pour régler tout le monde en une seule fois. Une confirmation récapitule le montant total." },
  { q: "Comment fonctionnent les pointages ?", r: "Les appareils K40 (empreinte) et Watchman (reconnaissance faciale) remontent automatiquement les pointages. Sur la fiche d'un agent, « Gérer les pointages » permet de filtrer par jour, semaine, mois ou année et de corriger manuellement une entrée." },
  { q: "Comment approuver ou refuser une demande ?", r: "Dans Communication, onglet Demandes : chaque demande en attente dispose des boutons Approuver et Refuser. Vous pouvez filtrer par « À traiter », « Approuvées » ou « Refusées »." },
  { q: "Comment enregistrer une dépense de la société ?", r: "Dans Finance & Paie, cliquez sur « Ajouter une dépense » (loyer, charges, transport…). Elle apparaît aussitôt dans le journal des mouvements et dans les totaux de la période." },
  { q: "Comment modifier les informations d'un agent ?", r: "Ouvrez le profil de l'agent, puis cliquez sur l'icône ⚙️ Paramètres du bandeau. Une fenêtre permet de modifier son nom, sa fonction, son service, ses coordonnées, son salaire et sa photo." },
  { q: "Comment changer les paramètres de l'entreprise ?", r: "Dans Administration, onglet Paramètres : devise (FCFA), fuseau horaire, règles de pointage et de retard, notifications et sécurité. Les modifications sont enregistrées et conservées." },
  { q: "Comment filtrer une vue par agence ?", r: "Utilisez le sélecteur d'agence en haut à droite (à côté de « Actions »). Toutes les vues se filtrent alors sur l'agence choisie." },
];

export default function Aide() {
  const navigate = useNavigate();
  const { toast } = useUI();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(0);

  const faq = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? FAQ.filter((f) => f.q.toLowerCase().includes(t) || f.r.toLowerCase().includes(t)) : FAQ;
  }, [q]);

  return (
    <div className="space-y-5 pb-12">
      <PageHeader title="Aide & support" subtitle="Tout pour bien utiliser MADMEN au quotidien." />

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-600 p-6 shadow-card">
        <span className="absolute -right-10 -top-12 w-48 h-48 rounded-full bg-white/5" aria-hidden="true" />
        <div className="relative max-w-2xl">
          <span className="w-11 h-11 rounded-xl bg-white/10 text-white flex items-center justify-center mb-3"><Icon name="help" className="text-[24px]" filled /></span>
          <h2 className="text-xl font-semibold text-white tracking-tight">Comment pouvons-nous vous aider ?</h2>
          <p className="text-sm text-white/75 mt-1">Parcourez les guides ou cherchez une réponse dans la FAQ.</p>
        </div>
      </div>

      {/* Guides rapides */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink">Guides rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GUIDES.map((g) => (
            <button key={g.titre} onClick={() => navigate(g.to)} className="card card-hover p-5 text-left flex flex-col group focus-visible:outline-none focus-visible:shadow-focus">
              <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Icon name={g.icon} className="text-[22px]" filled /></span>
              <h3 className="text-sm font-semibold text-ink mt-3">{g.titre}</h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">{g.desc}</p>
              <span className="mt-auto pt-3 text-sm font-medium text-brand-600 inline-flex items-center gap-1">Ouvrir <Icon name="chevron_right" className="text-[18px] group-hover:translate-x-0.5 transition-transform" /></span>
            </button>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">Questions fréquentes</h2>
          <SearchInput value={q} onChange={setQ} placeholder="Rechercher dans l'aide…" className="w-full sm:w-72" />
        </div>
        <div className="space-y-2.5">
          {faq.map((f, i) => {
            const ouvert = open === i;
            return (
              <div key={f.q} className="card overflow-hidden">
                <button onClick={() => setOpen(ouvert ? null : i)} aria-expanded={ouvert} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-surface-2/50 transition-colors focus-visible:outline-none focus-visible:shadow-focus">
                  <span className="text-sm font-medium text-ink">{f.q}</span>
                  <Icon name="expand_more" className={`text-[20px] text-muted shrink-0 transition-transform ${ouvert ? "rotate-180" : ""}`} />
                </button>
                {ouvert && <p className="px-5 pb-4 -mt-1 text-sm text-muted leading-relaxed">{f.r}</p>}
              </div>
            );
          })}
          {faq.length === 0 && (
            <div className="card py-12 text-center"><Icon name="search_off" className="text-faint text-[34px]" /><p className="mt-2 text-sm text-muted">Aucune réponse pour « {q} ».</p></div>
          )}
        </div>
      </section>

      {/* Contact support */}
      <section className="card p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <span className="w-11 h-11 rounded-xl bg-or-100 text-or-700 flex items-center justify-center shrink-0"><Icon name="support_agent" className="text-[24px]" filled /></span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-ink">Besoin d'une aide personnalisée ?</h3>
            <p className="text-xs text-muted mt-0.5">Notre équipe support vous répond du lundi au vendredi, 8h–18h.</p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-texte">
              <span className="inline-flex items-center gap-1.5"><Icon name="mail" className="text-[16px] text-muted" /> support@madmen.io</span>
              <span className="inline-flex items-center gap-1.5"><Icon name="call" className="text-[16px] text-muted" /> +242 06 00 00 00</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" icon="menu_book" onClick={() => toast("Documentation ouverte (PDF)", "info")}>Documentation</Button>
            <Button variant="primary" icon="mail" onClick={() => toast("Demande envoyée au support", "success")}>Contacter le support</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
