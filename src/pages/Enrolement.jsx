import { useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import { Input, Field } from "../components/ui/Input.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";

const etapes = [
  { id: 0, label: "Identité", icon: "person" },
  { id: 1, label: "Empreinte", icon: "fingerprint" },
  { id: 2, label: "Badge & PIN", icon: "badge" },
  { id: 3, label: "Validation", icon: "verified" },
];

export default function Enrolement() {
  const { toast } = useUI();
  const [etape, setEtape] = useState(0);
  const [empreinte, setEmpreinte] = useState(false);

  const suivant = () => setEtape((e) => Math.min(e + 1, 3));
  const precedent = () => setEtape((e) => Math.max(e - 1, 0));
  const terminer = () => {
    toast("Enrôlement terminé avec succès");
    setEtape(0);
    setEmpreinte(false);
  };

  return (
    <div>
      <PageHeader title="Enrôlement biométrique" subtitle="Enregistrez un nouvel employé et ses identifiants en quelques étapes." />

      {/* Indicateur d'étapes */}
      <div className="flex items-center gap-2 mb-6">
        {etapes.map((e, i) => (
          <div key={e.id} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-2 ${i <= etape ? "text-brand-600" : "text-subtle"}`}>
              <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${i < etape ? "bg-brand-600 text-canvas" : i === etape ? "bg-brand-50 text-brand-600 ring-2 ring-brand-200" : "bg-surface-2 text-subtle"}`}>
                <Icon name={i < etape ? "check" : e.icon} className="text-[20px]" />
              </span>
              <span className="text-sm font-medium hidden sm:inline">{e.label}</span>
            </div>
            {i < etapes.length - 1 && <div className={`h-0.5 flex-1 rounded ${i < etape ? "bg-brand-500" : "bg-surface-2"}`} />}
          </div>
        ))}
      </div>

      <div className="card p-6 max-w-2xl">
        {etape === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nom et prénom" className="sm:col-span-2">
              <Input placeholder="Ex. Jean Dupont" />
            </Field>
            <Field label="Fonction">
              <Input placeholder="Ex. Comptable" />
            </Field>
            <Field label="Département">
              <Input placeholder="Ex. Finance" />
            </Field>
          </div>
        )}

        {etape === 1 && (
          <div className="text-center py-6">
            <button
              onClick={() => setEmpreinte(true)}
              className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center transition-all ${empreinte ? "bg-emerald-500/15 text-emerald-500" : "bg-brand-50 text-brand-500 hover:bg-brand-100"}`}
            >
              <Icon name={empreinte ? "check_circle" : "fingerprint"} className="text-[56px]" filled />
            </button>
            <p className="mt-4 text-sm font-medium text-texte">
              {empreinte ? "Empreinte capturée avec succès" : "Posez le doigt sur le lecteur"}
            </p>
            <p className="text-xs text-subtle mt-1">{empreinte ? "Vous pouvez passer à l'étape suivante." : "Cliquez pour simuler la capture."}</p>
          </div>
        )}

        {etape === 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Numéro de badge RFID">
              <Input placeholder="Ex. RFID-00482" />
            </Field>
            <Field label="Code PIN (4 chiffres)">
              <Input placeholder="••••" maxLength={4} />
            </Field>
          </div>
        )}

        {etape === 3 && (
          <div className="text-center py-6">
            <span className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <Icon name="verified" className="text-[36px]" filled />
            </span>
            <p className="mt-4 text-base font-semibold text-ink">Tout est prêt</p>
            <p className="text-sm text-muted mt-1">Identité, empreinte, badge et code PIN sont configurés. Validez pour finaliser.</p>
          </div>
        )}

        <div className="flex justify-between mt-6 pt-5 border-t border-border">
          <Button variant="secondary" icon="arrow_back" onClick={precedent} disabled={etape === 0}>
            Précédent
          </Button>
          {etape < 3 ? (
            <Button iconRight="arrow_forward" onClick={suivant} disabled={etape === 1 && !empreinte}>
              Continuer
            </Button>
          ) : (
            <Button icon="check" onClick={terminer}>
              Terminer l'enrôlement
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
