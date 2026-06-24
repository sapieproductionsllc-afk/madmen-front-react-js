import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api.js";

// Bandeau d'état du relais, en haut du dashboard :
//  - BUREAU HORS-LIGNE (rouge) : le cloud n'a reçu aucun check-in depuis > 10 min
//    (GET /api/relay/health -> quiet:true). Détection de coupure totale ; les pointages
//    restent saufs sur la pointeuse et remontent dès qu'un PC se reconnecte.
//  - SINON (vert, discret) : nombre de PC qui relaient en ce moment (reporters_online).
//    Pratique pendant le déploiement — on voit "X postes" grimper à chaque installation.
export default function BureauHorsLigne() {
  const [etat, setEtat] = useState(null);

  useEffect(() => {
    let actif = true;
    const verifier = async () => {
      try {
        const h = await apiGet("/api/relay/health");
        if (actif) setEtat(h);
      } catch {
        // Erreur réseau côté admin : on n'affiche rien (évite un faux "hors-ligne").
      }
    };
    verifier();
    const id = setInterval(verifier, 60000);
    return () => {
      actif = false;
      clearInterval(id);
    };
  }, []);

  if (!etat) return null;

  // 1) Bureau hors-ligne -> bandeau rouge.
  if (etat.quiet) {
    const min =
      etat.silence_seconds != null ? Math.max(1, Math.round(etat.silence_seconds / 60)) : null;
    return (
      <div
        role="alert"
        className="bg-red-600 text-white px-4 py-2 text-sm flex items-center justify-center gap-2 shrink-0"
      >
        <span aria-hidden>⚠️</span>
        <span>
          <strong>Bureau hors-ligne</strong> — aucune donnée reçue{" "}
          {min ? `depuis ~${min} min` : "depuis un moment"}. Les pointages restent
          enregistrés sur la pointeuse et remonteront dès qu'un PC du bureau se reconnecte.
        </span>
      </div>
    );
  }

  // 2) En ligne -> indicateur discret du nombre de PC qui relaient (si l'info existe).
  const n = etat.reporters_online;
  if (n == null) return null;
  return (
    <div className="bg-emerald-50 text-emerald-700 px-4 py-1 text-xs flex items-center justify-center gap-1.5 shrink-0 border-b border-emerald-100">
      <span aria-hidden>📡</span>
      <span>
        {n} poste{n > 1 ? "s" : ""} relaie{n > 1 ? "nt" : ""} les pointages en ce moment
      </span>
    </div>
  );
}
