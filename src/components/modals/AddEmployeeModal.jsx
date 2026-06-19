import { useState } from "react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import { agencesList, statutsEmploye } from "../../data/datasets.js";

const champ =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition";

function Champ({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-500 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

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
        <div className="sm:col-span-2">
          <Champ label="Nom et prénom *">
            <input className={champ} value={form.nom} onChange={maj("nom")} placeholder="Ex. Jean Dupont" />
          </Champ>
        </div>
        <Champ label="Fonction">
          <input className={champ} value={form.fonction} onChange={maj("fonction")} placeholder="Ex. Comptable" />
        </Champ>
        <Champ label="Agence">
          <select className={champ} value={form.agence} onChange={maj("agence")}>
            {agencesList.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </Champ>
        <Champ label="Téléphone">
          <input className={champ} placeholder="+33 6 00 00 00 00" />
        </Champ>
        <Champ label="Statut">
          <select className={champ} value={form.statut} onChange={maj("statut")}>
            {statutsEmploye.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
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
