import { useEffect, useId, useRef } from "react";
import Icon from "./Icon.jsx";

const widths = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

// Tons de la pastille d'icône (anneau subtil pour la profondeur).
const tones = {
  brand: "bg-brand-50 text-brand-600 ring-brand-600/10",
  danger: "bg-rose-50 text-rose-600 ring-rose-600/10",
  or: "bg-or-100 text-or-700 ring-or-600/15",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-600/10",
  sky: "bg-sky-50 text-sky-600 ring-sky-600/10",
  amber: "bg-amber-50 text-amber-600 ring-amber-600/10",
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({ open, onClose, title, subtitle, icon, iconTone = "brand", children, footer, size = "md" }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const previousFocus = useRef(null);
  const onCloseRef = useRef(onClose);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const subtitleId = `${baseId}-subtitle`;

  // Garde la dernière version d'onClose sans relancer l'effet de focus à chaque rendu.
  useEffect(() => { onCloseRef.current = onClose; });

  // Escape + scroll-lock + restauration du focus — NE dépend QUE de `open`
  // (sinon, à chaque frappe, le cleanup rendrait le focus à l'élément précédent → l'input « coupe »).
  useEffect(() => {
    if (!open) return undefined;
    previousFocus.current = document.activeElement;
    const handler = (e) => e.key === "Escape" && onCloseRef.current?.();
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
      // Restaure le focus sur l'élément déclencheur à la fermeture.
      if (previousFocus.current instanceof HTMLElement) previousFocus.current.focus();
    };
  }, [open]);

  // À l'ouverture : place le focus sur le premier élément interactif (ou le bouton Fermer).
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const first = panel?.querySelector(FOCUSABLE);
    (first || closeRef.current)?.focus();
  }, [open]);

  // Piège le focus dans le panneau (boucle Tab / Shift+Tab).
  const onKeyDownTrap = (e) => {
    if (e.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;
    const items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!open) return null;

  const tone = tones[iconTone] ?? tones.brand;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-ink/55 backdrop-blur-md overlay-in" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        onKeyDown={onKeyDownTrap}
        className={`relative w-full ${widths[size]} bg-surface ring-1 ring-black/5 border border-border rounded-t-2xl sm:rounded-2xl shadow-pop max-h-[92vh] flex flex-col modal-in`}
      >
        {/* En-tête */}
        <div className="flex items-start gap-3.5 px-5 sm:px-6 pt-5 pb-4 border-b border-border">
          {icon && (
            <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ring-1 ${tone}`}>
              <Icon name={icon} className="text-[24px]" filled />
            </span>
          )}
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 id={titleId} className="text-[1.15rem] font-semibold text-ink tracking-tight leading-tight">{title}</h3>
            {subtitle && <p id={subtitleId} className="text-sm text-muted mt-1 leading-snug">{subtitle}</p>}
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            className="-mt-1 -mr-1.5 w-8 h-8 shrink-0 flex items-center justify-center text-subtle hover:text-texte hover:bg-surface-2 rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:shadow-focus"
            aria-label="Fermer"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>

        {/* Corps */}
        <div className="px-5 sm:px-6 py-5 overflow-y-auto scroll-thin">{children}</div>

        {/* Pied */}
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 px-5 sm:px-6 py-4 border-t border-border bg-surface-2/60 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
