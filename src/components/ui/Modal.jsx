import { useEffect } from "react";
import Icon from "./Icon.jsx";

const widths = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function Modal({ open, onClose, title, subtitle, icon, iconTone = "brand", children, footer, size = "md" }) {
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const tone = iconTone === "danger" ? "bg-rose-50 text-rose-600" : "bg-brand-50 text-brand-600";

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${widths[size]} bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col modal-in`}>
        <div className="flex items-start gap-3 p-5 border-b border-slate-100">
          {icon && (
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
              <Icon name={icon} className="text-[22px]" />
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1 transition-colors"
            aria-label="Fermer"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto scroll-thin">{children}</div>

        {footer && (
          <div className="flex flex-wrap justify-end gap-2 p-4 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
