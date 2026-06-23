import { champClass } from "./Input.jsx";

// Sélecteur d'heure réutilisable — `<input type="time">` stylé pour rester cohérent
// avec les autres champs de l'app (même recette de bordure/focus que Input/Select).
// Valeur contrôlée au format "HH:MM" (00-23 : 00-59). Renvoie la valeur via onChange(string).
export default function TimePicker({ value = "", onChange, disabled = false, className = "", ...props }) {
  return (
    <input
      type="time"
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      step="60"
      className={`${champClass} tabular-nums ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
      {...props}
    />
  );
}

// "HH:MM:SS" | "HH:MM" -> "HH:MM" (ou "" si invalide). Utilitaire partagé.
export function toHHMM(v) {
  if (!v) return "";
  const m = String(v).match(/(\d{1,2}):(\d{2})/);
  if (!m) return "";
  const h = Math.min(23, Math.max(0, Number(m[1])));
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

// Valide qu'une chaîne est bien "HH:MM" dans les bornes horaires.
export function estHeureValide(v) {
  const m = String(v || "").match(/^(\d{2}):(\d{2})$/);
  if (!m) return false;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h >= 0 && h <= 23 && min >= 0 && min <= 59;
}
