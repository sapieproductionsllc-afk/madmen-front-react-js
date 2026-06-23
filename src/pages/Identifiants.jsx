import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import Button from "../components/ui/Button.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import Icon from "../components/ui/Icon.jsx";
import Modal from "../components/ui/Modal.jsx";
import { Input, Field } from "../components/ui/Input.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { apiGet, apiPatch, apiPost } from "../lib/api.js";
import { mapEmploye } from "../lib/mappers.js";

function PINInput({ value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        value={value}
        onChange={onChange}
        type={show ? "text" : "password"}
        inputMode="numeric"
        pattern="\d{4}"
        maxLength={4}
        placeholder="Ex. 1234"
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-subtle hover:text-muted transition-colors"
        tabIndex={-1}
        aria-label={show ? "Masquer le code" : "Afficher le code"}
      >
        <Icon name={show ? "visibility_off" : "visibility"} className="text-[18px]" />
      </button>
    </div>
  );
}

const toneStatut = { Actif: "emerald", "En congé": "amber", Suspendu: "rose" };

export default function Identifiants({ embedded }) {
  const { toast } = useUI();
  const [employes, setEmployes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ matricule: "", code_pin: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setChargement(true);
    apiGet("/api/employes")
      .then((data) => setEmployes((Array.isArray(data) ? data : []).map(mapEmploye)))
      .catch((e) => setErreur(e.message || "Erreur de chargement"))
      .finally(() => setChargement(false));
  }, []);

  const liste = useMemo(() => {
    if (!recherche) return employes;
    const q = recherche.toLowerCase();
    return employes.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.matricule.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q)
    );
  }, [employes, recherche]);

  const ouvrirEdition = (emp) => {
    setForm({ matricule: emp.matricule, code_pin: "" });
    setFormError("");
    setEditTarget(emp);
  };

  const validerEtEnregistrer = async () => {
    const matricule = form.matricule.trim();
    if (!matricule) {
      setFormError("Le matricule est obligatoire.");
      return;
    }

    if (form.code_pin && !/^\d{4}$/.test(form.code_pin)) {
      setFormError("Le code PIN doit contenir exactement 4 chiffres.");
      return;
    }

    const conflit = employes.find(
      (e) => e.matricule === matricule && e._id !== editTarget._id
    );
    if (conflit) {
      setFormError(`Le matricule « ${matricule} » est déjà attribué.`);
      return;
    }

    setSaving(true);
    try {
      const payload = {};
      if (matricule !== editTarget.matricule) payload.matricule = matricule;
      if (form.code_pin) payload.code_pin = form.code_pin;

      if (Object.keys(payload).length > 0) {
        await apiPatch(`/api/employes/${editTarget._id}/identifiants`, payload);
      }

      setEmployes((prev) =>
        prev.map((e) =>
          e._id === editTarget._id ? { ...e, matricule, id: matricule } : e
        )
      );

      toast(
        `Identifiants de ${editTarget.name} mis à jour${form.code_pin ? " (nouveau code PIN défini)" : ""}`,
        "success"
      );
      setEditTarget(null);
    } catch (e) {
      setFormError(e.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const regenererPin = async () => {
    try {
      const res = await apiPost(`/api/employes/${editTarget._id}/regenerer-pin`);
      toast(`Nouveau PIN pour ${editTarget.name} : ${res.code_pin_genere}`, "info");
      setEditTarget(null);
    } catch (e) {
      setFormError(e.message || "Erreur de régénération");
    }
  };

  if (chargement)
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-sm text-muted animate-pulse">Chargement des employés…</span>
      </div>
    );

  if (erreur)
    return (
      <div className="card p-6 text-center">
        <Icon name="error" className="text-rose-400 text-[32px] mb-3" filled />
        <p className="text-sm text-rose-400">{erreur}</p>
      </div>
    );

  return (
    <div>
      {!embedded && (
        <PageHeader
          title="Gestion des identifiants"
          subtitle="Attribuez et modifiez le matricule et le code PIN de chaque employé"
        />
      )}

      {/* Barre de recherche */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-sm text-muted">{employes.length} employé{employes.length > 1 ? "s" : ""}</p>
        <SearchInput
          value={recherche}
          onChange={setRecherche}
          placeholder="Rechercher un employé…"
          className="sm:w-72"
        />
      </div>

      {/* Tableau */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full text-left border-collapse" style={{ minWidth: 640 }}>
            <thead>
              <tr className="kicker border-b border-border bg-surface-2">
                <th className="px-5 py-2.5 font-semibold">Employé</th>
                <th className="px-5 py-2.5 font-semibold">Département</th>
                <th className="px-5 py-2.5 font-semibold">Matricule</th>
                <th className="px-5 py-2.5 font-semibold">Code PIN</th>
                <th className="px-5 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {liste.map((e) => (
                <tr
                  key={e._id}
                  className="border-t border-border transition-colors hover:bg-surface-2"
                >
                  <td className="px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-ink">{e.name}</p>
                      <p className="text-xs text-subtle">{e.fonction}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-texte">{e.department}</td>
                  <td className="px-5 py-3">
                    <span className="font-mono text-sm text-ink font-medium">{e.matricule}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="tracking-widest text-muted font-mono">••••</span>
                      <StatusPill label="Défini" tone="emerald" />
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="manage_accounts"
                      onClick={() => ouvrirEdition(e)}
                    >
                      Modifier
                    </Button>
                  </td>
                </tr>
              ))}
              {liste.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-sm text-subtle">
                    Aucun employé ne correspond.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale d'édition */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Modifier les identifiants"
        subtitle={editTarget?.name}
        icon="manage_accounts"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={regenererPin} icon="refresh" disabled={saving}>
              Régénérer le PIN
            </Button>
            <Button variant="secondary" onClick={() => setEditTarget(null)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={validerEtEnregistrer} icon="check" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </>
        }
      >
        {editTarget && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-ink">{editTarget.name}</p>
                <p className="text-xs text-muted">{editTarget.fonction} · {editTarget.department}</p>
              </div>
            </div>

            <Field label="Matricule *">
              <Input
                value={form.matricule}
                onChange={(e) => {
                  setForm((f) => ({ ...f, matricule: e.target.value }));
                  setFormError("");
                }}
                placeholder="Ex. EMP-0001"
              />
            </Field>

            <Field
              label={
                <span className="flex items-center gap-1.5">
                  Nouveau code PIN (4 chiffres)
                  <span className="text-xs text-subtle font-normal">
                    · laisser vide pour conserver l'actuel
                  </span>
                </span>
              }
            >
              <PINInput
                value={form.code_pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setForm((f) => ({ ...f, code_pin: val }));
                  setFormError("");
                }}
              />
            </Field>

            {formError && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5">
                <Icon name="error" className="text-rose-400 text-[18px]" filled />
                <span className="text-sm text-rose-300">{formError}</span>
              </div>
            )}

            <div className="flex items-start gap-2.5 rounded-xl bg-brand-50 border border-brand-100 p-3.5">
              <Icon name="info" className="text-brand-600 text-[20px]" filled />
              <div className="text-xs text-brand-700 space-y-1">
                <p>Le matricule doit être <b>unique</b> dans le système.</p>
                <p>Le code PIN sert à la connexion sur les postes de travail et doit contenir <b>exactement 4 chiffres</b>.</p>
                <p>Vous pouvez aussi <b>régénérer</b> automatiquement un PIN unique via le bouton prévu.</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
