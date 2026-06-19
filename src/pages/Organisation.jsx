import { useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import Tabs from "../components/ui/Tabs.jsx";
import Table from "../components/ui/Table.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { agences } from "../data/mockData.js";
import { departements } from "../data/datasets.js";

export default function Organisation() {
  const { toast } = useUI();
  const [onglet, setOnglet] = useState("agences");

  const colonnesDep = [
    { key: "name", label: "Département", render: (d) => <span className="font-medium text-slate-800">{d.name}</span> },
    { key: "lead", label: "Responsable", render: (d) => <span className="text-slate-600">{d.lead}</span> },
    { key: "agence", label: "Agence", render: (d) => <span className="text-slate-600">{d.agence}</span> },
    { key: "headcount", label: "Effectif", align: "right", render: (d) => <span className="font-mono font-medium text-slate-800">{d.headcount}</span> },
  ];

  return (
    <div>
      <PageHeader title="Organisation" subtitle="Structure de l'entreprise : agences et départements.">
        <Button icon="add" onClick={() => toast("Formulaire de création ouvert", "info")}>
          {onglet === "agences" ? "Nouvelle agence" : "Nouveau département"}
        </Button>
      </PageHeader>

      <div className="mb-5">
        <Tabs
          tabs={[
            { label: "Agences", value: "agences" },
            { label: "Départements", value: "departements" },
          ]}
          active={onglet}
          onChange={setOnglet}
        />
      </div>

      {onglet === "agences" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {agences.map((a) => {
            const taux = Math.round((a.present / a.employees) * 100);
            return (
              <div key={a.id} className="card card-hover p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                    <Icon name="apartment" className="text-[24px]" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">{a.name}</p>
                    <p className="text-xs text-slate-400">{a.zone}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Effectif</p>
                    <p className="text-lg font-semibold text-slate-900 tabular-nums">{a.employees}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Présence</p>
                    <p className="text-lg font-semibold text-emerald-600 tabular-nums">{taux} %</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <Table columns={colonnesDep} data={departements} rowKey={(d) => d.name} />
        </div>
      )}
    </div>
  );
}
