import { useMemo, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import CartePaie from "../components/ui/CartePaie.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { employes, fcfa } from "../data/datasets.js";
import { paieDetail } from "../data/profil.js";

// Statut de paiement par agent (le reste = « Payé »).
const STATUT = { "AUR-7720": "En attente", "AUR-5567": "En attente", "AUR-2241": "En attente", "AUR-1190": "En retard" };

const lignes = employes.map((e) => ({ e, f: paieDetail(e.id), statut: STATUT[e.id] ?? "Payé" }));

const onglets = [
  { key: "Tous", label: "Tous", tone: "bg-brand-600" },
  { key: "Payé", label: "Payés", tone: "bg-emerald-500" },
  { key: "En attente", label: "En attente", tone: "bg-amber-500" },
  { key: "En retard", label: "En retard", tone: "bg-rose-500" },
];

export default function Finance() {
  const { confirm, toast } = useUI();
  const [q, setQ] = useState("");
  const [filtre, setFiltre] = useState("Tous");

  const compte = (k) => (k === "Tous" ? lignes.length : lignes.filter((l) => l.statut === k).length);

  const masseSalariale = lignes.reduce((s, l) => s + l.f.base + l.f.primes, 0);
  const totalAvances = lignes.reduce((s, l) => s + l.f.avances, 0);
  const totalRetenues = lignes.reduce((s, l) => s + l.f.retenues, 0);
  const aPayer = lignes.filter((l) => l.statut !== "Payé").reduce((s, l) => s + l.f.net, 0);

  const liste = useMemo(() => {
    const t = q.trim().toLowerCase();
    return lignes.filter((l) => {
      const okQ = !t || l.e.name.toLowerCase().includes(t) || l.e.id.toLowerCase().includes(t) || l.e.fonction.toLowerCase().includes(t);
      const okF = filtre === "Tous" || l.statut === filtre;
      return okQ && okF;
    });
  }, [q, filtre]);

  const payer = (e, f) =>
    confirm({
      title: "Valider ce paiement ?",
      message: `Le paiement de ${e.name} (${fcfa(f.net)}) sera marqué comme payé et envoyé en comptabilité.`,
      confirmLabel: "Valider le paiement",
      onConfirm: () => toast(`Paiement de ${e.name} validé`, "success"),
    });
  const bulletin = (e) => toast(`Bulletin de paie de ${e.name} généré (PDF)`, "info");

  const kpis = [
    { label: "Masse salariale", value: fcfa(masseSalariale), icon: "account_balance_wallet", tone: "or" },
    { label: "À payer", value: fcfa(aPayer), icon: "schedule", tone: "amber" },
    { label: "Avances", value: fcfa(totalAvances), icon: "trending_down", tone: "sky" },
    { label: "Retenues", value: fcfa(totalRetenues), icon: "remove_circle", tone: "rose" },
  ];
  const tonesKpi = {
    or: "bg-or-100 text-or-700",
    amber: "bg-amber-50 text-amber-600",
    sky: "bg-sky-50 text-sky-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="space-y-5 pb-12">
      <PageHeader title="Paiements" subtitle="Gestion des paiements des employés — mai 2026.">
        <Button icon="download" onClick={() => toast("Export de la paie généré (PDF)", "info")}>
          Enregistrer
        </Button>
      </PageHeader>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4 flex items-center gap-3">
            <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tonesKpi[k.tone]}`}>
              <Icon name={k.icon} className="text-[22px]" filled />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-ink tabular-nums font-mono leading-none truncate">{k.value}</p>
              <p className="text-xs text-muted mt-1">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Onglets statut + recherche */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 overflow-x-auto scroll-thin pb-1 sm:pb-0">
          {onglets.map((o) => (
            <button
              key={o.key}
              onClick={() => setFiltre(o.key)}
              className={`shrink-0 inline-flex items-center gap-2 pl-3 pr-2 h-9 rounded-full text-sm whitespace-nowrap border transition-colors ${
                filtre === o.key ? "bg-brand-600 text-canvas border-brand-600" : "bg-surface text-muted border-border hover:border-border-strong hover:text-texte"
              }`}
            >
              {o.label}
              <span className={`text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded-full ${filtre === o.key ? "bg-canvas/20 text-canvas" : "bg-surface-2 text-texte"}`}>
                {compte(o.key)}
              </span>
            </button>
          ))}
        </div>
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher un agent…" className="sm:ml-auto sm:w-72" />
      </div>

      {/* Grille de cartes financières */}
      {liste.length === 0 ? (
        <div className="card py-16 text-center">
          <Icon name="search_off" className="text-faint text-[40px]" />
          <p className="mt-2 text-sm text-muted">Aucun paiement ne correspond.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
          {liste.map((l) => (
            <CartePaie key={l.e.id} e={l.e} f={l.f} statut={l.statut} onPayer={payer} onBulletin={bulletin} />
          ))}
        </div>
      )}
    </div>
  );
}
