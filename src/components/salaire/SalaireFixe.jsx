import { useEffect, useState } from "react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Icon from "../ui/Icon.jsx";
import { Input, Select, Field } from "../ui/Input.jsx";
import { useUI } from "../ui/UIProvider.jsx";
import { fcfa } from "../../data/datasets.js";
import { apiGet, apiPost, apiPut, apiDelete } from "../../lib/api.js";

const DEVISES = ["FCFA", "EUR", "USD"];
const aujourdHui = () => new Date().toISOString().slice(0, 10);
const formVide = () => ({ montant: "", devise: "FCFA", date_application: aujourdHui(), commentaire: "" });

// Formate un montant selon la devise (FCFA via le formateur dédié, sinon générique).
function montantFmt(m, devise = "FCFA") {
  const n = Number(m) || 0;
  return devise === "FCFA" ? fcfa(n) : `${n.toLocaleString("fr-FR")} ${devise}`;
}

// Carte « Salaire fixe » : montant actuel + historique daté (ajout/modif/suppression).
// Le salaire fixe alimente le calcul de paie (salaire effectif au mois). `onChange` permet
// au parent de recharger le bulletin après une modification.
export default function SalaireFixe({ employeId, onChange }) {
  const { toast, confirm } = useUI();
  const [data, setData] = useState({ actuel: null, historique: [] });
  const [chargement, setChargement] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(formVide());
  const [editId, setEditId] = useState(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);

  const charger = () => {
    if (!employeId) return;
    setChargement(true);
    apiGet(`/api/employes/${employeId}/salaire`)
      .then((d) => setData({ actuel: d?.actuel ?? null, historique: Array.isArray(d?.historique) ? d.historique : [] }))
      .catch(() => setData({ actuel: null, historique: [] }))
      .finally(() => setChargement(false));
  };
  useEffect(() => { charger(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [employeId]);

  const maj = (k) => (ev) => setForm((f) => ({ ...f, [k]: ev.target.value }));
  const deviseCourante = data.historique[0]?.devise || "FCFA";

  const ouvrirAjout = () => { setForm(formVide()); setEditId(null); setErreur(null); setOpen(true); };
  const ouvrirEdit = (h) => {
    setForm({ montant: String(h.montant), devise: h.devise || "FCFA", date_application: h.date_application, commentaire: h.commentaire || "" });
    setEditId(h.id); setErreur(null); setOpen(true);
  };

  const valide = Number(form.montant) > 0 && /^\d{4}-\d{2}-\d{2}$/.test(form.date_application);

  const enregistrer = async () => {
    if (!valide || enCours) return;
    setEnCours(true); setErreur(null);
    const payload = {
      montant: Number(form.montant),
      devise: form.devise,
      date_application: form.date_application,
      commentaire: form.commentaire.trim() || null,
    };
    try {
      if (editId) await apiPut(`/api/salaire/${editId}`, payload);
      else await apiPost(`/api/employes/${employeId}/salaire`, payload);
      toast(editId ? "Salaire fixe modifié" : "Salaire fixe ajouté", "success");
      setOpen(false);
      charger();
      onChange?.();
    } catch (e) {
      setErreur(e.message || "Échec de l'enregistrement");
    } finally {
      setEnCours(false);
    }
  };

  const supprimer = (h) => {
    confirm({
      title: "Supprimer cette entrée ?",
      message: `Salaire ${montantFmt(h.montant, h.devise)} applicable le ${h.date_application}.`,
      danger: true,
      confirmLabel: "Supprimer",
      onConfirm: async () => {
        try { await apiDelete(`/api/salaire/${h.id}`); toast("Entrée supprimée"); charger(); onChange?.(); }
        catch (e) { toast(e.message || "Échec de la suppression", "error"); }
      },
    });
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Icon name="payments" className="text-[18px]" filled />
          </span>
          <h3 className="text-sm font-semibold text-ink">Salaire fixe</h3>
        </div>
        <Button size="sm" icon="add" onClick={ouvrirAjout}>Ajouter un salaire fixe</Button>
      </div>

      {/* Salaire fixe ACTUEL */}
      <div className="rounded-xl bg-brand-50 border border-brand-100 px-4 py-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-brand-700/70">Salaire fixe actuel</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-brand-700 mt-0.5">
            {data.actuel != null ? montantFmt(data.actuel, deviseCourante) : "—"}
          </p>
        </div>
        <Icon name="payments" className="text-brand-400 text-[28px] shrink-0" filled />
      </div>

      {/* HISTORIQUE daté */}
      <p className="text-[11px] font-medium text-subtle uppercase tracking-wide mt-4 mb-1.5">Historique des salaires</p>
      {chargement ? (
        <p className="text-sm text-muted py-3 text-center">Chargement…</p>
      ) : data.historique.length === 0 ? (
        <p className="text-sm text-muted py-3 text-center">Aucun salaire fixe enregistré pour l'instant.</p>
      ) : (
        <div className="divide-y divide-border">
          {data.historique.map((h, i) => (
            <div key={h.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="font-mono tabular-nums font-semibold text-texte flex items-center gap-2">
                  {montantFmt(h.montant, h.devise)}
                  {i === 0 && <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Actuel</span>}
                </p>
                <p className="text-xs text-muted truncate">Applicable le {h.date_application}{h.commentaire ? ` · ${h.commentaire}` : ""}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => ouvrirEdit(h)} title="Modifier" aria-label="Modifier" className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-surface-2 transition-colors">
                  <Icon name="edit" className="text-[17px]" />
                </button>
                <button onClick={() => supprimer(h)} title="Supprimer" aria-label="Supprimer" className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors">
                  <Icon name="delete" className="text-[17px]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pop-up ajout / édition */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? "Modifier le salaire fixe" : "Ajouter un salaire fixe"}
        subtitle="Le montant s'applique à partir de la date choisie et alimente le calcul de paie."
        icon="payments"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={enregistrer} disabled={!valide || enCours} icon={enCours ? "progress_activity" : "check"}>
              {enCours ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </>
        }
      >
        {erreur && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3.5">
            <Icon name="error" className="text-rose-600 text-[20px]" />
            <p className="text-xs text-rose-700">{erreur}</p>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Montant du salaire fixe *">
            <Input type="number" min="0" value={form.montant} onChange={maj("montant")} placeholder="ex. 250000" />
          </Field>
          <Field label="Devise">
            <Select value={form.devise} onChange={maj("devise")}>
              {DEVISES.map((d) => <option key={d}>{d}</option>)}
            </Select>
          </Field>
          <Field label="Date d'application *">
            <Input type="date" value={form.date_application} onChange={maj("date_application")} />
          </Field>
          <Field label="Commentaire (optionnel)" className="sm:col-span-2">
            <Input value={form.commentaire} onChange={maj("commentaire")} placeholder="ex. Augmentation annuelle" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
