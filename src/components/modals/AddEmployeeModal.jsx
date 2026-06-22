import { useRef, useState } from "react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Icon from "../ui/Icon.jsx";
import { Input, Select, Field as Champ } from "../ui/Input.jsx";
import { agencesList, statutsEmploye } from "../../data/datasets.js";

const formVide = { nom: "", fonction: "", agence: "", telephone: "", statut: statutsEmploye[0] };

export default function AddEmployeeModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState(formVide);
  const [photo, setPhoto] = useState(null);
  const fileRef = useRef(null);
  const maj = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const valide = form.nom.trim().length > 1;

  const choisirPhoto = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      if (photo) URL.revokeObjectURL(photo);
      setPhoto(URL.createObjectURL(f));
    }
    e.target.value = "";
  };
  const retirerPhoto = () => { if (photo) URL.revokeObjectURL(photo); setPhoto(null); };

  const reset = () => { retirerPhoto(); setForm(formVide); };
  const soumettre = () => {
    if (!valide) return;
    onSaved?.(form.nom.trim());
    reset();
  };
  const fermer = () => { reset(); onClose?.(); };

  return (
    <Modal
      open={open}
      onClose={fermer}
      title="Ajouter un employé"
      subtitle="Renseignez les informations de base, puis lancez l'enrôlement biométrique."
      icon="person_add"
      footer={
        <>
          <Button variant="secondary" onClick={fermer}>Annuler</Button>
          <Button onClick={soumettre} disabled={!valide} icon="check">Enregistrer</Button>
        </>
      }
    >
      {/* Photo de l'employé */}
      <div className="flex items-center gap-4 mb-5">
        <span className="relative w-16 h-16 rounded-full bg-surface-2 border border-border flex items-center justify-center overflow-hidden shrink-0">
          {photo ? <img src={photo} alt="Aperçu de la photo" className="w-full h-full object-cover" /> : <Icon name="person" className="text-faint text-[30px]" filled />}
        </span>
        <div className="min-w-0">
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={choisirPhoto} />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" icon="photo_camera" onClick={() => fileRef.current?.click()}>{photo ? "Changer la photo" : "Ajouter une photo"}</Button>
            {photo && <Button variant="ghost" size="sm" icon="delete" onClick={retirerPhoto}>Retirer</Button>}
          </div>
          <p className="text-xs text-subtle mt-1.5">Facultatif — JPG, PNG ou WebP.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Champ label="Nom et prénom *" className="sm:col-span-2">
          <Input value={form.nom} onChange={maj("nom")} placeholder="Ex. Jean Dupont" />
        </Champ>
        <Champ label="Fonction">
          <Input value={form.fonction} onChange={maj("fonction")} placeholder="Ex. Comptable" />
        </Champ>
        <Champ label="Agence / lieu (facultatif)">
          <Input value={form.agence} onChange={maj("agence")} placeholder="Ex. Siège social — ou laissez vide" list="agences-suggestions" />
          <datalist id="agences-suggestions">
            {agencesList.map((a) => <option key={a} value={a} />)}
          </datalist>
        </Champ>
        <Champ label="Téléphone">
          <Input value={form.telephone} onChange={maj("telephone")} placeholder="+242 06 00 00 00" />
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
        <Icon name="fingerprint" className="text-brand-600 text-[20px]" />
        <p className="text-xs text-brand-700">
          Après enregistrement, l'employé pourra être enrôlé (empreinte, badge, code PIN) depuis la page <b>Enrôlement</b>.
        </p>
      </div>
    </Modal>
  );
}
