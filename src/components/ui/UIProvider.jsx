import { createContext, useContext, useState, useCallback } from "react";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";
import Icon from "./Icon.jsx";
import AddEmployeeModal from "../modals/AddEmployeeModal.jsx";

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
    <div className="toast-in flex items-center gap-3 bg-white border border-slate-200 shadow-lift rounded-xl px-4 py-3 min-w-[260px] max-w-sm">
      <Icon name={t.icon} className={`text-[20px] ${t.cls}`} filled />
      <span className="text-sm text-slate-700">{message}</span>
    </div>
  );
}

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const toast = useCallback((message, type = "success") => {
    const id = ++TOAST_ID;
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 3400);
  }, []);

  const confirm = useCallback((opts) => setConfirmState(opts), []);
  const openAddEmployee = useCallback(() => setAddOpen(true), []);

  const fermerConfirm = () => setConfirmState(null);

  return (
    <UICtx.Provider value={{ toast, confirm, openAddEmployee }}>
      {children}

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-[80] space-y-2">
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
              onClick={() => {
                confirmState?.onConfirm?.();
                fermerConfirm();
              }}
            >
              {confirmState?.confirmLabel || "Confirmer"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">{confirmState?.message}</p>
      </Modal>

      {/* Ajout d'employé (global) */}
      <AddEmployeeModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={(nom) => {
          setAddOpen(false);
          toast(`Employé « ${nom} » ajouté avec succès`);
        }}
      />
    </UICtx.Provider>
  );
}
