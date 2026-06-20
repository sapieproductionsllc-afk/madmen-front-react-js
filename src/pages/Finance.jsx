import { useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import StatTile from "../components/ui/StatTile.jsx";
import Table from "../components/ui/Table.jsx";
import Button from "../components/ui/Button.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { paie } from "../data/datasets.js";

const euro = (n) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const net = (p) => p.base + p.primes - p.avances - p.retenues;

export default function Finance() {
  const { confirm, toast } = useUI();
  const [visible, setVisible] = useState(false);

  const masque = (valeur) => (visible ? valeur : "••••");

  const masseSalariale = paie.reduce((s, p) => s + p.base + p.primes, 0);
  const totalAvances = paie.reduce((s, p) => s + p.avances, 0);
  const totalRetenues = paie.reduce((s, p) => s + p.retenues, 0);
  const totalNet = paie.reduce((s, p) => s + net(p), 0);

  const valider = (p) =>
    confirm({
      title: "Valider ce paiement ?",
      message: `Le paiement de ${p.name} (${euro(net(p))}) sera marqué comme validé et envoyé en comptabilité.`,
      confirmLabel: "Valider le paiement",
      onConfirm: () => toast(`Paiement de ${p.name} validé`),
    });

  const colonnes = [
    { key: "name", label: "Employé", render: (p) => <span className="font-medium text-ink">{p.name}</span> },
    { key: "base", label: "Salaire de base", align: "right", render: (p) => <span className="font-mono">{masque(euro(p.base))}</span> },
    { key: "primes", label: "Primes", align: "right", render: (p) => <span className="font-mono text-emerald-600">{masque(euro(p.primes))}</span> },
    { key: "avances", label: "Avances", align: "right", render: (p) => <span className="font-mono text-amber-600">{masque(p.avances ? `- ${euro(p.avances)}` : euro(0))}</span> },
    {
      key: "retenues",
      label: "Retenues",
      align: "right",
      render: (p) => (
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-rose-600">{masque(`- ${euro(p.retenues)}`)}</span>
          {p.retardRetenue > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
              <Icon name="schedule" className="text-[12px]" />
              dont {masque(euro(p.retardRetenue))} retard
            </span>
          )}
        </div>
      ),
    },
    { key: "net", label: "Net à payer", align: "right", render: (p) => <span className="font-mono font-semibold text-ink">{masque(euro(net(p)))}</span> },
    { key: "status", label: "Statut", render: (p) => <StatusPill label={p.status} tone={p.status === "Validé" ? "emerald" : "amber"} /> },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (p) =>
        p.status === "En attente" ? (
          <Button variant="ghost" size="sm" onClick={() => valider(p)}>
            Valider
          </Button>
        ) : (
          <span className="text-emerald-500"><Icon name="check_circle" className="text-[18px]" filled /></span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader title="Finance & Paie" subtitle="Salaires, avances, primes, retenues et paiements — mai 2026.">
        <Button variant="secondary" icon={visible ? "visibility_off" : "visibility"} onClick={() => setVisible((v) => !v)}>
          {visible ? "Masquer les montants" : "Afficher les montants"}
        </Button>
        <Button icon="download" onClick={() => toast("Export de la paie généré (PDF)")}>
          Exporter la paie
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile icon="account_balance_wallet" label="Masse salariale" value={masque(euro(masseSalariale))} color="indigo" />
        <StatTile icon="trending_down" label="Avances" value={masque(euro(totalAvances))} color="amber" />
        <StatTile icon="remove_circle" label="Retenues" value={masque(euro(totalRetenues))} color="rose" />
        <StatTile icon="payments" label="Net total" value={masque(euro(totalNet))} color="emerald" />
      </div>

      <div className="card">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          <Icon name="lock" className="text-rose-500 text-[18px]" />
          <p className="text-xs text-muted">
            Données sensibles — accès réservé à la <b>Comptabilité</b> et aux <b>RH</b>. Les montants sont masqués par défaut.
          </p>
        </div>
        <Table columns={colonnes} data={paie} rowKey={(p) => p.id} />
      </div>
    </div>
  );
}
