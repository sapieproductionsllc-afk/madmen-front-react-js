import Icon from "./Icon.jsx";

// En-tête de section : titre + action optionnelle.
// variant="glyph" (défaut) : icône glyphe nue, neutre (text-muted).
// variant="chip" : pastille décorative neutre (bg-surface-2 text-muted) — pour les en-têtes de carte.
// L'indigo reste réservé aux CTA / nav active / focus / 1 accent data.
export default function SectionHeader({ icon, title, action, onAction, variant = "glyph", className = "" }) {
  return (
    <div className={`flex items-end justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        {icon &&
          (variant === "chip" ? (
            <span className="w-8 h-8 rounded-xl bg-surface-2 text-muted flex items-center justify-center shrink-0 ring-1 ring-inset ring-black/[0.03]">
              <Icon name={icon} className="text-[20px]" />
            </span>
          ) : (
            <Icon name={icon} className="text-muted text-[22px]" />
          ))}
        <h2 className="text-[1.0625rem] font-semibold text-ink tracking-tight truncate">{title}</h2>
      </div>
      {action &&
        (onAction ? (
          <button
            onClick={onAction}
            className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 rounded-lg px-1 -mx-1 shrink-0"
          >
            {action}
            <Icon name="arrow_forward" className="text-[18px]" />
          </button>
        ) : (
          <button
            disabled
            title="Bientôt disponible"
            className="text-sm font-medium text-subtle flex items-center gap-1 rounded-lg px-1 -mx-1 shrink-0 cursor-not-allowed opacity-50"
          >
            {action}
            <Icon name="arrow_forward" className="text-[18px]" />
          </button>
        ))}
    </div>
  );
}
