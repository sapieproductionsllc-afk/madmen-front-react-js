import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader.jsx";
import StatTile from "../components/ui/StatTile.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import Tabs from "../components/ui/Tabs.jsx";
import Table from "../components/ui/Table.jsx";
import Button from "../components/ui/Button.jsx";
import StatusPill from "../components/ui/StatusPill.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import Drawer from "../components/ui/Drawer.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { employes, demandeParEmploye } from "../data/datasets.js";

const tonePourStatut = { Actif: "emerald", Congé: "amber", Suspendu: "rose" };
const tonePourJour = { Présent: "emerald", Retard: "amber", Absent: "rose", Congé: "slate" };
const tonePourDemande = { Congé: "amber", Permission: "indigo", Absence: "rose" };

// Ligne d'information (coordonnées / affectation) avec lien optionnel.
function InfoRow({ icon, label, value, mono = false, href }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center shrink-0">
        <Icon name={icon} className="text-subtle text-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-subtle">{label}</p>
        {href ? (
          <a href={href} className="text-sm text-texte hover:text-brand-500 transition-colors truncate block">
            {value}
          </a>
        ) : (
          <p className={`text-sm text-texte truncate ${mono ? "font-mono" : ""}`}>{value}</p>
        )}
      </div>
    </div>
  );
}

// Ligne d'une statistique du pointage du jour.
function JourRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm text-texte text-right">{children}</span>
    </div>
  );
}

export default function Employes() {
  const { openAddEmployee, confirm, toast } = useUI();
  const navigate = useNavigate();
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("Tous");
  const [detail, setDetail] = useState(null);
  const [traitees, setTraitees] = useState({}); // demandeId → "Approuvée" | "Refusée"
  const [motifsSusp, setMotifsSusp] = useState({}); // employeId → motif de suspension

  const liste = useMemo(() => {
    return employes.filter((e) => {
      const okStatut = filtre === "Tous" || e.status === filtre;
      const okRecherche =
        !recherche ||
        e.name.toLowerCase().includes(recherche.toLowerCase()) ||
        e.id.toLowerCase().includes(recherche.toLowerCase()) ||
        e.fonction.toLowerCase().includes(recherche.toLowerCase());
      return okStatut && okRecherche;
    });
  }, [recherche, filtre]);

  const compte = (s) => employes.filter((e) => e.status === s).length;

  const suspendre = (emp) =>
    confirm({
      title: "Suspendre cet employé ?",
      message: `Le compte de ${emp.name} sera suspendu et son accès aux postes bloqué. Indiquez le motif : il sera conservé pour mémoire.`,
      confirmLabel: "Suspendre",
      danger: true,
      input: {
        label: "Motif de la suspension",
        placeholder: "Ex. : enquête interne, absences répétées non justifiées…",
        required: true,
      },
      onConfirm: (raison) => {
        setMotifsSusp((m) => ({ ...m, [emp.id]: raison }));
        toast(`${emp.name} a été suspendu`, "info");
      },
    });

  const approuver = (emp, d) =>
    confirm({
      title: `Approuver la demande de ${d.type.toLowerCase()} ?`,
      message: `${emp.name} — ${d.periode}. L'employé sera notifié de l'accord.`,
      confirmLabel: "Approuver",
      onConfirm: () => {
        setTraitees((s) => ({ ...s, [d.id]: "Approuvée" }));
        toast(`Demande de ${d.type.toLowerCase()} approuvée pour ${emp.name}`);
      },
    });

  const refuser = (emp, d) =>
    confirm({
      title: `Refuser la demande de ${d.type.toLowerCase()} ?`,
      message: `${emp.name} — ${d.periode}. L'employé sera notifié du refus.`,
      confirmLabel: "Refuser",
      danger: true,
      onConfirm: () => {
        setTraitees((s) => ({ ...s, [d.id]: "Refusée" }));
        toast("Demande refusée", "info");
      },
    });

  const annulerDecision = (d) => {
    setTraitees((s) => {
      const next = { ...s };
      delete next[d.id];
      return next;
    });
    toast("Décision annulée — demande remise en attente", "info");
  };

  const colonnes = [
    {
      key: "name",
      label: "Employé",
      sortAccessor: (e) => e.name,
      render: (e) => (
        <div className="flex items-center gap-3">
          <Avatar name={e.name} size="w-8 h-8" />
          <div>
            <p className="text-sm font-medium text-ink">{e.name}</p>
            <p className="text-xs text-subtle font-mono">{e.id}</p>
          </div>
        </div>
      ),
    },
    { key: "fonction", label: "Fonction", render: (e) => <span className="text-texte">{e.fonction}</span> },
    { key: "agence", label: "Agence", render: (e) => <span className="text-texte">{e.agence}</span> },
    {
      key: "today",
      label: "Aujourd'hui",
      sortable: false,
      render: (e) => <StatusPill label={e.today.statut} tone={tonePourJour[e.today.statut] ?? "slate"} />,
    },
    { key: "status", label: "Statut", render: (e) => <StatusPill label={e.status} tone={tonePourStatut[e.status]} /> },
    {
      key: "actions",
      label: "",
      align: "right",
      sortable: false,
      render: (e) => {
        const d = demandeParEmploye[e.id];
        const enAttente = d && !traitees[d.id];
        return (
          <div className="flex items-center justify-end gap-1">
            {enAttente && (
              <span title={`Demande de ${d.type.toLowerCase()} en attente`} className="flex items-center text-brand-500 mr-0.5">
                <Icon name="pending_actions" className="text-[18px]" filled />
              </span>
            )}
            <button
              onClick={(ev) => {
                ev.stopPropagation();
                suspendre(e);
              }}
              className="text-subtle hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1.5 transition-colors"
              title="Suspendre"
            >
              <Icon name="block" className="text-[18px]" />
            </button>
            <Icon name="chevron_right" className="text-subtle text-[20px]" />
          </div>
        );
      },
    },
  ];

  const t = detail?.today;

  return (
    <div>
      <PageHeader title="Employés" subtitle={`${employes.length} employés enregistrés`}>
        <Button variant="secondary" icon="download">
          Exporter
        </Button>
        <Button variant="secondary" icon="fingerprint" onClick={() => navigate("/enrolement")}>
          Enrôler
        </Button>
        <Button icon="person_add" onClick={openAddEmployee}>
          Ajouter un employé
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile icon="groups" label="Total" value={employes.length} color="indigo" />
        <StatTile icon="how_to_reg" label="Actifs" value={compte("Actif")} color="emerald" />
        <StatTile icon="beach_access" label="En congé" value={compte("Congé")} color="amber" />
        <StatTile icon="block" label="Suspendus" value={compte("Suspendu")} color="rose" />
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-border">
          <Tabs
            tabs={[
              { label: "Tous", value: "Tous" },
              { label: "Actifs", value: "Actif" },
              { label: "Congé", value: "Congé" },
              { label: "Suspendus", value: "Suspendu" },
            ]}
            active={filtre}
            onChange={setFiltre}
          />
          <SearchInput value={recherche} onChange={setRecherche} placeholder="Rechercher un employé…" className="sm:w-72" />
        </div>
        <Table
          columns={colonnes}
          data={liste}
          rowKey={(e) => e.id}
          onRowClick={(e) => setDetail(e)}
          sortable
          minWidth={820}
          emptyLabel="Aucun employé ne correspond."
        />
      </div>

      {/* Fiche employé (panneau latéral) */}
      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Fiche employé"
        subtitle={detail?.id}
        icon="badge"
        footer={
          detail ? (
            <>
              <Button
                variant="secondary"
                icon="event_available"
                onClick={() => {
                  navigate("/presence");
                  setDetail(null);
                }}
              >
                Voir le pointage
              </Button>
              {detail.status !== "Suspendu" && (
                <Button variant="danger-soft" icon="block" onClick={() => suspendre(detail)}>
                  Suspendre
                </Button>
              )}
            </>
          ) : null
        }
      >
        {detail && (
          <div className="space-y-6">
            {/* Héros */}
            <div className="flex flex-col items-center text-center pb-6 border-b border-border">
              <Avatar name={detail.name} size="w-20 h-20" className="text-xl" />
              <p className="mt-3 text-lg font-semibold text-ink">{detail.name}</p>
              <p className="text-sm text-muted">{detail.fonction}</p>
              <div className="mt-3">
                <StatusPill label={detail.status} tone={tonePourStatut[detail.status]} />
              </div>
            </div>

            {/* Motif de suspension (conservé pour mémoire) */}
            {motifsSusp[detail.id] && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/[0.06] p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon name="block" className="text-rose-600 text-[18px]" filled />
                  <span className="text-sm font-semibold text-ink">Motif de la suspension</span>
                </div>
                <p className="text-sm text-texte">{motifsSusp[detail.id]}</p>
              </div>
            )}

            {/* Demande en attente d'accord */}
            {(() => {
              const d = demandeParEmploye[detail.id];
              if (!d) return null;
              const etat = traitees[d.id];
              return (
                <div className="rounded-xl border border-brand-600/30 bg-brand-500/[0.06] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="pending_actions" className="text-brand-500 text-[20px]" filled />
                    <span className="text-sm font-semibold text-ink">Demande en attente</span>
                    <span className="ml-auto">
                      <StatusPill label={d.type} tone={tonePourDemande[d.type] ?? "indigo"} dot={false} />
                    </span>
                  </div>
                  {etat ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Icon
                          name={etat === "Approuvée" ? "check_circle" : "cancel"}
                          filled
                          className={`text-[18px] ${etat === "Approuvée" ? "text-emerald-600" : "text-rose-600"}`}
                        />
                        <span className={etat === "Approuvée" ? "text-emerald-600" : "text-rose-600"}>
                          Demande {etat.toLowerCase()}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" icon="undo" onClick={() => annulerDecision(d)}>
                        Annuler
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between gap-3">
                          <span className="text-muted shrink-0">Période</span>
                          <span className="text-texte text-right">{d.periode}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-muted shrink-0">Motif</span>
                          <span className="text-texte text-right">{d.motif}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-muted shrink-0">Soumise le</span>
                          <span className="text-texte text-right">{d.soumisLe}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="primary" size="sm" icon="check" className="flex-1" onClick={() => approuver(detail, d)}>
                          Approuver
                        </Button>
                        <Button variant="danger-soft" size="sm" icon="close" className="flex-1" onClick={() => refuser(detail, d)}>
                          Refuser
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* Pointage du jour */}
            <div>
              <p className="kicker mb-3">Pointage du jour</p>
              <div className="rounded-xl bg-surface-2 border border-border p-4 space-y-3">
                <JourRow label="Statut">
                  <StatusPill label={t.statut} tone={tonePourJour[t.statut] ?? "slate"} dot={false} />
                </JourRow>
                <JourRow label="Horaire prévu">
                  <span className="font-mono">{t.prevu}</span>
                </JourRow>
                <JourRow label="Arrivée">
                  <span className="font-mono">{t.arrivee}</span>
                  {t.retardMin > 0 && <span className="text-amber-600"> (+{t.retardMin} min)</span>}
                </JourRow>
                {t.retenue > 0 && (
                  <JourRow label="Retenue">
                    <span className="font-mono text-rose-600">−{t.retenue} €</span>
                  </JourRow>
                )}
                <JourRow label="Poste">
                  <span className="font-mono text-xs">{t.poste}</span>
                </JourRow>
                {t.justification && (
                  <JourRow label="Justification">
                    <span className={t.justification.statut === "Justifié" ? "text-emerald-600" : "text-amber-600"}>
                      {t.justification.statut}
                      {t.justification.motif ? ` · ${t.justification.motif}` : ""}
                    </span>
                  </JourRow>
                )}
              </div>
            </div>

            {/* Coordonnées */}
            <div>
              <p className="kicker mb-1.5">Coordonnées</p>
              <InfoRow icon="mail" label="Email" value={detail.email} href={`mailto:${detail.email}`} />
              <InfoRow icon="call" label="Téléphone" value={detail.phone} href={`tel:${detail.phone.replace(/\s/g, "")}`} />
            </div>

            {/* Affectation */}
            <div>
              <p className="kicker mb-1.5">Affectation</p>
              <InfoRow icon="badge" label="Matricule" value={detail.id} mono />
              <InfoRow icon="domain" label="Département" value={detail.department} />
              <InfoRow icon="apartment" label="Agence" value={detail.agence} />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
