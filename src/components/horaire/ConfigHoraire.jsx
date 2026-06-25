import { useEffect, useState } from "react";
import Icon from "../ui/Icon.jsx";
import Button from "../ui/Button.jsx";
import { Field } from "../ui/Input.jsx";
import TimePicker, { toHHMM, estHeureValide } from "../ui/TimePicker.jsx";
import { useUI } from "../ui/UIProvider.jsx";
import { apiGet, apiPut } from "../../lib/api.js";

// Jours ISO 1=lundi .. 7=dimanche (l'API attend ce CSV).
const JOURS = [
  { iso: 1, court: "Lun", long: "Lundi" },
  { iso: 2, court: "Mar", long: "Mardi" },
  { iso: 3, court: "Mer", long: "Mercredi" },
  { iso: 4, court: "Jeu", long: "Jeudi" },
  { iso: 5, court: "Ven", long: "Vendredi" },
  { iso: 6, court: "Sam", long: "Samedi" },
  { iso: 7, court: "Dim", long: "Dimanche" },
];

// Repli horaire global par défaut (si l'employé n'a pas encore de config).
const DEFAUT = {
  heure_arrivee: "08:00",
  heure_depart: "17:00",
  pause_debut: "12:30",
  pause_fin: "14:00",
  jours: [1, 2, 3, 4, 5],
  tolerance_minutes: 10,
  avance_minutes: 30,
};

// CSV ISO "1,2,3" -> [1,2,3] (filtre les valeurs hors 1..7).
function parseJours(csv) {
  if (Array.isArray(csv)) return csv.map(Number).filter((n) => n >= 1 && n <= 7);
  return String(csv ?? "")
    .split(",")
    .map((x) => Number(x.trim()))
    .filter((n) => n >= 1 && n <= 7);
}

// Normalise la réponse GET /horaire vers l'état local du formulaire.
// Gère les deux formes : config plate (heure_arrivee/heure_depart/jours_travailles)
// ou mode planning { planning: { "1": {debut,fin} } }.
function normaliser(h) {
  if (!h || typeof h !== "object") {
    return { ...DEFAUT, planning: {}, avance: false };
  }
  const planning = h.planning && typeof h.planning === "object" ? h.planning : null;
  const tolerance = h.tolerance_minutes != null ? Number(h.tolerance_minutes) : DEFAUT.tolerance_minutes;
  const avanceMin = h.avance_minutes != null ? Number(h.avance_minutes) : DEFAUT.avance_minutes;

  if (planning && Object.keys(planning).length > 0) {
    // Mode planning : un créneau par jour. On dérive aussi des valeurs « simples »
    // (1er créneau) pour pré-remplir le mode simple si l'admin repasse en simple.
    const jours = Object.keys(planning).map(Number).filter((n) => n >= 1 && n <= 7).sort();
    const premier = planning[String(jours[0])] || {};
    const planNorm = {};
    for (const iso of jours) {
      const c = planning[String(iso)] || {};
      planNorm[iso] = { debut: toHHMM(c.debut), fin: toHHMM(c.fin) };
    }
    return {
      heure_arrivee: toHHMM(premier.debut) || DEFAUT.heure_arrivee,
      heure_depart: toHHMM(premier.fin) || DEFAUT.heure_depart,
      pause_debut: toHHMM(h.pause_debut) || DEFAUT.pause_debut,
      pause_fin: toHHMM(h.pause_fin) || DEFAUT.pause_fin,
      jours,
      tolerance_minutes: tolerance,
      avance_minutes: avanceMin,
      planning: planNorm,
      avance: true,
    };
  }

  return {
    heure_arrivee: toHHMM(h.heure_arrivee) || DEFAUT.heure_arrivee,
    heure_depart: toHHMM(h.heure_depart) || DEFAUT.heure_depart,
    pause_debut: toHHMM(h.pause_debut) || DEFAUT.pause_debut,
    pause_fin: toHHMM(h.pause_fin) || DEFAUT.pause_fin,
    jours: h.jours_travailles != null ? parseJours(h.jours_travailles) : DEFAUT.jours,
    tolerance_minutes: tolerance,
    avance_minutes: avanceMin,
    planning: {},
    avance: false,
  };
}

// Carte de configuration horaire d'UN employé.
// `employeId` : id NUMÉRIQUE. `onSaved` : notifie le parent (recharge calendrier/récap).
export default function ConfigHoraire({ employeId, onSaved }) {
  const { toast } = useUI();
  const [form, setForm] = useState(() => ({ ...DEFAUT, planning: {}, avance: false }));
  const [initial, setInitial] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    if (!employeId) return;
    let actif = true;
    setChargement(true);
    setErreur(null);
    apiGet(`/api/employes/${employeId}/horaire`)
      .then((h) => {
        if (!actif) return;
        const n = normaliser(h);
        setForm(n);
        setInitial(n);
      })
      .catch(() => {
        if (!actif) return;
        // Pas de config existante : on retombe sur le repli par défaut.
        const n = { ...DEFAUT, planning: {}, avance: false };
        setForm(n);
        setInitial(n);
      })
      .finally(() => actif && setChargement(false));
    return () => {
      actif = false;
    };
  }, [employeId]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const toggleJour = (iso) => {
    setForm((f) => {
      const actif = f.jours.includes(iso);
      const jours = actif ? f.jours.filter((j) => j !== iso) : [...f.jours, iso].sort((a, b) => a - b);
      // En mode avancé : prépare/retire le créneau du jour.
      const planning = { ...f.planning };
      if (actif) {
        delete planning[iso];
      } else if (!planning[iso]) {
        planning[iso] = { debut: f.heure_arrivee, fin: f.heure_depart };
      }
      return { ...f, jours, planning };
    });
  };

  const setCreneau = (iso, champ, val) =>
    setForm((f) => ({
      ...f,
      planning: { ...f.planning, [iso]: { ...(f.planning[iso] || {}), [champ]: val } },
    }));

  // Bascule simple <-> avancé. En passant en avancé, on amorce chaque jour travaillé
  // avec les heures simples ; en repassant en simple on garde heure_arrivee/depart.
  const basculerAvance = () => {
    setForm((f) => {
      if (f.avance) return { ...f, avance: false };
      const planning = { ...f.planning };
      for (const iso of f.jours) {
        if (!planning[iso]) planning[iso] = { debut: f.heure_arrivee, fin: f.heure_depart };
      }
      return { ...f, avance: true, planning };
    });
  };

  // Validation : au moins un jour, heures valides, et début < fin (modèle AVANT minuit).
  const validerSimple = () =>
    form.jours.length > 0 &&
    estHeureValide(form.heure_arrivee) &&
    estHeureValide(form.heure_depart) &&
    form.heure_arrivee < form.heure_depart;

  const validerAvance = () =>
    form.jours.length > 0 &&
    form.jours.every((iso) => {
      const c = form.planning[iso] || {};
      return estHeureValide(c.debut) && estHeureValide(c.fin) && c.debut < c.fin;
    });

  const valide = form.avance ? validerAvance() : validerSimple();

  const enregistrer = async () => {
    if (!valide || enCours || !employeId) return;
    setEnCours(true);
    setErreur(null);

    const tolerance = Math.max(0, Number(form.tolerance_minutes) || 0);
    const avanceMin = Math.min(240, Math.max(0, Number(form.avance_minutes) || 0));
    let payload;
    if (form.avance) {
      // Mode planning : un créneau par jour travaillé.
      const planning = {};
      for (const iso of form.jours) {
        const c = form.planning[iso] || {};
        planning[String(iso)] = { debut: c.debut, fin: c.fin };
      }
      payload = {
        planning,
        pause_debut: form.pause_debut,
        pause_fin: form.pause_fin,
        tolerance_minutes: tolerance,
        avance_minutes: avanceMin,
      };
    } else {
      // Mode simple : mêmes heures pour tous les jours travaillés.
      payload = {
        heure_arrivee: form.heure_arrivee,
        heure_depart: form.heure_depart,
        pause_debut: form.pause_debut,
        pause_fin: form.pause_fin,
        jours_travailles: [...form.jours].sort((a, b) => a - b).join(","),
        tolerance_minutes: tolerance,
        avance_minutes: avanceMin,
      };
    }

    try {
      await apiPut(`/api/employes/${employeId}/horaire`, payload);
      toast("Horaire enregistré", "success");
      setInitial(form);
      onSaved?.();
    } catch (e) {
      setErreur(e?.message || "Échec de l'enregistrement");
      toast(e?.message || "Échec de l'enregistrement", "error");
    } finally {
      setEnCours(false);
    }
  };

  const modifie = initial && JSON.stringify(initial) !== JSON.stringify(form);

  if (chargement) {
    return (
      <div className="card p-5">
        <div className="py-10 text-center">
          <Icon name="progress_activity" className="text-faint text-[32px] animate-spin" />
          <p className="mt-2 text-sm text-muted">Chargement de l'horaire…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      {/* En-tête */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Icon name="schedule" className="text-[18px]" filled />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-ink">Horaire de travail</h3>
            <p className="text-xs text-muted">Heures et jours pris en compte pour le pointage.</p>
          </div>
        </div>
        <button
          onClick={basculerAvance}
          className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border border-border bg-surface text-muted hover:text-ink hover:border-border-strong transition-colors"
        >
          <Icon name={form.avance ? "tune" : "tune"} className="text-[15px]" />
          {form.avance ? "Mode simple" : "Horaires différents par jour"}
        </button>
      </div>

      {erreur && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3.5">
          <Icon name="error" className="text-rose-600 text-[20px]" />
          <p className="text-xs text-rose-700">{erreur}</p>
        </div>
      )}

      {/* Jours travaillés (7 toggles Lun -> Dim) */}
      <p className="text-xs font-medium text-subtle mb-2">Jours travaillés</p>
      <div className="grid grid-cols-7 gap-1.5 mb-5">
        {JOURS.map((j) => {
          const on = form.jours.includes(j.iso);
          return (
            <button
              key={j.iso}
              type="button"
              onClick={() => toggleJour(j.iso)}
              aria-pressed={on}
              title={j.long}
              className={`h-10 rounded-lg text-xs font-semibold transition-colors border ${
                on
                  ? "bg-brand-600 text-canvas border-brand-600"
                  : "bg-surface text-muted border-border hover:border-border-strong hover:text-texte"
              }`}
            >
              {j.court}
            </button>
          );
        })}
      </div>

      {/* Mode SIMPLE : mêmes heures tous les jours travaillés */}
      {!form.avance ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Heure d'arrivée">
            <TimePicker value={form.heure_arrivee} onChange={(v) => set({ heure_arrivee: v })} />
          </Field>
          <Field label="Heure de départ">
            <TimePicker value={form.heure_depart} onChange={(v) => set({ heure_depart: v })} />
          </Field>
        </div>
      ) : (
        /* Mode AVANCÉ : un créneau par jour travaillé */
        <div className="space-y-2">
          <p className="text-xs font-medium text-subtle">Horaires par jour</p>
          {form.jours.length === 0 ? (
            <p className="text-sm text-muted py-3 text-center">Sélectionnez au moins un jour travaillé.</p>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
              {JOURS.filter((j) => form.jours.includes(j.iso)).map((j) => {
                const c = form.planning[j.iso] || {};
                return (
                  <div key={j.iso} className="flex items-center gap-3 px-3 py-2.5 bg-surface">
                    <span className="w-12 shrink-0 text-sm font-medium text-texte">{j.court}</span>
                    <TimePicker value={c.debut || ""} onChange={(v) => setCreneau(j.iso, "debut", v)} className="flex-1" />
                    <Icon name="arrow_forward" className="text-subtle text-[16px] shrink-0" />
                    <TimePicker value={c.fin || ""} onChange={(v) => setCreneau(j.iso, "fin", v)} className="flex-1" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pause déjeuner : fenêtre fixe (sortie/retour pointés ; retour après la fin = retard) */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Début de la pause déjeuner">
          <TimePicker value={form.pause_debut} onChange={(v) => set({ pause_debut: v })} />
        </Field>
        <Field label="Fin de la pause (retour au plus tard)">
          <TimePicker value={form.pause_fin} onChange={(v) => set({ pause_fin: v })} />
        </Field>
      </div>

      {/* Tolérances : retard et arrivée en avance */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Tolérance de retard (minutes)">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="120"
              value={form.tolerance_minutes}
              onChange={(e) => set({ tolerance_minutes: e.target.value })}
              className="w-full rounded-lg bg-canvas border border-border px-3.5 py-2.5 text-sm text-texte outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 tabular-nums"
            />
            <span className="text-xs text-subtle whitespace-nowrap">min</span>
          </div>
          <p className="mt-1.5 text-[11px] text-faint flex items-center gap-1.5">
            <Icon name="info" className="text-[14px]" />
            Arrivée au-delà de la tolérance = retard.
          </p>
        </Field>
        <Field label="Tolérance d'arrivée en avance (min)">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="240"
              value={form.avance_minutes}
              onChange={(e) => set({ avance_minutes: e.target.value })}
              className="w-full rounded-lg bg-canvas border border-border px-3.5 py-2.5 text-sm text-texte outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 tabular-nums"
            />
            <span className="text-xs text-subtle whitespace-nowrap">min</span>
          </div>
          <p className="mt-1.5 text-[11px] text-faint flex items-center gap-1.5">
            <Icon name="info" className="text-[14px]" />
            Combien de temps avant son heure l'employé peut pointer (avant ça, le doigt est ignoré).
          </p>
        </Field>
      </div>

      {/* Validation + enregistrement */}
      <div className="mt-5 pt-4 border-t border-border flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[11px] text-faint flex items-center gap-1.5">
          <Icon name="lock" className="text-[14px]" /> Réservé à l'administrateur.
        </p>
        <div className="flex items-center gap-2">
          {!valide && (
            <span className="text-[11px] text-rose-600">
              {form.jours.length === 0 ? "Sélectionnez un jour." : "Vérifiez les heures (arrivée < départ)."}
            </span>
          )}
          <Button
            onClick={enregistrer}
            disabled={!valide || enCours || !modifie}
            icon={enCours ? "progress_activity" : "check"}
          >
            {enCours ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
