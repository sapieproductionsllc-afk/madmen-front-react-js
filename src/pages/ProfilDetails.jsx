import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import Table from "../components/ui/Table.jsx";
import BandeauAgent from "../components/ui/BandeauAgent.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { employes, tempsReel, fcfa } from "../data/datasets.js";
import { employeDetails, historiqueActivite, activiteDetail, historiquePaiements, paieDetail, documentsEmploye, historiqueRH } from "../data/profil.js";

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
    <ol className="flex overflow-x-auto scroll-thin pb-1">
      {items.map((ev, i) => (
        <li key={i} className="relative flex-1 min-w-[120px] flex flex-col items-center text-center px-1.5">
          {i < items.length - 1 && <span className="absolute top-[14px] left-1/2 w-full h-0.5 bg-border" aria-hidden="true" />}
          <span className={`relative z-10 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${tonePastille[ev.tone] ?? tonePastille.slate}`}>
            <Icon name={ev.icon} className="text-[15px]" filled />
          </span>
          <p className="mt-2 text-[11px] font-mono tabular-nums text-subtle">{ev[champTime]}</p>
          <p className="mt-0.5 text-[13px] font-semibold text-ink leading-tight">{ev[champType]}</p>
          <p className="text-[11px] text-muted leading-snug line-clamp-2 mt-0.5">{ev[champDetail]}</p>
        </li>
      ))}
    </ol>
  );
}

function Bloc({ title, icon, count, children }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3.5">
        <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
          <Icon name={icon} className="text-[18px]" filled />
        </span>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {count != null && <span className="ml-auto text-xs font-semibold tabular-nums text-muted bg-surface-2 px-2 py-0.5 rounded-full">{count}</span>}
      </div>
      {children}
    </div>
  );
}

// En-tête de section (page Détails en défilement continu).
// Badge PLEIN (rang 1) pour se distinguer des cartes internes ; séparateur avant chaque section.
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

const ANCRES = { Résumé: "resume", Activité: "activite", Paiements: "paiements", Documents: "documents", Historique: "historique" };

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
  const paiements = historiquePaiements(id);
  const fiche = paieDetail(id);
  const docs = documentsEmploye(id);
  const rh = historiqueRH(id);

  const scrollTo = (ancre) => document.getElementById(ancre)?.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });

  // Montant signé (le signe porte l'info, pas seulement la couleur → daltonisme).
  const signe = (n) => (!n ? fcfa(0) : (n > 0 ? "+" : "") + fcfa(n));
  const statsPaie = [
    { k: "Salaire de base", disp: fcfa(fiche.base), tone: "text-ink" },
    { k: "Primes", disp: signe(fiche.primes), tone: "text-emerald-600" },
    { k: "Avances", disp: signe(-fiche.avances), tone: "text-amber-600" },
    { k: "Retenues", disp: signe(-fiche.retenues), tone: "text-rose-600" },
    { k: "Net à payer", disp: fcfa(fiche.net), tone: "text-brand-600", fort: true },
  ];

  const paieCols = [
    { key: "mois", label: "Mois", render: (r) => <span className="text-texte font-medium">{r.mois}</span> },
    { key: "net", label: "Net versé", align: "right", render: (r) => <span className="font-mono tabular-nums text-ink font-medium">{fcfa(r.net)}</span> },
    { key: "status", label: "Statut", align: "right", render: (r) => <StatusPill label={r.status} tone={r.status === "Payé" ? "emerald" : "amber"} /> },
  ];

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
        onPaiements={() => scrollTo("paiements")}
        onPlus={() => navigate(`/employes/${id}`)}
        plusLabel="Présence"
        plusIcon="event_available"
      />

      {/* ---------- RÉSUMÉ ---------- */}
      <Section id="resume" icon="badge" title="Résumé" first>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-ink mb-1">Coordonnées</h3>
            <InfoRow icon="badge" label="Matricule" value={e.id} />
            <InfoRow icon="mail" label="Email" value={e.email} href={`mailto:${e.email}`} />
            <InfoRow icon="call" label="Téléphone" value={e.phone} href={`tel:${e.phone.replace(/\s/g, "")}`} />
            <InfoRow icon="home" label="Adresse" value={d.adresse ?? "—"} />
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-ink mb-1">Affectation &amp; RH</h3>
            <InfoRow icon="work" label="Fonction" value={e.fonction} />
            <InfoRow icon="domain" label="Service" value={e.department} />
            <InfoRow icon="supervisor_account" label="Manager" value={d.manager ?? "—"} />
            <InfoRow icon="event" label="Embauche" value={d.embauche ?? "—"} />
            {d.urgence && <InfoRow icon="emergency" label="Urgence" value={`${d.urgence.nom} (${d.urgence.lien}) · ${d.urgence.tel}`} />}
          </div>
        </div>
      </Section>

      {/* ---------- ACTIVITÉ ---------- */}
      <Section id="activite" icon="bolt" title="Activité du jour">
        <div className="grid grid-cols-2 gap-3 lg:gap-4">
          <Bloc title="Connexions" icon="login" count={actDetail.connexions.length}>
            <ul className="space-y-2.5 text-sm">
              {actDetail.connexions.map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span className="text-muted truncate">Poste {c.poste}</span>
                  <span className="font-mono tabular-nums text-texte shrink-0">{c.time}</span>
                </li>
              ))}
            </ul>
          </Bloc>
          <Bloc title="Déconnexions" icon="logout" count={actDetail.deconnexions.length}>
            <ul className="space-y-2.5 text-sm">
              {actDetail.deconnexions.map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span className="text-muted truncate">{c.motif}</span>
                  <span className="font-mono tabular-nums text-texte shrink-0">{c.time}</span>
                </li>
              ))}
            </ul>
          </Bloc>
          <Bloc title="Inactivités" icon="motion_photos_paused" count={actDetail.inactivites.length}>
            <ul className="space-y-2.5 text-sm">
              {actDetail.inactivites.map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span className="text-muted truncate">Dès {c.debut}</span>
                  <span className="font-medium text-amber-600 shrink-0">{c.duree}</span>
                </li>
              ))}
            </ul>
          </Bloc>
          <Bloc title="Justifications" icon="verified" count={actDetail.justifications.length}>
            <ul className="space-y-2.5 text-sm">
              {actDetail.justifications.map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
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

      {/* ---------- PAIEMENTS ---------- */}
      <Section id="paiements" icon="payments" title="Paiements">
        <div>
          <p className="text-xs text-subtle mb-2">Fiche du mois en cours</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {statsPaie.map((s) => (
              <div key={s.k} className={`card p-4 ${s.fort ? "border-brand-600/30 bg-brand-50/40" : ""}`}>
                <p className={`text-lg font-semibold tabular-nums font-mono leading-none ${s.tone}`}>{s.disp}</p>
                <p className="text-xs text-muted mt-1.5">{s.k}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-ink">Historique des paiements</h3>
          </div>
          <Table columns={paieCols} data={paiements} rowKey={(r) => r.mois} minWidth={420} />
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
