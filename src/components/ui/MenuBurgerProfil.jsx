import { useState, useRef, useEffect } from "react";
import Icon from "./Icon.jsx";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";
import { useUI } from "./UIProvider.jsx";
import { apiPost, apiPut } from "../../lib/api.js";
import BadgeModal from "../badge/BadgeModal.jsx";
import BiometrieModal from "./BiometrieModal.jsx";

const focusOr = "focus:outline-none focus-visible:ring-2 focus-visible:ring-or-400 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700";

// Élément de menu (icône en pastille + libellé). `danger` = action sensible (rose).
function Item({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      role="menuitem"
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
        danger ? "text-rose-600 hover:bg-rose-50" : "text-ink hover:bg-surface-2"
      }`}
    >
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${danger ? "bg-rose-50 text-rose-500" : "bg-surface-2 text-muted"}`}>
        <Icon name={icon} className="text-[16px]" />
      </span>
      {label}
    </button>
  );
}

/**
 * Menu « burger » de la fiche employé (remplace l'ancien engrenage Paramètres cassé).
 * Regroupe les actions admin : Biométrie, Badge RFID, Régénérer le PIN, Suspendre/Réactiver.
 * Le menu est positionné en `fixed` (ancré au bouton) pour échapper au `overflow-hidden`
 * du bandeau. Toutes les actions appellent la VRAIE API.
 */
export default function MenuBurgerProfil({ e }) {
  const { toast } = useUI();
  const id = e?._id ?? e?.id;

  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const [bio, setBio] = useState(false);
  const [badge, setBadge] = useState(false);
  const [pin, setPin] = useState(null); // code PIN régénéré à afficher
  const [confirmAction, setConfirmAction] = useState(null); // null | 'actif' | 'suspendu' | 'archive'
  const [statut, setStatut] = useState(e?.statut ?? "actif");

  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const basculer = () => {
    if (!open && btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return undefined;
    const horsClic = (ev) => {
      if (menuRef.current?.contains(ev.target) || btnRef.current?.contains(ev.target)) return;
      setOpen(false);
    };
    const onEsc = (ev) => ev.key === "Escape" && setOpen(false);
    const fermer = () => setOpen(false);
    document.addEventListener("mousedown", horsClic);
    document.addEventListener("keydown", onEsc);
    window.addEventListener("scroll", fermer, true);
    window.addEventListener("resize", fermer);
    return () => {
      document.removeEventListener("mousedown", horsClic);
      document.removeEventListener("keydown", onEsc);
      window.removeEventListener("scroll", fermer, true);
      window.removeEventListener("resize", fermer);
    };
  }, [open]);

  const regenererPin = async () => {
    setOpen(false);
    if (!id) return;
    try {
      const r = await apiPost(`/api/employes/${id}/regenerer-pin`, {});
      setPin(r?.code_pin_genere ?? "—");
    } catch {
      toast("Régénération du PIN impossible", "error");
    }
  };

  const archived = statut === "archive";
  const suspendu = statut === "suspendu";
  const changerStatut = async () => {
    if (!id || !confirmAction) return;
    const cible = confirmAction;
    try {
      await apiPut(`/api/employes/${id}`, { statut: cible });
      setStatut(cible);
      setConfirmAction(null);
      toast(cible === "actif" ? `${e?.name} réactivé(e)` : cible === "suspendu" ? `${e?.name} suspendu(e)` : `${e?.name} archivé(e)`, "success");
    } catch {
      toast("Changement de statut impossible", "error");
    }
  };

  // Config du modal de confirmation selon l'action ciblée.
  const CONF = {
    actif: { titre: "Réactiver l'employé ?", icon: "play_circle", tone: "emerald", btn: "Réactiver", variant: "primary", texte: `${e?.name} pourra de nouveau pointer et se connecter.` },
    suspendu: { titre: "Suspendre l'employé ?", icon: "pause_circle", tone: "danger", btn: "Suspendre", variant: "danger", texte: `${e?.name} ne pourra plus pointer ni se connecter. Ses données sont conservées.` },
    archive: { titre: "Archiver l'employé ?", icon: "inventory_2", tone: "danger", btn: "Archiver", variant: "danger", texte: `${e?.name} sera retiré(e) des effectifs actifs (masqué des listes). Données et historique conservés.` },
  };
  const conf = confirmAction ? CONF[confirmAction] : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={basculer}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu de la fiche"
        title="Menu de la fiche"
        className={`w-10 h-10 inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors ${focusOr}`}
      >
        <Icon name="menu" className="text-[20px]" />
      </button>

      {open && rect && (
        <div
          ref={menuRef}
          role="menu"
          style={{ position: "fixed", top: rect.bottom + 8, right: Math.max(8, window.innerWidth - rect.right), zIndex: 70 }}
          className="w-60 rounded-2xl border border-border bg-surface p-1.5 shadow-pop"
        >
          <p className="px-3 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-subtle">Actions de la fiche</p>
          <Item icon="fingerprint" label="Biométrie" onClick={() => { setOpen(false); setBio(true); }} />
          <Item icon="badge" label="Badge RFID" onClick={() => { setOpen(false); setBadge(true); }} />
          <Item icon="password" label="Régénérer le PIN" onClick={regenererPin} />
          <div className="h-px bg-border my-1.5 mx-2" />
          {archived ? (
            <Item icon="play_circle" label="Réactiver l'employé" onClick={() => { setOpen(false); setConfirmAction("actif"); }} />
          ) : (
            <>
              <Item icon={suspendu ? "play_circle" : "pause_circle"} label={suspendu ? "Réactiver l'employé" : "Suspendre l'employé"} danger={!suspendu} onClick={() => { setOpen(false); setConfirmAction(suspendu ? "actif" : "suspendu"); }} />
              <Item icon="inventory_2" label="Archiver l'employé" danger onClick={() => { setOpen(false); setConfirmAction("archive"); }} />
            </>
          )}
        </div>
      )}

      <BiometrieModal open={bio} onClose={() => setBio(false)} employe={e} />
      <BadgeModal open={badge} onClose={() => setBadge(false)} employe={e} />

      <Modal
        open={pin !== null}
        onClose={() => setPin(null)}
        title="Nouveau code PIN"
        icon="password"
        iconTone="or"
        footer={<Button variant="primary" onClick={() => setPin(null)}>Compris</Button>}
      >
        <p className="text-sm text-muted mb-3">L'ancien PIN ne fonctionne plus. Communiquez ce code à {e?.name} :</p>
        <p className="text-center text-3xl font-bold font-mono tracking-[0.3em] text-brand-600 bg-surface-2 rounded-xl py-4">{pin}</p>
      </Modal>

      <Modal
        open={!!conf}
        onClose={() => setConfirmAction(null)}
        title={conf?.titre}
        icon={conf?.icon}
        iconTone={conf?.tone}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmAction(null)}>Annuler</Button>
            <Button variant={conf?.variant} onClick={changerStatut}>{conf?.btn}</Button>
          </>
        }
      >
        <p className="text-sm text-muted">{conf?.texte}</p>
      </Modal>
    </>
  );
}
