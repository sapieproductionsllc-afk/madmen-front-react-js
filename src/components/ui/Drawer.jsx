import { useEffect, useId, useRef } from "react";
import Icon from "./Icon.jsx";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Panneau latéral coulissant (droite) — pour consulter le détail d'un élément
// sans quitter la liste. Accessibilité alignée sur Modal (Échap, scroll-lock, focus-trap).
export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  icon,
  iconClass = "bg-brand-50 text-brand-600",
  children,
  footer,
}) {
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
      if (previousFocus.current instanceof HTMLElement) previousFocus.current.focus();
    };
  }, [open, onClose]);

  // À l'ouverture : focus sur le premier élément interactif (ou Fermer).
  useEffect(() => {
    if (!open) return;
    const first = panelRef.current?.querySelector(FOCUSABLE);
    (first || closeRef.current)?.focus();
  }, [open]);

  // Piège le focus dans le panneau.
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

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm overlay-in" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        onKeyDown={onKeyDownTrap}
        className="absolute right-0 top-0 bottom-0 w-full max-w-[440px] bg-surface border-l border-border shadow-pop flex flex-col drawer-in"
      >
        <div className="flex items-start gap-3 p-5 border-b border-border">
          {icon && (
            <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
              <Icon name={icon} className="text-[22px]" filled />
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h3 id={titleId} className="text-[1.0625rem] font-semibold text-ink tracking-tight truncate">{title}</h3>
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

        <div className="flex-1 p-5 overflow-y-auto scroll-thin">{children}</div>

        {footer && (
          <div className="flex flex-wrap justify-end gap-2 p-4 border-t border-border bg-surface-2">{footer}</div>
        )}
      </div>
    </div>
  );
}
