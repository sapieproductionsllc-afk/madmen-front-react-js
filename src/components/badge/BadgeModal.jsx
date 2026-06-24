import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import { useUI } from "../ui/UIProvider.jsx";
import BadgeEmploye from "./BadgeEmploye.jsx";

// Aperçu du badge + téléchargement PNG (capture du DOM en haute résolution).
export default function BadgeModal({ open, onClose, employe }) {
  const badgeRef = useRef(null);
  const { toast } = useUI();
  const [gen, setGen] = useState(false);

  const telecharger = async () => {
    if (!badgeRef.current) return;
    setGen(true);
    try {
      const url = await toPng(badgeRef.current, { pixelRatio: 3, cacheBust: true, backgroundColor: "#ffffff" });
      const a = document.createElement("a");
      a.download = `badge-${employe?.matricule || employe?.id || "employe"}.png`;
      a.href = url;
      a.click();
      toast("Badge téléchargé", "success");
    } catch {
      toast("Échec de la génération du badge (photo non accessible ?)", "error");
    } finally {
      setGen(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Badge employé"
      subtitle={employe?.name}
      icon="badge"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={gen}>Fermer</Button>
          <Button icon="download" onClick={telecharger} disabled={gen}>
            {gen ? "Génération…" : "Télécharger (PNG)"}
          </Button>
        </>
      }
    >
      <div className="flex justify-center py-2 bg-slate-50 -mx-1 rounded-xl">
        <BadgeEmploye employe={employe} innerRef={badgeRef} />
      </div>
    </Modal>
  );
}
