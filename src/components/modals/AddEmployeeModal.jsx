import { useState } from "react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import { Input, Select, Field as Champ } from "../ui/Input.jsx";
import { agencesList, statutsEmploye } from "../../data/datasets.js";

export default function AddEmployeeModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ nom: "", fonction: "", agence: agencesList[0], statut: statutsEmploye[0] });
  const maj = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const valide = form.nom.trim().length > 1;

  const soumettre = () => {
    if (!valide) return;
    onSaved?.(form.nom.trim());
    setForm({ nom: "", fonction: "", agence: agencesList[0], statut: statutsEmploye[0] });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajouter un employé"
      subtitle="Renseignez les informations de base, puis lancez l'enrôlement biométrique."
      icon="person_add"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={soumettre} disabled={!valide} icon="check">
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Champ label="Nom et prénom *" className="sm:col-span-2">
          <Input value={form.nom} onChange={maj("nom")} placeholder="Ex. Jean Dupont" />
        </Champ>
        <Champ label="Fonction">
          <Input value={form.fonction} onChange={maj("fonction")} placeholder="Ex. Comptable" />
        </Champ>
        <Champ label="Agence">
          <Select value={form.agence} onChange={maj("agence")}>
            {agencesList.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </Select>
        </Champ>
        <Champ label="Téléphone">
          <Input placeholder="+33 6 00 00 00 00" />
        </Champ>
        <Champ label="Statut">
          <Select value={form.statut} onChange={maj("statut")}>
            {statutsEmploye.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Champ>
      </div>

      <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-brand-50 border border-brand-100 p-3.5">
        <span className="material-symbols-rounded text-brand-600 text-[20px]">fingerprint</span>
        <p className="text-xs text-brand-700">
          Après enregistrement, l'employé pourra être enrôlé (empreinte, badge, code PIN) depuis la page <b>Enrôlement</b>.
        </p>
      </div>
    </Modal>
  );
}
