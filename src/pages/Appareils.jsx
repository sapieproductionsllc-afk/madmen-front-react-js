import { useEffect, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { apiGet } from "../lib/api.js";

const EVENEMENTS = [
  { id: 1, agent: "Karim Benali", action: "Pointage — entrée", appareil: "ZKTeco K40", heure: "08:42", icon: "login", bg: "bg-emerald-50 text-emerald-600" },
  { id: 2, agent: "Elena Vance", action: "Reconnaissance faciale", appareil: "Watchman", heure: "08:39", icon: "face", bg: "bg-or-100 text-or-700" },
  { id: 3, agent: "Sarah Jenkins", action: "Pointage — entrée", appareil: "ZKTeco K40", heure: "08:35", icon: "login", bg: "bg-emerald-50 text-emerald-600" },
  { id: 4, agent: "Inconnu", action: "Échec de reconnaissance", appareil: "Watchman", heure: "08:31", icon: "error", bg: "bg-rose-50 text-rose-600" },
  { id: 5, agent: "Marcus Thorne", action: "Pointage — entrée", appareil: "ZKTeco K40", heure: "08:28", icon: "login", bg: "bg-emerald-50 text-emerald-600" },
  { id: 6, agent: "Amélie Dubois", action: "Reconnaissance faciale", appareil: "Watchman", heure: "08:24", icon: "face", bg: "bg-or-100 text-or-700" },
];

// Choix de l'icône/couleur de carte selon le type d'appareil renvoyé par l'API.
function styleType(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("facial") || t.includes("visage") || t.includes("face") || t.includes("caméra") || t.includes("camera"))
    return { icon: "face", bg: "bg-or-100 text-or-700" };
  if (t.includes("rfid") || t.includes("badge"))
    return { icon: "badge", bg: "bg-brand-50 text-brand-600" };
  // Empreinte / pointeuse par défaut
  return { icon: "fingerprint", bg: "bg-brand-50 text-brand-600" };
}

// Appareil API {id,name,type,agence,status,lastSync} -> objet attendu par CarteAppareil.
// Champs absents de l'API mis à une valeur neutre pour ne rien casser : ip, firmware, stats.
function mapAppareil(a) {
  const { icon, bg } = styleType(a.type);
  return {
    id: a.id,
    nom: a.name || "—",
    type: a.type || "—",
    icon,
    bg,
    status: a.status || "—",
    ip: a.ip || "—", // absent de l'API
    firmware: a.firmware || "—", // absent de l'API
    emplacement: a.agence || "—",
    derniereSync: a.lastSync || "—",
    stats: [], // absent de l'API : aucune carte stat affichée
  };
}

function Meta({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-texte tabular-nums">{value}</dd>
    </div>
  );
}

function CarteAppareil({ a, onSync, onConfig }) {
  return (
    <article className="card p-5 flex flex-col">
      <div className="flex items-start gap-3">
        <span className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${a.bg}`}><Icon name={a.icon} className="text-[26px]" filled /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-ink">{a.nom}</h3>
            <StatusPill label={a.status} tone={a.status === "En ligne" ? "emerald" : a.status === "Maintenance" ? "amber" : "rose"} />
          </div>
          <p className="text-xs text-muted mt-0.5">{a.type} · {a.emplacement}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        {a.stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-surface-2/50 border border-border p-3 text-center">
            <p className="text-lg font-semibold text-ink tabular-nums leading-none">{s.value}</p>
            <p className="text-[11px] text-muted mt-1 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2 text-xs">
        <Meta label="Adresse IP" value={a.ip} />
        <Meta label="Firmware" value={a.firmware} />
        <Meta label="Dernière synchro." value={a.derniereSync} />
        <Meta label="Réseau" value="Wi-Fi" />
      </dl>

      <div className="mt-auto pt-4 flex gap-2">
        <Button variant="secondary" size="sm" icon="sync" onClick={() => onSync(a)}>Synchroniser</Button>
        <Button variant="ghost" size="sm" icon="tune" onClick={() => onConfig(a)}>Configurer</Button>
      </div>
    </article>
  );
}

export default function Appareils({ embedded = false }) {
  const { toast } = useUI();
  const [appareils, setAppareils] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  // Données RÉELLES depuis l'API (remplace les mocks de src/data).
  useEffect(() => {
    apiGet("/api/appareils")
      .then((data) => setAppareils((Array.isArray(data) ? data : []).map(mapAppareil)))
      .catch((e) => setErreur(e?.message || "Erreur de chargement"))
      .finally(() => setChargement(false));
  }, []);

  const actions = (
    <div className="flex gap-2 shrink-0">
      <Button variant="secondary" icon="sync" onClick={() => toast("Synchronisation des 2 appareils lancée", "success")}>Tout synchroniser</Button>
      <Button variant="primary" icon="add" onClick={() => toast("Ajout d'appareil ouvert", "info")}>Ajouter un appareil</Button>
    </div>
  );

  const corps = (
    <>
      {chargement ? (
        <div className="card py-16 text-center">
          <Icon name="progress_activity" className="text-faint text-[40px] animate-spin" />
          <p className="mt-2 text-sm text-muted">Chargement des appareils…</p>
        </div>
      ) : erreur ? (
        <div className="card py-16 text-center">
          <Icon name="error" className="text-rose-500 text-[40px]" />
          <p className="mt-2 text-sm text-muted">{erreur}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {appareils.map((a) => (
            <CarteAppareil key={a.id} a={a} onSync={(d) => toast(`${d.nom} synchronisé`, "success")} onConfig={(d) => toast(`Configuration de ${d.nom} ouverte`, "info")} />
          ))}
        </div>
      )}

      <section className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Icon name="history" className="text-[20px]" filled /></span>
          <div>
            <h3 className="text-sm font-semibold text-ink">Activité récente des appareils</h3>
            <p className="text-xs text-muted">Derniers événements remontés par le K40 et le Watchman.</p>
          </div>
        </div>
        <div className="divide-y divide-border">
          {EVENEMENTS.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-5 py-3">
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${e.bg}`}><Icon name={e.icon} className="text-[18px]" filled /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink truncate">{e.agent} <span className="text-muted font-normal">· {e.action}</span></p>
                <p className="text-xs text-subtle">{e.appareil}</p>
              </div>
              <span className="text-xs text-subtle tabular-nums shrink-0">{e.heure}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  return (
    <div className={embedded ? "space-y-5" : "space-y-5 pb-12"}>
      {embedded ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-muted inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 2 appareils · <span className="text-texte font-medium">2 en ligne</span> · synchro il y a 1 min</p>
          {actions}
        </div>
      ) : (
        <PageHeader title="Appareils biométriques" subtitle="Pointeuse à empreinte K40 et caméra faciale Watchman.">{actions}</PageHeader>
      )}
      {corps}
    </div>
  );
}
