// Champs de formulaire canoniques (un seul style dans toute l'app).
// Recette unique : bordure --border, focus border-brand-500 + ring-brand-500/15 très subtil.
export const champClass =
  "w-full rounded-lg bg-canvas border border-border px-3.5 py-2.5 text-sm text-texte placeholder:text-subtle outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15";

export function Input({ className = "", ...props }) {
  return <input className={`${champClass} ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <select className={`${champClass} ${className}`} {...props}>
      {children}
    </select>
  );
}

// Libellé + champ. Le contenu (Input/Select custom) est passé en children.
export function Field({ label, htmlFor, className = "", children }) {
  return (
    <label htmlFor={htmlFor} className={`block ${className}`}>
      {label && <span className="block text-xs font-medium text-subtle mb-1.5">{label}</span>}
      {children}
    </label>
  );
}

export default Input;
