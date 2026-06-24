import { useEffect, useState } from "react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Icon from "../ui/Icon.jsx";
import TimePicker from "../ui/TimePicker.jsx";
import { Field } from "../ui/Input.jsx";
import { useUI } from "../ui/UIProvider.jsx";
import { apiPut, apiPost } from "../../lib/api.js";

const p2 = (x) => String(x).padStart(2, "0");

// "YYYY-MM-DD" -> "lundi 10 juin 2026".
function labelDate(d) {
  if (!d) return "";
  try {
    return new Date(`${d}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  } catch {
    return d;
  }
}

/**
 * Pointage d'un JOUR (clic calendrier). Deux usages :
 *  - RAPIDE : l'admin pointe l'arrivée (VERT) ou la sortie (ROUGE) à l'heure EXACTE du
 *    clic — secours quand le K40 n'a pas lu l'empreinte. POST .../pointage-manuel.
 *  - PRÉCIS : correction d'une heure d'arrivée/départ (repliée). PUT .../pointage-jour.
 */
export default function PointageJourModal({ employeId, jour, onClose, onSaved }) {
  const { toast, refreshData } = useUI();
  const [arrivee, setArrivee] = useState("");
  const [depart, setDepart] = useState("");
  const [saving, setSaving] = useState(false);
  const [manuel, setManuel] = useState(false);   // section "heure précise" repliée par défaut
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setArrivee(jour?.arrivee || "");
    setDepart(jour?.depart || "");
    setManuel(false);
  }, [jour]);

  // Horloge vivante : l'heure (à la seconde) que les boutons rapides vont enregistrer.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = p2(now.getHours());
  const mm = p2(now.getMinutes());
  const ss = p2(now.getSeconds());
  const heureNow = `${hh}:${mm}`;

  // Pointage RAPIDE à l'heure actuelle, sur la date du jour ouvert.
  const pointerMaintenant = async (type) => {
    if (!employeId || !jour?.date || saving) return;
    setSaving(true);
    try {
      const r = await apiPost(`/api/employes/${employeId}/pointage-manuel`, {
        horodatage: `${jour.date} ${hh}:${mm}:${ss}`,
        type,
      });
      const hhmm = (dt) => (dt ? String(dt).slice(11, 16) : "");
      setArrivee(hhmm(r?.pointage?.heure_entree));
      setDepart(hhmm(r?.pointage?.heure_sortie));
      toast(type === "entree" ? `Arrivée pointée à ${heureNow}` : `Sortie pointée à ${heureNow}`, "success");
      refreshData();
      onSaved?.();
    } catch (e) {
      toast(e?.message || "Échec du pointage manuel", "error");
    } finally {
      setSaving(false);
    }
  };

  // Correction d'une heure PRÉCISE (override du jour).
  const enregistrer = async () => {
    if (!employeId || !jour?.date) return;
    setSaving(true);
    try {
      await apiPut(`/api/employes/${employeId}/pointage-jour`, {
        date: jour.date,
        heure_entree: arrivee || null,
        heure_sortie: depart || null,
      });
      toast(arrivee || depart ? "Pointage du jour enregistré" : "Pointage du jour effacé", "success");
      refreshData();
      onSaved?.();
    } catch (e) {
      toast(e?.message || "Échec de l'enregistrement", "error");
    } finally {
      setSaving(false);
    }
  };

  const carteBtn =
    "group flex flex-col items-center justify-center gap-1 rounded-2xl py-4 px-3 text-white shadow-soft " +
    "transition duration-150 ease-out hover:shadow-lift active:translate-y-px " +
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 " +
    "focus-visible:outline-none focus-visible:shadow-focus";

  return (
    <Modal
      open={!!jour}
      onClose={onClose}
      title="Pointage du jour"
      subtitle={labelDate(jour?.date)}
      icon="more_time"
      size="sm"
      footer={
        <Button variant="ghost" onClick={onClose} disabled={saving}>Fermer</Button>
      }
    >
      <div className="space-y-4">
        {/* Horloge vivante — l'heure qui sera posée par les boutons rapides */}
        <div className="rounded-2xl bg-surface-2 border border-border py-3.5 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-subtle">Heure actuelle</p>
          <p className="font-display font-bold tracking-tight tabular-nums leading-none mt-1">
            <span className="text-[2.6rem] text-ink">{hh}:{mm}</span>
            <span className="text-2xl text-subtle">:{ss}</span>
          </p>
        </div>

        {/* Boutons rapides : VERT = arrivée, ROUGE = sortie (heure exacte du clic) */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => pointerMaintenant("entree")}
            disabled={saving}
            className={`${carteBtn} bg-emerald-600 hover:bg-emerald-700`}
          >
            <Icon name="login" filled className="text-[26px] transition duration-150 group-hover:scale-110" />
            <span className="text-sm font-semibold leading-tight">Pointer l'arrivée</span>
            <span className="text-[11px] text-white/75 tabular-nums">à {heureNow}</span>
          </button>
          <button
            type="button"
            onClick={() => pointerMaintenant("sortie")}
            disabled={saving}
            className={`${carteBtn} bg-rose-600 hover:bg-rose-700`}
          >
            <Icon name="logout" filled className="text-[26px] transition duration-150 group-hover:scale-110" />
            <span className="text-sm font-semibold leading-tight">Pointer la sortie</span>
            <span className="text-[11px] text-white/75 tabular-nums">à {heureNow}</span>
          </button>
        </div>

        {/* Ce qui est déjà pointé ce jour */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-surface px-3 py-2.5 flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${arrivee ? "bg-emerald-500" : "bg-faint"}`} />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-subtle leading-none">Arrivée</p>
              <p className={`text-lg font-semibold tabular-nums leading-tight ${arrivee ? "text-ink" : "text-faint"}`}>{arrivee || "—"}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface px-3 py-2.5 flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${depart ? "bg-rose-500" : "bg-faint"}`} />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-subtle leading-none">Départ</p>
              <p className={`text-lg font-semibold tabular-nums leading-tight ${depart ? "text-ink" : "text-faint"}`}>{depart || "—"}</p>
            </div>
          </div>
        </div>

        {arrivee && !depart && (
          <p className="text-[11px] text-amber-600 flex items-start gap-1.5">
            <Icon name="info" className="text-[15px] mt-px shrink-0" filled />
            Arrivée enregistrée — la sortie se posera au prochain pointage, ou ci-dessus.
          </p>
        )}

        {/* Correction d'une heure précise — repliée */}
        <div className="border-t border-hairline pt-3">
          <button
            type="button"
            onClick={() => setManuel((v) => !v)}
            className="w-full flex items-center justify-between text-xs font-medium text-muted hover:text-texte transition"
          >
            <span className="flex items-center gap-1.5"><Icon name="tune" className="text-[16px]" /> Saisir une heure précise</span>
            <Icon name="expand_more" className={`text-[18px] transition-transform duration-150 ${manuel ? "rotate-180" : ""}`} />
          </button>
          {manuel && (
            <div className="space-y-3 mt-3 modal-in">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Heure d'arrivée"><TimePicker value={arrivee} onChange={setArrivee} /></Field>
                <Field label="Heure de départ"><TimePicker value={depart} onChange={setDepart} /></Field>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-subtle">Vider les deux champs efface le jour.</p>
                <Button size="sm" icon="check" onClick={enregistrer} disabled={saving}>
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
