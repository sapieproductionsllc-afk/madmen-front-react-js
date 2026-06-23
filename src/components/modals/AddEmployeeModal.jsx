import { useRef, useState } from "react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Icon from "../ui/Icon.jsx";
import { Input, Select, Field as Champ } from "../ui/Input.jsx";
import { agencesList, statutsEmploye } from "../../data/datasets.js";
import { apiPost } from "../../lib/api.js";

const formVide = { nom: "", fonction: "", agence: "", telephone: "", statut: statutsEmploye[0] };

// "Jean Pierre Dupont" -> { prenom: "Jean", nom: "Pierre Dupont" }.
// L'API exige nom ET prénom : si un seul mot est saisi, on le réutilise pour les deux.
function separerNom(complet) {
  const parts = complet.trim().split(/\s+/);
  const prenom = parts.shift() || "";
  const nom = parts.join(" ") || prenom;
  return { prenom, nom };
}

export default function AddEmployeeModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState(formVide);
  const [photo, setPhoto] = useState(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [cree, setCree] = useState(null); // réponse API : { matricule, code_pin_genere, nom, prenom, ... }
  const [copie, setCopie] = useState(""); // "matricule" | "pin" -> feedback « Copié »
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

  const reset = () => {
    retirerPhoto();
    setForm(formVide);
    setErreur(null);
    setCree(null);
    setEnCours(false);
    setCopie("");
  };
  const fermer = () => { reset(); onClose?.(); };

  const soumettre = async () => {
    if (!valide || enCours) return;
    setEnCours(true);
    setErreur(null);
    const { prenom, nom } = separerNom(form.nom);
    try {
      // Le matricule ET le code PIN sont générés par l'API ; on lit code_pin_genere
      // dans la réponse pour l'afficher une seule fois.
      const emp = await apiPost("/api/employes", {
        prenom,
        nom,
        telephone: form.telephone.trim() || null,
      });
      setCree(emp);
      onSaved?.(`${prenom} ${nom}`.trim()); // toast + rafraîchissement de la liste (parent)
    } catch (e) {
      setErreur(e.message || "Création impossible");
    } finally {
      setEnCours(false);
    }
  };

  const copier = async (valeur, quoi) => {
    try {
      await navigator.clipboard.writeText(String(valeur));
      setCopie(quoi);
      setTimeout(() => setCopie(""), 1500);
    } catch {
      /* presse-papiers indisponible : l'utilisateur recopie à la main */
    }
  };

  return (
    <Modal
      open={open}
      onClose={fermer}
      title={cree ? "Employé créé" : "Ajouter un employé"}
      subtitle={
        cree
          ? "Notez les identifiants : le code PIN ne sera plus jamais affiché."
          : "Renseignez les informations de base, puis lancez l'enrôlement biométrique."
      }
      icon={cree ? "check_circle" : "person_add"}
      footer={
        cree ? (
          <Button onClick={fermer} icon="check">Terminé</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={fermer}>Annuler</Button>
            <Button onClick={soumettre} disabled={!valide || enCours} icon={enCours ? "progress_activity" : "check"}>
              {enCours ? "Création…" : "Créer l'employé"}
            </Button>
          </>
        )
      }
    >
      {cree ? (
        /* ----- Écran « identifiants générés » ----- */
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 p-3.5">
            <Icon name="warning" className="text-amber-600 text-[20px]" filled />
            <p className="text-xs text-amber-800">
              Communiquez ce <b>code PIN</b> à l'employé et notez-le : pour des raisons de sécurité, il
              <b> ne sera plus jamais affiché</b>. En cas d'oubli, il faudra en régénérer un nouveau.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { cle: "matricule", label: "Matricule", valeur: cree.matricule, gros: false },
              { cle: "pin", label: "Code PIN", valeur: cree.code_pin_genere, gros: true },
            ].map(({ cle, label, valeur, gros }) => (
              <div key={cle} className="rounded-xl border border-border bg-surface-2 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted uppercase tracking-wide">{label}</span>
                  <button
                    type="button"
                    onClick={() => copier(valeur, cle)}
                    className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
                  >
                    <Icon name={copie === cle ? "check" : "content_copy"} className="text-[15px]" />
                    {copie === cle ? "Copié" : "Copier"}
                  </button>
                </div>
                <p className={`mt-1 font-mono font-bold text-texte ${gros ? "text-2xl tracking-[0.3em]" : "text-lg"}`}>
                  {valeur ?? "—"}
                </p>
              </div>
            ))}
          </div>

          <p className="text-xs text-subtle">
            {cree.prenom} {cree.nom} a été créé. L'enrôlement biométrique (empreinte, badge) se fait depuis la page <b>Enrôlement</b>.
          </p>
        </div>
      ) : (
        /* ----- Formulaire ----- */
        <>
          {erreur && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3.5">
              <Icon name="error" className="text-rose-600 text-[20px]" />
              <p className="text-xs text-rose-700">{erreur}</p>
            </div>
          )}

          {/* Photo de l'employé (cosmétique pour l'instant — non persistée à la création) */}
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
            <Icon name="badge" className="text-brand-600 text-[20px]" filled />
            <p className="text-xs text-brand-700">
              Le <b>matricule</b> et un <b>code PIN</b> uniques seront générés automatiquement à la création (affichés juste après). L'empreinte/badge s'ajoutent depuis la page <b>Enrôlement</b>.
            </p>
          </div>
        </>
      )}
    </Modal>
  );
}
