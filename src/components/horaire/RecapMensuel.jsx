import Icon from "../ui/Icon.jsx";
import { fcfa } from "../../data/datasets.js";

// Formate des secondes -> "Xh YYm" (ou "—" si nul).
function dureeH(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  if (!s) return "0 h";
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

// Dérive le récap depuis le bulletin de paie. Priorité au bloc `recap_heures`
// si le backend le fournit ; sinon on agrège le tableau `detail[]` + champs heures.
function deriverRecap(paie) {
  if (!paie) return null;

  // 1) Bloc dédié fourni par le backend (forme attendue ci-dessous).
  const r = paie.recap_heures || paie.recap || null;

  const detail = Array.isArray(paie.detail) ? paie.detail : [];
  const compte = (status) => detail.filter((d) => d.status === status).length;

  // États journaliers : PRESENT / LATE / ABSENT / FERIE / EXTRA (+ CONGE si exposé).
  const presents = compte("PRESENT");
  const retards = compte("LATE");
  const absents = compte("ABSENT");
  const feries = compte("FERIE");
  const conges = compte("CONGE") + compte("CONGE_PAYE");

  // Secondes -> on convertit en heures pour l'affichage.
  const secTravaille = Number(paie.temps_total_travaille_sec) || 0;
  const secTheorique = Number(paie.temps_theorique_mensuel_sec) || 0;
  const secSup =
    Number(paie.temps_heures_sup_sec ?? paie.heures_sup_sec) ||
    Math.max(0, secTravaille - secTheorique);

  // Retenues (retard + absence + manuelles) — même logique que la page Paiement.
  const retenues =
    (Number(paie.retenues) || 0) +
    (Number(paie.deduction_retard) || 0) +
    (Number(paie.deduction_absence) || 0);

  return {
    heuresNormalesSec: r?.heures_normales_sec ?? Math.min(secTravaille, secTheorique || secTravaille),
    heuresSupSec: r?.heures_sup_sec ?? secSup,
    heuresTheoriquesSec: r?.heures_theoriques_sec ?? secTheorique,
    heuresTravailleesSec: r?.heures_travaillees_sec ?? secTravaille,
    presents: r?.jours_present ?? presents,
    retards: r?.jours_retard ?? retards,
    absents: r?.jours_absent ?? absents,
    conges: r?.jours_conge ?? conges,
    feries: r?.jours_ferie ?? feries,
    retenues: r?.retenues ?? retenues,
  };
}

function CarteStat({ icon, tone, value, label, sub }) {
  return (
    <div className={`rounded-xl border px-4 py-3.5 ${tone}`}>
      <div className="flex items-center justify-between gap-2">
        <Icon name={icon} className="text-[20px] opacity-80" filled />
        <span className="text-2xl font-bold tabular-nums leading-none">{value}</span>
      </div>
      <p className="text-xs font-medium mt-2 opacity-80">{label}</p>
      {sub != null && <p className="text-[11px] opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

// Récap mensuel des heures AVANT validation paie.
// `paie` = bulletin GET /api/employes/{id}/paie?mois=AAAA-MM. `moisLabel` : libellé affiché.
export default function RecapMensuel({ paie, moisLabel, onValiderPaie }) {
  const r = deriverRecap(paie);

  if (!r) {
    return (
      <div className="card p-5">
        <div className="py-10 text-center">
          <Icon name="summarize" className="text-faint text-[32px]" />
          <p className="mt-2 text-sm text-muted">Aucune donnée de paie pour ce mois.</p>
        </div>
      </div>
    );
  }

  const net = Number(paie?.salaire_net) || 0;
  const brut = Number(paie?.salaire_brut) || 0;

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Icon name="summarize" className="text-[18px]" filled />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-ink">Récapitulatif des heures</h3>
            <p className="text-xs text-muted">{moisLabel || "Mois en cours"} · à vérifier avant la paie</p>
          </div>
        </div>
        {onValiderPaie && (
          <button
            onClick={onValiderPaie}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Icon name="payments" className="text-[18px]" />
            Aller à la paie
          </button>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Heures */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <CarteStat
            icon="schedule"
            tone="bg-brand-50 border-brand-100 text-brand-700"
            value={dureeH(r.heuresNormalesSec)}
            label="Heures normales"
            sub={`Théorique ${dureeH(r.heuresTheoriquesSec)}`}
          />
          <CarteStat
            icon="more_time"
            tone="bg-or-100/60 border-or-200 text-or-700"
            value={dureeH(r.heuresSupSec)}
            label="Heures sup."
            sub="Au-delà du théorique"
          />
          <CarteStat
            icon="timer"
            tone="bg-emerald-50 border-emerald-100 text-emerald-700"
            value={dureeH(r.heuresTravailleesSec)}
            label="Total travaillé"
            sub="Heures réelles pointées"
          />
          <CarteStat
            icon="account_balance_wallet"
            tone="bg-rose-50 border-rose-100 text-rose-700"
            value={fcfa(r.retenues)}
            label="Retenues"
            sub="Retards + absences"
          />
        </div>

        {/* Jours */}
        <div>
          <p className="text-[11px] font-medium text-subtle uppercase tracking-wide mb-2">Jours du mois</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            <CarteStat icon="check_circle" tone="bg-emerald-50 border-emerald-100 text-emerald-700" value={r.presents} label="Présents" />
            <CarteStat icon="schedule" tone="bg-amber-50 border-amber-100 text-amber-700" value={r.retards} label="Retards" />
            <CarteStat icon="cancel" tone="bg-rose-50 border-rose-100 text-rose-700" value={r.absents} label="Absences" />
            <CarteStat icon="beach_access" tone="bg-sky-50 border-sky-100 text-sky-700" value={r.conges} label="Congés" />
            <CarteStat icon="flag" tone="bg-slate-50 border-slate-200 text-slate-700" value={r.feries} label="Fériés" />
          </div>
        </div>

        {/* Bulletin (brut/net) */}
        <div className="rounded-xl bg-surface-2/60 border border-border px-4 py-3.5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Icon name="receipt_long" className="text-muted text-[20px]" />
            <span className="text-sm text-muted">Estimation du bulletin</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[11px] text-subtle">Brut</p>
              <p className="text-sm font-mono tabular-nums font-semibold text-texte">{fcfa(brut)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-subtle">Net estimé</p>
              <p className="text-lg font-mono tabular-nums font-bold text-ink">{fcfa(net)}</p>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-faint flex items-center gap-1.5">
          <Icon name="info" className="text-[14px]" />
          Les congés approuvés ne sont pas comptés comme absences. Vérifiez ce récap avant de valider la paie.
        </p>
      </div>
    </div>
  );
}
