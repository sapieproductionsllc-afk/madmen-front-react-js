import { useState } from "react";

// Couleurs d'avatar (initiales) déterministes selon le nom.
const couleurs = [
  "bg-brand-500/15 text-brand-400",
  "bg-emerald-500/15 text-emerald-300",
  "bg-amber-500/15 text-amber-300",
  "bg-rose-500/15 text-rose-300",
  "bg-sky-500/15 text-sky-300",
  "bg-violet-500/15 text-violet-300",
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
  const base = `${size} rounded-full overflow-hidden ring-1 ring-border-strong shrink-0 ${className}`;

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
