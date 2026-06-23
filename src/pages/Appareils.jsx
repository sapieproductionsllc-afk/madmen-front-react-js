import { useEffect, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { apiGet, apiPost } from "../lib/api.js";

// Formate un horodatage SQL (YYYY-MM-DD HH:MM:SS) en heure courte "HH:MM".
// Renvoie une valeur neutre si le format est inattendu plutôt que de planter.
function formatHeure(ts) {
  if (!ts || typeof ts !== "string") return "—";
  const m = ts.match(/(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "—";
}

// Incident d'inactivité API
// {id, employe, heure_verrouillage, heure_reprise, duree_minutes, motif, justification, statut}
// -> événement attendu par le rendu {id, agent, action, appareil, heure, icon, bg}.
// L'API ne renvoie pas le nom d'appareil : les incidents proviennent des postes
// WatchMEN, on l'indique de façon neutre sans inventer de référence matérielle.
function mapEvenement(i) {
  const statut = (i.statut || "").toLowerCase();
  const motif = i.motif || "Inactivité";
  const repris = i.heure_reprise != null;

  // Action lisible : verrouillage / reprise + motif, durée si connue.
  let action;
  if (repris) {
    const duree = Number(i.duree_minutes) > 0 ? ` (${i.duree_minutes} min)` : "";
    action = `Reprise — ${motif}${duree}`;
  } else {
    action = `Verrouillage poste — ${motif}`;
  }

  // Icône/couleur selon l'état de l'incident.
  let icon = "lock";
  let bg = "bg-amber-50 text-amber-600";
  if (repris) {
    icon = "lock_open";
    bg = "bg-emerald-50 text-emerald-600";
  } else if (statut === "non_justifie" || statut === "rejete") {
    icon = "error";
    bg = "bg-rose-50 text-rose-600";
  }

  return {
    id: i.id,
    agent: i.employe || "Agent inconnu",
    action,
    appareil: "Poste WatchMEN",
    // L'événement le plus pertinent : reprise si elle existe, sinon verrouillage.
    heure: formatHeure(repris ? i.heure_reprise : i.heure_verrouillage),
    icon,
    bg,
  };
}

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

// Normalise le statut : l'API renvoie "en_ligne"/"hors_ligne" (base locale) ou déjà
// "En ligne"/"Hors ligne" (autre seed) — on affiche toujours le format attendu par la pastille.
const STATUT_APP = { en_ligne: "En ligne", hors_ligne: "Hors ligne", maintenance: "Maintenance" };

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
    status: STATUT_APP[a.status] || a.status || "—",
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

  // Activité récente des appareils : les incidents d'inactivité remontés par les
  // postes WatchMEN (GET /api/incidents, triés du plus récent au plus ancien).
  const [evenements, setEvenements] = useState([]);
  const [evChargement, setEvChargement] = useState(true);
  const [evErreur, setEvErreur] = useState(false);

  // Données RÉELLES depuis l'API (remplace les mocks de src/data).
  useEffect(() => {
    apiGet("/api/appareils")
      .then((data) => setAppareils((Array.isArray(data) ? data : []).map(mapAppareil)))
      .catch((e) => setErreur(e?.message || "Erreur de chargement"))
      .finally(() => setChargement(false));
  }, []);

  // Événements récents : dégradation gracieuse — en cas d'erreur/404, on affiche
  // un état vide neutre plutôt que de casser la page (l'API est en prod).
  useEffect(() => {
    apiGet("/api/incidents?limit=8")
      .then((data) => setEvenements((Array.isArray(data) ? data : []).map(mapEvenement)))
      .catch(() => setEvErreur(true))
      .finally(() => setEvChargement(false));
  }, []);

  // Pousse les utilisateurs + les empreintes enrôlées vers le K40 (via pyzk côté API).
  // L'employé peut alors pointer au doigt sur le terminal.
  const [syncK40, setSyncK40] = useState(false);
  const synchroniserK40 = async () => {
    if (syncK40) return;
    setSyncK40(true);
    toast("Synchronisation des empreintes vers le K40…", "info");
    try {
      await apiPost("/api/k40/push-all", {});
      const r = await apiPost("/api/k40/push-fingerprints", {});
      toast(`K40 synchronisé — ${r?.synced ?? 0} empreinte(s) envoyée(s)`, "success");
    } catch (e) {
      toast(e?.message || "Échec de la synchro K40 (le terminal est-il joignable ?)", "error");
    } finally {
      setSyncK40(false);
    }
  };

  const actions = (
    <div className="flex gap-2 shrink-0">
      <Button variant="secondary" icon="sync" onClick={synchroniserK40} disabled={syncK40}>
        {syncK40 ? "Synchro…" : "Synchroniser le K40"}
      </Button>
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
            <CarteAppareil key={a.id} a={a} onSync={synchroniserK40} onConfig={(d) => toast(`Configuration de ${d.nom} ouverte`, "info")} />
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
        {evChargement ? (
          <div className="px-5 py-10 text-center">
            <Icon name="progress_activity" className="text-faint text-[28px] animate-spin" />
            <p className="mt-2 text-xs text-muted">Chargement de l'activité…</p>
          </div>
        ) : evErreur || evenements.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Icon name="history_toggle_off" className="text-faint text-[28px]" />
            <p className="mt-2 text-xs text-muted">Aucune activité récente à afficher.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {evenements.map((e) => (
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
        )}
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
