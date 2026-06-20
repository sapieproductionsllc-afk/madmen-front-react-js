import { useEffect, useId, useRef } from "react";
import Icon from "./Icon.jsx";

const widths = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({ open, onClose, title, subtitle, icon, iconTone = "brand", children, footer, size = "md" }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const previousFocus = useRef(null);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const subtitleId = `${baseId}-subtitle`;

  // Escape + scroll-lock + restauration du focus.
  useEffect(() => {
    if (!open) return undefined;
    previousFocus.current = document.activeElement;
    const handler = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
      // Restaure le focus sur l'élément déclencheur à la fermeture.
      if (previousFocus.current instanceof HTMLElement) previousFocus.current.focus();
    };
  }, [open, onClose]);

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

  const tone = iconTone === "danger" ? "bg-rose-500/15 text-rose-400" : "bg-brand-500/15 text-brand-400";

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-canvas/40 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        onKeyDown={onKeyDownTrap}
        className={`relative w-full ${widths[size]} bg-surface border border-border rounded-t-2xl sm:rounded-2xl shadow-pop max-h-[92vh] flex flex-col modal-in`}
      >
        <div className="flex items-start gap-3 p-5 border-b border-border">
          {icon && (
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
              <Icon name={icon} className="text-[22px]" />
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h3 id={titleId} className="text-[1.0625rem] font-semibold text-ink tracking-tight">{title}</h3>
            {subtitle && <p id={subtitleId} className="text-sm text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            className="text-subtle hover:text-texte hover:bg-surface-2 rounded-lg p-1 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
            aria-label="Fermer"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto scroll-thin">{children}</div>

        {footer && (
          <div className="flex flex-wrap justify-end gap-2 p-4 border-t border-border bg-surface-2 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
