import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api.js";

// Bannière "bureau hors-ligne" : s'affiche en haut du dashboard quand le cloud n'a
// reçu AUCUN check-in de reporter depuis trop longtemps (GET /api/relay/health ->
// quiet:true). C'est de la DÉTECTION : les pointages restent saufs sur la pointeuse
// et remontent dès qu'un PC du bureau relaie de nouveau. Avec 15 PC, n'apparaît
// quasiment jamais — sauf coupure totale (courant/internet, ou tout débranché).
export default function BureauHorsLigne() {
  const [etat, setEtat] = useState(null); // { quiet, last_relay_at, silence_seconds }

  useEffect(() => {
    let actif = true;
    const verifier = async () => {
      try {
        const h = await apiGet("/api/relay/health");
        if (actif) setEtat(h);
      } catch {
        // Réseau/erreur côté admin : on n'affiche RIEN (évite un faux "hors-ligne"
        // dû à la connexion de l'admin lui-même).
      }
    };
    verifier();
    const id = setInterval(verifier, 60000); // re-vérifie toutes les 60 s
    return () => {
      actif = false;
      clearInterval(id);
    };
  }, []);

  if (!etat || !etat.quiet) return null;

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
