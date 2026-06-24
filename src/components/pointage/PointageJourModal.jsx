import { useEffect, useState } from "react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Icon from "../ui/Icon.jsx";
import TimePicker from "../ui/TimePicker.jsx";
import { Field } from "../ui/Input.jsx";
import { useUI } from "../ui/UIProvider.jsx";
import { apiPut } from "../../lib/api.js";

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
 * Saisie/correction du pointage d'un JOUR (clic sur le calendrier) : heure d'arrivée
 * + heure de départ. Override admin via PUT /api/employes/{id}/pointage-jour.
 * `jour` = l'objet jour du calendrier ({ date, arrivee, depart, ... }) ou null (fermé).
 */
export default function PointageJourModal({ employeId, jour, onClose, onSaved }) {
  const { toast, refreshData } = useUI();
  const [arrivee, setArrivee] = useState("");
  const [depart, setDepart] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setArrivee(jour?.arrivee || "");
    setDepart(jour?.depart || "");
  }, [jour]);

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
      onClose();
    } catch (e) {
      toast(e?.message || "Échec de l'enregistrement", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!jour}
      onClose={onClose}
      title="Pointage du jour"
      subtitle={labelDate(jour?.date)}
      icon="edit_calendar"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button icon="check" onClick={enregistrer} disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted">Renseignez ou corrigez l'heure d'arrivée et de départ pour ce jour.</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Heure d'arrivée"><TimePicker value={arrivee} onChange={setArrivee} /></Field>
          <Field label="Heure de départ"><TimePicker value={depart} onChange={setDepart} /></Field>
        </div>
        {arrivee && !depart && (
          <p className="text-xs text-amber-600 flex items-start gap-1.5">
            <Icon name="info" className="text-[16px] mt-px shrink-0" filled />
            Arrivée enregistrée — le départ se posera au prochain pointage K40, ou saisissez-le ici.
          </p>
        )}
        <p className="text-[11px] text-subtle">Laissez les deux champs vides puis Enregistrer pour effacer le pointage du jour.</p>
      </div>
    </Modal>
  );
}
