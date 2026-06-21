import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import Tabs from "../components/ui/Tabs.jsx";
import Table from "../components/ui/Table.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { employes, tempsReel, toneLive } from "../data/datasets.js";
import {
  employeDetails,
  historiquePresence,
  historiqueActivite,
  activiteDetail,
  productiviteEmploye,
  historiquePaiements,
  paieDetail,
  documentsEmploye,
  historiqueRH,
} from "../data/profil.js";

const euro = (n) => n.toLocaleString("fr-FR") + " €";

const dotLive = { "En activité": "bg-emerald-400", "En pause": "bg-amber-400", Absent: "bg-rose-400", Congé: "bg-sky-400" };
const tonePastille = {
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  sky: "bg-sky-50 text-sky-600",
  brand: "bg-brand-50 text-brand-600",
  slate: "bg-slate-50 text-slate-600",
};
const tonesTexte = { emerald: "text-emerald-600", amber: "text-amber-600", rose: "text-rose-600", sky: "text-sky-600", brand: "text-brand-600" };
const barreScore = { emerald: "bg-emerald-500", brand: "bg-brand-600", amber: "bg-amber-500", rose: "bg-rose-500" };

function tempsTravaille(arrivee) {
  if (!arrivee || arrivee === "--:--") return "—";
  const [h, m] = arrivee.split(":").map(Number);
  let min = 13 * 60 + 30 - (h * 60 + m);
  if (min < 0) min = 0;
  return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}m`;
}
const couleurScore = (s) => (s >= 90 ? "emerald" : s >= 80 ? "brand" : s >= 70 ? "amber" : "rose");

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
      {items.map((e, i) => (
        <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
          <div className="flex flex-col items-center">
            <span className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${tonePastille[e.tone] ?? tonePastille.slate}`}>
              <Icon name={e.icon} className="text-[15px]" filled />
            </span>
            {i < items.length - 1 && <span className="w-px flex-1 bg-border mt-1" />}
          </div>
          <div className="pb-1 min-w-0">
            <p className="text-sm font-medium text-ink">{e[champType]}</p>
            <p className="text-xs text-muted">{e[champDetail]}</p>
            <p className="text-xs text-subtle font-mono mt-0.5">{e[champTime]}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

// Bloc-section générique (onglets détaillés).
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

export default function ProfilEmploye() {
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
  const t = e.today ?? {};
  const presence = historiquePresence(id);
  const activite = historiqueActivite(id);
  const actDetail = activiteDetail(id);
  const prod = productiviteEmploye(id);
  const paiements = historiquePaiements(id);
  const fiche = paieDetail(id);
  const docs = documentsEmploye(id);
  const rh = historiqueRH(id);
  const derniere = activite[activite.length - 1];

  const stats = [
    { label: "Heure d'arrivée", value: t.arrivee && t.arrivee !== "--:--" ? t.arrivee : "—", sub: "Aujourd'hui", icon: "login", tone: "emerald" },
    { label: "Temps travaillé", value: tempsTravaille(t.arrivee), sub: "Aujourd'hui", icon: "schedule", tone: "brand" },
    { label: "Productivité", value: `${prod.score} %`, sub: `Rang ${prod.rang}/${prod.total}`, icon: "trending_up", tone: couleurScore(prod.score) },
    { label: "Dernière activité", value: derniere?.time ?? "—", sub: tr.depuis && tr.depuis !== "—" ? tr.depuis : "—", icon: "bolt", tone: "amber" },
  ];

  const onglets = ["Résumé", "Présence", "Activité", "Productivité", "Paiements", "Documents", "Historique"].map((v) => ({ label: v, value: v }));

  const tuilesAction = [
    { label: "Présence", sub: "Voir l'historique", icon: "event_available", cible: "Présence" },
    { label: "Activité", sub: "Voir le détail", icon: "bolt", cible: "Activité" },
    { label: "Productivité", sub: "Voir le score", icon: "trending_up", cible: "Productivité" },
    { label: "Paiements", sub: "Voir l'historique", icon: "payments", cible: "Paiements" },
  ];

  const presenceCols = [
    { key: "date", label: "Date", render: (r) => <span className="text-texte font-medium">{r.date}</span> },
    { key: "statut", label: "Statut", render: (r) => <StatusPill label={r.statut} tone={{ Présent: "emerald", Retard: "amber", Absent: "rose", Congé: "sky" }[r.statut] ?? "slate"} /> },
    { key: "arrivee", label: "Arrivée", render: (r) => <span className="font-mono tabular-nums text-texte">{r.arrivee}</span> },
    { key: "depart", label: "Départ", render: (r) => <span className="font-mono tabular-nums text-texte">{r.depart}</span> },
    { key: "retardMin", label: "Retard", render: (r) => (r.retardMin > 0 ? <span className="text-rose-600">+{r.retardMin} min</span> : <span className="text-muted">—</span>) },
    { key: "temps", label: "Temps", render: (r) => <span className="font-mono tabular-nums text-texte">{r.temps}</span> },
  ];

  const paieCols = [
    { key: "mois", label: "Mois", render: (r) => <span className="text-texte font-medium">{r.mois}</span> },
    { key: "net", label: "Net versé", align: "right", render: (r) => <span className="font-mono tabular-nums text-ink font-medium">{euro(r.net)}</span> },
    { key: "status", label: "Statut", align: "right", render: (r) => <StatusPill label={r.status} tone={r.status === "Payé" ? "emerald" : "amber"} /> },
  ];

  return (
    <div className="space-y-5 pb-12 max-w-6xl">
      {/* Retour */}
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink transition-colors">
        <Icon name="arrow_back" className="text-[18px]" />
        Retour
      </button>

      {/* Héros — bandeau canard */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-600 p-6 shadow-card">
        <div className="absolute -right-8 -top-10 w-44 h-44 rounded-full bg-white/5" aria-hidden="true" />
        <div className="absolute -right-16 top-16 w-44 h-44 rounded-full bg-white/5" aria-hidden="true" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="relative shrink-0 mx-auto sm:mx-0">
            <Avatar name={e.name} size="w-20 h-20" className="text-2xl ring-2 ring-white/30 ring-offset-2 ring-offset-brand-700" />
            <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-brand-600 ${dotLive[live] ?? "bg-slate-300"}`} />
          </div>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h1 className="text-2xl font-semibold text-white tracking-tight">{e.name}</h1>
              <span className="inline-flex items-center gap-1.5 self-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/15 text-white">
                <span className={`w-1.5 h-1.5 rounded-full ${dotLive[live] ?? "bg-slate-300"}`} />
                {live}
              </span>
            </div>
            <p className="text-white/85 mt-1">{e.fonction} · {e.department}</p>
            <p className="text-xs font-mono text-white/60 mt-1">{e.id} · {e.agence}</p>
          </div>
          <div className="flex items-center justify-center gap-2 shrink-0">
            <button
              onClick={() => toast(`Message à ${e.name}`, "info")}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
            >
              <Icon name="mail" className="text-[18px]" /> Message
            </button>
            <button
              onClick={() => toast(`Appel de ${e.name}`, "info")}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold bg-canvas text-brand-700 hover:bg-white transition-colors"
            >
              <Icon name="call" className="text-[18px]" /> Appeler
            </button>
          </div>
        </div>
      </div>

      {/* 4 tuiles de stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${tonePastille[s.tone] ?? tonePastille.slate}`}>
              <Icon name={s.icon} className="text-[20px]" filled />
            </span>
            <p className="mt-3 text-xl font-semibold text-ink tabular-nums leading-none truncate">{s.value}</p>
            <p className="text-sm font-medium text-texte mt-1.5">{s.label}</p>
            <p className="text-xs text-subtle mt-0.5 truncate">{s.sub}</p>
          </div>
        ))}
      </div>

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
              <button key={a.label} onClick={() => setOnglet(a.cible)} className="card card-hover p-4 text-left flex items-center gap-3">
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

      {/* ---------- PRÉSENCE ---------- */}
      {onglet === "Présence" && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {[
              { k: "Retards (7 j)", v: presence.filter((p) => p.statut === "Retard").length, tone: "amber" },
              { k: "Absences (7 j)", v: presence.filter((p) => p.statut === "Absent").length, tone: "rose" },
              { k: "Jours présents", v: presence.filter((p) => p.statut === "Présent" || p.statut === "Retard").length, tone: "emerald" },
            ].map((s) => (
              <div key={s.k} className="card p-4">
                <p className={`text-2xl font-semibold tabular-nums leading-none ${tonesTexte[s.tone]}`}>{s.v}</p>
                <p className="text-xs text-muted mt-1.5">{s.k}</p>
              </div>
            ))}
          </div>
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-ink">Historique des pointages</h2>
            </div>
            <Table columns={presenceCols} data={presence} rowKey={(r) => r.date} minWidth={620} />
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

      {/* ---------- PRODUCTIVITÉ ---------- */}
      {onglet === "Productivité" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Score */}
            <div className="card p-5 lg:col-span-1">
              <p className="kicker mb-2">Score de productivité</p>
              <div className="flex items-end gap-2">
                <span className={`text-4xl font-semibold tabular-nums leading-none ${tonesTexte[couleurScore(prod.score)]}`}>{prod.score}</span>
                <span className="text-lg text-muted mb-0.5">%</span>
                <span className={`ml-auto inline-flex items-center gap-0.5 text-xs font-medium ${prod.tendance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  <Icon name={prod.tendance >= 0 ? "trending_up" : "trending_down"} className="text-[16px]" />
                  {prod.tendance >= 0 ? "+" : ""}{prod.tendance} %
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-2 mt-4 overflow-hidden">
                <div className={`h-full rounded-full ${barreScore[couleurScore(prod.score)]}`} style={{ width: `${prod.score}%` }} />
              </div>
              <p className="text-xs text-subtle mt-2">Sur les 7 derniers jours</p>
            </div>
            {/* Rang */}
            <div className="card p-5 flex flex-col justify-center items-center text-center">
              <span className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-2">
                <Icon name="emoji_events" className="text-[26px]" filled />
              </span>
              <p className="text-3xl font-semibold text-ink tabular-nums leading-none">
                {prod.rang}
                <span className="text-lg text-muted">/{prod.total}</span>
              </p>
              <p className="text-xs text-muted mt-1.5">Classement de l'équipe</p>
            </div>
            {/* Temps */}
            <div className="card p-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xl font-semibold text-ink tabular-nums leading-none">{prod.tempsMoyen}</p>
                <p className="text-xs text-muted mt-1.5">Temps travaillé / jour</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-amber-600 tabular-nums leading-none">{prod.inactivite}</p>
                <p className="text-xs text-muted mt-1.5">Inactivité / jour</p>
              </div>
            </div>
          </div>
          {/* Série 7 jours */}
          <div className="card p-5">
            <h2 className="text-base font-semibold text-ink mb-4">Productivité — 7 derniers jours</h2>
            <div className="flex items-end gap-2 sm:gap-3 h-40">
              {prod.serie.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
                  <span className="text-[11px] font-mono tabular-nums text-muted">{v}</span>
                  <div className="w-full rounded-t-md bg-brand-600/85 hover:bg-brand-600 transition-colors" style={{ height: `${v}%` }} />
                  <span className="text-[10px] text-subtle">J{i + 1}</span>
                </div>
              ))}
            </div>
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
                <p className={`text-lg font-semibold tabular-nums font-mono leading-none ${s.tone}`}>{euro(s.v)}</p>
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
