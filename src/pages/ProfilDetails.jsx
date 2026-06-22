import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import BandeauAgent from "../components/ui/BandeauAgent.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { employes, tempsReel } from "../data/datasets.js";
import { employeDetails, historiqueActivite, activiteDetail, documentsEmploye, historiqueRH } from "../data/profil.js";

const tonePastille = {
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  sky: "bg-sky-50 text-sky-600",
  brand: "bg-brand-50 text-brand-600",
  slate: "bg-slate-50 text-slate-600",
};

// Progression de défilement (repère passif, non cliquable) — écoute le scroller de Layout.
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

function InfoRow({ icon, label, value, href }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <span className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center shrink-0">
        <Icon name={icon} className="text-subtle text-[18px]" />
      </span>
      <span className="text-sm text-muted w-28 shrink-0">{label}</span>
      {href ? (
        <a href={href} className="text-sm text-texte font-medium hover:text-brand-600 truncate">{value}</a>
      ) : (
        <span className="text-sm text-texte font-medium truncate">{value}</span>
      )}
    </div>
  );
}

// Frise HORIZONTALE : nœuds reliés sur une ligne, défile si trop d'étapes (gain de hauteur).
function Timeline({ items, champTime = "time", champType = "type", champDetail = "detail" }) {
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

// En-tête de carte (rang 3) — unifié sur toute la page.
function CardHeader({ icon, title, count }) {
  return (
    <div className="flex items-center gap-2 mb-3.5">
      <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
        <Icon name={icon} className="text-[18px]" filled />
      </span>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {count != null && <span className="ml-auto text-xs font-semibold tabular-nums text-muted bg-surface-2 px-2 py-0.5 rounded-full">{count}</span>}
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

export default function ProfilDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useUI();
  const progress = useScrollProgress();

  const e = employes.find((x) => x.id === id);

  // Défilement vers la section demandée (ex. arrivée depuis « Voir le détail des pointages »).
  useEffect(() => {
    const ancre = ANCRES[location.state?.onglet];
    if (!ancre) return;
    const raf = requestAnimationFrame(() => {
      document.getElementById(ancre)?.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
      navigate(location.pathname, { replace: true, state: {} });
    });
    return () => cancelAnimationFrame(raf);
  }, [location.state, location.pathname, navigate]);

  if (!e) {
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

  const d = employeDetails[id] ?? {};
  const tr = tempsReel[id] ?? {};
  const live = tr.live ?? "Absent";
  const activite = historiqueActivite(id);
  const actDetail = activiteDetail(id);
  const docs = documentsEmploye(id);
  const rh = historiqueRH(id);

  return (
    <div className="space-y-7 pb-12">
      {/* Progression de défilement (repère passif) */}
      <div className="sticky top-0 z-20 -mx-5 md:-mx-8 -mt-6 md:-mt-8 h-0.5 bg-transparent" aria-hidden="true">
        <div className="h-full bg-or-500/80 transition-[width] duration-150" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>

      {/* Bouton retour */}
      <button
        onClick={() => navigate(`/employes/${id}`)}
        className="group inline-flex items-center gap-1.5 h-9 pl-2 pr-3.5 rounded-full bg-surface border border-border text-sm font-medium text-muted hover:text-ink hover:border-border-strong hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        <Icon name="arrow_back" className="text-[18px] group-hover:-translate-x-0.5 transition-transform" />
        Retour à la présence
      </button>

      <BandeauAgent
        e={e}
        live={live}
        onPaiements={() => navigate(`/employes/${id}/paiement`)}
        onPlus={() => navigate(`/employes/${id}`)}
        plusLabel="Présence"
        plusIcon="event_available"
      />

      {/* ---------- RÉSUMÉ ---------- */}
      <Section id="resume" icon="badge" title="Résumé" first>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <CardHeader icon="contact_mail" title="Coordonnées" />
            <InfoRow icon="badge" label="Matricule" value={e.id} />
            <InfoRow icon="mail" label="Email" value={e.email} href={`mailto:${e.email}`} />
            <InfoRow icon="call" label="Téléphone" value={e.phone} href={`tel:${e.phone.replace(/\s/g, "")}`} />
            <InfoRow icon="home" label="Adresse" value={d.adresse ?? "—"} />
          </div>
          <div className="card p-5">
            <CardHeader icon="business_center" title="Affectation & RH" />
            <InfoRow icon="work" label="Fonction" value={e.fonction} />
            <InfoRow icon="domain" label="Service" value={e.department} />
            <InfoRow icon="supervisor_account" label="Manager" value={d.manager ?? "—"} />
            <InfoRow icon="event" label="Embauche" value={d.embauche ?? "—"} />
            {d.urgence && <InfoRow icon="emergency" label="Urgence" value={`${d.urgence.nom} (${d.urgence.lien}) · ${d.urgence.tel}`} />}
          </div>
        </div>
      </Section>

      {/* ---------- POINTAGES (bande → feuille de pointage éditable) ---------- */}
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

      {/* ---------- ACTIVITÉ ---------- */}
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

      {/* ---------- DOCUMENTS ---------- */}
      <Section id="documents" icon="folder" title="Documents">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((doc) => (
            <button
              key={doc.nom}
              onClick={() => toast(`Téléchargement de « ${doc.nom} »`, "info")}
              className="group card card-hover p-4 flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <Icon name={doc.icon} className="text-[22px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink truncate">{doc.nom}</p>
                <p className="text-xs text-subtle">{doc.type} · {doc.date} · {doc.size}</p>
              </div>
              <Icon name="download" className="text-subtle group-hover:text-brand-600 text-[20px]" />
            </button>
          ))}
        </div>
      </Section>

      {/* ---------- HISTORIQUE ---------- */}
      <Section id="historique" icon="history" title="Historique">
        <div className="card p-5">
          <Timeline items={rh} champTime="date" />
        </div>
        <p className="text-center text-xs text-faint pt-1">Fin du dossier agent</p>
      </Section>
    </div>
  );
}
