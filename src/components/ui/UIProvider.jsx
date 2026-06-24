import { createContext, useContext, useState, useCallback } from "react";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";
import Icon from "./Icon.jsx";

const UICtx = createContext(null);
export const useUI = () => useContext(UICtx);

let TOAST_ID = 0;

const toastTones = {
  success: { icon: "check_circle", cls: "text-emerald-500" },
  info: { icon: "info", cls: "text-brand-600" },
  error: { icon: "error", cls: "text-rose-500" },
};

function Toast({ message, type }) {
  const t = toastTones[type] ?? toastTones.success;
  return (
    <div className="toast-in flex items-center gap-3 bg-surface border border-border shadow-lift rounded-xl px-4 py-3 min-w-[260px] max-w-sm">
      <Icon name={t.icon} className={`text-[20px] ${t.cls}`} filled />
      <span className="text-sm text-texte">{message}</span>
    </div>
  );
}

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const [champValue, setChampValue] = useState("");
  const [agence, setAgence] = useState("Toutes les agences");
  // Signal global de rafraîchissement : bumpé après une synchro qui apporte du nouveau.
  // Les vues incluent `dataVersion` dans leurs deps de fetch -> elles re-récupèrent sans reload.
  const [dataVersion, setDataVersion] = useState(0);
  const refreshData = useCallback(() => setDataVersion((v) => v + 1), []);

  const toast = useCallback((message, type = "success") => {
    const id = ++TOAST_ID;
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 3400);
  }, []);

  const confirm = useCallback((opts) => {
    setChampValue(opts.input?.defaultValue ?? "");
    setConfirmState(opts);
  }, []);
  const fermerConfirm = () => setConfirmState(null);

  return (
    <UICtx.Provider value={{ toast, confirm, agence, setAgence, dataVersion, refreshData }}>
      {children}

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-[80] space-y-2" role="status" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} />
        ))}
      </div>

      {/* Boîte de confirmation */}
      <Modal
        open={!!confirmState}
        onClose={fermerConfirm}
        title={confirmState?.title}
        icon={confirmState?.danger ? "warning" : "help"}
        iconTone={confirmState?.danger ? "danger" : "brand"}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={fermerConfirm}>
              Annuler
            </Button>
            <Button
              variant={confirmState?.danger ? "danger" : "primary"}
              disabled={confirmState?.input?.required && !champValue.trim()}
              onClick={() => {
                confirmState?.onConfirm?.(champValue.trim());
                fermerConfirm();
              }}
            >
              {confirmState?.confirmLabel || "Confirmer"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-texte">{confirmState?.message}</p>
        {confirmState?.input && (
          <div className="mt-4">
            <label className="block text-xs font-medium text-muted mb-1.5">
              {confirmState.input.label}
              {confirmState.input.required && <span className="text-rose-600"> *</span>}
            </label>
            <textarea
              value={champValue}
              onChange={(e) => setChampValue(e.target.value)}
              placeholder={confirmState.input.placeholder}
              rows={3}
              className="w-full rounded-lg bg-canvas border border-border px-3.5 py-2.5 text-sm text-texte placeholder:text-muted outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 resize-none"
            />
          </div>
        )}
      </Modal>
    </UICtx.Provider>
  );
}
