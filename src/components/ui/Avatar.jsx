import { useState } from "react";

// Couleurs d'avatar (initiales) déterministes selon le nom.
const couleurs = [
  "bg-brand-50 text-brand-600",
  "bg-emerald-50 text-emerald-600",
  "bg-amber-50 text-amber-600",
  "bg-rose-50 text-rose-600",
  "bg-sky-50 text-sky-600",
  "bg-violet-50 text-violet-600",
];

export default function Avatar({ src, name = "", size = "w-9 h-9", className = "" }) {
  const [erreur, setErreur] = useState(false);

  const initiales = name
    .split(" ")
    .map((mot) => mot[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const indice = name.length % couleurs.length;
  const base = `${size} rounded-full overflow-hidden ring-1 ring-slate-200 shrink-0 ${className}`;

  if (src && !erreur) {
    return (
      <div className={base}>
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setErreur(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${base} flex items-center justify-center text-xs font-semibold ${couleurs[indice]}`}
    >
      {initiales || "?"}
    </div>
  );
}
