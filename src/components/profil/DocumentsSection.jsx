import { useEffect, useRef, useState } from "react";
import Icon from "../ui/Icon.jsx";
import Button from "../ui/Button.jsx";
import Modal from "../ui/Modal.jsx";
import { Input, Select, Field as Champ } from "../ui/Input.jsx";
import { useUI } from "../ui/UIProvider.jsx";
import { apiGet, apiPatch, apiDelete, apiUpload } from "../../lib/api.js";

// Types de document RH proposés (alignés sur les icônes RH).
const TYPES_DOC = ["Contrat", "Identité", "Paie", "RH", "Autre"];
const ICONE_DOC = { Contrat: "description", Identité: "badge", Paie: "receipt_long", RH: "edit_document" };
const iconeDoc = (type) => ICONE_DOC[type] ?? "description";

// Date ISO -> "JJ/MM/AAAA".
function dateFr(iso) {
  if (!iso) return "—";
  const d = String(iso).slice(0, 10).split("-");
  return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : String(iso);
}
// Octets -> libellé lisible.
function tailleFr(octets) {
  if (octets == null) return "—";
  if (octets >= 1024 * 1024) return `${(octets / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
  if (octets >= 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${octets} o`;
}

// Refuse tout fichier non-PDF côté client (le backend rejette aussi en 422).
function estPdf(file) {
  if (!file) return false;
  const nom = (file.name || "").toLowerCase();
  return file.type === "application/pdf" || nom.endsWith(".pdf");
}

const formVide = { titre: "", type: "Contrat", description: "" };

/**
 * DocumentsSection — CRUD complet des documents d'un employé.
 *  - GET    /api/employes/{id}/documents
 *  - POST   /api/employes/{id}/documents              (multipart, fichier=PDF)
 *  - PATCH  /api/employes/{id}/documents/{docId}      (renommer / métadonnées)
 *  - POST   /api/employes/{id}/documents/{docId}/remplacer  (multipart, fichier=PDF)
 *  - DELETE /api/employes/{id}/documents/{docId}      (204)
 */
export default function DocumentsSection({ numericId }) {
  const { toast, confirm } = useUI();
  const [docs, setDocs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  // Modale d'ajout.
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [form, setForm] = useState(formVide);
  const [fichier, setFichier] = useState(null);
  const [enCours, setEnCours] = useState(false);
  const [erreurForm, setErreurForm] = useState(null);
  const fileRef = useRef(null);

  // Modale de renommage.
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(formVide);
  const [editEnCours, setEditEnCours] = useState(false);
  const [editErreur, setEditErreur] = useState(null);

  // Remplacement de fichier (input caché par carte).
  const [remplaceId, setRemplaceId] = useState(null);
  const remplaceRef = useRef(null);

  const charger = () => {
    if (!numericId) return;
    setChargement(true);
    setErreur(null);
    apiGet(`/api/employes/${numericId}/documents`)
      .then((data) => setDocs(Array.isArray(data) ? data : []))
      .catch((e) => setErreur(e?.message || "Erreur de chargement des documents"))
      .finally(() => setChargement(false));
  };

  useEffect(charger, [numericId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Ajout ----------
  const ouvrirAjout = () => {
    setForm(formVide);
    setFichier(null);
    setErreurForm(null);
    setAjoutOuvert(true);
  };

  const choisirFichier = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!estPdf(f)) {
      setErreurForm("Seuls les fichiers PDF sont acceptés.");
      return;
    }
    setErreurForm(null);
    setFichier(f);
    if (!form.titre.trim()) setForm((s) => ({ ...s, titre: f.name.replace(/\.pdf$/i, "") }));
  };

  const ajoutValide = form.titre.trim().length > 0 && !!fichier;

  const soumettreAjout = async () => {
    if (!ajoutValide || enCours) return;
    if (!estPdf(fichier)) {
      setErreurForm("Seuls les fichiers PDF sont acceptés.");
      return;
    }
    setEnCours(true);
    setErreurForm(null);
    try {
      // apiUpload n'envoie qu'un fichier : on ajoute les métadonnées au même FormData
      // via le 4e paramètre `extra`.
      await apiUpload(`/api/employes/${numericId}/documents`, fichier, "fichier", {
        titre: form.titre.trim(),
        type: form.type,
        description: form.description.trim(),
      });
      toast(`Document « ${form.titre.trim()} » ajouté`, "success");
      setAjoutOuvert(false);
      charger();
    } catch (e) {
      setErreurForm(e?.message || "Téléversement impossible (PDF uniquement).");
    } finally {
      setEnCours(false);
    }
  };

  // ---------- Renommer (PATCH) ----------
  const ouvrirEdit = (doc) => {
    setEditTarget(doc);
    setEditForm({ titre: doc.titre || "", type: doc.type || "RH", description: doc.description || "" });
    setEditErreur(null);
  };

  const editValide = editForm.titre.trim().length > 0;

  const soumettreEdit = async () => {
    if (!editValide || editEnCours || !editTarget) return;
    setEditEnCours(true);
    setEditErreur(null);
    try {
      await apiPatch(`/api/employes/${numericId}/documents/${editTarget.id}`, {
        titre: editForm.titre.trim(),
        type: editForm.type,
        description: editForm.description.trim(),
      });
      toast("Document mis à jour", "success");
      setEditTarget(null);
      charger();
    } catch (e) {
      setEditErreur(e?.message || "Modification impossible");
    } finally {
      setEditEnCours(false);
    }
  };

  // ---------- Remplacer le fichier (POST .../remplacer) ----------
  const demanderRemplacement = (doc) => {
    setRemplaceId(doc.id);
    requestAnimationFrame(() => remplaceRef.current?.click());
  };

  const choisirRemplacement = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    const docId = remplaceId;
    setRemplaceId(null);
    if (!f || !docId) return;
    if (!estPdf(f)) {
      toast("Seuls les fichiers PDF sont acceptés.", "error");
      return;
    }
    try {
      await apiUpload(`/api/employes/${numericId}/documents/${docId}/remplacer`, f, "fichier");
      toast("Fichier remplacé", "success");
      charger();
    } catch (err) {
      toast(err?.message || "Remplacement impossible", "error");
    }
  };

  // ---------- Supprimer (DELETE) ----------
  const supprimer = (doc) => {
    confirm({
      title: "Supprimer le document",
      message: `Supprimer définitivement « ${doc.titre} » ? Cette action est irréversible.`,
      confirmLabel: "Supprimer",
      danger: true,
      onConfirm: async () => {
        try {
          await apiDelete(`/api/employes/${numericId}/documents/${doc.id}`);
          toast("Document supprimé", "success");
          charger();
        } catch (err) {
          toast(err?.message || "Suppression impossible", "error");
        }
      },
    });
  };

  // ---------- Voir / Télécharger ----------
  const voir = (doc) => {
    if (!doc.url) return toast("Lien du document indisponible", "error");
    window.open(doc.url, "_blank", "noopener,noreferrer");
  };
  const telecharger = (doc) => {
    if (!doc.url) return toast("Lien du document indisponible", "error");
    const a = document.createElement("a");
    a.href = doc.url;
    a.download = `${doc.titre || "document"}.pdf`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const maj = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));
  const majEdit = (k) => (e) => setEditForm((s) => ({ ...s, [k]: e.target.value }));

  return (
    <>
      {/* En-tête + bouton d'ajout */}
      <div className="flex items-center justify-between gap-3 mb-1">
        <p className="text-sm text-muted">
          {chargement ? "Chargement…" : `${docs.length} document${docs.length > 1 ? "s" : ""}`}
        </p>
        <Button icon="upload_file" onClick={ouvrirAjout} disabled={!numericId}>
          Ajouter un document
        </Button>
      </div>

      {/* Input caché global pour le remplacement de fichier */}
      <input ref={remplaceRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={choisirRemplacement} />

      {/* États */}
      {chargement ? (
        <div className="card py-14 text-center">
          <Icon name="progress_activity" className="text-faint text-[36px] animate-spin" />
          <p className="mt-2 text-sm text-muted">Chargement des documents…</p>
        </div>
      ) : erreur ? (
        <div className="card py-14 text-center">
          <Icon name="error" className="text-rose-500 text-[36px]" />
          <p className="mt-2 text-sm text-muted">{erreur}</p>
          <Button variant="secondary" size="sm" className="mt-4" icon="refresh" onClick={charger}>
            Réessayer
          </Button>
        </div>
      ) : docs.length === 0 ? (
        <div className="card py-14 text-center">
          <Icon name="folder_open" className="text-faint text-[36px]" />
          <p className="mt-2 text-sm text-muted">Aucun document pour cet agent.</p>
          <Button size="sm" className="mt-4" icon="upload_file" onClick={ouvrirAjout}>
            Ajouter le premier document
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {docs.map((doc) => (
            <div key={doc.id} className="card p-4 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                  <Icon name={iconeDoc(doc.type)} className="text-[22px]" filled />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink truncate" title={doc.titre}>{doc.titre}</p>
                  <p className="text-xs text-subtle mt-0.5">
                    {doc.type || "RH"} · {dateFr(doc.created_at)} · {tailleFr(doc.taille_octets)}
                  </p>
                  {doc.description && <p className="text-xs text-muted mt-1 line-clamp-2">{doc.description}</p>}
                  {doc.ajoute_par_nom && (
                    <p className="text-[11px] text-subtle mt-1.5 inline-flex items-center gap-1">
                      <Icon name="person" className="text-[14px]" /> Ajouté par {doc.ajoute_par_nom}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border -mb-0.5">
                <ActionDoc icon="visibility" label="Voir" onClick={() => voir(doc)} />
                <ActionDoc icon="download" label="Télécharger" onClick={() => telecharger(doc)} />
                <ActionDoc icon="edit" label="Renommer" onClick={() => ouvrirEdit(doc)} />
                <ActionDoc icon="find_replace" label="Remplacer" onClick={() => demanderRemplacement(doc)} />
                <ActionDoc icon="delete" label="Supprimer" danger onClick={() => supprimer(doc)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------- Modale : Ajouter un document ---------- */}
      <Modal
        open={ajoutOuvert}
        onClose={() => !enCours && setAjoutOuvert(false)}
        title="Ajouter un document"
        subtitle="PDF uniquement. Le document sera rattaché au dossier de l'agent."
        icon="upload_file"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAjoutOuvert(false)} disabled={enCours}>Annuler</Button>
            <Button onClick={soumettreAjout} disabled={!ajoutValide || enCours} icon={enCours ? "progress_activity" : "check"}>
              {enCours ? "Téléversement…" : "Ajouter"}
            </Button>
          </>
        }
      >
        {erreurForm && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3.5">
            <Icon name="error" className="text-rose-600 text-[20px]" />
            <p className="text-xs text-rose-700">{erreurForm}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Champ label="Nom du document *" className="sm:col-span-2">
            <Input value={form.titre} onChange={maj("titre")} placeholder="Ex. Contrat CDI 2026" />
          </Champ>
          <Champ label="Type">
            <Select value={form.type} onChange={maj("type")}>
              {TYPES_DOC.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Champ>
          <Champ label="Description (facultatif)" className="sm:col-span-2">
            <Input value={form.description} onChange={maj("description")} placeholder="Note interne, référence…" />
          </Champ>
        </div>

        {/* Zone de dépôt PDF */}
        <div className="mt-4">
          <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={choisirFichier} />
          {fichier ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-3.5">
              <span className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <Icon name="picture_as_pdf" className="text-[22px]" filled />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-texte truncate">{fichier.name}</p>
                <p className="text-xs text-subtle">{tailleFr(fichier.size)}</p>
              </div>
              <Button variant="ghost" size="sm" icon="close" onClick={() => setFichier(null)}>Retirer</Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-border hover:border-brand-400 bg-surface-2/40 hover:bg-surface-2 transition-colors px-4 py-6 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
            >
              <Icon name="cloud_upload" className="text-brand-500 text-[28px]" />
              <p className="text-sm font-medium text-texte mt-1">Choisir un fichier PDF</p>
              <p className="text-xs text-subtle mt-0.5">Format accepté : PDF</p>
            </button>
          )}
        </div>
      </Modal>

      {/* ---------- Modale : Renommer ---------- */}
      <Modal
        open={!!editTarget}
        onClose={() => !editEnCours && setEditTarget(null)}
        title="Modifier le document"
        subtitle="Renommez ou reclassez ce document."
        icon="edit_document"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditTarget(null)} disabled={editEnCours}>Annuler</Button>
            <Button onClick={soumettreEdit} disabled={!editValide || editEnCours} icon={editEnCours ? "progress_activity" : "save"}>
              {editEnCours ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </>
        }
      >
        {editErreur && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3.5">
            <Icon name="error" className="text-rose-600 text-[20px]" />
            <p className="text-xs text-rose-700">{editErreur}</p>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Champ label="Nom du document *" className="sm:col-span-2">
            <Input value={editForm.titre} onChange={majEdit("titre")} placeholder="Ex. Contrat CDI 2026" />
          </Champ>
          <Champ label="Type">
            <Select value={editForm.type} onChange={majEdit("type")}>
              {TYPES_DOC.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Champ>
          <Champ label="Description (facultatif)" className="sm:col-span-2">
            <Input value={editForm.description} onChange={majEdit("description")} placeholder="Note interne, référence…" />
          </Champ>
        </div>
      </Modal>
    </>
  );
}

// Petit bouton d'action sous chaque document.
function ActionDoc({ icon, label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
        danger ? "text-rose-600 hover:bg-rose-50" : "text-muted hover:text-texte hover:bg-surface-2"
      }`}
    >
      <Icon name={icon} className="text-[16px]" />
      {label}
    </button>
  );
}
