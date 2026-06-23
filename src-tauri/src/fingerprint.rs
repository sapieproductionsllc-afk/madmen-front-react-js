//! Sidecar agent d'empreintes (zkagent.exe), lancé au démarrage de l'app.
//! Il expose le lecteur Live20 sur http://127.0.0.1:8080 (le front l'interroge
//! directement : `/status`, `/capture`). Échoue en silence si le lecteur/SDK est
//! absent — le reste du dashboard reste utilisable.
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;

pub fn demarrer(app: &AppHandle) {
    match app.shell().sidecar("zkagent") {
        Ok(cmd) => {
            if let Err(e) = cmd.spawn() {
                eprintln!("[empreintes] échec du lancement du sidecar zkagent : {e}");
            }
        }
        Err(e) => eprintln!("[empreintes] sidecar zkagent introuvable : {e}"),
    }
}
