import { useEffect, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import Modal from "../components/ui/Modal.jsx";
import { Input, Field as Champ } from "../components/ui/Input.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";
import { apiGet, apiPost } from "../lib/api.js";

// Pastille d'état du poste (aligné sur l'ENUM SQL poste_travail.statut).
const STATUT_META = {
  libre:      { label: "Libre",      cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  occupe:     { label: "Occupé",     cls: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500" },
  verrouille: { label: "Verrouillé", cls: "bg-rose-50 text-rose-700 border-rose-200",          dot: "bg-rose-500" },
  hors_ligne: { label: "Hors ligne", cls: "bg-slate-100 text-slate-600 border-slate-200",      dot: "bg-slate-400" },
};

const formVide = { code: "", nom: "", adresse_ip: "" };

export default function Postes() {
  const { toast } = useUI();
  const [postes, setPostes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [form, setForm] = useState(formVide);
  const [enCours, setEnCours] = useState(false);
  const [erreurForm, setErreurForm] = useState(null);

  const charger = () => {
    setChargement(true);
    apiGet("/api/postes")
      .then((data) => setPostes(Array.isArray(data) ? data : []))
      .catch((e) => setErreur(e.message || "Erreur de chargement"))
      .finally(() => setChargement(false));
  };
  useEffect(() => { charger(); }, []);

  const maj = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const codeValide = form.code.trim().length > 0;

  const ouvrirAjout = () => { setForm(formVide); setErreurForm(null); setAjoutOuvert(true); };

  const creer = async () => {
    if (!codeValide || enCours) return;
    setEnCours(true);
    setErreurForm(null);
    try {
      await apiPost("/api/postes", {
        code: form.code.trim(),
        nom: form.nom.trim() || null,
        adresse_ip: form.adresse_ip.trim() || null,
      });
      toast(`Poste « ${form.code.trim()} » créé`);
      setAjoutOuvert(false);
      setForm(formVide);
      charger();
    } catch (e) {
      setErreurForm(e.message || "Création impossible");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      <PageHeader title="Postes de travail" subtitle="Les postes (PC) que les agents peuvent ouvrir avec leur code PIN.">
        <Button icon="add" onClick={ouvrirAjout}>Ajouter un poste</Button>
      </PageHeader>

      {chargement ? (
        <div className="card py-16 text-center">
          <Icon name="progress_activity" className="text-faint text-[40px] animate-spin" />
          <p className="mt-2 text-sm text-muted">Chargement des postes…</p>
        </div>
      ) : erreur ? (
        <div className="card py-16 text-center">
          <Icon name="error" className="text-rose-500 text-[40px]" />
          <p className="mt-2 text-sm text-muted">{erreur}</p>
        </div>
      ) : postes.length === 0 ? (
        <div className="card py-16 text-center">
          <Icon name="desktop_windows" className="text-faint text-[40px]" />
          <p className="mt-2 text-sm text-muted">Aucun poste pour l'instant.</p>
          <Button className="mt-4" icon="add" onClick={ouvrirAjout}>Créer le premier poste</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {postes.map((p) => {
            const meta = STATUT_META[p.statut] ?? STATUT_META.hors_ligne;
            return (
              <div key={p.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                      <Icon name="desktop_windows" className="text-[22px]" filled />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-texte truncate">{p.nom || p.code}</p>
                      <p className="text-xs text-muted font-mono truncate">{p.code}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full border ${meta.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                </div>
                {p.adresse_ip && (
                  <p className="mt-3 text-xs text-subtle flex items-center gap-1.5">
                    <Icon name="lan" className="text-[15px]" /> {p.adresse_ip}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modale de création de poste */}
      <Modal
        open={ajoutOuvert}
        onClose={() => setAjoutOuvert(false)}
        title="Ajouter un poste"
        subtitle="Le « code » identifie le poste côté kiosque (ex. PC-01)."
        icon="add_box"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAjoutOuvert(false)}>Annuler</Button>
            <Button onClick={creer} disabled={!codeValide || enCours} icon={enCours ? "progress_activity" : "check"}>
              {enCours ? "Création…" : "Créer le poste"}
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
          <Champ label="Code du poste *" className="sm:col-span-2">
            <Input value={form.code} onChange={maj("code")} placeholder="Ex. PC-01" />
          </Champ>
          <Champ label="Nom (facultatif)">
            <Input value={form.nom} onChange={maj("nom")} placeholder="Ex. Accueil" />
          </Champ>
          <Champ label="Adresse IP (facultatif)">
            <Input value={form.adresse_ip} onChange={maj("adresse_ip")} placeholder="Ex. 192.168.1.50" />
          </Champ>
        </div>

        <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-brand-50 border border-brand-100 p-3.5">
          <Icon name="info" className="text-brand-600 text-[20px]" filled />
          <p className="text-xs text-brand-700">
            Le <b>code</b> doit être identique à celui configuré sur le kiosque (app Watchmen) du poste. N'importe quel agent <b>pointé présent</b> pourra ensuite l'ouvrir avec son code PIN.
          </p>
        </div>
      </Modal>
    </div>
  );
}
