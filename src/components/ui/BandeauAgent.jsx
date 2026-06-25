import { useState, useEffect } from "react";
import Avatar from "./Avatar.jsx";
import Icon from "./Icon.jsx";
import MenuBurgerProfil from "./MenuBurgerProfil.jsx";
import { fcfa } from "../../data/datasets.js";
import { apiGet } from "../../lib/api.js";

// Fiche de paie résumée VRAIE (GET /api/employes/{id}/paie?mois=YYYY-MM) -> forme { base, primes, avances, retenues, net, status }.
// base = salaire_brut ; retenues = deduction_retard + deduction_absence ; net = salaire_net ;
// primes/avances repris du bulletin si exposés (sinon 0) ; status dérivé de paie_calculable.
function mapPaie(p) {
  if (!p) return { base: 0, primes: 0, avances: 0, retenues: 0, net: 0, status: "En attente" };
  return {
    base: Number(p.salaire_brut) || 0,
    primes: Number(p.primes) || 0,
    avances: Number(p.avances) || 0,
    retenues: (Number(p.deduction_retard) || 0) + (Number(p.deduction_absence) || 0),
    net: Number(p.salaire_net) || 0,
    status: p.paie_calculable ? "Payé" : "En attente",
  };
}

// Photo déterministe par employé (repli initiales géré par <Avatar> si hors-ligne).
const photoDe = (id) => `https://i.pravatar.cc/240?u=${encodeURIComponent(id)}`;
const dotLive = { "En activité": "bg-emerald-400", "En pause": "bg-amber-400", Absent: "bg-rose-400", Congé: "bg-sky-400" };

const focusOr = "focus:outline-none focus-visible:ring-2 focus-visible:ring-or-400 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700";

// Bandeau profil agent (vert sapin) — partagé entre la fiche Présence et la page Détails.
// Actions : Paiements · bouton fusionné détails/modification (onPlus) · menu burger (actions admin).
export default function BandeauAgent({ e, live = "Absent", tauxHoraire = 1300, onPaiements, onPlus, plusLabel = "Plus de détails", plusIcon = "chevron_right", salaireNet = null }) {
  const [showSalaire, setShowSalaire] = useState(true);

  // Infos affichées (nom / fonction / contact / salaire net du bulletin).
  const [info, setInfo] = useState({
    name: e.name || `${e.prenom ?? ""} ${e.nom ?? ""}`.trim(),
    prenom: e.prenom ?? "",
    nom: e.nom ?? "",
    fonction: e.matiere ?? e.fonction,
    department: e.department ?? "",
    email: e.email,
    phone: e.phone,
    salaire: 0, // net du bulletin (chargé depuis l'API ci-dessous)
    photo: null,
  });

  // Salaire net : fourni par le parent (profil rapide) -> AUCUNE requête. Sinon (page
  // Détails, etc.) on charge le bulletin du mois nous-même (repli).
  useEffect(() => {
    if (salaireNet != null) {
      setInfo((prev) => ({ ...prev, salaire: salaireNet }));
      return undefined;
    }
    let actif = true;
    const idPaie = e._id ?? e.id;
    if (!idPaie) return undefined;
    const moisCourant = new Date().toISOString().slice(0, 7); // AAAA-MM
    apiGet(`/api/employes/${idPaie}/paie?mois=${moisCourant}`)
      .then((p) => {
        if (actif) setInfo((prev) => ({ ...prev, salaire: mapPaie(p).net }));
      })
      .catch(() => {
        /* repli neutre : salaire reste à 0 si le bulletin est indisponible */
      });
    return () => {
      actif = false;
    };
  }, [e._id, e.id, salaireNet]);

  const showDept = info.department && !info.fonction.toLowerCase().includes(info.department.toLowerCase());

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-600 p-6 shadow-card">
      <div className="absolute -right-8 -top-10 w-44 h-44 rounded-full bg-white/5" aria-hidden="true" />
      <div className="absolute -right-16 top-16 w-44 h-44 rounded-full bg-white/5" aria-hidden="true" />
      <div className="relative flex flex-col sm:flex-row sm:items-start gap-5">
        {/* Photo circulaire + point de présence */}
        <div className="relative shrink-0 mx-auto sm:mx-0">
          <span className="block rounded-full ring-2 ring-or-400/80 ring-offset-2 ring-offset-brand-700">
            <Avatar src={info.photo || photoDe(e.id)} name={info.name} size="w-[88px] h-[88px]" textSize="text-[26px]" ring={false} />
          </span>
          <span className={`absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full border-2 border-brand-600 ${dotLive[live] ?? "bg-slate-300"}`} aria-hidden="true" />
        </div>

        {/* Identité + infos de base */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide text-ink bg-gradient-to-br from-or-300 to-or-500">
            <Icon name="work" className="text-[14px]" filled /> Agent
          </span>
          <h1 className="text-2xl font-semibold text-white tracking-tight mt-2 leading-tight break-words">{info.name}</h1>
          <p className="text-sm text-white/70 mt-0.5 truncate">
            {info.fonction}{showDept && <> · {info.department}</>} · <span className="font-mono">{e.id}</span>
          </p>

          {/* Contact + rémunération */}
          <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-1.5 text-white/85 min-w-0">
              <Icon name="mail" className="text-[16px] text-white/70 shrink-0" />
              <span className="truncate">{info.email}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-white/85">
              <Icon name="call" className="text-[16px] text-white/70 shrink-0" /> {info.phone}
            </span>
            <span className="hidden sm:inline-block w-px h-4 bg-white/15" aria-hidden="true" />
            <span className="inline-flex items-center gap-1.5 text-white/85" title="Salaire net mensuel de référence">
              <Icon name="payments" className="text-[16px] text-white/70 shrink-0" filled />
              {showSalaire ? (
                <>
                  <span className="font-semibold text-white tabular-nums">{fcfa(info.salaire)}</span> <span className="text-white/60">net/mois</span>
                </>
              ) : (
                <span className="font-semibold text-white tracking-widest">••• ••• FCFA</span>
              )}
              <button
                onClick={() => setShowSalaire((v) => !v)}
                aria-label={showSalaire ? "Masquer le salaire" : "Afficher le salaire"}
                title={showSalaire ? "Masquer le salaire" : "Afficher le salaire"}
                className={`inline-flex items-center justify-center w-6 h-6 rounded-md hover:bg-white/10 text-white/70 transition-colors ${focusOr}`}
              >
                <Icon name={showSalaire ? "visibility_off" : "visibility"} className="text-[15px]" />
              </button>
            </span>
          </div>
        </div>

        {/* Actions : Paiements + bouton fusionné (détails/modification) + menu burger */}
        <div className="flex items-center justify-center gap-2 shrink-0">
          <button onClick={onPaiements} className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold bg-or-500 text-white hover:bg-or-400 transition-colors ${focusOr}`}>
            <Icon name="payments" className="text-[18px]" filled /> Paiements
          </button>
          {onPlus && (
            <button onClick={onPlus} className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-colors ${focusOr}`}>
              <Icon name={plusIcon} className="text-[18px]" /> {plusLabel}
            </button>
          )}
          <MenuBurgerProfil e={e} />
        </div>
      </div>
    </div>
  );
}
