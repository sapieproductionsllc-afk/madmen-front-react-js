import { useEffect, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import Modal from "../components/ui/Modal.jsx";
import { Input, Field as Champ } from "../components/ui/Input.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { apiGet, apiPost, apiDelete } from "../lib/api.js";

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

// "2026-05-14" -> "jeu. 14 mai 2026"
function formatDate(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${JOURS[dt.getDay()]} ${d} ${MOIS[m - 1]} ${y}`;
}

const anneeCourante = new Date().getFullYear();

// Gestion des jours fériés : payés, jamais comptés comme absence dans la paie.
export default function JoursFeries({ embedded = false }) {
  const { toast, confirm } = useUI();
  const [annee, setAnnee] = useState(anneeCourante);
  const [feries, setFeries] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState({ date: "", libelle: "" });
  const [enCours, setEnCours] = useState(false);
  const [erreurForm, setErreurForm] = useState(null);

  const charger = (an) => {
    setChargement(true);
    setErreur(null);
    apiGet(`/api/jours-feries?annee=${an}`)
      .then((data) => setFeries(Array.isArray(data) ? data : []))
      .catch((e) => setErreur(e.message || "Erreur de chargement"))
      .finally(() => setChargement(false));
  };
  useEffect(() => { charger(annee); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [annee]);

  const maj = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valide = /^\d{4}-\d{2}-\d{2}$/.test(form.date) && form.libelle.trim().length > 0;

  const ouvrirAjout = () => { setForm({ date: "", libelle: "" }); setErreurForm(null); setOuvert(true); };

  const creer = async () => {
    if (!valide || enCours) return;
    setEnCours(true);
    setErreurForm(null);
    try {
      await apiPost("/api/jours-feries", { date: form.date, libelle: form.libelle.trim() });
      toast(`Jour férié « ${form.libelle.trim()} » ajouté`);
      setOuvert(false);
      const anAjout = Number(form.date.slice(0, 4));
      if (anAjout !== annee) setAnnee(anAjout); // bascule sur l'année du férié ajouté
      else charger(annee);
    } catch (e) {
      setErreurForm(e.message || "Ajout impossible");
    } finally {
      setEnCours(false);
    }
  };

  const supprimer = (f) => {
    confirm({
      title: "Supprimer ce jour férié ?",
      message: `${f.libelle} — ${formatDate(f.date)}.`,
      danger: true,
      confirmLabel: "Supprimer",
      onConfirm: async () => {
        try { await apiDelete(`/api/jours-feries/${f.id}`); toast("Jour férié supprimé"); charger(annee); }
        catch (e) { toast(e.message || "Suppression impossible", "error"); }
      },
    });
  };

  return (
    <div className={embedded ? "space-y-5" : "space-y-5 pb-12"}>
      {embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">Les jours fériés sont payés et ne comptent jamais comme absence dans la paie.</p>
          <Button icon="add" onClick={ouvrirAjout}>Ajouter un jour férié</Button>
        </div>
      ) : (
        <PageHeader title="Jours fériés" subtitle="Les jours fériés sont payés et ne comptent jamais comme absence dans la paie.">
          <Button icon="add" onClick={ouvrirAjout}>Ajouter un jour férié</Button>
        </PageHeader>
      )}

      {/* Sélecteur d'année */}
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => setAnnee((a) => a - 1)} className="w-9 h-9 rounded-lg border border-border bg-surface hover:bg-surface-2 flex items-center justify-center text-muted transition-colors" aria-label="Année précédente">
          <Icon name="chevron_left" className="text-[20px]" />
        </button>
        <span className="text-lg font-bold tabular-nums text-ink min-w-[5rem] text-center">{annee}</span>
        <button onClick={() => setAnnee((a) => a + 1)} className="w-9 h-9 rounded-lg border border-border bg-surface hover:bg-surface-2 flex items-center justify-center text-muted transition-colors" aria-label="Année suivante">
          <Icon name="chevron_right" className="text-[20px]" />
        </button>
      </div>

      {chargement ? (
        <div className="card py-16 text-center">
          <Icon name="progress_activity" className="text-faint text-[40px] animate-spin" />
          <p className="mt-2 text-sm text-muted">Chargement…</p>
        </div>
      ) : erreur ? (
        <div className="card py-16 text-center">
          <Icon name="error" className="text-rose-500 text-[40px]" />
          <p className="mt-2 text-sm text-muted">{erreur}</p>
        </div>
      ) : feries.length === 0 ? (
        <div className="card py-16 text-center">
          <Icon name="event_busy" className="text-faint text-[40px]" />
          <p className="mt-2 text-sm text-muted">Aucun jour férié pour {annee}.</p>
          <Button className="mt-4" icon="add" onClick={ouvrirAjout}>Ajouter un jour férié</Button>
        </div>
      ) : (
        <div className="card divide-y divide-border">
          {feries.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex flex-col items-center justify-center shrink-0 leading-none">
                  <span className="text-[16px] font-bold tabular-nums">{Number(String(f.date).slice(8, 10))}</span>
                  <span className="text-[9px] uppercase tracking-wide">{MOIS[Number(String(f.date).slice(5, 7)) - 1]}</span>
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-texte truncate">{f.libelle}</p>
                  <p className="text-xs text-muted">{formatDate(f.date)}</p>
                </div>
              </div>
              <button onClick={() => supprimer(f)} title="Supprimer" aria-label="Supprimer" className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0">
                <Icon name="delete" className="text-[18px]" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modale d'ajout */}
      <Modal
        open={ouvert}
        onClose={() => setOuvert(false)}
        title="Ajouter un jour férié"
        subtitle="Date + nom. Il sera payé et exclu des absences."
        icon="event"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOuvert(false)}>Annuler</Button>
            <Button onClick={creer} disabled={!valide || enCours} icon={enCours ? "progress_activity" : "check"}>
              {enCours ? "Ajout…" : "Ajouter"}
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
          <Champ label="Date *">
            <Input type="date" value={form.date} onChange={maj("date")} />
          </Champ>
          <Champ label="Nom du jour férié *">
            <Input value={form.libelle} onChange={maj("libelle")} placeholder="Ex. Fête de l'Indépendance" />
          </Champ>
        </div>
      </Modal>
    </div>
  );
}
