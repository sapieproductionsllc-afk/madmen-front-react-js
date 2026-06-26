//! Sidecar agent d'empreintes (zkagent.exe), lancé au démarrage de l'app et MAINTENU EN VIE.
//!
//! Il expose le lecteur Live20 sur http://127.0.0.1:8080 (le front l'interroge directement :
//! `/status`, `/capture`, `/merge`). Échoue en silence si le lecteur/SDK est absent — le reste
//! du dashboard reste utilisable.
//!
//! BUG HISTORIQUE (corrigé ici) : `cmd.spawn()` renvoie un `CommandChild`. S'il est DROPPÉ,
//! tauri-plugin-shell tue le process enfant aussitôt → l'agent ne tenait jamais sur :8080
//! (cf. SETUP-APP-ADMIN-MATERIEL : « garder le CommandChild en vie »). CORRECTIF : on STOCKE
//! le handle dans l'état managé Tauri (il vit aussi longtemps que l'app) et on DRAINE le flux
//! d'évènements, sinon le tube stdout/stderr du sidecar peut saturer puis le bloquer.

use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use tauri_plugin_shell::{
    process::{CommandChild, CommandEvent},
    ShellExt,
};

/// Conserve le handle du sidecar empreintes pour toute la durée de vie de l'app.
/// Sans cet état managé, le `CommandChild` serait droppé en fin de `demarrer()` et
/// l'agent tué immédiatement (la cause de « Capture interrompue »). À la fermeture de
/// l'app, l'état est droppé → l'agent s'arrête proprement (cycle de vie lié à l'app).
// Le champ n'est jamais LU : il n'existe que pour garder le `CommandChild` vivant
// (c'est son Drop, à la fermeture de l'app, qui compte).
#[allow(dead_code)]
pub struct AgentEmpreintes(pub Mutex<Option<CommandChild>>);

pub fn demarrer(app: &AppHandle) {
    let cmd = match app.shell().sidecar("zkagent") {
        Ok(c) => c,
        Err(e) => {
            eprintln!("[empreintes] sidecar zkagent introuvable : {e}");
            return;
        }
    };

    match cmd.spawn() {
        Ok((mut rx, child)) => {
            // 1) NE PAS dropper `child` : on le confie à l'état managé -> l'agent reste vivant.
            app.manage(AgentEmpreintes(Mutex::new(Some(child))));

            // 2) Drainer les évènements du sidecar (sinon le tube peut saturer et bloquer
            //    l'agent). On se contente de journaliser sa terminaison éventuelle.
            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    if let CommandEvent::Terminated(payload) = event {
                        eprintln!("[empreintes] sidecar zkagent terminé : {:?}", payload);
                        break;
                    }
                }
            });

            eprintln!("[empreintes] sidecar zkagent lancé et maintenu en vie (:8080).");
        }
        Err(e) => eprintln!("[empreintes] échec du lancement du sidecar zkagent : {e}"),
    }
}
