import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import logo from "../../assets/logo.png";

// Résout une URL de photo (absolue telle quelle, sinon préfixée par l'API).
function resoudrePhoto(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  const base = import.meta.env.VITE_API_URL || "";
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

// Initiales (fallback quand pas de photo / photo en erreur).
function initiales(nom = "") {
  return nom.trim().split(/\s+/).slice(0, 2).map((m) => m[0]?.toUpperCase() ?? "").join("") || "?";
}

const STATUT_TON = {
  Actif: "bg-emerald-100 text-emerald-700",
  "En congé": "bg-amber-100 text-amber-700",
  Suspendu: "bg-rose-100 text-rose-700",
};

/**
 * Badge employé MADMEN — carte verticale (format carte d'identité pro).
 * Réf. design : logo/organisation en haut, photo nette bien visible, nom en gros,
 * infos essentielles (matricule/poste/département), QR du matricule, fort contraste.
 * `innerRef` permet à la modale de capturer l'élément en PNG.
 */
export default function BadgeEmploye({ employe, innerRef }) {
  const [photoErr, setPhotoErr] = useState(false);
  const e = employe || {};
  const nom = e.name || `${e.prenom ?? ""} ${e.nom ?? ""}`.trim() || "—";
  const matricule = e.matricule || e.id || "—";
  const poste = e.fonction || e.poste_libelle || "—";
  const dept = e.department || e.departement_nom || "—";
  const statut = e.status || "Actif";
  const photo = !photoErr ? resoudrePhoto(e.photo_url || e.photo) : null;

  return (
    <div
      ref={innerRef}
      className="w-[340px] bg-white rounded-[26px] overflow-hidden shadow-2xl ring-1 ring-slate-200 select-none"
      style={{ fontFamily: "inherit" }}
    >
      {/* En-tête : marque MADMEN (teal) + logo */}
      <div className="relative h-32 bg-gradient-to-br from-brand-700 to-brand-600">
        <div className="absolute -right-10 -top-12 w-44 h-44 rounded-full bg-white/5" />
        <div className="absolute -left-8 top-10 w-28 h-28 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-2.5 px-5 pt-4">
          <img src={logo} alt="" className="w-8 h-8 object-contain" crossOrigin="anonymous" />
          <div className="leading-tight">
            <p className="text-white font-extrabold tracking-tight text-lg">MADMEN</p>
            <p className="text-white/70 text-[10px] font-medium tracking-[0.18em] uppercase">Carte professionnelle</p>
          </div>
        </div>
      </div>

      {/* Photo (chevauche l'en-tête) */}
      <div className="flex justify-center -mt-14">
        <div className="w-28 h-28 rounded-2xl ring-4 ring-white shadow-lg overflow-hidden bg-brand-50 flex items-center justify-center">
          {photo ? (
            <img
              src={photo}
              alt={nom}
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
              onError={() => setPhotoErr(true)}
            />
          ) : (
            <span className="text-3xl font-extrabold text-brand-600">{initiales(nom)}</span>
          )}
        </div>
      </div>

      {/* Identité */}
      <div className="px-5 pt-3 text-center">
        <p className="text-xl font-extrabold text-slate-900 leading-tight">{nom}</p>
        <p className="text-sm font-semibold text-brand-600 mt-0.5">{poste}</p>
        <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STATUT_TON[statut] ?? "bg-slate-100 text-slate-600"}`}>
          {statut}
        </span>
      </div>

      {/* Infos + QR */}
      <div className="px-5 py-4 mt-2 flex items-center gap-4">
        <div className="flex-1 min-w-0 space-y-2.5">
          <Info label="Matricule" valeur={matricule} mono />
          <Info label="Département" valeur={dept} />
        </div>
        <div className="shrink-0 text-center">
          <div className="p-1.5 bg-white rounded-lg ring-1 ring-slate-200">
            <QRCodeSVG value={String(matricule)} size={78} level="M" fgColor="#0f3d3a" />
          </div>
          <p className="text-[8px] text-slate-400 mt-1 tracking-wide">Scanner pour identifier</p>
        </div>
      </div>

      {/* Liseré or */}
      <div className="h-2 bg-gradient-to-r from-or-400 to-or-500" />
    </div>
  );
}

function Info({ label, valeur, mono }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`text-sm font-semibold text-slate-800 truncate ${mono ? "font-mono" : ""}`}>{valeur}</p>
    </div>
  );
}
