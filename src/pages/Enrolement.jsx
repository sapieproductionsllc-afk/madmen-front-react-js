import { useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";

const etapes = [
  { id: 0, label: "Identité", icon: "person" },
  { id: 1, label: "Empreinte", icon: "fingerprint" },
  { id: 2, label: "Badge & PIN", icon: "badge" },
  { id: 3, label: "Validation", icon: "verified" },
];

const champ =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition";

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
            <div className={`flex items-center gap-2 ${i <= etape ? "text-brand-600" : "text-slate-400"}`}>
              <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${i < etape ? "bg-brand-600 text-white" : i === etape ? "bg-brand-50 text-brand-600 ring-2 ring-brand-200" : "bg-slate-100 text-slate-400"}`}>
                <Icon name={i < etape ? "check" : e.icon} className="text-[20px]" />
              </span>
              <span className="text-sm font-medium hidden sm:inline">{e.label}</span>
            </div>
            {i < etapes.length - 1 && <div className={`h-0.5 flex-1 rounded ${i < etape ? "bg-brand-500" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      <div className="card p-6 max-w-2xl">
        {etape === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block sm:col-span-2">
              <span className="block text-xs font-medium text-slate-500 mb-1.5">Nom et prénom</span>
              <input className={champ} placeholder="Ex. Jean Dupont" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-500 mb-1.5">Fonction</span>
              <input className={champ} placeholder="Ex. Comptable" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-500 mb-1.5">Département</span>
              <input className={champ} placeholder="Ex. Finance" />
            </label>
          </div>
        )}

        {etape === 1 && (
          <div className="text-center py-6">
            <button
              onClick={() => setEmpreinte(true)}
              className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center transition-all ${empreinte ? "bg-emerald-50 text-emerald-500" : "bg-brand-50 text-brand-500 hover:bg-brand-100"}`}
            >
              <Icon name={empreinte ? "check_circle" : "fingerprint"} className="text-[56px]" filled />
            </button>
            <p className="mt-4 text-sm font-medium text-slate-700">
              {empreinte ? "Empreinte capturée avec succès" : "Posez le doigt sur le lecteur"}
            </p>
            <p className="text-xs text-slate-400 mt-1">{empreinte ? "Vous pouvez passer à l'étape suivante." : "Cliquez pour simuler la capture."}</p>
          </div>
        )}

        {etape === 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs font-medium text-slate-500 mb-1.5">Numéro de badge RFID</span>
              <input className={champ} placeholder="Ex. RFID-00482" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-500 mb-1.5">Code PIN (4 chiffres)</span>
              <input className={champ} placeholder="••••" maxLength={4} />
            </label>
          </div>
        )}

        {etape === 3 && (
          <div className="text-center py-6">
            <span className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <Icon name="verified" className="text-[36px]" filled />
            </span>
            <p className="mt-4 text-base font-semibold text-slate-800">Tout est prêt</p>
            <p className="text-sm text-slate-500 mt-1">Identité, empreinte, badge et code PIN sont configurés. Validez pour finaliser.</p>
          </div>
        )}

        <div className="flex justify-between mt-6 pt-5 border-t border-slate-100">
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
