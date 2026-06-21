import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar.jsx";
import Icon from "./Icon.jsx";
import { useUI } from "./UIProvider.jsx";
import { fcfa } from "../../data/datasets.js";
import { paieDetail } from "../../data/profil.js";

// Photo déterministe par employé (repli initiales géré par <Avatar> si hors-ligne).
const photoDe = (id) => `https://i.pravatar.cc/240?u=${encodeURIComponent(id)}`;
const dotLive = { "En activité": "bg-emerald-400", "En pause": "bg-amber-400", Absent: "bg-rose-400", Congé: "bg-sky-400" };

const focusOr = "focus:outline-none focus-visible:ring-2 focus-visible:ring-or-400 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700";

// Bandeau profil agent (vert sapin) — partagé entre la fiche Présence et la page Détails.
export default function BandeauAgent({ e, live = "Absent", tauxHoraire = 1300, onPaiements, onPlus, plusLabel = "Plus de détails", plusIcon = "chevron_right" }) {
  const { toast } = useUI();
  const navigate = useNavigate();
  const [showSalaire, setShowSalaire] = useState(true);
  const salaire = paieDetail(e.id).net;

  // Évite la redondance "Responsable Cybersécurité · Cybersécurité".
  const role = e.matiere ?? e.fonction;
  const showDept = e.department && !role.toLowerCase().includes(e.department.toLowerCase());

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-600 p-6 shadow-card">
      <div className="absolute -right-8 -top-10 w-44 h-44 rounded-full bg-white/5" aria-hidden="true" />
      <div className="absolute -right-16 top-16 w-44 h-44 rounded-full bg-white/5" aria-hidden="true" />
      <div className="relative flex flex-col sm:flex-row sm:items-start gap-5">
        {/* Photo circulaire + point de présence */}
        <div className="relative shrink-0 mx-auto sm:mx-0">
          <span className="block rounded-full ring-2 ring-or-400/80 ring-offset-2 ring-offset-brand-700">
            <Avatar src={photoDe(e.id)} name={e.name} size="w-[88px] h-[88px]" textSize="text-[26px]" ring={false} />
          </span>
          <span className={`absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full border-2 border-brand-600 ${dotLive[live] ?? "bg-slate-300"}`} aria-hidden="true" />
        </div>

        {/* Identité + infos de base */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide text-ink bg-gradient-to-br from-or-300 to-or-500">
            <Icon name="work" className="text-[14px]" filled /> Agent
          </span>
          <h1 className="text-2xl font-semibold text-white tracking-tight mt-2 leading-tight break-words">{e.name}</h1>
          <p className="text-sm text-white/70 mt-0.5 truncate">
            {role}{showDept && <> · {e.department}</>} · <span className="font-mono">{e.id}</span>
          </p>

          {/* Contact + paramètres + rémunération */}
          <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-1.5 text-white/85 min-w-0">
              <Icon name="mail" className="text-[16px] text-white/70 shrink-0" />
              <span className="truncate">{e.email}</span>
            </span>
            <button
              onClick={() => navigate("/parametres")}
              aria-label="Paramètres"
              title="Paramètres"
              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors shrink-0 ${focusOr}`}
            >
              <Icon name="settings" className="text-[16px]" />
            </button>
            <span className="inline-flex items-center gap-1.5 text-white/85">
              <Icon name="call" className="text-[16px] text-white/70 shrink-0" /> {e.phone}
            </span>
            <span className="hidden sm:inline-block w-px h-4 bg-white/15" aria-hidden="true" />
            <span className="inline-flex items-center gap-1.5 text-white/85" title="Salaire net mensuel de référence">
              <Icon name="payments" className="text-[16px] text-white/70 shrink-0" filled />
              {showSalaire ? (
                <>
                  <span className="font-semibold text-white tabular-nums">{fcfa(salaire)}</span> <span className="text-white/60">net/mois</span>
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

        {/* Actions */}
        <div className="flex items-center justify-center gap-2 shrink-0">
          <button onClick={onPaiements} className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold bg-or-500 text-ink hover:bg-or-400 transition-colors ${focusOr}`}>
            <Icon name="payments" className="text-[18px]" filled /> Paiements
          </button>
          <button onClick={() => toast(`Message à ${e.name}`, "info")} aria-label="Message" title="Message" className={`w-10 h-10 inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors ${focusOr}`}>
            <Icon name="mail" className="text-[18px]" />
          </button>
          <button onClick={onPlus} className={`inline-flex items-center gap-1 h-10 px-3.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/15 text-white/90 border border-white/15 transition-colors ${focusOr}`}>
            {plusLabel} <Icon name={plusIcon} className="text-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
