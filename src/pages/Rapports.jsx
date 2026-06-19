import { useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { rapports } from "../data/datasets.js";

const formats = [
  { id: "pdf", label: "PDF", icon: "picture_as_pdf" },
  { id: "excel", label: "Excel", icon: "table_view" },
  { id: "csv", label: "CSV", icon: "description" },
];

export default function Rapports() {
  const { toast } = useUI();
  const [exportCible, setExportCible] = useState(null);

  return (
    <div>
      <PageHeader title="Rapports & Analyses" subtitle="Générez et exportez les rapports de votre organisation.">
        <Button variant="secondary" icon="schedule">
          Rapports planifiés
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {rapports.map((r) => (
          <div key={r.title} className="card card-hover p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Icon name={r.icon} className="text-[24px]" />
              </span>
              <span className="text-xs font-medium text-slate-400">{r.periode}</span>
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">{r.title}</h3>
            <p className="text-sm text-slate-500 flex-1">{r.desc}</p>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
              <Button variant="secondary" size="sm" icon="visibility" className="flex-1" onClick={() => toast(`Aperçu : ${r.title}`, "info")}>
                Aperçu
              </Button>
              <Button size="sm" icon="download" className="flex-1" onClick={() => setExportCible(r)}>
                Exporter
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!exportCible}
        onClose={() => setExportCible(null)}
        title="Exporter le rapport"
        subtitle={exportCible?.title}
        icon="download"
      >
        <p className="text-sm text-slate-600 mb-4">Choisissez le format d'export :</p>
        <div className="grid grid-cols-3 gap-3">
          {formats.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                toast(`${exportCible.title} exporté en ${f.label}`);
                setExportCible(null);
              }}
              className="card card-hover p-4 flex flex-col items-center gap-2 text-slate-600 hover:text-brand-600"
            >
              <Icon name={f.icon} className="text-[28px]" />
              <span className="text-sm font-medium">{f.label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
