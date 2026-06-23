import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { champClass } from "./Input.jsx";
import { useUI } from "./UIProvider.jsx";

/**
 * EditableField — champ d'affichage qui devient éditable au clic, avec
 * SAUVEGARDE AUTOMATIQUE au blur (onSave async).
 *
 * Cycle de vie :
 *  - Lecture : label + valeur, icône crayon qui apparaît au survol/focus.
 *  - Clic (ou Entrée/Espace) : passe en saisie, focus + sélection auto.
 *  - Blur OU Entrée (Ctrl/Cmd+Entrée pour textarea) : valide puis sauvegarde.
 *      • Validation locale (validate) échouée -> toast d'erreur + rollback, aucun réseau.
 *      • Valeur inchangée -> referme sans appel réseau.
 *      • Pendant onSave : mini-spinner, champ figé.
 *      • Succès : toast discret + la valeur affichée se met à jour (prop `value` rafraîchie par le parent).
 *      • Échec (onSave rejette) : toast d'erreur + restauration de l'ancienne valeur.
 *  - Échap : annule sans sauvegarder.
 *
 * Props :
 *  - label            libellé du champ
 *  - value            valeur courante (contrôlée par le parent)
 *  - onSave(v)        async ; DOIT rejeter (throw) en cas d'échec pour déclencher le rollback
 *  - type             "text" | "email" | "tel" | "number" | "date" | "select" | "textarea" | "password"
 *  - options          [{ value, label }] (type="select")
 *  - placeholder      texte indicatif quand vide
 *  - display(v)       formatage d'affichage optionnel (ex. date FR, FCFA)
 *  - icon             icône Material en tête de ligne (optionnel)
 *  - emptyText        texte affiché quand la valeur est vide ("—" par défaut)
 *  - validate(v)      retourne un message d'erreur (string) si invalide, sinon null
 *  - successText      message du toast de succès ("Enregistré" par défaut ; null pour aucun)
 *  - inputMode/maxLength/min/step  transmis tels quels à l'input
 */
export default function EditableField({
  label,
  value,
  onSave,
  type = "text",
  options = [],
  placeholder = "",
  display,
  icon,
  emptyText = "—",
  validate,
  successText = "Enregistré",
  inputMode,
  maxLength,
  min,
  step,
  className = "",
}) {
  const { toast } = useUI();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);
  const cancelledRef = useRef(false); // Échap : empêche le blur de sauvegarder

  // Resynchronise le brouillon sur la valeur du parent tant qu'on n'édite pas.
  useEffect(() => {
    if (!editing) setDraft(value ?? "");
  }, [value, editing]);

  // Focus + sélection à l'ouverture.
  useEffect(() => {
    if (!editing) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    if (typeof el.select === "function" && type !== "date") el.select();
  }, [editing, type]);

  const ouvrir = () => {
    if (saving) return;
    cancelledRef.current = false;
    setDraft(value ?? "");
    setEditing(true);
  };

  const annuler = () => {
    cancelledRef.current = true;
    setDraft(value ?? "");
    setEditing(false);
  };

  const valider = async () => {
    if (cancelledRef.current || saving) return;

    const next = type === "number" ? draft : String(draft).trim();
    const ancien = value ?? "";

    // Inchangé -> on referme, pas de réseau.
    if (String(next) === String(ancien ?? "")) {
      setEditing(false);
      return;
    }

    // Validation locale -> toast + rollback, pas de réseau.
    if (validate) {
      const msg = validate(next);
      if (msg) {
        toast(msg, "error");
        setDraft(ancien);
        setEditing(false);
        return;
      }
    }

    setSaving(true);
    try {
      await onSave(next);
      if (successText) toast(successText, "success");
      setEditing(false); // le parent pousse la nouvelle `value`
    } catch (err) {
      toast(err?.message || "Échec de l'enregistrement", "error");
      setDraft(ancien); // rollback
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      annuler();
    } else if (e.key === "Enter" && type !== "textarea") {
      e.preventDefault();
      e.currentTarget.blur?.(); // déclenche valider() via onBlur
    } else if (e.key === "Enter" && type === "textarea" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.currentTarget.blur?.();
    }
  };

  const affichage = () => {
    if (value == null || value === "") return <span className="text-subtle">{emptyText}</span>;
    return display ? display(value) : value;
  };

  // ---- Lecture ----
  if (!editing) {
    return (
      <div className={`group/ef flex items-center gap-3 py-2.5 border-b border-border last:border-0 ${className}`}>
        {icon && (
          <span className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center shrink-0">
            <Icon name={icon} className="text-subtle text-[18px]" />
          </span>
        )}
        <span className="text-sm text-muted w-32 shrink-0">{label}</span>
        <button
          type="button"
          onClick={ouvrir}
          className="group/btn flex-1 min-w-0 flex items-center justify-between gap-2 text-left rounded-lg px-1.5 -mx-1.5 py-1 -my-1 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 transition-colors"
          title="Modifier"
          aria-label={`Modifier ${label}`}
        >
          <span className="text-sm text-texte font-medium truncate">{affichage()}</span>
          <Icon
            name="edit"
            className="text-subtle text-[16px] opacity-0 group-hover/ef:opacity-100 group-focus-visible/btn:opacity-100 shrink-0 transition-opacity"
          />
        </button>
      </div>
    );
  }

  // ---- Édition ----
  const commun = {
    ref: inputRef,
    value: draft,
    disabled: saving,
    onChange: (e) => setDraft(e.target.value),
    onKeyDown,
    onBlur: valider,
    placeholder,
    inputMode,
    maxLength,
    min,
    step,
  };
  const dim = saving ? "opacity-60" : "";

  return (
    <div className={`flex items-center gap-3 py-2.5 border-b border-border last:border-0 ${className}`}>
      {icon && (
        <span className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center shrink-0">
          <Icon name={icon} className="text-subtle text-[18px]" />
        </span>
      )}
      <span className="text-sm text-muted w-32 shrink-0">{label}</span>
      <div className="flex-1 min-w-0 relative flex items-center">
        {type === "select" ? (
          <span className="relative block w-full">
            <select {...commun} className={`${champClass} appearance-none pr-9 cursor-pointer ${dim}`}>
              {placeholder && <option value="">{placeholder}</option>}
              {options.map((o) => (
                <option key={String(o.value)} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <Icon
              name="expand_more"
              aria-hidden
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-subtle text-[20px]"
            />
          </span>
        ) : type === "textarea" ? (
          <textarea {...commun} rows={3} className={`${champClass} resize-y ${dim}`} />
        ) : (
          <input {...commun} type={type} className={`${champClass} pr-8 ${dim}`} />
        )}
        {saving && (
          <Icon
            name="progress_activity"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-600 text-[18px] animate-spin pointer-events-none"
          />
        )}
      </div>
    </div>
  );
}
