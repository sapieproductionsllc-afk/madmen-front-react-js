import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import Tabs from "../components/ui/Tabs.jsx";
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

function InfoRow({ icon, label, value, href }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <span className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center shrink-0">
        <Icon name={icon} className="text-subtle text-[18px]" />
      </span>
      <span className="text-sm text-muted w-32 shrink-0">{label}</span>
      {href ? (
        <a href={href} className="text-sm text-texte font-medium hover:text-brand-600 truncate">{value}</a>
      ) : (
        <span className="text-sm text-texte font-medium truncate">{value}</span>
      )}
    </div>
  );
}

function Timeline({ items, champTime = "time", champType = "type", champDetail = "detail" }) {
  return (
    <ol className="relative">
      {items.map((ev, i) => (
        <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
          <div className="flex flex-col items-center">
            <span className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${tonePastille[ev.tone] ?? tonePastille.slate}`}>
              <Icon name={ev.icon} className="text-[15px]" filled />
            </span>
            {i < items.length - 1 && <span className="w-px flex-1 bg-border mt-1" />}
          </div>
          <div className="pb-1 min-w-0">
            <p className="text-sm font-medium text-ink">{ev[champType]}</p>
            <p className="text-xs text-muted">{ev[champDetail]}</p>
            <p className="text-xs text-subtle font-mono mt-0.5">{ev[champTime]}</p>
          </div>
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
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {count != null && <span className="ml-auto text-xs font-semibold tabular-nums text-muted bg-surface-2 px-2 py-0.5 rounded-full">{count}</span>}
      </div>
      {children}
    </div>
  );
}

export default function ProfilDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useUI();
  const [onglet, setOnglet] = useState(location.state?.onglet ?? "Résumé");

  const e = employes.find((x) => x.id === id);

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

  const onglets = ["Résumé", "Activité", "Paiements", "Documents", "Historique"].map((v) => ({ label: v, value: v }));

  const tuilesAction = [
    { label: "Présence", sub: "Voir le calendrier", icon: "event_available", action: () => navigate(`/employes/${id}`) },
    { label: "Activité", sub: "Voir le détail", icon: "bolt", action: () => setOnglet("Activité") },
    { label: "Paiements", sub: "Voir l'historique", icon: "payments", action: () => setOnglet("Paiements") },
    { label: "Documents", sub: "Voir les fichiers", icon: "folder", action: () => setOnglet("Documents") },
  ];

  const paieCols = [
    { key: "mois", label: "Mois", render: (r) => <span className="text-texte font-medium">{r.mois}</span> },
    { key: "net", label: "Net versé", align: "right", render: (r) => <span className="font-mono tabular-nums text-ink font-medium">{fcfa(r.net)}</span> },
    { key: "status", label: "Statut", align: "right", render: (r) => <StatusPill label={r.status} tone={r.status === "Payé" ? "emerald" : "amber"} /> },
  ];

  return (
    <div className="space-y-4 pb-10">
      <button onClick={() => navigate(`/employes/${id}`)} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink transition-colors">
        <Icon name="arrow_back" className="text-[18px]" />
        Retour à la présence
      </button>

      <BandeauAgent
        e={e}
        live={live}
        onPaiements={() => setOnglet("Paiements")}
        onPlus={() => navigate(`/employes/${id}`)}
        plusLabel="Présence"
        plusIcon="event_available"
      />

      {/* Onglets */}
      <div className="border-b border-border overflow-x-auto scroll-thin">
        <Tabs tabs={onglets} active={onglet} onChange={setOnglet} />
      </div>

      {/* ---------- RÉSUMÉ ---------- */}
      {onglet === "Résumé" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card p-5">
              <h2 className="text-base font-semibold text-ink mb-3">Informations</h2>
              <InfoRow icon="badge" label="Matricule" value={e.id} />
              <InfoRow icon="mail" label="Email" value={e.email} href={`mailto:${e.email}`} />
              <InfoRow icon="call" label="Téléphone" value={e.phone} href={`tel:${e.phone.replace(/\s/g, "")}`} />
              <InfoRow icon="home" label="Adresse" value={d.adresse ?? "—"} />
              <InfoRow icon="domain" label="Service" value={e.department} />
              <InfoRow icon="supervisor_account" label="Manager" value={d.manager ?? "—"} />
              <InfoRow icon="event" label="Date d'embauche" value={d.embauche ?? "—"} />
              {d.urgence && <InfoRow icon="emergency" label="Urgence" value={`${d.urgence.nom} (${d.urgence.lien}) · ${d.urgence.tel}`} />}
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-ink">Dernières activités</h2>
                <button onClick={() => setOnglet("Activité")} className="text-xs font-medium text-brand-600 hover:text-brand-700">Voir tout</button>
              </div>
              <Timeline items={activite.slice(0, 4)} />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {tuilesAction.map((a) => (
              <button key={a.label} onClick={a.action} className="card card-hover p-4 text-left flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                  <Icon name={a.icon} className="text-[20px]" filled />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{a.label}</p>
                  <p className="text-xs text-subtle truncate">{a.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---------- ACTIVITÉ ---------- */}
      {onglet === "Activité" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Bloc title="Connexions" icon="login" count={actDetail.connexions.length}>
            <ul className="space-y-2.5 text-sm">
              {actDetail.connexions.map((c, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-muted">Poste {c.poste}</span>
                  <span className="font-mono tabular-nums text-texte">{c.time}</span>
                </li>
              ))}
            </ul>
          </Bloc>
          <Bloc title="Déconnexions" icon="logout" count={actDetail.deconnexions.length}>
            <ul className="space-y-2.5 text-sm">
              {actDetail.deconnexions.map((c, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-muted">{c.motif}</span>
                  <span className="font-mono tabular-nums text-texte">{c.time}</span>
                </li>
              ))}
            </ul>
          </Bloc>
          <Bloc title="Inactivités" icon="motion_photos_paused" count={actDetail.inactivites.length}>
            <ul className="space-y-2.5 text-sm">
              {actDetail.inactivites.map((c, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-muted">À partir de {c.debut}</span>
                  <span className="font-medium text-amber-600">{c.duree}</span>
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
          <div className="lg:col-span-2">
            <Bloc title="Journal du jour" icon="schedule">
              <Timeline items={activite} />
            </Bloc>
          </div>
        </div>
      )}

      {/* ---------- PAIEMENTS ---------- */}
      {onglet === "Paiements" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { k: "Salaire de base", v: fiche.base, tone: "text-ink" },
              { k: "Primes", v: fiche.primes, tone: "text-emerald-600" },
              { k: "Avances", v: -fiche.avances, tone: "text-amber-600" },
              { k: "Retenues", v: -fiche.retenues, tone: "text-rose-600" },
              { k: "Net à payer", v: fiche.net, tone: "text-brand-600", fort: true },
            ].map((s) => (
              <div key={s.k} className={`card p-4 ${s.fort ? "border-brand-600/30 bg-brand-50/40" : ""}`}>
                <p className={`text-lg font-semibold tabular-nums font-mono leading-none ${s.tone}`}>{fcfa(s.v)}</p>
                <p className="text-xs text-muted mt-1.5">{s.k}</p>
              </div>
            ))}
          </div>
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-ink">Historique des paiements</h2>
            </div>
            <Table columns={paieCols} data={paiements} rowKey={(r) => r.mois} minWidth={420} />
          </div>
        </div>
      )}

      {/* ---------- DOCUMENTS ---------- */}
      {onglet === "Documents" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((doc) => (
            <div key={doc.nom} className="card card-hover p-4 flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <Icon name={doc.icon} className="text-[22px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink truncate">{doc.nom}</p>
                <p className="text-xs text-subtle">{doc.type} · {doc.date} · {doc.size}</p>
              </div>
              <Icon name="download" className="text-subtle hover:text-brand-600 text-[20px] cursor-pointer" />
            </div>
          ))}
        </div>
      )}

      {/* ---------- HISTORIQUE ---------- */}
      {onglet === "Historique" && (
        <div className="card p-5 max-w-2xl">
          <h2 className="text-base font-semibold text-ink mb-4">Historique RH</h2>
          <Timeline items={rh} champTime="date" />
        </div>
      )}
    </div>
  );
}
