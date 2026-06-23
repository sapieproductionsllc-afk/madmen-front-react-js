// Pont front → commandes Tauri. En mode navigateur (hors app desktop), `estTauri()`
// renvoie false et `invokeTauri()` renvoie null : le dashboard reste 100% utilisable
// dans un navigateur, et les fonctionnalités desktop (passerelle K40, empreintes,
// réglages locaux) ne s'affichent que dans l'app « MadMen Admin ».

export const estTauri = () =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/**
 * Appelle une commande Tauri. Renvoie null si on n'est pas dans l'app desktop.
 * @param {string} cmd  nom de la commande Rust (#[tauri::command])
 * @param {object} [args]
 */
export async function invokeTauri(cmd, args) {
  if (!estTauri()) return null;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke(cmd, args);
}
