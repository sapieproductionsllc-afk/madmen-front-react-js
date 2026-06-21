import { useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";
import { employeDetails } from "../../data/profil.js";

// Couleur d'avatar dérivée du nom (placeholder).
const AVC = ["#2f7d63", "#5a6cb0", "#b07a3a", "#357a8a", "#9a5a7d", "#4a7d4a", "#a85b4b", "#5b6e8c"];
const couleur = (n) => AVC[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % AVC.length];
const initiales = (n) => n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const statutMap = {
  Actif: { label: "Actif", c: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500", bar: "border-t-emerald-500" },
  Congé: { label: "En congé", c: "text-sky-600", bg: "bg-sky-50", dot: "bg-sky-500", bar: "border-t-sky-500" },
  Suspendu: { label: "Suspendu", c: "text-rose-600", bg: "bg-rose-50", dot: "bg-rose-500", bar: "border-t-rose-500" },
};

// Ancienneté depuis la date d'embauche (réf. = aujourd'hui).
function anciennete(dateStr) {
  if (!dateStr) return { val: "—", unite: "" };
  const [j, m, y] = dateStr.split("/").map(Number);
  const h = new Date(y, m - 1, j);
  const now = new Date();
  let an = now.getFullYear() - h.getFullYear();
  let mo = now.getMonth() - h.getMonth();
  if (now.getDate() < h.getDate()) mo--;
  if (mo < 0) { an--; mo += 12; }
  return an >= 1 ? { val: an, unite: an > 1 ? "ans" : "an" } : { val: Math.max(mo, 0), unite: "mois" };
}

// Âge à partir de la date de naissance.
function age(dateStr) {
  if (!dateStr) return null;
  const [j, m, y] = dateStr.split("/").map(Number);
  const now = new Date();
  let a = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < j)) a--;
  return a;
}

function Ligne({ icon, value, lead }) {
  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${lead ? "text-ink font-semibold" : "text-muted"}`}>
      <Icon name={icon} className="text-[16px] text-faint shrink-0" />
      <span className="truncate">{value}</span>
    </div>
  );
}

// Carte « annuaire » (page Agents) — identité + ancienneté.
export default function CarteAnnuaire({ e }) {
  const navigate = useNavigate();
  const s = statutMap[e.status] ?? statutMap.Actif;
  const d = employeDetails[e.id] ?? {};
  const embauche = d.embauche;
  const anc = anciennete(embauche);
  const chip = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-2 border border-border text-[11px] text-muted";

  return (
    <article className={`card flex flex-col p-[18px] border-t-[4px] ${s.bar} hover:-translate-y-0.5 hover:shadow-lift transition-all`}>
      {/* En-tête : avatar + identité + badge */}
      <div className="relative flex items-center gap-3 pr-20">
        <div className="relative shrink-0">
          <div className="w-[46px] h-[46px] rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: couleur(e.name) }}>
            {initiales(e.name)}
          </div>
          <span className={`absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 rounded-full border-[2.5px] border-surface ${s.dot}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-ink truncate">{e.name}</p>
          <p className="text-xs text-faint font-medium">{e.id}</p>
        </div>
        <span className={`absolute top-0 right-0 inline-flex items-center gap-1.5 text-[11px] font-semibold ${s.c} ${s.bg} px-2.5 py-1 rounded-full`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      </div>

      {/* Infos personnelles */}
      <div className="flex flex-wrap gap-1.5 mt-2.5">
        {(d.sexe || d.naissance) && (
          <span className={chip}>
            <Icon name={d.sexe === "Femme" ? "female" : "male"} className="text-[13px] text-muted" />
            {[d.sexe, d.naissance ? `${age(d.naissance)} ans` : null].filter(Boolean).join(" · ")}
          </span>
        )}
        {d.residence && (
          <span className={chip}>
            <Icon name="home" className="text-[13px] text-muted" /> {d.residence}
          </span>
        )}
      </div>

      {/* Méta */}
      <div className="grid gap-2 mt-3 mb-[15px] pt-3.5 border-t border-border text-[13px]">
        <Ligne icon="work" value={e.fonction} lead />
        <Ligne icon="domain" value={e.department} />
        <Ligne icon="location_on" value={e.agence} />
        <Ligne icon="mail" value={e.email} />
        <Ligne icon="call" value={e.phone} />
      </div>

      {/* Ancienneté */}
      <div className="rounded-xl bg-[#f3f6ee] border border-border px-3.5 py-3 flex items-center justify-between gap-2.5">
        <div className="min-w-0">
          <p className="text-[11px] text-muted">Dans l'entreprise depuis</p>
          <p className="text-[13.5px] font-bold tabular-nums text-ink mt-0.5">{embauche ?? "—"}</p>
        </div>
        <div className="shrink-0 text-center bg-surface border border-border rounded-lg px-2.5 py-1.5">
          <p className="text-base font-extrabold text-emerald-600 leading-none tabular-nums">{anc.val}</p>
          <p className="text-[9.5px] uppercase tracking-wide text-faint mt-0.5">{anc.unite}</p>
        </div>
      </div>

      {/* Pied */}
      <div className="mt-[15px]">
        <button
          onClick={() => navigate(`/employes/${e.id}`)}
          className="group w-full flex items-center justify-center gap-1.5 rounded-lg border border-border bg-canvas py-2.5 text-[13px] font-semibold text-muted hover:bg-ink hover:text-white hover:border-ink transition-colors"
        >
          Voir profil
          <Icon name="arrow_forward" className="text-[15px] group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </article>
  );
}
