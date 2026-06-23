import { useState, useEffect } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import { Input, Select, Field as Champ } from "../components/ui/Input.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { apiGet, apiPut } from "../lib/api.js";

const CLE = "madmen_parametres";
const DEFAULTS = {
  entreprise: "MADMEN Group",
  fuseau: "Afrique/Brazzaville",
  langue: "Français",
  devise: "FCFA",
  seuilInactivite: 5,
  debut: "08:30",
  fin: "17:30",
  toleranceRetard: 5,
  retenueMinute: 300,
  retenueAuto: true,
  justifAbsence: true,
  notifs: { retards: true, connexions: true, inactivite: true },
  securite: { twoFA: true, masquerSalaires: true, audit: true },
};

// Fusionne une source partielle (localStorage ou API) avec les valeurs par défaut,
// en préservant les sous-objets notifs/securite.
function fusionner(src) {
  if (!src || typeof src !== "object") return DEFAULTS;
  return {
    ...DEFAULTS,
    ...src,
    notifs: { ...DEFAULTS.notifs, ...(src.notifs || {}) },
    securite: { ...DEFAULTS.securite, ...(src.securite || {}) },
  };
}

function charger() {
  try {
    const s = JSON.parse(localStorage.getItem(CLE) || "null");
    return s ? fusionner(s) : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function Section({ icon, title, desc, children }) {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3 mb-4 pb-4 border-b border-border">
        <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Icon name={icon} className="text-[22px]" filled /></span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink tracking-tight">{title}</h2>
          <p className="text-xs text-muted mt-0.5">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-texte">{label}</p>
        {desc && <p className="text-xs text-muted mt-0.5 leading-snug">{desc}</p>}
      </div>
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
    </div>
  );
}

export default function Parametres({ embedded = false, onDirty }) {
  const { toast } = useUI();
  const [saved, setSaved] = useState(charger);
  const [params, setParams] = useState(saved);
  const [chargement, setChargement] = useState(true);
  const [sauvegarde, setSauvegarde] = useState(false);

  // Au montage : GET /api/parametres pour préremplir le formulaire.
  // Dégradation gracieuse : en cas d'erreur/404, on conserve les valeurs locales (localStorage/DEFAULTS).
  useEffect(() => {
    let actif = true;
    apiGet("/api/parametres")
      .then((data) => {
        if (!actif) return;
        if (data && typeof data === "object" && Object.keys(data).length) {
          const fusionne = fusionner(data);
          setSaved(fusionne);
          setParams(fusionne);
        }
      })
      .catch(() => { /* API indisponible — on garde les valeurs locales */ })
      .finally(() => { if (actif) setChargement(false); });
    return () => { actif = false; };
  }, []);

  const dirty = JSON.stringify(params) !== JSON.stringify(saved);
  useEffect(() => { onDirty?.(dirty); }, [dirty, onDirty]);
  const set = (k, v) => setParams((p) => ({ ...p, [k]: v }));
  const setNum = (k, e) => set(k, e.target.value === "" ? "" : Number(e.target.value));
  const setNotif = (k, v) => setParams((p) => ({ ...p, notifs: { ...p.notifs, [k]: v } }));
  const setSecu = (k, v) => setParams((p) => ({ ...p, securite: { ...p.securite, [k]: v } }));

  const enregistrer = async () => {
    setSauvegarde(true);
    // Fallback local immédiat (mode hors-ligne).
    try { localStorage.setItem(CLE, JSON.stringify(params)); } catch { /* stockage indisponible */ }
    try {
      const data = await apiPut("/api/parametres", params);
      // PUT renvoie l'état complet rechargé : on resynchronise si disponible.
      const fusionne = (data && typeof data === "object" && Object.keys(data).length) ? fusionner(data) : params;
      setSaved(fusionne);
      setParams(fusionne);
      toast("Paramètres enregistrés", "success");
    } catch {
      // API indisponible : on garde la sauvegarde locale sans planter.
      setSaved(params);
      toast("Paramètres enregistrés localement (API indisponible)", "info");
    } finally {
      setSauvegarde(false);
    }
  };
  const reinitialiser = () => { setParams(saved); toast("Modifications annulées", "info"); };

  return (
    <div className="pb-2">
      {!embedded && (
        <PageHeader
          title="Paramètres"
          subtitle={chargement ? "Chargement de la configuration…" : "Configuration générale de l'entreprise."}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section icon="business" title="Entreprise" desc="Informations générales de l'organisation.">
          <div className="space-y-4">
            <Champ label="Nom de l'entreprise"><Input value={params.entreprise} onChange={(e) => set("entreprise", e.target.value)} /></Champ>
            <Champ label="Fuseau horaire">
              <Select value={params.fuseau} onChange={(e) => set("fuseau", e.target.value)}>
                <option>Afrique/Brazzaville</option><option>Afrique/Abidjan</option><option>Afrique/Dakar</option><option>Europe/Paris</option>
              </Select>
            </Champ>
            <div className="grid grid-cols-2 gap-4">
              <Champ label="Langue"><Select value={params.langue} onChange={(e) => set("langue", e.target.value)}><option>Français</option><option>English</option></Select></Champ>
              <Champ label="Devise"><Select value={params.devise} onChange={(e) => set("devise", e.target.value)}><option>FCFA</option><option>EUR</option><option>USD</option></Select></Champ>
            </div>
          </div>
        </Section>

        <Section icon="timer" title="Activité & inactivité" desc="Règles de surveillance des postes.">
          <div className="space-y-4">
            <Champ label="Seuil d'inactivité (minutes)"><Input type="number" min="0" value={params.seuilInactivite} onChange={(e) => setNum("seuilInactivite", e)} /></Champ>
            <div className="grid grid-cols-2 gap-4">
              <Champ label="Début de journée"><Input type="time" value={params.debut} onChange={(e) => set("debut", e.target.value)} /></Champ>
              <Champ label="Fin de journée"><Input type="time" value={params.fin} onChange={(e) => set("fin", e.target.value)} /></Champ>
            </div>
          </div>
        </Section>

        <Section icon="more_time" title="Pointage & retards" desc="Règles appliquées aux pointages K40.">
          <div className="grid grid-cols-2 gap-4">
            <Champ label="Tolérance (minutes)"><Input type="number" min="0" value={params.toleranceRetard} onChange={(e) => setNum("toleranceRetard", e)} /></Champ>
            <Champ label="Retenue / minute (FCFA)"><Input type="number" min="0" value={params.retenueMinute} onChange={(e) => setNum("retenueMinute", e)} /></Champ>
          </div>
          <div className="mt-2 divide-y divide-border border-t border-border">
            <Toggle label="Retenue automatique sur salaire" desc="Déduit le retard directement de la paie." checked={params.retenueAuto} onChange={(v) => set("retenueAuto", v)} />
            <Toggle label="Justification des absences" desc="L'employé peut justifier depuis son app." checked={params.justifAbsence} onChange={(v) => set("justifAbsence", v)} />
          </div>
        </Section>

        <Section icon="notifications" title="Notifications" desc="Alertes envoyées aux superviseurs.">
          <div className="divide-y divide-border -mt-2.5">
            <Toggle label="Retards et absences" desc="Notifie en cas de retard ou d'absence." checked={params.notifs.retards} onChange={(v) => setNotif("retards", v)} />
            <Toggle label="Connexions refusées" desc="Tentatives d'accès bloquées." checked={params.notifs.connexions} onChange={(v) => setNotif("connexions", v)} />
            <Toggle label="Incidents d'inactivité" desc="Postes inactifs au-delà du seuil." checked={params.notifs.inactivite} onChange={(v) => setNotif("inactivite", v)} />
          </div>
        </Section>

        <Section icon="shield" title="Sécurité" desc="Protection des accès et des données.">
          <div className="divide-y divide-border -mt-2.5">
            <Toggle label="Double authentification (2FA)" desc="Code supplémentaire à la connexion." checked={params.securite.twoFA} onChange={(v) => setSecu("twoFA", v)} />
            <Toggle label="Masquer les salaires" desc="Salaires floutés par défaut." checked={params.securite.masquerSalaires} onChange={(v) => setSecu("masquerSalaires", v)} />
            <Toggle label="Journal d'audit" desc="Trace toutes les actions admin." checked={params.securite.audit} onChange={(v) => setSecu("audit", v)} />
          </div>
        </Section>
      </div>

      {/* Barre de sauvegarde flottante — apparaît uniquement en cas de modification */}
      {dirty && (
        <div className="sticky bottom-4 z-20 mt-5 flex justify-center pointer-events-none">
          <div className="modal-in pointer-events-auto flex flex-wrap items-center gap-3 rounded-2xl bg-surface border border-border-strong shadow-pop px-3.5 py-2.5">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 pl-1">
              <Icon name="edit" className="text-[16px]" /> Modifications non enregistrées
            </span>
            <span className="w-px h-5 bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" icon="undo" onClick={reinitialiser} disabled={sauvegarde}>Réinitialiser</Button>
              <Button variant="primary" size="sm" icon="save" onClick={enregistrer} disabled={sauvegarde}>{sauvegarde ? "Enregistrement…" : "Enregistrer"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
